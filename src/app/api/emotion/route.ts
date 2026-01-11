import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { getServerEnv } from "@/src/lib/env";
import type { EmotionResponse, EmotionLabel } from "@/src/contracts/types";

const ALLOWED: ReadonlyArray<EmotionLabel> = [
  "Neutral",
  "Happy",
  "Sad",
  "Angry"
] as const;

function extractJsonObject(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeEmotionResponse(obj: unknown): EmotionResponse {
  if (!obj || typeof obj !== "object") {
    return { emotion: "Neutral", confidence: 0.0 };
  }

  const emotionRaw = (obj as any).emotion;
  const confidenceRaw = (obj as any).confidence;

  const emotion: EmotionLabel = ALLOWED.includes(emotionRaw) ? emotionRaw : "Neutral";
  const confidenceNum = typeof confidenceRaw === "number" ? confidenceRaw : Number(confidenceRaw);
  const confidence = Number.isFinite(confidenceNum)
    ? Math.max(0, Math.min(1, confidenceNum))
    : 0.0;

  return { emotion, confidence };
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  // data:[<mediatype>][;base64],<data>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  return { mimeType, base64 };
}

export async function POST(req: Request) {
  try {
    const env = getServerEnv();
    if (!env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const imageDataUrl = body?.imageDataUrl;

    if (typeof imageDataUrl !== "string" || imageDataUrl.length < 32) {
      return NextResponse.json({ error: "imageDataUrl is required" }, { status: 400 });
    }

    // Keep requests bounded to avoid huge payloads.
    if (imageDataUrl.length > 2_500_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const parsed = parseDataUrl(imageDataUrl);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = [
      "You are an emotion classifier.",
      "Given a single image containing a human face, infer the most likely CURRENT emotional state.",
      `Return ONLY valid JSON with keys: { "emotion": one of ${ALLOWED.join("|")}, "confidence": number from 0 to 1 }.`,
      "If the face is not visible or you are uncertain, return {\"emotion\":\"Neutral\",\"confidence\":0.0}.",
      "Do not include any extra keys, markdown, or commentary."
    ].join("\n");

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: parsed.base64,
          mimeType: parsed.mimeType
        }
      }
    ]);

    const text = result.response.text();
    const parsedJson = extractJsonObject(text);
    const emotion = normalizeEmotionResponse(parsedJson);

    return NextResponse.json(emotion);
  } catch (error: any) {
    console.error("Emotion API Error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Failed to detect emotion", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
