import { NextRequest, NextResponse } from "next/server";
import { generateSubheadlines } from "@/app/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { url, zielgruppe, ansprache, selectedHeadlines } =
      await request.json();

    if (
      !url ||
      !zielgruppe ||
      !ansprache ||
      !Array.isArray(selectedHeadlines) ||
      selectedHeadlines.length !== 3
    ) {
      return NextResponse.json(
        { error: "URL, Zielgruppe, Ansprache und 3 ausgewählte Headlines sind erforderlich" },
        { status: 400 }
      );
    }

    const subheadlines = await generateSubheadlines(
      url,
      zielgruppe,
      ansprache,
      selectedHeadlines
    );
    return NextResponse.json({ subheadlines });
  } catch (error) {
    console.error("Subheadlines error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Generierung. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
