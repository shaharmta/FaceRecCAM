from fastapi import WebSocket, WebSocketDisconnect
from typing import Set, Optional
from datetime import datetime

class WebSocketManager:
    def __init__(self):
        self.connections: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.add(ws)

    def disconnect(self, ws: WebSocket):
        self.connections.discard(ws)

    async def broadcast(self, message: dict):
        for ws in list(self.connections):
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(ws)

    async def broadcast_recognition(self, status: str, person_id: Optional[int], device_id: Optional[str], preview_image: str, vector: Optional[list[float]], person_name: Optional[str]):
        """Broadcast a recognition event to all connected clients."""
        message = {
            "event_type": "recognition",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "status": status,
                "person_id": person_id,
                "device_id": device_id,
                "preview_image": preview_image,
                "vector": vector,
                "person_name": person_name,
                "recognized": status in ["green", "yellow"]
            }
        }
        await self.broadcast(message)

    async def broadcast_person_added(self):
        await self.broadcast({
            "event_type": "person_added",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {"status": "success"}
        })

    async def broadcast_visit_updated(self, person_id: str):
        await self.broadcast({
            "event_type": "visit_updated",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": {"status": "success", "person_id": person_id}
        })

# Create a single instance to be used across the application
manager = WebSocketManager() 