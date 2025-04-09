from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/surprise")
def surprise():
    return {"יהיה לנו פרויקט מפחיד נודר"}