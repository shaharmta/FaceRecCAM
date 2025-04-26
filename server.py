from fastapi import FastAPI, UploadFile, File, HTTPException
import face_recognition
import numpy as np
import uvicorn
import os
import io

app = FastAPI()

# Preloaded known face encodings (can be loaded dynamically later)
known_faces = {}

THRESHOLD = 0.8  # Distance threshold for face matching

# Detect and identify a face from an uploaded image
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    content = await file.read()
    img = face_recognition.load_image_file(io.BytesIO(content))

    encodings = face_recognition.face_encodings(img)
    if len(encodings) == 0:
        raise HTTPException(status_code=404, detail="No face detected")

    query_encoding = encodings[0]

    best_match = None
    best_distance = float('inf')

    for name, known_encoding in known_faces.items():
        distance = np.linalg.norm(query_encoding - known_encoding)
        print(f"Comparing with {name}, distance: {distance}")
        if distance < best_distance:
            best_distance = distance
            best_match = name

    if best_match is None or best_distance == float('inf'):
        return {"match": None, "distance": None}   

    if best_distance < THRESHOLD:
        return {"match": best_match, "distance": best_distance}
    else:
        return {"match": None, "distance": best_distance}

# Add a new face to the database
@app.post("/add-face")
async def add_face(name: str, file: UploadFile = File(...)):
    content = await file.read()

    img = face_recognition.load_image_file(io.BytesIO(content)) 

    encodings = face_recognition.face_encodings(img)
    if len(encodings) == 0:
        raise HTTPException(status_code=404, detail="No face detected")

    face_encoding = encodings[0]

    np.save(f"{name}.npy", face_encoding)
    known_faces[name] = face_encoding

    return {"message": f"Face added successfully for {name}"}

# Retrieve a saved face vector by name
@app.get("/face/{name}")
async def get_face(name: str):
    try:
        face_encoding = np.load(f"{name}.npy")
        return {"name": name, "vector": face_encoding.tolist()}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Face not found")

# Delete a face from the database
@app.delete("/face/{name}")
async def delete_face(name: str):
    try:
        os.remove(f"{name}.npy")
        known_faces.pop(name, None)
        return {"message": f"Face {name} deleted successfully"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Face not found")

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
