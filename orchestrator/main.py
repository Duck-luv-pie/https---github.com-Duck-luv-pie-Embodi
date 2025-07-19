# orchestrator/main.py

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai  # type: ignore
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
import base64
import requests

# --- Configure Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # put this in your .env or export in shell
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

COLAB_API_URL = "https://4896656563fd.ngrok-free.app/generate"
COLAB_API_URL_2 = "https://c93a85c63d08.ngrok-free.app/generated"  # Fresh ngrok URL


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
    image: str = ""  # Add this for base64 image data

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
    try:
        print(f"Received convert-mesh request with image length: {len(req.image) if req.image else 0}")
        
        # Get base64 image from request
        if not req.image:
            print("No image data provided")
            raise HTTPException(status_code=400, detail="No image data provided")

        print(f"Sending request to Colab URL: {COLAB_API_URL_2}")
        
        # Send image to Colab's convert-mesh endpoint
        colab_response = requests.post(
            COLAB_API_URL_2, 
            json={"image": req.image},
            timeout=30     # Add timeout
        )
        print(f"Colab response status: {colab_response.status_code}")
        print(f"Colab response text: {colab_response.text[:200]}...")  # First 200 chars
        
        if colab_response.status_code != 200:
            print(f"Colab error: {colab_response.text}")
            raise HTTPException(status_code=500, detail=f"Colab error: {colab_response.text}")

        print(f"Successfully got .obj file, size: {len(colab_response.content)} bytes")
        
        # Return the raw .obj file directly
        from fastapi.responses import Response
        return Response(
            content=colab_response.content,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=character.obj"}
        )

    except requests.exceptions.SSLError as e:
        print(f"SSL Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SSL connection failed: {str(e)}")
    except requests.exceptions.ConnectionError as e:
        print(f"Connection Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Connection failed - ngrok URL may be expired: {str(e)}")
    except Exception as e:
        print(f"Exception in convert_mesh: {str(e)}")
        raise HTTPException(status_code=500, detail=f"convert_mesh failed: {str(e)}")

@app.post("/auto-rig")
async def auto_rig(req: JobRequest):
    return {"status": "ok", "step": "auto-rig", "received_mesh": req.image_url}

@app.post("/enhance-prompt", response_model=EnhancePromptResponse)
async def enhance_prompt(req: JobRequest):
    user_desc = req.prompt.strip()

    system_prompt = (
        "You are an expert in crafting prompts for Stable Diffusion to generate 3D T-posing characters for animation or modeling. "
        "Your goal is to convert the user’s character description into a detailed and explicit prompt that ensures:\n"
        "- Full body is visible\n"
        "- Arms are stretched horizontally in a T-pose\n"
        "- Front-facing view\n"
        "- Neutral background (white or gray, no scenery)\n"
        "- Stylized like a game-ready 3D character\n"
        "- Clear lighting and visible full clothing and body structure\n"
        "- No close-ups, no half-body crops, no dramatic angles\n\n"
        "DO NOT add any commentary. Just output the final enhanced prompt only."
    )

    prompt = f"{system_prompt}\n\nUser description:\n{user_desc}\n\nEnhanced prompt:"
    response = model.generate_content(prompt)
    enhanced = response.text.strip()

    return {"enhanced_prompt": enhanced}
