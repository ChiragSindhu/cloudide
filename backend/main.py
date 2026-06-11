from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import os
from contextlib import asynccontextmanager

from routes import execution, metrics
from websocket.manager import ws_manager
from services.redis_manager import redis_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Cloud IDE..")
    
    # Check Redis connection
    if redis_manager.ping():
        print("✓ Redis connected")
    else:
        print("✗ Redis connection failed")
        raise Exception("Cannot connect to Redis")
    
    yield
    
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="Cloud Python Compiler",
    description="Execute Python code in isolated Docker containers",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(execution.router, prefix="/api", tags=["execution"])
app.include_router(metrics.router, prefix="/api", tags=["metrics"])

# Serve frontend static files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.join(BASE_DIR, "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve main IDE page"""
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Frontend not found</h1>")

@app.get("/debug", response_class=HTMLResponse)
async def debug():
    """Serve debug dashboard"""
    debug_path = os.path.join(frontend_path, "debug.html")
    if os.path.exists(debug_path):
        return FileResponse(debug_path)
    return HTMLResponse("<h1>Debug page not found</h1>")

@app.websocket("/ws/debug")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for debug dashboard"""
    await ws_manager.connect(websocket)
    
    try:
        # Send initial metrics
        metrics_data = redis_manager.get_metrics()
        await websocket.send_json({
            "type": "metrics_update",
            "data": metrics_data,
            "timestamp": None
        })
        
        # Send recent events
        events = redis_manager.get_recent_events(50)
        await websocket.send_json({
            "type": "events_history",
            "data": events,
            "timestamp": None
        })
        
        # Keep connection alive
        while True:
            await websocket.receive_text()
    
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/health")
async def health():
    """Health check endpoint"""
    redis_ok = redis_manager.ping()
    return {
        "status": "healthy" if redis_ok else "unhealthy",
        "redis": redis_ok
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)