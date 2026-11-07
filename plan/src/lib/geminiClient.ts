/**
 * Server-side Gemini AI client for CuratePlan.
 * Directly communicates with Google Gemini REST API using GEMINI_API_KEY.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
}

export async function callGemini(prompt: string, responseJsonSchema?: unknown): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      if (responseJsonSchema) {
        body.generationConfig = {
          responseMimeType: "application/json",
          responseSchema: responseJsonSchema,
          temperature: 0.2,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText.substring(0, 200)}`);
      }

      const data: GeminiResponse = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty candidate response from Gemini.");
      }

      return text;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini.");
}

/**
 * Proxy helper: tries FastAPI backend first, falls back to direct Gemini call if backend is offline.
 */
export async function tryFastApiOrFallback<T>(
  endpoint: string,
  payload: unknown,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Backend offline or timeout -> proceed to direct Gemini fallback
  }

  return fallbackFn();
}

