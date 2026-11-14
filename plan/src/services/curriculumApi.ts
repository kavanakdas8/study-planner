import { StudyPlan, SavedPlan, OnboardingSelection } from "@/types/study";
import { normalizePlanToCurriculum } from "@/lib/curriculumAdapter";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface GeneratePlanPayload {
  topic: string;
  timeframe: string;
  daily_hours: number;
  experience_level: string;
  goal?: string;
}

/**
 * Communicates with the FastAPI backend to generate a structured curriculum
 * using Google Gemini.
 */
export async function generateCurriculumPlan(
  selection: OnboardingSelection
): Promise<SavedPlan> {
  const dailyHours = Number((selection.dailyMinutes / 60).toFixed(1));
  const payload: GeneratePlanPayload = {
    topic: selection.subject.trim(),
    timeframe: selection.durationLabel,
    daily_hours: dailyHours,
    experience_level: selection.level || "Beginner",
    goal: `Master ${selection.subject.trim()} (${selection.durationLabel}, ${selection.dailyLabel}/day)`,
  };

  const res = await fetch(`${API_BASE_URL}/api/generate-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.detail ||
        `Server error (${res.status}): Failed to generate curriculum. Ensure the backend is running on port 8000.`
    );
  }

  const planData: StudyPlan = await res.json();

  const newSavedPlan: SavedPlan = {
    ...planData,
    id: `plan_${Date.now()}`,
    createdAt: Date.now(),
    daily_hours: payload.daily_hours,
    experience_level: payload.experience_level,
  };

  return normalizePlanToCurriculum(newSavedPlan);
}
