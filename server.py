from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends
from datetime import datetime
import uvicorn
import os
import io
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import httpx
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

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

# Configuration for external services (in production, use environment variables)
SERVICES = {
    "recognition": os.getenv("RECOGNITION_SERVICE", "http://recognition-service:8001"),
    "database": os.getenv("DATABASE_SERVICE", "http://database-service:8004"),
    "logging": os.getenv("LOGGING_SERVICE", "http://logging-service:8005")
}

# Response Models
class RecognitionResponse(BaseModel):
    """Response model for face recognition results"""
    recognized: bool = Field(..., description="Whether the face was recognized")
    person_name: Optional[str] = Field(None, description="Name of the recognized person")
    confidence: Optional[float] = Field(None, description="Confidence score of the recognition")

class LogEntry(BaseModel):
    """Model for log entries"""
    timestamp: str = Field(..., description="ISO format timestamp of the event")
    recognized: bool = Field(..., description="Whether the face was recognized")
    person_name: Optional[str] = Field(None, description="Name of the recognized person")
    device_id: Optional[str] = Field(None, description="ID of the device that made the request")

class ServiceError(Exception):
    """Custom exception for service communication errors"""
    def __init__(self, service: str, status_code: int, detail: str):
        self.service = service
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Error from {service}: {detail} (Status: {status_code})")

# Dependency for HTTP client
async def get_http_client():
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client

@app.post("/recognize", 
    response_model=RecognitionResponse,
    responses={
        200: {"description": "Successfully processed face recognition request"},
        400: {"description": "Invalid input or no face detected"},
        500: {"description": "Internal server error or service unavailable"}
    },
    summary="Recognize a face from an image",
    description="Process an image containing a face and determine if it matches any known person"
)
async def recognize(
    file: UploadFile = File(..., description="Image file containing a face"),
    device_id: Optional[str] = Query(None, description="ID of the device making the request"),
    client: httpx.AsyncClient = Depends(get_http_client)
):
    """
    Process a face recognition request:
    1. Send image to recognition service for analysis
    2. Log the result
    """
    content = await file.read()
    
    try:
        # Single call to recognition service
        response = await client.post(
            f"{SERVICES['recognition']}/analyze",
            files={"file": content}
        )
        response.raise_for_status()
        result = response.json()
        
        # Log the event
        await log_event(
            result["recognized"],
            result.get("person_name"),
            device_id,
            client
        )
        
        return RecognitionResponse(
            recognized=result["recognized"],
            person_name=result.get("person_name"),
            confidence=result.get("confidence")
        )
        
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            await log_event(False, None, device_id, client)
            return RecognitionResponse(recognized=False)
        raise ServiceError(e.request.url.host, e.response.status_code, str(e))
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

@app.post("/add-person",
    responses={
        200: {"description": "Successfully added person"},
        400: {"description": "Invalid input or no face detected"},
        500: {"description": "Internal server error or service unavailable"}
    },
    summary="Add a new person to the database",
    description="Add a new person's face to the recognition database"
)
async def add_person(
    name: str = Query(..., description="Full name of the person"),
    file: UploadFile = File(..., description="Image file containing the person's face"),
    client: httpx.AsyncClient = Depends(get_http_client)
):
    """Add a new person to the face recognition database"""
    content = await file.read()
    
    try:
        # Send to recognition service for face detection and embedding
        recognition_response = await client.post(
            f"{SERVICES['recognition']}/analyze",
            files={"file": content}
        )
        recognition_response.raise_for_status()
        result = recognition_response.json()
        
        if not result["recognized"]:
            # Store in database
            db_response = await client.post(
                f"{SERVICES['database']}/add-person",
                json={
                    "name": name,
                    "embedding": result["embedding"]
                }
            )
            db_response.raise_for_status()
            return {"status": "person added"}
        else:
            raise HTTPException(
                status_code=400,
                detail="Face already exists in database"
            )
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=400, detail="No face detected in image")
        raise ServiceError(e.request.url.host, e.response.status_code, str(e))
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

@app.get("/logs",
    response_model=List[LogEntry],
    responses={
        200: {"description": "Successfully retrieved logs"},
        500: {"description": "Internal server error or service unavailable"}
    },
    summary="Get recognition logs",
    description="Retrieve logs of past face recognition events with optional filtering"
)
async def get_logs(
    device_id: Optional[str] = Query(None, description="Filter logs by device ID"),
    date: Optional[str] = Query(None, description="Filter logs by date (YYYY-MM-DD)"),
    limit: Optional[int] = Query(100, le=1000, description="Maximum number of logs to return"),
    client: httpx.AsyncClient = Depends(get_http_client)
):
    """Retrieve logs of face recognition events"""
    try:
        response = await client.get(
            f"{SERVICES['logging']}/logs",
            params={"device_id": device_id, "date": date, "limit": limit}
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise ServiceError(e.request.url.host, e.response.status_code, str(e))
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

@app.get("/status",
    responses={
        200: {"description": "Service is online"}
    },
    summary="Health check",
    description="Check if the API gateway is online"
)
async def status():
    """Health check endpoint"""
    return {"status": "online"}

async def log_event(
    recognized: bool,
    person_name: Optional[str],
    device_id: Optional[str],
    client: httpx.AsyncClient
):
    """Log a recognition event to the logging service"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "recognized": recognized,
        "person_name": person_name,
        "device_id": device_id
    }
    
    try:
        response = await client.post(
            f"{SERVICES['logging']}/log",
            json=log_entry
        )
        response.raise_for_status()
    except (httpx.HTTPStatusError, httpx.RequestError) as e:
        # Log to console if logging service is unavailable
        print(f"Failed to log event: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
