import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

load_dotenv()

# Structured Curriculum Models
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

class ChatExtractionSchema(BaseModel):
    message: str = Field(description="Friendly, concise conversational response to the user")
    topic: Optional[str] = Field(default=None, description="The subject or topic the user wants to learn")
    timeframe: Optional[str] = Field(default=None, description="E.g. '2 Weeks', '1 Month', '2 Months', '3 Months'")
    daily_hours: Optional[float] = Field(default=None, description="Daily available hours, e.g. 0.5, 1.0, 2.0, 3.0")
    experience_level: Optional[str] = Field(default=None, description="E.g. 'Beginner', 'Know the basics', 'Intermediate', 'Advanced'")
    objective: Optional[str] = Field(default=None, description="E.g. 'Job preparation', 'Academic', 'Project building', 'Interview prep', 'Personal interest'")
    ready_to_generate: bool = Field(description="True only if topic, timeframe, daily_hours, and experience_level are all known or user explicitly asked to generate")
    suggested_options: List[str] = Field(default_factory=list, description="3-5 quick-reply suggestion chips for the user's next response")

class ModificationSchema(BaseModel):
    explanation: str = Field(description="Clear explanation of the changes made to the roadmap")
    proposed_changes: List[str] = Field(description="List of specific bullet points detailing additions, removals, or schedule adjustments")
    modified_plan: StudyPlan

class AssistantSchema(BaseModel):
    reply: str = Field(description="Helpful, pedagogical tutor response formatted in Markdown")
    follow_ups: List[str] = Field(default_factory=list, description="2-3 relevant follow-up questions or next actions")

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODELS_TO_TRY = ["gemini-3.5-flash-lite", "gemini-3.5-flash"]

def chat_onboarding(messages: List[dict], current_params: Optional[dict] = None) -> ChatExtractionSchema:
    current_params = current_params or {}
    
    formatted_history = "\n".join([
        f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
        for m in messages
    ])

    prompt = f"""
You are CuratePlan's intelligent conversational study planner.
Your goal is to converse naturally with a student, understand what they want to learn, and collect only essential missing details to build their personalized curriculum.

Current Known Information:
- Topic: {current_params.get('topic', 'Unknown')}
- Timeframe: {current_params.get('timeframe', 'Unknown')}
- Daily Commitment: {current_params.get('daily_hours', 'Unknown')}
- Experience Level: {current_params.get('experience_level', 'Unknown')}
- Objective: {current_params.get('objective', 'Unknown')}

Conversation History:
{formatted_history}

CRITICAL RULES:
1. NEVER ask for information the user has already stated. If the user said "I know Python basics and want to learn ML in 2 months, 1 hr daily", extract ALL of those immediately.
2. Ask only ONE essential missing detail at a time in a warm, concise, conversational tone.
3. If Topic is known and other essentials (experience level, daily hours, timeframe) are collected, set ready_to_generate=true!
4. Always provide 3-5 quick-reply options in suggested_options matching the next logical question:
   - If asking experience: ["Complete beginner", "Know the basics", "Intermediate", "Advanced"]
   - If asking daily hours: ["30 mins / day", "1 hour / day", "2 hours / day", "3+ hours / day"]
   - If asking timeframe: ["2 Weeks", "1 Month", "2 Months", "3 Months", "No rush"]
   - If asking objective: ["Job preparation", "Build projects", "Academic exams", "Interview prep", "Personal curiosity"]
   - If ready to generate: ["Generate my roadmap now", "Customize parameters"]
"""

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ChatExtractionSchema,
                    temperature=0.2
                ),
            )
            return ChatExtractionSchema.model_validate_json(response.text)
        except Exception as err:
            last_error = err
            continue

    raise last_error or RuntimeError("Failed to process conversation with Gemini.")

def generate_plan(
    topic: str,
    timeframe: str,
    daily_hours: float,
    experience_level: str,
    objective: Optional[str] = "Project building"
) -> StudyPlan:
    prompt = f"""
You are an expert pedagogical study coach and agentic curriculum architect.
Create a comprehensive, production-grade learning curriculum for:

Student Goal: '{topic}'
Available Timeframe: {timeframe}
Daily Commitment: {daily_hours} hours per day
Prior Experience: {experience_level}
Primary Objective: {objective}

Pedagogical Requirements:
1. Break down into logical sequential periods (e.g. 'Week 1', 'Week 2' or 'Day 1', 'Day 2' if under 14 days).
2. Each period must have a focused 'topic_summary' and 2 to 4 actionable, practical tasks.
3. Daily task durations strictly must not exceed {daily_hours * 60} minutes total for that period.
4. Maintain a 30% theory / 70% hands-on building balance: include practical coding exercises, documentation reading, architecture videos, and real projects.
5. Provide clear, inspiring descriptions for each task explaining exactly what to build, study, or test.
"""

    last_error = None
    for model_name in MODELS_TO_TRY:
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

def modify_plan(
    current_plan: StudyPlan,
    instruction: str,
    completed_task_ids: Optional[List[str]] = None
) -> ModificationSchema:
    plan_json = current_plan.model_dump_json(indent=2)
    prompt = f"""
You are an expert curriculum optimizer.
The student has an existing curriculum and wants to modify it:

Student Instruction: "{instruction}"

Current Curriculum JSON:
{plan_json}

Completed Task IDs: {completed_task_ids or []}

Instructions:
1. Understand the student's request (e.g. shorten timeframe, add revision days, remove advanced topics, add projects).
2. Adjust the schedule to fulfill the request.
3. Preserve already-covered topics and completed work.
4. Output a clear explanation, a list of bullet points detailing the exact proposed changes, and the updated StudyPlan JSON.
"""

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ModificationSchema,
                    temperature=0.2
                ),
            )
            return ModificationSchema.model_validate_json(response.text)
        except Exception as err:
            last_error = err
            continue

    raise last_error or RuntimeError("Failed to modify plan with available models.")

def assistant_tutor(
    message: str,
    topic_context: Optional[dict] = None,
    plan_overview: Optional[str] = None,
    mode: Optional[str] = "chat"
) -> AssistantSchema:
    context_str = json.dumps(topic_context or {}, indent=2)
    prompt = f"""
You are CuratePlan's in-dashboard AI study tutor and mentor.
The student is actively studying.

Current Study Context:
- Plan Overview: {plan_overview or 'General Study'}
- Active Topic Context:
{context_str}

Student Message: "{message}"
Mode: {mode}

Guidelines:
1. Provide accurate, crystal-clear, pedagogically sound explanations.
2. If explaining a concept, give a concrete real-world analogy and a minimal code snippet if applicable.
3. If asked for practice questions, provide 5 high-yield conceptual or coding questions with clear answers and explanations.
4. Format using clean Markdown with bold keywords and concise sections.
5. Provide 2-3 relevant follow-up suggestions in follow_ups.
"""

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AssistantSchema,
                    temperature=0.3
                ),
            )
            return AssistantSchema.model_validate_json(response.text)
        except Exception as err:
            last_error = err
            continue

    raise last_error or RuntimeError("Failed to generate tutor response with available models.")
