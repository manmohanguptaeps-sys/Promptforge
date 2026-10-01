import { NextResponse } from "next/server";
import { analyzeIntentFast } from "@/lib/ai/analyzeIntent";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const result = await analyzeIntentFast(message);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Intent API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Intent analysis failed.",
      },
      { status: 500 }
    );
  }
}