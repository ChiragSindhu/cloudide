from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import asyncio
from services.redis_manager import redis_manager
from services.executor import code_executor

router = APIRouter()

class CodeExecutionRequest(BaseModel):
    code: str

class CodeExecutionResponse(BaseModel):
    execution_id: str

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """Submit code for execution"""
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    # Generate execution ID
    execution_id = str(uuid.uuid4())
    
    # Create execution record
    redis_manager.create_execution(execution_id, request.code)
    redis_manager.publish_event("execution_created", {
        "execution_id": execution_id,
        "code_length": len(request.code)
    })
    
    # Execute in background
    asyncio.create_task(code_executor.execute_code(execution_id, request.code))
    
    return CodeExecutionResponse(execution_id=execution_id)

@router.get("/execution/{execution_id}")
async def get_execution(execution_id: str):
    """Get execution status and results"""
    execution = redis_manager.get_execution(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return execution

@router.get("/execution/{execution_id}/logs")
async def get_execution_logs(execution_id: str):
    """Get execution logs"""
    execution = redis_manager.get_execution(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    logs = redis_manager.get_logs(execution_id)
    return {"logs": logs}