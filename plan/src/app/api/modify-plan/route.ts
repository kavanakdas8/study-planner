import { NextRequest, NextResponse } from "next/server";
import { callGemini, tryFastApiOrFallback } from "@/lib/geminiClient";
import { StudyPlan } from "@/types/study";

interface ModifyPayload {
  current_plan: StudyPlan;
  instruction: string;
  completed_task_ids?: string[];
}

const modifyPlanSchema = {
  type: "OBJECT",
  properties: {
    explanation: { type: "STRING" },
    proposed_changes: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    modified_plan: {
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
    },
  },
  required: ["explanation", "proposed_changes", "modified_plan"],
};

export async function POST(req: NextRequest) {
  try {
    const payload: ModifyPayload = await req.json();

    const result = await tryFastApiOrFallback("/api/modify-plan", payload, async () => {
      const prompt = `
You are an expert curriculum optimizer.
The student has an existing curriculum and wants to modify it:

Student Instruction: "${payload.instruction}"

Current Curriculum JSON:
${JSON.stringify(payload.current_plan, null, 2)}

Completed Task IDs: ${JSON.stringify(payload.completed_task_ids || [])}

Instructions:
1. Understand the student's request (e.g. shorten timeframe, add revision days, remove advanced topics, add projects).
2. Adjust the schedule to fulfill the request.
3. Preserve already-covered topics and completed work.
4. Output a clear explanation, a list of bullet points detailing the exact proposed changes, and the updated StudyPlan JSON.
`;

      const responseText = await callGemini(prompt, modifyPlanSchema);
      return JSON.parse(responseText);
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to modify plan.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

