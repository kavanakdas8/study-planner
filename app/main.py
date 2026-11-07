from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from agent import (
    generate_plan,
    chat_onboarding,
    modify_plan,
    assistant_tutor,
    StudyPlan,
    ChatExtractionSchema,
    ModificationSchema,
    AssistantSchema,
)

app = FastAPI(title="CuratePlan Conversational AI API", version="2.0.0")

# Allow Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanRequest(BaseModel):
    topic: str
    timeframe: str
    daily_hours: float
    experience_level: str
    objective: Optional[str] = "Project building"

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    current_params: Optional[Dict[str, Any]] = None

class ModifyRequest(BaseModel):
    current_plan: StudyPlan
    instruction: str
    completed_task_ids: Optional[List[str]] = None

class AssistantRequest(BaseModel):
    message: str
    topic_context: Optional[Dict[str, Any]] = None
    plan_overview: Optional[str] = None
    mode: Optional[str] = "chat"

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "CuratePlan AI API", "version": "2.0.0"}

@app.post("/api/chat", response_model=ChatExtractionSchema)
def chat_endpoint(payload: ChatRequest):
    try:
        result = chat_onboarding(
            messages=payload.messages,
            current_params=payload.current_params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-plan", response_model=StudyPlan)
def make_plan(payload: PlanRequest):
    try:
        plan = generate_plan(
            topic=payload.topic,
            timeframe=payload.timeframe,
            daily_hours=payload.daily_hours,
            experience_level=payload.experience_level,
            objective=payload.objective or "Project building"
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/modify-plan", response_model=ModificationSchema)
def modify_plan_endpoint(payload: ModifyRequest):
    try:
        result = modify_plan(
            current_plan=payload.current_plan,
            instruction=payload.instruction,
            completed_task_ids=payload.completed_task_ids
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assistant", response_model=AssistantSchema)
def assistant_endpoint(payload: AssistantRequest):
    try:
        result = assistant_tutor(
            message=payload.message,
            topic_context=payload.topic_context,
            plan_overview=payload.plan_overview,
            mode=payload.mode or "chat"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
