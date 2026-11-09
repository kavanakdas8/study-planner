from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import generate_plan, StudyPlan

app = FastAPI(title="AI Study Planner API")

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

@app.post("/api/generate-plan", response_model=StudyPlan)
def make_plan(payload: PlanRequest):
    try:
        plan = generate_plan(
            topic=payload.topic,
            timeframe=payload.timeframe,
            daily_hours=payload.daily_hours,
            experience_level=payload.experience_level
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)