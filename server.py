from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import imagesProcessing
import tempfile
import base64
import os
from typing import Optional, List
from websocket_manager import manager
from pydantic import BaseModel
from face_db import get_conn, USE_LOCAL

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
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        status, vector, person_id = imagesProcessing.is_familiar(tmp_path)
        os.unlink(tmp_path)

        preview_image = base64.b64encode(content).decode("utf-8")
        await manager.broadcast_recognition(status, person_id, device_id, preview_image, vector)

        return {"status": status, "person_id": person_id, "vector": vector}

    except Exception as e:
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
        with get_conn() as conn:
            cur = conn.cursor()
            try:
                if USE_LOCAL:
                    # SQLite version
                    cur.execute("""
                        SELECT 
                            p.person_id,
                            MAX(v.last_checked) as last_seen,
                            COUNT(v.vector_id) as vector_count,
                            (
                                SELECT vector 
                                FROM vectors 
                                WHERE person_id = p.person_id 
                                ORDER BY last_checked DESC 
                                LIMIT 1
                            ) as latest_vector
                        FROM persons p
                        LEFT JOIN vectors v ON p.person_id = v.person_id
                        GROUP BY p.person_id
                        ORDER BY p.person_id
                    """)
                else:
                    # PostgreSQL version
                    cur.execute("""
                        SELECT 
                            p.person_id,
                            MAX(v.last_checked) as last_seen,
                            COUNT(v.vector_id) as vector_count,
                            (
                                SELECT vector::text
                                FROM vectors 
                                WHERE person_id = p.person_id 
                                ORDER BY last_checked DESC 
                                LIMIT 1
                            ) as latest_vector
                        FROM persons p
                        LEFT JOIN vectors v ON p.person_id = v.person_id
                        GROUP BY p.person_id
                        ORDER BY p.person_id
                    """)
                rows = cur.fetchall()
            finally:
                cur.close()
            
            return {
                "people": [{
                    "id": r[0],
                    "last_seen": r[1],
                    "vector_count": r[2],
                    "has_vector": r[3] is not None
                } for r in rows]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))