# orchestrator/main.py

from fastapi import FastAPI
from pydantic import BaseModel

# 1) Define the FastAPI app object
app = FastAPI()

# 2) Define a simple schema for incoming requests
class JobRequest(BaseModel):
    prompt: str = ""
    image_url: str = ""

# 3) Expose your three endpoints
@app.post("/generate-image")
async def generate_image(req: JobRequest):
    return {"status": "ok", "step": "generate-image", "received_prompt": req.prompt}

@app.post("/convert-mesh")
async def convert_mesh(req: JobRequest):
    return {"status": "ok", "step": "convert-mesh", "received_image": req.image_url}

@app.post("/auto-rig")
async def auto_rig(req: JobRequest):
    return {"status": "ok", "step": "auto-rig", "received_mesh": req.image_url}
