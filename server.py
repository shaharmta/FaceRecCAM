from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pinecone_imageProcessing as imagesProcessing
import tempfile
import base64
import os
from typing import Optional, List
from websocket_manager import manager
from pydantic import BaseModel
import pinecone_db as face_db

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
    print("=== Recognize Request Received ===")
    print(f"Device ID: {device_id}")
    print(f"File name: {file.filename}")
    print(f"File content type: {file.content_type}")
    
    try:
        content = await file.read()
        print(f"File size: {len(content)} bytes")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
            print(f"Temporary file created: {tmp_path}")

        print("Calling imagesProcessing.is_familiar...")
        status, vector, person_id = imagesProcessing.is_familiar(tmp_path)
        print(f"Recognition result - Status: {status}, Person ID: {person_id}, Vector length: {len(vector) if vector else 0}")

        # If recognized and within period (green), add vector to Pinecone for same person_id
        if status == "green" and person_id is not None and vector:
            try:
                face_db.insert_vector_for_person(person_id, vector)
                print(f"Inserted new vector for person {person_id} (capped at 10, oldest pruned if needed)")
            except Exception as e:
                print(f"Warning: failed to insert vector for person {person_id}: {e}")
        
        os.unlink(tmp_path)
        print("Temporary file cleaned up")

        preview_image = base64.b64encode(content).decode("utf-8")
        print("Broadcasting recognition result...")
        await manager.broadcast_recognition(status, person_id, device_id, preview_image, vector)

        print("✅ Recognition request completed successfully")
        return {"status": status, "person_id": person_id, "vector": vector}

    except Exception as e:
        print("❌ Error in /recognize endpoint:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        print(f"   Error details: {repr(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
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
async def list_people():
    try:
        print("=== LIST PEOPLE REQUEST ===")
        people = face_db.list_people()
        print(f"Found {len(people)} people in Pinecone database")
        
        return {
            "people": people
        }
    except Exception as e:
        print(f"Error listing people: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))