from fastapi import FastAPI


app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/surprise")
def surprise():
    return {"We will have amazing project !"}

@app.get("/awsdeploy")
def surprise():
    return {"deployed through github actions 4 try !"}


