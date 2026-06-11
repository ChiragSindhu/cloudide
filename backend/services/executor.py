import docker
import uuid
import time
import asyncio
from typing import Tuple, Optional
from datetime import datetime
from config import settings
from services.redis_manager import redis_manager

class CodeExecutor:
    def __init__(self):
        self.docker_client = docker.from_env()
        self._ensure_runner_image()
    
    def _ensure_runner_image(self):
        """Verify runner image exists"""
        try:
            self.docker_client.images.get(settings.RUNNER_IMAGE)
        except docker.errors.ImageNotFound:
            raise Exception(f"Runner image {settings.RUNNER_IMAGE} not found. Please build it first.")
    
    async def execute_code(self, execution_id: str, code: str) -> None:
        """Execute Python code in isolated container"""
        container = None
        start_time = time.time()
        
        try:
            # Update status
            redis_manager.update_execution_status(execution_id, "RUNNING")
            redis_manager.append_log(execution_id, "INFO", "Execution started")
            redis_manager.publish_event("execution_started", {
                "execution_id": execution_id,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Create container
            redis_manager.append_log(execution_id, "INFO", "Creating container")
            redis_manager.publish_event("container_creating", {
                "execution_id": execution_id
            })
            
            container = await asyncio.to_thread(self._create_container, code)
            
            redis_manager.append_log(execution_id, "INFO", f"Container created: {container.short_id}")
            redis_manager.publish_event("container_created", {
                "execution_id": execution_id,
                "container_id": container.short_id
            })
            
            # Start container
            redis_manager.append_log(execution_id, "INFO", "Starting container")
            await asyncio.to_thread(container.start)
            
            redis_manager.publish_event("container_started", {
                "execution_id": execution_id,
                "container_id": container.short_id
            })
            
            # Wait for completion with timeout
            redis_manager.append_log(execution_id, "INFO", "Waiting for execution to complete")
            
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(container.wait),
                    timeout=settings.MAX_EXECUTION_TIME
                )
                exit_code = result['StatusCode']
            except asyncio.TimeoutError:
                redis_manager.append_log(execution_id, "ERROR", "Execution timed out")
                redis_manager.publish_event("execution_timeout", {
                    "execution_id": execution_id
                })
                await asyncio.to_thread(container.kill)
                
                duration = time.time() - start_time
                redis_manager.update_execution_result(
                    execution_id,
                    stderr="Execution timed out after 30 seconds",
                    duration=duration,
                    status="TIMEOUT"
                )
                return
            
            # Get logs
            stdout = await asyncio.to_thread(
                container.logs,
                stdout=True,
                stderr=False
            )
            stderr = await asyncio.to_thread(
                container.logs,
                stdout=False,
                stderr=True
            )
            
            stdout = stdout.decode('utf-8', errors='replace')
            stderr = stderr.decode('utf-8', errors='replace')
            
            duration = time.time() - start_time
            
            # Check for OOM
            container_info = await asyncio.to_thread(
                self.docker_client.api.inspect_container,
                container.id
            )
            
            if container_info['State'].get('OOMKilled', False):
                status = "MEMORY_LIMIT_EXCEEDED"
                stderr = "Memory limit exceeded\n" + stderr
                redis_manager.append_log(execution_id, "ERROR", "Memory limit exceeded")
            elif exit_code != 0:
                status = "ERROR"
                redis_manager.append_log(execution_id, "ERROR", f"Execution failed with exit code {exit_code}")
            else:
                status = "SUCCESS"
                redis_manager.append_log(execution_id, "INFO", "Execution completed successfully")
            
            # Update results
            redis_manager.update_execution_result(
                execution_id,
                stdout=stdout,
                stderr=stderr,
                duration=duration,
                exit_code=exit_code,
                status=status
            )
            
            redis_manager.publish_event("execution_completed", {
                "execution_id": execution_id,
                "status": status,
                "duration": duration,
                "exit_code": exit_code
            })
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Execution error: {str(e)}"
            
            redis_manager.append_log(execution_id, "ERROR", error_msg)
            redis_manager.update_execution_result(
                execution_id,
                stderr=error_msg,
                duration=duration,
                status="ERROR"
            )
            redis_manager.publish_event("execution_error", {
                "execution_id": execution_id,
                "error": str(e)
            })
        
        finally:
            # Cleanup container
            if container:
                try:
                    redis_manager.append_log(execution_id, "INFO", "Removing container")
                    await asyncio.to_thread(container.remove, force=True)
                    redis_manager.publish_event("container_removed", {
                        "execution_id": execution_id
                    })
                except Exception as e:
                    redis_manager.append_log(execution_id, "ERROR", f"Failed to remove container: {str(e)}")
    
    def _create_container(self, code: str):
        """Create Docker container with code"""
        return self.docker_client.containers.create(
            image=settings.RUNNER_IMAGE,
            command=["python", "-c", code],
            mem_limit=settings.MAX_MEMORY,
            cpu_quota=int(100000 * settings.MAX_CPU_COUNT),
            cpu_period=100000,
            network_mode=settings.DOCKER_NETWORK,
            detach=True,
            read_only=False,  # Python needs to write to /tmp
            security_opt=["no-new-privileges"],
            cap_drop=["ALL"],
            pids_limit=100
        )

# Global instance
code_executor = CodeExecutor()