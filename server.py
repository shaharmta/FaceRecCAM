from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pinecone_imagesProcessing as imagesProcessing
import tempfile
import base64
import os
from typing import Optional, List
from websocket_manager import manager
from pydantic import BaseModel
from pinecone_db import get_conn, USE_LOCAL, list_people

class AddPersonPayload(BaseModel):
    vector: list[float]

app = FastAPI()

# CORS to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.post("/recognize")
async def recognize(file: UploadFile = File(...), device_id: Optional[str] = Query(None)):
    try:
        print(f"=== RECOGNIZE REQUEST ===")
        print(f"File: {file.filename}, Size: {file.size}, Device ID: {device_id}")
        
        content = await file.read()
        print(f"File content size: {len(content)} bytes")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
            print(f"Temporary file created: {tmp_path}")

        print("Calling imagesProcessing.is_familiar...")
        status, vector, person_id = imagesProcessing.is_familiar(tmp_path)
        print(f"Recognition result: status={status}, person_id={person_id}, vector_length={len(vector) if vector else 'None'}")
        
        os.unlink(tmp_path)
        print(f"Temporary file deleted: {tmp_path}")

        preview_image = base64.b64encode(content).decode("utf-8")
        await manager.broadcast_recognition(status, person_id, device_id, preview_image, vector)

        print(f"=== RECOGNITION COMPLETE ===")
        return {"status": status, "person_id": person_id, "vector": vector}

    except Exception as e:
        print(f"Error in recognize endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-person")
async def add_person(payload: AddPersonPayload):
    print("=== Add Person Request Received ===")
    print(f"Vector length: {len(payload.vector)}")
    try:
        if not payload.vector:
            print("Error: Missing vector")
            raise ValueError("Vector is required")
            
        print("Calling add_new_person...")
        person_id = imagesProcessing.add_new_person(payload.vector)
        print(f"Person added successfully with ID {person_id}")
        await manager.broadcast_person_added()
        return {"status": "person added", "person_id": person_id}
    except Exception as e:
        print(f"Error in add_person: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-visit")
async def update_visit(vector: List[float] = Query(...), person_id: str = Query(...)):
    try:
        imagesProcessing.add_new_visit(vector, person_id)
        await manager.broadcast_visit_updated(person_id)
        return {"status": "visit updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
def health():
    return {"status": "online"}

@app.get("/list-people")
async def list_people_endpoint():
    try:
        people = list_people()
        
        return {
            "people": [{
                "id": person["id"],
                "last_seen": person["last_seen"],
                "vector_count": person["vector_count"],
                "has_vector": person["has_vector"]
            } for person in people]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))