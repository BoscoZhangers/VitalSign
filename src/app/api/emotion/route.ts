// This API route is deprecated - emotion detection now happens client-side using face-api.js
// Keeping this file for backward compatibility during migration
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Emotion detection now runs client-side using face-api.js",
      emotion: "Neutral",
      confidence: 0.0
    },
    { status: 410 }
  );
}

