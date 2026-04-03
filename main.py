import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for your Live Server (usually port 5500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. CONFIGURATION ---
# API Key is loaded from environment variable to avoid public exposure
API_KEY = os.getenv('GAI_API_KEY')
if not API_KEY:
    raise RuntimeError('GAI_API_KEY environment variable not set. Please configure your Google Gemini key in your environment.')

# Optionally support local .env file if available (needs python-dotenv installed)
if not API_KEY:
    try:
        from dotenv import load_dotenv
        load_dotenv()
        API_KEY = os.getenv('GAI_API_KEY')
    except ImportError:
        pass

if not API_KEY:
    raise RuntimeError('GAI_API_KEY environment variable not set. Please configure your Google Gemini key in your environment.')

genai.configure(api_key=API_KEY)

# Use Gemini 2.0 Flash (current model, free tier available)
MODEL_NAME = 'gemini-2.0-flash'
model = genai.GenerativeModel(MODEL_NAME)

# --- 2. LOCAL KNOWLEDGE BASE (Offline Failover) ---
# This answers users if the API Quota is finished for the day.
OFFLINE_DATA = {
    "hello": "System online. I am Karan's Digital Twin. How can I help you?",
    "who are you": "I am an AI assistant representing Karan Bhati, a 2nd-year CSE student at GEC Jaipur.",
    "projects": "Karan's key projects include 'Pardarshi' (Budget Tracking) and 'Dariyav Grih Udyog' (E-commerce).",
    "skills": "Karan is skilled in Python, FastAPI, JavaScript, C++, and Linux Mint administration.",
    "college": "Karan studies at Government Engineering College (GEC), Jaipur.",
    "pardarshi": "Pardarshi is a live budget tracking tool designed for transparency in Indian public spending.",
    "dariyav": "Dariyav Grih Udyog is Karan's family business focused on handmade food products like pickles.",
    "contact": "You can find Karan on GitHub or LinkedIn as 'Karan Bhati'."
}

KARAN_CONTEXT = """
You are the AI Digital Twin of Karan Bhati. 
College: GEC Jaipur (2nd Year CSE).
Projects: Pardarshi, Dariyav Grih Udyog.
Tone: Professional, helpful, and tech-savvy.
"""

@app.get("/chat")
async def chat(user_msg: str, unlocked: bool = False):
    user_query = user_msg.lower()
    
    # 3. THE "OMEGA" SECURITY CHECK (Local Logic)
    if "bhati ji" in user_query or "boss" in user_query:
        if not unlocked:
            return {"reply": "Access Denied. This information is encrypted. Please provide the biometric unlock phrase."}
        else:
            return {"reply": "Biometric match confirmed. bhati ji (also known as boss) is Karan's partner and a key part of his personal world."}

    # 4. ATTEMPT CLOUD PROCESSING (Gemini)
    try:
        status_label = "UNLOCKED/PERSONAL" if unlocked else "LOCKED/PROFESSIONAL"
        prompt = f"{KARAN_CONTEXT}\nSECURITY_STATUS: {status_label}\nUser: {user_msg}\nAI:"
        
        response = model.generate_content(prompt)
        return {"reply": response.text}

    except Exception as e:
        # 5. THE QUOTA FAILSAFE
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str:
            print("!!! API QUOTA EXCEEDED: SWITCHING TO LOCAL CACHE !!!")
            
            # Search local keywords to find a match
            for key, val in OFFLINE_DATA.items():
                if key in user_query:
                    return {"reply": f"[LOCAL_CORE]: {val}"}
            
            return {"reply": "My high-level neural link is recharging (Quota Exceeded). I can still discuss Karan's projects, skills, or college! What would you like to know?"}
        
        return {"reply": "Neural Link Error: System connection lost."}

if __name__ == "__main__":
    import uvicorn
    # Running on localhost port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)