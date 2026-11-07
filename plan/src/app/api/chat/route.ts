import { NextRequest, NextResponse } from "next/server";
import { callGemini, tryFastApiOrFallback } from "@/lib/geminiClient";

interface ChatPayload {
  messages: Array<{ role: string; content: string }>;
  current_params?: {
    topic?: string;
    timeframe?: string;
    daily_hours?: number;
    experience_level?: string;
    objective?: string;
  };
}

const chatSchema = {
  type: "OBJECT",
  properties: {
    message: { type: "STRING" },
    topic: { type: "STRING" },
    timeframe: { type: "STRING" },
    daily_hours: { type: "NUMBER" },
    experience_level: { type: "STRING" },
    objective: { type: "STRING" },
    ready_to_generate: { type: "BOOLEAN" },
    suggested_options: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["message", "ready_to_generate"],
};

export async function POST(req: NextRequest) {
  try {
    const payload: ChatPayload = await req.json();

    const result = await tryFastApiOrFallback("/api/chat", payload, async () => {
      const historyStr = (payload.messages || [])
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const prompt = `
You are CuratePlan's intelligent conversational study planner.
Your goal is to converse naturally with a student, understand what they want to learn, and collect only essential missing details to build their personalized curriculum.

Current Known Information:
- Topic: ${payload.current_params?.topic || "Unknown"}
- Timeframe: ${payload.current_params?.timeframe || "Unknown"}
- Daily Commitment: ${payload.current_params?.daily_hours || "Unknown"}
- Experience Level: ${payload.current_params?.experience_level || "Unknown"}
- Objective: ${payload.current_params?.objective || "Unknown"}

Conversation History:
${historyStr}

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
`;

      const responseText = await callGemini(prompt, chatSchema);
      return JSON.parse(responseText);
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process chat.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

