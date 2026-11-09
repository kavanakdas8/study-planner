import os
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Load .env relative to this file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Models to attempt with fallback
MODELS_TO_TRY = ["gemini-3.5-flash-lite", "gemini-3.5-flash"]

# Structured Models for Study Plan
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

# Chat Interface Models
class ChatMessage(BaseModel):
    role: str # "user" | "assistant" | "system"
    content: str

class ConversationTurn(BaseModel):
    reply: str = Field(description="Conversational response to the user. Warm, encouraging, concise.")
    suggested_replies: List[str] = Field(default_factory=list, description="3-4 short suggested response options/chips for the user")
    extracted_topic: Optional[str] = Field(None, description="Learning topic/subject if identified")
    extracted_timeframe: Optional[str] = Field(None, description="Timeframe e.g. '2 weeks', '1 month', '8 weeks'")
    extracted_daily_hours: Optional[float] = Field(None, description="Daily hours commitment e.g. 1.0, 2.0")
    extracted_experience_level: Optional[str] = Field(None, description="Experience level e.g. 'Beginner', 'Intermediate', 'Advanced'")
    extracted_goal: Optional[str] = Field(None, description="Goal focus e.g. 'Build practical projects', 'Exam prep', 'Fundamentals'")
    ready_to_generate: bool = Field(False, description="True if we have enough info (topic, experience, timeframe, daily hours) to generate the study plan now")

class AssistantTurn(BaseModel):
    reply: str = Field(description="Helpful answer or explanation for the student")
    suggested_replies: List[str] = Field(default_factory=list, description="2-4 relevant follow-up actions or questions")
    has_curriculum_change: bool = Field(False, description="True if user requested modifying the existing study plan/schedule")
    change_summary: Optional[str] = Field(None, description="Concise explanation of the changes made to the schedule")
    updated_plan: Optional[StudyPlan] = Field(None, description="The updated StudyPlan if has_curriculum_change is True")

def get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not configured.")
    return genai.Client(api_key=api_key)

