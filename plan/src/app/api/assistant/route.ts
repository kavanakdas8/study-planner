import { NextRequest, NextResponse } from "next/server";
import { callGemini, tryFastApiOrFallback } from "@/lib/geminiClient";

interface AssistantPayload {
  message: string;
  topic_context?: Record<string, unknown>;
  plan_overview?: string;
  mode?: "chat" | "explain" | "quiz" | "practice" | "reschedule";
}

const assistantSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    follow_ups: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["reply"],
};

export async function POST(req: NextRequest) {
  try {
    const payload: AssistantPayload = await req.json();

    const result = await tryFastApiOrFallback("/api/assistant", payload, async () => {
      const prompt = `
You are CuratePlan's in-dashboard AI study tutor and mentor.
The student is actively studying.

Current Study Context:
- Plan Overview: ${payload.plan_overview || "General Study"}
- Active Topic Context:
${JSON.stringify(payload.topic_context || {}, null, 2)}

Student Message: "${payload.message}"
Mode: ${payload.mode || "chat"}

Guidelines:
1. Provide accurate, crystal-clear, pedagogically sound explanations.
2. If explaining a concept, give a concrete real-world analogy and a minimal code snippet if applicable.
3. If asked for practice questions, provide 5 high-yield conceptual or coding questions with clear answers and explanations.
4. Format using clean Markdown with bold keywords and concise sections.
5. Provide 2-3 relevant follow-up suggestions in follow_ups.
`;

      const responseText = await callGemini(prompt, assistantSchema);
      return JSON.parse(responseText);
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate tutor response.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

