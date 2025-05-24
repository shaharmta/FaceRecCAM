from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import imagesProcessing
import tempfile
import base64
import os
from typing import Optional, List
from websocket_manager import manager
from pydantic import BaseModel
from face_db import get_conn

class AddPersonPayload(BaseModel):
    name: str
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
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        status, vector, person_id = imagesProcessing.is_familiar(tmp_path)
        os.unlink(tmp_path)

        # Get person's name if they were recognized
        person_name = None
        if status in ["green", "yellow"] and person_id:
            with get_conn() as conn:
                result = conn.execute("SELECT name FROM people WHERE id = ?", (person_id,)).fetchone()
                if result:
                    person_name = result[0]

        preview_image = base64.b64encode(content).decode("utf-8")
        await manager.broadcast_recognition(status, person_id, device_id, preview_image, vector, person_name)

        return {"status": status, "person_id": person_id, "vector": vector, "person_name": person_name}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-person")
async def add_person(payload: AddPersonPayload):
    print("=== Add Person Request Received ===")
    print(f"Name: {payload.name}")
    print(f"Vector length: {len(payload.vector)}")
    try:
        if not payload.name or not payload.vector:
            print("Error: Missing name or vector")
            raise ValueError("Name and vector are required")
            
        print("Calling add_new_person...")
        imagesProcessing.add_new_person(payload.name, payload.vector)
        print("Person added successfully")
        await manager.broadcast_person_added()
        return {"status": "person added"}
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
        with get_conn() as conn:
            rows = conn.execute("SELECT id, name, last_seen FROM people").fetchall()
            return {"people": [{"id": r[0], "name": r[1], "last_seen": r[2]} for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
