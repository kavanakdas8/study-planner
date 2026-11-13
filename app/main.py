from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from agent import generate_plan, handle_chat_turn, StudyPlan, ChatMessage

app = FastAPI(title="CuratePlan AI Study Planner API", version="2.0.0")

# Allow Next.js frontend to connect from standard local dev ports
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
    goal: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = Field(default_factory=list)
    collected_info: Optional[Dict[str, Any]] = None
    current_plan: Optional[Dict[str, Any]] = None
    mode: str = "onboarding" # "onboarding" | "assistant"

class ChatResponse(BaseModel):
    reply: str
    suggested_replies: List[str] = Field(default_factory=list)
    ready_to_generate: bool = False
    collected_info: Optional[Dict[str, Any]] = None
    plan: Optional[StudyPlan] = None
    has_curriculum_change: bool = False
    change_summary: Optional[str] = None
    updated_plan: Optional[StudyPlan] = None

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": "CuratePlan AI Backend"}

@app.post("/api/generate-plan", response_model=StudyPlan)
@app.post("/generate-plan", response_model=StudyPlan)
def make_plan(payload: PlanRequest):
    try:
        print(f"[Backend] Received subject: '{payload.topic}'")
        print(f"[Backend] Received study preferences: timeframe='{payload.timeframe}', daily_hours={payload.daily_hours}, level='{payload.experience_level}'")
        plan = generate_plan(
            topic=payload.topic,
            timeframe=payload.timeframe,
            daily_hours=payload.daily_hours,
            experience_level=payload.experience_level,
            goal=payload.goal
        )
        print(f"[Backend] Generated curriculum subject: '{plan.subject}' with {len(plan.schedule)} periods")
        return plan
    except Exception as e:
        print(f"[Backend] Error generating plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
@app.post("/chat", response_model=ChatResponse)
def chat_turn(payload: ChatRequest):
    try:
        result = handle_chat_turn(
            message=payload.message,
            history=payload.history,
            collected_info=payload.collected_info,
            current_plan=payload.current_plan,
            mode=payload.mode
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
