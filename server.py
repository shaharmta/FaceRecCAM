from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import imagesProcessing
import tempfile
import base64
import os
from typing import Optional, List
from websocket_manager import manager

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
        await manager.broadcast_recognition(status, person_id, device_id, preview_image)

        return {"status": status, "person_id": person_id, "vector": vector}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-person")
async def add_person(vector: List[float] = Query(...)):
    try:
        imagesProcessing.add_new_person(vector)
        await manager.broadcast_person_added()
        return {"status": "person added"}
    except Exception as e:
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
