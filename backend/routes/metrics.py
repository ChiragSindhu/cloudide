from fastapi import APIRouter
from services.redis_manager import redis_manager

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    """Get system metrics"""
    metrics = redis_manager.get_metrics()
    active_executions = redis_manager.get_active_executions()
    
    # Get details for active executions
    active_details = []
    for exec_id in active_executions:
        execution = redis_manager.get_execution(exec_id)
        if execution:
            active_details.append({
                "execution_id": exec_id,
                "status": execution.get("status"),
                "created_at": execution.get("created_at")
            })
    
    return {
        "metrics": metrics,
        "active_executions": active_details
    }

@router.get("/events")
async def get_recent_events(count: int = 100):
    """Get recent events"""
    events = redis_manager.get_recent_events(count)
    return {"events": events}

@router.post("/metrics/reset")
async def reset_metrics():
    """Reset metrics (for testing)"""
    redis_manager.reset_metrics()
    return {"status": "metrics reset"}