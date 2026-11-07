import { NextRequest, NextResponse } from "next/server";
import { callGemini, tryFastApiOrFallback } from "@/lib/geminiClient";

interface PlanRequestPayload {
  topic: string;
  timeframe: string;
  daily_hours: number;
  experience_level: string;
  objective?: string;
}

const studyPlanSchema = {
  type: "OBJECT",
  properties: {
    subject: { type: "STRING" },
    target_timeframe: { type: "STRING" },
    overview: { type: "STRING" },
    schedule: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          period_label: { type: "STRING" },
          topic_summary: { type: "STRING" },
          tasks: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                duration_minutes: { type: "INTEGER" },
                description: { type: "STRING" },
                resource_type: { type: "STRING" },
              },
              required: ["title", "duration_minutes", "description", "resource_type"],
            },
          },
        },
        required: ["period_label", "topic_summary", "tasks"],
      },
    },
  },
  required: ["subject", "target_timeframe", "overview", "schedule"],
};

export async function POST(req: NextRequest) {
  try {
    const payload: PlanRequestPayload = await req.json();

    const plan = await tryFastApiOrFallback("/api/generate-plan", payload, async () => {
      const prompt = `
You are an expert pedagogical study coach and agentic curriculum architect.
Create a comprehensive, production-grade learning curriculum for:

Student Goal: '${payload.topic}'
Available Timeframe: ${payload.timeframe}
Daily Commitment: ${payload.daily_hours} hours per day
Prior Experience: ${payload.experience_level}
Primary Objective: ${payload.objective || "Practical building"}

Pedagogical Requirements:
1. Break down into logical sequential periods (e.g. 'Week 1', 'Week 2' or 'Day 1', 'Day 2' if under 14 days).
2. Each period must have a focused 'topic_summary' and 2 to 4 actionable, practical tasks.
3. Daily task durations strictly must not exceed ${payload.daily_hours * 60} minutes total for that period.
4. Maintain a 30% theory / 70% hands-on building balance: include practical coding exercises, documentation reading, architecture videos, and real projects.
5. Provide clear, inspiring descriptions for each task explaining exactly what to build, study, or test.
`;

      const responseText = await callGemini(prompt, studyPlanSchema);
      return JSON.parse(responseText);
    });

    return NextResponse.json(plan);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate plan.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

