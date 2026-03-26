import { NextRequest, NextResponse } from "next/server";
import { analyzeAdImage } from "@/app/lib/gemini";
import { analyzeUrlForCopyCreator, generateAdCopies } from "@/app/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFiles = formData.getAll("image") as File[];
    const url = formData.get("url") as string | null;

    if (imageFiles.length === 0 || !url) {
      return NextResponse.json(
        { error: "Mindestens ein Bild und eine URL sind erforderlich" },
        { status: 400 }
      );
    }

    // URL-Analyse einmal durchführen (Cache greift automatisch)
    const urlAnalysis = await analyzeUrlForCopyCreator(url);

    // Pro Bild parallel: Bildanalyse → Ad Copy Generierung
    const creatives = await Promise.all(
      imageFiles.map(async (imageFile) => {
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = imageFile.type;

        const imageAnalysis = await analyzeAdImage(base64, mimeType);
        const adCopies = await generateAdCopies(imageAnalysis, urlAnalysis, url);

        return {
          fileName: imageFile.name,
          imageAnalysis,
          adCopies,
        };
      })
    );

    return NextResponse.json({ urlAnalysis, creatives });
  } catch (error) {
    console.error("Copy Creator error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Generierung. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
