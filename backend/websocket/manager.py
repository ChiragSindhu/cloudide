from fastapi import WebSocket
from typing import List, Set
import asyncio
import json
from services.redis_manager import redis_manager

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.redis_listener_task = None
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        # Start Redis listener if not already running
        if not self.redis_listener_task:
            self.redis_listener_task = asyncio.create_task(self._listen_redis_events())
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.active_connections.discard(connection)
    
    async def _listen_redis_events(self):
        """Listen to Redis pub/sub for events"""
        pubsub = redis_manager.redis_client.pubsub()
        await asyncio.to_thread(pubsub.subscribe, "events")
        
        while True:
            try:
                message = await asyncio.to_thread(pubsub.get_message, timeout=1.0)
                if message and message['type'] == 'message':
                    event_data = json.loads(message['data'])
                    await self.broadcast(event_data)
            except Exception as e:
                print(f"Redis listener error: {e}")
                await asyncio.sleep(1)

# Global instance
ws_manager = WebSocketManager()