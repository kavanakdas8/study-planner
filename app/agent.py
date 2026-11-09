import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

# Define strict structured models
class Task(BaseModel):
    title: str = Field(description="Actionable title for the study task")
    duration_minutes: int = Field(description="Estimated minutes to complete")
    description: str = Field(description="Detailed instructions on what to read, code, or practice")
    resource_type: str = Field(description="e.g. Documentation, Exercise, Video, Reading")

class PeriodSchedule(BaseModel):
    period_label: str = Field(description="e.g. 'Day 1', 'Day 2', or 'Week 1'")
    topic_summary: str = Field(description="Core objective of this period")
    tasks: List[Task]

class StudyPlan(BaseModel):
    subject: str
    target_timeframe: str
    overview: str = Field(description="High-level strategy to master the topic within the timeframe")
    schedule: List[PeriodSchedule]

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_plan(topic: str, timeframe: str, daily_hours: float, experience_level: str) -> StudyPlan:
    prompt = f"""
    You are an expert pedagogical study coach and agentic curriculum designer.
    
    Student Goal: Learn '{topic}'
    Available Timeframe: {timeframe}
    Commitment: {daily_hours} hours per day
    Prior Experience: {experience_level}

    Requirements:
    1. If timeframe is under 14 days, break it down by individual days ('Day 1', 'Day 2', etc.).
    2. If timeframe is longer (e.g. 1 month), break it down by weeks ('Week 1', 'Week 2', etc.).
    3. Ensure daily tasks strictly do not exceed the stated daily hours limit.
    4. Balance theory (30%) with active, hands-on building/practice (70%).
    """

    # gemini-2.5-flash is deprecated; use supported models with fallback
    models_to_try = ["gemini-3.5-flash-lite", "gemini-3.5-flash"]
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=StudyPlan,
                    temperature=0.3
                ),
            )
            return StudyPlan.model_validate_json(response.text)
        except Exception as err:
            last_error = err
            continue

    raise last_error or RuntimeError("Failed to generate plan with available models.")