def generate_plan(
    topic: str,
    timeframe: str,
    daily_hours: float,
    experience_level: str,
    goal: Optional[str] = None
) -> StudyPlan:
    """Generate a structured study plan compatible with CuratePlan frontend."""
    client = get_client()

    goal_prompt = f"\nSpecific Student Focus: {goal}" if goal else ""
    prompt = f"""
    You are an expert pedagogical study coach and agentic curriculum designer for CuratePlan.

    Student Goal: Learn '{topic}'
    Available Timeframe: {timeframe}
    Commitment: {daily_hours} hours per day
    Prior Experience: {experience_level}{goal_prompt}

    Requirements:
    1. If timeframe is under 14 days, break it down by individual days ('Day 1', 'Day 2', etc.).
    2. If timeframe is longer (e.g. 1 month, 6 weeks, 8 weeks), break it down by weeks ('Week 1', 'Week 2', etc.).
    3. Ensure daily tasks strictly do not exceed the stated daily hours limit ({daily_hours} hours = {int(daily_hours * 60)} minutes total per period).
    4. Balance theory (30%) with active, hands-on building/practice (70%).
    5. Each task must have an informative description with concrete instructions and realistic duration_minutes.
    6. Include practical milestone projects or exercises that test mastery.
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

def handle_chat_turn(
    message: str,
    history: List[ChatMessage],
    collected_info: Optional[Dict[str, Any]] = None,
    current_plan: Optional[Dict[str, Any]] = None,
    mode: str = "onboarding"
) -> Dict[str, Any]:
    """Process a conversational turn, either for onboarding curriculum creation or in-dashboard study assistance."""
    client = get_client()
    collected = dict(collected_info or {})

    if mode == "assistant" and current_plan:
        # Dashboard assistant mode: user asking questions or modifying active curriculum
        formatted_history = "\n".join([f"{m.role}: {m.content}" for m in history[-8:]])
        plan_summary = f"Subject: {current_plan.get('subject')}\nTimeframe: {current_plan.get('target_timeframe')}\nOverview: {current_plan.get('overview')}"
        schedule_preview = json.dumps(current_plan.get("schedule", [])[:6], indent=2)

        prompt = f"""
        You are CuratePlan's intelligent learning assistant for the student's active study plan.

        Current Active Plan:
        {plan_summary}
        Current Schedule Sample:
        {schedule_preview}

        Recent Conversation:
        {formatted_history}

        User Message: "{message}"

        Instructions:
        1. If user is asking for explanation, quiz, or study tips:
           - Provide a clear, supportive, concise explanation.
           - Set has_curriculum_change = False.
           - Provide 2-3 helpful suggested follow-up chips in suggested_replies.
        2. If user is asking to modify their schedule (e.g. "Reschedule remaining topics", "I missed 3 days", "Reduce daily workload", "Add more practical projects", "Make it easier"):
           - Formulate the adjusted plan schedule based on their request while keeping completed/past context intact.
           - Set has_curriculum_change = True.
           - Provide change_summary describing exactly what was modified.
           - Return the full updated StudyPlan in updated_plan.
           - In your reply, explain the modifications clearly and ask if they would like to apply this update.
        """

        last_error = None
        for model_name in MODELS_TO_TRY:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AssistantTurn,
                        temperature=0.3
                    ),
                )
                turn = AssistantTurn.model_validate_json(response.text)
                return {
                    "reply": turn.reply,
                    "suggested_replies": turn.suggested_replies,
                    "has_curriculum_change": turn.has_curriculum_change,
                    "change_summary": turn.change_summary,
                    "updated_plan": turn.updated_plan.model_dump() if turn.updated_plan else None,
                    "collected_info": collected,
                    "plan": None,
                }
            except Exception as err:
                last_error = err
                continue
        raise last_error or RuntimeError("Failed to process assistant request.")

    # Onboarding Mode: Conversational curriculum creation
    formatted_history = "\n".join([f"{m.role}: {m.content}" for m in history[-8:]])
    known_str = json.dumps(collected)

    prompt = f"""
    You are CuratePlan's expert AI pedagogical advisor and learning companion.
    Your objective is to have a natural, ChatGPT-inspired conversation with the student to understand what they want to learn and collect enough details to generate a personalized study roadmap.

    Key information needed for a great roadmap:
    1. Topic / Subject (e.g. "Machine Learning", "Python from scratch", "Data Structures & Algorithms")
    2. Prior Experience (e.g. "Complete beginner", "Know the basics", "Intermediate", "Advanced")
    3. Daily study commitment (e.g. 0.5, 1.0, 2.0, 3.0 hours)
    4. Target timeframe (e.g. "2 weeks", "4 weeks", "8 weeks", "2 months")
    5. Main goal (e.g. "Build practical projects", "Exam preparation", "Career transition", "Master fundamentals")

    Already Known Information:
    {known_str}

    Recent Conversation History:
    {formatted_history}

    Latest User Message:
    "{message}"

    Guidelines:
    - If the user provides multiple details in one message (e.g. "I want to learn Python in 4 weeks, studying 2 hours a day, I'm a beginner"), extract ALL of them immediately! DO NOT ask redundant questions for information already provided.
    - If key information is missing, ask ONLY 1 friendly, focused question to get the next missing detail.
    - Provide 3-4 short, clickable suggested replies/chips (e.g. ["Complete beginner", "Know the basics", "Intermediate", "Advanced"] or ["30 minutes", "1 hour", "2 hours", "3+ hours"]).
    - When you have the Topic, Experience Level, Daily Hours, and Timeframe (or if user says "generate now" / has provided enough context):
      Set ready_to_generate = True.
      Make your reply enthusiastic and confirm what is being built (e.g. "Fantastic! Building your customized Python roadmap now...").
    - If user asks to adapt, change pace, or make it more project-focused before generating, update the extracted parameters accordingly.
    """

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ConversationTurn,
                    temperature=0.3
                ),
            )
            turn = ConversationTurn.model_validate_json(response.text)

            # Update collected info
            if turn.extracted_topic:
                collected["topic"] = turn.extracted_topic
            if turn.extracted_timeframe:
                collected["timeframe"] = turn.extracted_timeframe
            if turn.extracted_daily_hours is not None:
                collected["daily_hours"] = turn.extracted_daily_hours
            if turn.extracted_experience_level:
                collected["experience_level"] = turn.extracted_experience_level
            if turn.extracted_goal:
                collected["goal"] = turn.extracted_goal

            # Check if we have all essentials
            has_essentials = bool(
                collected.get("topic")
                and collected.get("timeframe")
                and collected.get("daily_hours")
                and collected.get("experience_level")
            )

            is_ready = turn.ready_to_generate or has_essentials
            generated_plan = None

            if is_ready:
                # Default fallbacks for safety if missing
                topic = collected.get("topic") or message
                timeframe = collected.get("timeframe") or "4 Weeks"
                daily_hours = float(collected.get("daily_hours") or 1.5)
                experience = collected.get("experience_level") or "Beginner"
                goal = collected.get("goal")

                generated_plan = generate_plan(
                    topic=topic,
                    timeframe=timeframe,
                    daily_hours=daily_hours,
                    experience_level=experience,
                    goal=goal
                )

            return {
                "reply": turn.reply,
                "suggested_replies": turn.suggested_replies if not is_ready else [],
                "ready_to_generate": is_ready,
                "collected_info": collected,
                "plan": generated_plan.model_dump() if generated_plan else None,
            }
        except Exception as err:
            last_error = err
            continue

    raise last_error or RuntimeError("Failed to process conversation with available models.")
