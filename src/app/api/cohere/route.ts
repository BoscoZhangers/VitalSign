import { CohereClient } from "cohere-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CohereBody = {
	prompt?: unknown;
	model?: unknown;
};

function getModel(body: CohereBody | null): string {
	const fromBody = typeof body?.model === "string" ? body.model.trim() : "";
	if (fromBody) return fromBody;

	const fromEnv = (process.env.COHERE_MODEL ?? "").trim();
	if (fromEnv) return fromEnv;

	// Use a modern chat model by default (generate() is legacy in the SDK).
	return "command-a-03-2025";
}

export async function POST(req: Request) {
	try {
		const apiKey = process.env.COHERE_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 }
			);
		}

		const body = (await req.json().catch(() => null)) as CohereBody | null;
		const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
		if (!prompt) {
			return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
		}

		const model = getModel(body);
		const cohere = new CohereClient({ token: apiKey });
		const result = await cohere.chat({
			model,
			message: prompt
		});

		const text = String(result.text ?? "").trim();
		return NextResponse.json({ text });
	} catch (error: any) {
		const details = error?.message ?? error?.body ?? String(error);
		console.error("Cohere API Error:", details);
		return NextResponse.json(
			{ error: "Failed to generate content", details },
			{ status: 500 }
		);
	}
}
