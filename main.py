import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
API_KEY = os.getenv('GAI_API_KEY')

if not API_KEY:
    try:
        from dotenv import load_dotenv
        load_dotenv()
        API_KEY = os.getenv('GAI_API_KEY')
    except Exception:
        pass

if not API_KEY:
    raise RuntimeError('GAI_API_KEY environment variable not set. Please configure your Google Gemini key in your environment.')

genai.configure(api_key=API_KEY)

MODEL_NAME = 'gemini-2.0-flash'
model = genai.GenerativeModel(MODEL_NAME)

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
    
    if "bhati ji" in user_query or "boss" in user_query:
        if not unlocked:
            return {"reply": "Access Denied. This information is encrypted. Please provide the biometric unlock phrase."}
        else:
            return {"reply": "Biometric match confirmed. bhati ji (also known as boss) is Karan's partner and a key part of his personal world."}

    try:
        status_label = "UNLOCKED/PERSONAL" if unlocked else "LOCKED/PROFESSIONAL"
        prompt = f"{KARAN_CONTEXT}\nSECURITY_STATUS: {status_label}\nUser: {user_msg}\nAI:"
        
        response = model.generate_content(prompt)
        return {"reply": response.text}

    except Exception as e:
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str:
            print("!!! API QUOTA EXCEEDED: SWITCHING TO LOCAL CACHE !!!")
            
            for key, val in OFFLINE_DATA.items():
                if key in user_query:
                    return {"reply": f"[LOCAL_CORE]: {val}"}
            
            return {"reply": "My high-level neural link is recharging (Quota Exceeded). I can still discuss Karan's projects, skills, or college! What would you like to know?"}
        
        return {"reply": "Neural Link Error: System connection lost."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)