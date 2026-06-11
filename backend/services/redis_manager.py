import redis
import json
from datetime import datetime
from typing import Optional, Dict, List, Any
from config import settings

class RedisManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )
    
    def ping(self) -> bool:
        """Check Redis connection"""
        try:
            return self.redis_client.ping()
        except:
            return False
    
    # Execution Management
    def create_execution(self, execution_id: str, code: str) -> None:
        """Create new execution record"""
        execution_key = f"{settings.EXECUTION_PREFIX}{execution_id}"
        data = {
            "execution_id": execution_id,
            "code": code,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "stdout": "",
            "stderr": "",
            "duration": 0,
            "exit_code": -1
        }
        self.redis_client.hset(execution_key, mapping=data)
        self.redis_client.expire(execution_key, settings.EXECUTION_TTL)
        
        # Add to active executions
        self.redis_client.sadd(settings.ACTIVE_EXECUTIONS_KEY, execution_id)
        
        # Increment metrics
        self.redis_client.hincrby(settings.METRICS_KEY, "total", 1)
        self.redis_client.hincrby(settings.METRICS_KEY, "pending", 1)
    
    def update_execution_status(self, execution_id: str, status: str) -> None:
        """Update execution status"""
        execution_key = f"{settings.EXECUTION_PREFIX}{execution_id}"
        self.redis_client.hset(execution_key, "status", status)
        
        # Update metrics
        if status == "RUNNING":
            self.redis_client.hincrby(settings.METRICS_KEY, "pending", -1)
            self.redis_client.hincrby(settings.METRICS_KEY, "active", 1)
        elif status in ["SUCCESS", "ERROR", "TIMEOUT", "MEMORY_LIMIT_EXCEEDED"]:
            self.redis_client.hincrby(settings.METRICS_KEY, "active", -1)
            self.redis_client.hincrby(settings.METRICS_KEY, "completed", 1)
            if status != "SUCCESS":
                self.redis_client.hincrby(settings.METRICS_KEY, "failed", 1)
            if status == "TIMEOUT":
                self.redis_client.hincrby(settings.METRICS_KEY, "timeouts", 1)
            
            # Remove from active
            self.redis_client.srem(settings.ACTIVE_EXECUTIONS_KEY, execution_id)
    
    def update_execution_result(
        self, 
        execution_id: str, 
        stdout: str = "",
        stderr: str = "",
        duration: float = 0,
        exit_code: int = -1,
        status: str = "SUCCESS"
    ) -> None:
        """Update execution with results"""
        execution_key = f"{settings.EXECUTION_PREFIX}{execution_id}"
        updates = {
            "stdout": stdout,
            "stderr": stderr,
            "duration": duration,
            "status": status,
            "completed_at": datetime.utcnow().isoformat()
        }
        if exit_code != -1:
            updates["exit_code"] = exit_code
        
        self.redis_client.hset(execution_key, mapping=updates)
        self.update_execution_status(execution_id, status)
    
    def get_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get execution details"""
        execution_key = f"{settings.EXECUTION_PREFIX}{execution_id}"
        data = self.redis_client.hgetall(execution_key)
        if not data:
            return None
        
        # Convert numeric fields
        if data.get("duration"):
            data["duration"] = float(data["duration"])
        if data.get("exit_code"):
            data["exit_code"] = int(data["exit_code"])
        
        return data
    
    def get_active_executions(self) -> List[str]:
        """Get list of active execution IDs"""
        return list(self.redis_client.smembers(settings.ACTIVE_EXECUTIONS_KEY))
    
    # Logging
    def append_log(self, execution_id: str, log_type: str, message: str) -> None:
        """Append log entry"""
        log_key = f"{settings.LOGS_PREFIX}{execution_id}"
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": log_type,
            "message": message
        }
        self.redis_client.rpush(log_key, json.dumps(log_entry))
        self.redis_client.expire(log_key, settings.EXECUTION_TTL)
        
        # Trim if too long
        self.redis_client.ltrim(log_key, -settings.MAX_LOG_ENTRIES, -1)
    
    def get_logs(self, execution_id: str) -> List[Dict[str, Any]]:
        """Get all logs for an execution"""
        log_key = f"{settings.LOGS_PREFIX}{execution_id}"
        logs = self.redis_client.lrange(log_key, 0, -1)
        return [json.loads(log) for log in logs]
    
    # Events
    def publish_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Publish event to stream"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": event_type,
            "data": json.dumps(data)
        }
        self.redis_client.rpush(settings.EVENT_STREAM_KEY, json.dumps(event))
        
        # Trim event stream
        self.redis_client.ltrim(settings.EVENT_STREAM_KEY, -settings.MAX_EVENT_ENTRIES, -1)
        
        # Also publish to pub/sub for real-time
        self.redis_client.publish("events", json.dumps(event))
    
    def get_recent_events(self, count: int = 100) -> List[Dict[str, Any]]:
        """Get recent events"""
        events = self.redis_client.lrange(settings.EVENT_STREAM_KEY, -count, -1)
        return [json.loads(event) for event in events]
    
    # Metrics
    def get_metrics(self) -> Dict[str, int]:
        """Get system metrics"""
        metrics = self.redis_client.hgetall(settings.METRICS_KEY)
        return {
            "total": int(metrics.get("total", 0)),
            "pending": int(metrics.get("pending", 0)),
            "active": int(metrics.get("active", 0)),
            "completed": int(metrics.get("completed", 0)),
            "failed": int(metrics.get("failed", 0)),
            "timeouts": int(metrics.get("timeouts", 0))
        }
    
    def reset_metrics(self) -> None:
        """Reset all metrics"""
        self.redis_client.delete(settings.METRICS_KEY)
        self.redis_client.delete(settings.ACTIVE_EXECUTIONS_KEY)

# Global instance
redis_manager = RedisManager()