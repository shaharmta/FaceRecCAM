from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime
import uvicorn
import os
import io
from typing import Optional, List, Dict, Any, Set
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from fastapi.staticfiles import StaticFiles
import imagesProcessing
import tempfile
import base64

app = FastAPI(
    title="Face Recognition API Gateway",
    description="API Gateway for face recognition system that coordinates between Raspberry Pi devices and backend services",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for UI
app.mount("/ui", StaticFiles(directory="ui_app/build", html=True), name="ui")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(connection)

manager = ConnectionManager()

# Response Models
class RecognitionResponse(BaseModel):
    """Response model for face recognition results"""
    status: str = Field(..., description="Recognition status (green, yellow, red)")
    person_id: Optional[str] = Field(None, description="ID of the recognized person")
    vector: Optional[List[float]] = Field(None, description="Face embedding vector")

class UIEvent(BaseModel):
    """Model for UI events"""
    event_type: str = Field(..., description="Type of event (recognition, add_person, etc.)")
    timestamp: str = Field(..., description="ISO format timestamp of the event")
    data: Dict[str, Any] = Field(..., description="Event data")

class LogEntry(BaseModel):
    """Model for log entries"""
    timestamp: str = Field(..., description="ISO format timestamp of the event")
    status: str = Field(..., description="Recognition status (green, yellow, red)")
    person_id: Optional[str] = Field(None, description="ID of the recognized person")
    device_id: Optional[str] = Field(None, description="ID of the device that made the request")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle any incoming WebSocket messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/recognize", 
    response_model=RecognitionResponse,
    responses={
        200: {"description": "Successfully processed face recognition request"},
        400: {"description": "Invalid input or no face detected"},
        500: {"description": "Internal server error"}
    },
    summary="Recognize a face from an image",
    description="Process an image containing a face and determine if it matches any known person"
)
async def recognize(
    file: UploadFile = File(..., description="Image file containing a face"),
    device_id: Optional[str] = Query(None, description="ID of the device making the request")
):
    """
    Process a face recognition request:
    1. Save uploaded image temporarily
    2. Process with imagesProcessing
    3. Broadcast result to UI
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        # Process image
        status, vector, person_id = imagesProcessing.is_familiar(temp_path)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        # Prepare preview image (base64 encoded)
        preview_image = base64.b64encode(content).decode('utf-8')
        
        # Broadcast to UI
        ui_event = UIEvent(
            event_type="recognition",
            timestamp=datetime.utcnow().isoformat() + "Z",
            data={
                "status": status,
                "person_id": person_id,
                "device_id": device_id,
                "preview_image": preview_image
            }
        )
        await manager.broadcast(ui_event.dict())
        
        return RecognitionResponse(
            status=status,
            person_id=person_id,
            vector=vector
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-person",
    responses={
        200: {"description": "Successfully added person"},
        400: {"description": "Invalid input"},
        500: {"description": "Internal server error"}
    },
    summary="Add a new person to the database",
    description="Add a new person's face to the recognition database"
)
async def add_person(
    vector: List[float] = Query(..., description="Face embedding vector")
):
    """Add a new person to the face recognition database"""
    try:
        imagesProcessing.add_new_person(vector)
        
        # Broadcast to UI
        ui_event = UIEvent(
            event_type="person_added",
            timestamp=datetime.utcnow().isoformat() + "Z",
            data={
                "status": "success"
            }
        )
        await manager.broadcast(ui_event.dict())
        
        return {"status": "person added"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-visit",
    responses={
        200: {"description": "Successfully updated visit"},
        400: {"description": "Invalid input"},
        500: {"description": "Internal server error"}
    },
    summary="Update a person's visit",
    description="Update an existing person's face vector in the database"
)
async def update_visit(
    vector: List[float] = Query(..., description="Face embedding vector"),
    person_id: str = Query(..., description="ID of the person to update")
):
    """Update a person's visit in the face recognition database"""
    try:
        imagesProcessing.add_new_visit(vector, person_id)
        
        # Broadcast to UI
        ui_event = UIEvent(
            event_type="visit_updated",
            timestamp=datetime.utcnow().isoformat() + "Z",
            data={
                "status": "success",
                "person_id": person_id
            }
        )
        await manager.broadcast(ui_event.dict())
        
        return {"status": "visit updated"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status",
    responses={
        200: {"description": "Service is online"}
    },
    summary="Health check",
    description="Check if the API gateway is online"
)
async def status():
    """Check if the API gateway is online"""
    return {"status": "online"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
