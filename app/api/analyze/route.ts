import { NextRequest, NextResponse } from "next/server";
import { analyzeAndGenerateHeadlines } from "@/app/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL ist erforderlich" },
        { status: 400 }
      );
    }

    const result = await analyzeAndGenerateHeadlines(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Analyse. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
