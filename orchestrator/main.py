# orchestrator/main.py

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai  # type: ignore
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
import requests

# --- Configure Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # put this in your .env or export in shell
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

COLAB_API_URL = "https://4896656563fd.ngrok-free.app/generate"


# --- FastAPI App ---
app = FastAPI()

# --- CORS for frontend (optional but useful in dev) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request schema ---
class JobRequest(BaseModel):
    prompt: str = ""
    image_url: str = ""

class EnhancePromptResponse(BaseModel):
    enhanced_prompt: str

# --- Endpoints ---
@app.post("/generate-image")
async def generate_image(req: JobRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is empty")

    try:
        response = requests.post(COLAB_API_URL, json={"prompt": req.prompt})
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        data = response.json()
        return {"image_base64": data["image_base64"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error contacting Colab API: {str(e)}")

@app.post("/convert-mesh")
async def convert_mesh(req: JobRequest):
    return {"status": "ok", "step": "convert-mesh", "received_image": req.image_url}

@app.post("/auto-rig")
async def auto_rig(req: JobRequest):
    return {"status": "ok", "step": "auto-rig", "received_mesh": req.image_url}

@app.post("/enhance-prompt", response_model=EnhancePromptResponse)
async def enhance_prompt(req: JobRequest):
    user_desc = req.prompt.strip()

    system_prompt = (
        "You are an expert at writing prompts for Stable Diffusion to generate 3D character models. "
        "Given a user description, rewrite it as an ideal prompt for Stable Diffusion to generate a T-posing character model. "
        "Preserve the original character description, but add context to ensure the output is: "
        "T-posing, full body, front-facing, clear, highly detailed, with visible clothing and body type, on a plain background. "
        "Output only the enhanced prompt, no commentary or quotes."
    )

    prompt = f"{system_prompt}\n\nUser description:\n{user_desc}\n\nEnhanced prompt:"
    response = model.generate_content(prompt)
    enhanced = response.text.strip()

    return {"enhanced_prompt": enhanced}
