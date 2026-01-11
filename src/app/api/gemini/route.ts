import { CohereClient } from "cohere-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Deprecated route name: kept for compatibility.
// Implementation now uses Cohere. Prefer calling /api/cohere.

export async function POST(req: Request) {
  try {
    if (!process.env.COHERE_API_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
    const model = (process.env.COHERE_MODEL ?? "command-a-03-2025").trim() || "command-a-03-2025";
    const result = await cohere.chat({ model, message: prompt });
    const text = String(result.text ?? "");

    return NextResponse.json({ text });
    
  } catch (error: any) {
    console.error("Cohere API Error:", error?.message ?? error?.body ?? error);
    
    return NextResponse.json(
      { error: "Failed to generate content", details: error.message },
      { status: 500 }
    );
  }
}