import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ImageAnalysisResult {
  beschreibung: string;
  stimmung: string;
  anzeigentyp: string;
  awareness_stufe: "Top-of-Funnel" | "Middle-Funnel" | "Bottom-Funnel";
}

export async function analyzeAdImage(
  imageBase64: string,
  mimeType: string
): Promise<ImageAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
    {
      text: `Du bist ein erfahrener Meta Ads Analyst. Analysiere dieses Werbebild und bestimme:

1. **Beschreibung**: Was ist auf dem Bild zu sehen? Beschreibe den Inhalt kurz und präzise.
2. **Stimmung**: Welche Stimmung/Atmosphäre vermittelt das Bild? (z.B. professionell, emotional, verspielt, luxuriös, dringend, etc.)
3. **Anzeigentyp**: Um welche Art von Anzeige handelt es sich? (z.B. Produktanzeige, Testimonial, Lifestyle, Rabattaktion, Lead-Generierung, etc.)
4. **Awareness-Stufe**: Auf welcher Awareness-Stufe befindet sich die Anzeige?
   - "Top-of-Funnel": Aufmerksamkeit erzeugen, Problembewusstsein schaffen
   - "Middle-Funnel": Lösungen präsentieren, Vertrauen aufbauen
   - "Bottom-Funnel": Direkte Conversion, Kaufaufforderung

Antworte ausschließlich im folgenden JSON-Format, ohne zusätzlichen Text:
{
  "beschreibung": "...",
  "stimmung": "...",
  "anzeigentyp": "...",
  "awareness_stufe": "Top-of-Funnel" | "Middle-Funnel" | "Bottom-Funnel"
}`,
    },
  ]);

  const response = result.response;
  let jsonStr = response.text().trim();

  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr) as ImageAnalysisResult;
}
