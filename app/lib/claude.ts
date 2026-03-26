import Anthropic from "@anthropic-ai/sdk";
import type { ImageAnalysisResult } from "./gemini";
import { getCache, setCache } from "./db";

const client = new Anthropic();

export interface AnalysisResult {
  zielgruppe: string;
  ansprache: "Du" | "Sie";
  headlines: string[];
}

export interface UrlAnalysisResult {
  zielgruppe: string;
  seitenintention: string;
  funnel_stufe: "Top-of-Funnel" | "Middle-Funnel" | "Bottom-Funnel";
  tonalitaet: string;
  ansprache: "Du" | "Sie";
}

export interface AdCopyResult {
  kurztext: string;
  langtext: string;
  titel: [string, string];
}

export async function analyzeAndGenerateHeadlines(
  url: string
): Promise<AnalysisResult> {
  const cached = await getCache<AnalysisResult>(url, "headline_analysis");
  if (cached) return cached;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Nimm die Rolle einer professionellen Meta Copywriterin ein mit 10+ Jahren Erfahrung.
      Du schreibst Headlines auf Weltklasse Niveau, welche perfekt auf die Zielgruppe zugeschnitten sind und darauf abzielen, Neugierde und Interesse zu wecken.
      
      Rufe die folgende URL ab und analysiere das Angebot: ${url}

Basierend auf dem Inhalt der Seite:

1. Ermittle die Zielgruppe des Angebots (z.B. "Unternehmer im Bereich E-Commerce", "Frauen zwischen 25-40 die abnehmen wollen", etc.)
2. Ermittle die passende Ansprache: "Du" oder "Sie" — je nachdem was zur Zielgruppe und zum Tonfall der Seite passt
3. Erstelle 5 Facebook/Meta Ad Headlines (jeweils maximal 40 Zeichen)

WICHTIG zur Tonalität und Schreibweise:
- Analysiere die Sprache und Schreibweise der Seite genau. Achte auf regionale Besonderheiten (z.B. Schweizer Seiten verwenden kein "ß" sondern "ss", österreichische Seiten haben eigene Begriffe).
- Übernimm die Tonalität der Seite (formell, locker, emotional, sachlich) in den Headlines.
- Verwende dieselbe Rechtschreibvariante wie die Seite.

Die Headlines sollen:
- Aufmerksamkeit erregen
- Zum Klicken animieren
- Zum Angebot und zur Zielgruppe passen
- Die ermittelte Ansprache (Du/Sie) verwenden
- Die Tonalität und Schreibweise der Seite übernehmen
- Jede Headline endet mit einem Punkt.
- Verwende NIEMALS das Zeichen "–" (Halbgeviertstrich), da es nach AI aussieht. Verwende stattdessen "-" (normaler Bindestrich).
- STRIKT maximal 40 Zeichen lang sein (inklusive Leerzeichen und Punkt)

Antworte ausschließlich im folgenden JSON-Format, ohne zusätzlichen Text:
{
  "zielgruppe": "Beschreibung der Zielgruppe",
  "ansprache": "Du" oder "Sie",
  "headlines": ["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"]
}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [
      { type: "web_fetch_20260209", name: "web_fetch" },
    ],
    messages,
  });

  // Handle agentic loop: web_fetch is server-side, so we may get pause_turn or tool_use
  let currentMessages = [...messages];
  let currentResponse = response;

  while (
    currentResponse.stop_reason === "tool_use" ||
    currentResponse.stop_reason === "pause_turn"
  ) {
    currentMessages.push({
      role: "assistant",
      content: currentResponse.content,
    });

    if (currentResponse.stop_reason === "tool_use") {
      const toolUseBlocks = currentResponse.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
        (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Tool executed server-side",
        })
      );
      currentMessages.push({ role: "user", content: toolResults });
    }

    currentResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        { type: "web_fetch_20260209", name: "web_fetch" },
      ],
      messages: currentMessages,
    });
  }

  const textBlock = currentResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  if (!textBlock) {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response (handle potential markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const result = JSON.parse(jsonStr) as AnalysisResult;
  await setCache(url, "headline_analysis", result);
  return result;
}

export async function generateSubheadlines(
  url: string,
  zielgruppe: string,
  ansprache: "Du" | "Sie",
  selectedHeadlines: string[]
): Promise<string[]> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Nimm die Rolle einer professionellen Meta Copywriterin ein mit 10+ Jahren Erfahrung.
Du schreibst Headlines auf Weltklasse Niveau, welche perfekt auf die Zielgruppe 
zugeschnitten sind und darauf abzielen, Neugierde und Interesse zu wecken.

Rufe die folgende URL ab und analysiere das Angebot: ${url}

Die Zielgruppe ist: ${zielgruppe}
Die Ansprache ist: ${ansprache}

Der Nutzer hat folgende 3 Hauptheadlines ausgewählt:
1. ${selectedHeadlines[0]}
2. ${selectedHeadlines[1]}
3. ${selectedHeadlines[2]}

WICHTIG zur Tonalität und Schreibweise:
- Analysiere die Sprache und Schreibweise der Seite genau. Achte auf regionale Besonderheiten (z.B. Schweizer Seiten verwenden kein "ß" sondern "ss", österreichische Seiten haben eigene Begriffe).
- Übernimm die Tonalität der Seite (formell, locker, emotional, sachlich) in den Subheadlines.
- Verwende dieselbe Rechtschreibvariante wie die Seite.

Erstelle nun 5 Facebook/Meta Ad Subheadlines (Descriptions), die:
- Maximal 125 Zeichen lang sind (inklusive Leerzeichen)
- Auf den Inhalt des Angebots eingehen
- Die Ansprache "${ansprache}" verwenden
- Die Tonalität und Schreibweise der Seite übernehmen
- Jede Subheadline endet mit einem Punkt.
- Verwende NIEMALS das Zeichen "–" (Halbgeviertstrich), da es nach AI aussieht. Verwende stattdessen "-" (normaler Bindestrich).
- KEINE inhaltliche Redundanz mit den 3 ausgewählten Hauptheadlines haben
- Ergänzende Informationen oder Vorteile hervorheben, die in den Headlines NICHT erwähnt werden
- Zum Klicken und zur Conversion animieren

Antworte ausschließlich im folgenden JSON-Format, ohne zusätzlichen Text:
{
  "subheadlines": ["Subheadline 1", "Subheadline 2", "Subheadline 3", "Subheadline 4", "Subheadline 5"]
}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [
      { type: "web_fetch_20260209", name: "web_fetch" },
    ],
    messages,
  });

  let currentMessages = [...messages];
  let currentResponse = response;

  while (
    currentResponse.stop_reason === "tool_use" ||
    currentResponse.stop_reason === "pause_turn"
  ) {
    currentMessages.push({
      role: "assistant",
      content: currentResponse.content,
    });

    if (currentResponse.stop_reason === "tool_use") {
      const toolUseBlocks = currentResponse.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
        (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Tool executed server-side",
        })
      );
      currentMessages.push({ role: "user", content: toolResults });
    }

    currentResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        { type: "web_fetch_20260209", name: "web_fetch" },
      ],
      messages: currentMessages,
    });
  }

  const textBlock = currentResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  if (!textBlock) {
    throw new Error("No text response from Claude");
  }

  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const result = JSON.parse(jsonStr) as { subheadlines: string[] };
  return result.subheadlines;
}

export async function analyzeUrlForCopyCreator(
  url: string
): Promise<UrlAnalysisResult> {
  const cached = await getCache<UrlAnalysisResult>(url, "copy_creator_analysis");
  if (cached) return cached;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Du bist ein erfahrener Meta Ads Stratege. Rufe die folgende URL ab und analysiere die Seite im Kontext von Meta Ads: ${url}

Bestimme:
1. **Zielgruppe**: Wer wird mit dieser Seite angesprochen? (z.B. "Unternehmer im E-Commerce", "Frauen 25-40 die abnehmen wollen")
2. **Seitenintention**: Was ist das Ziel der Seite? (z.B. Lead-Generierung, Produktverkauf, Terminbuchung, Newsletter-Anmeldung)
3. **Funnel-Stufe**: Auf welcher Awareness-Stufe befindet sich die Seite?
   - "Top-of-Funnel": Aufmerksamkeit, Problembewusstsein
   - "Middle-Funnel": Lösungspräsentierung, Vertrauensaufbau
   - "Bottom-Funnel": Direkte Conversion, Kaufaufforderung
4. **Tonalität**: Wie ist der Tonfall der Seite? (z.B. professionell, locker, emotional, sachlich)
5. **Ansprache**: Wird "Du" oder "Sie" verwendet?

Antworte ausschließlich im folgenden JSON-Format, ohne zusätzlichen Text:
{
  "zielgruppe": "...",
  "seitenintention": "...",
  "funnel_stufe": "Top-of-Funnel" | "Middle-Funnel" | "Bottom-Funnel",
  "tonalitaet": "...",
  "ansprache": "Du" | "Sie"
}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_fetch_20260209", name: "web_fetch" }],
    messages,
  });

  let currentMessages = [...messages];
  let currentResponse = response;

  while (
    currentResponse.stop_reason === "tool_use" ||
    currentResponse.stop_reason === "pause_turn"
  ) {
    currentMessages.push({
      role: "assistant",
      content: currentResponse.content,
    });

    if (currentResponse.stop_reason === "tool_use") {
      const toolUseBlocks = currentResponse.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
        (block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Tool executed server-side",
        })
      );
      currentMessages.push({ role: "user", content: toolResults });
    }

    currentResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [{ type: "web_fetch_20260209", name: "web_fetch" }],
      messages: currentMessages,
    });
  }

  const textBlock = currentResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  if (!textBlock) {
    throw new Error("No text response from Claude");
  }

  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const result = JSON.parse(jsonStr) as UrlAnalysisResult;
  await setCache(url, "copy_creator_analysis", result);
  return result;
}

export async function generateAdCopies(
  imageAnalysis: ImageAnalysisResult,
  urlAnalysis: UrlAnalysisResult,
  url: string
): Promise<AdCopyResult> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Du bist eine professionelle Meta Copywriterin mit 10+ Jahren Erfahrung. Du schreibst Werbetexte auf Weltklasse-Niveau.

Die Ziel-URL des Angebots ist: ${url}

Du hast zwei Analysen erhalten:

**Bild-Analyse der bestehenden Ad:**
- Beschreibung: ${imageAnalysis.beschreibung}
- Stimmung: ${imageAnalysis.stimmung}
- Anzeigentyp: ${imageAnalysis.anzeigentyp}
- Awareness-Stufe: ${imageAnalysis.awareness_stufe}

**Landing-Page-Analyse:**
- Zielgruppe: ${urlAnalysis.zielgruppe}
- Seitenintention: ${urlAnalysis.seitenintention}
- Funnel-Stufe: ${urlAnalysis.funnel_stufe}
- Tonalität: ${urlAnalysis.tonalitaet}
- Ansprache: ${urlAnalysis.ansprache}

Basierend auf beiden Analysen, erstelle:

1. **Zwei komplett unterschiedliche Meta Ad Copies (Primary Text)**:
   - Die eine soll KURZ sein (2-3 Sätze), die andere LANG (4-6 Sätze mit Absätzen)
   - Die eine DARF Emojis enthalten, die andere NICHT
   - Beide müssen barrierefreundlich sein (klare Sprache, keine komplizierten Formulierungen)
   - Verwende die Ansprache "${urlAnalysis.ansprache}"
   - Passe die Copies an die Awareness-Stufe und Stimmung der Ad an
   - Verwende NIEMALS das Zeichen "\u2013" (Halbgeviertstrich), da es nach AI aussieht. Verwende stattdessen "-" (normaler Bindestrich).

2. **Zwei Meta-Titel (Headlines)**:
   - Maximal 40 Zeichen (inklusive Leerzeichen)
   - Direkt einsetzbar als Facebook/Meta Ad Headline
   - Jeder Titel endet mit einem Punkt.
   - Verwende NIEMALS das Zeichen "\u2013" (Halbgeviertstrich).

WICHTIG: Verwende korrekte deutsche Umlaute (ä, ö, ü, Ä, Ö, Ü, ß) in den Texten. Schreibe natürliches Deutsch, NICHT "ae", "oe", "ue" oder "ss" als Ersatz für Umlaute — es sei denn, die Seite verwendet Schweizer Rechtschreibung (dann kein ß, aber Umlaute trotzdem verwenden).

KRITISCH: Deine GESAMTE Antwort muss NUR aus dem folgenden JSON bestehen. Kein Text davor, kein Text danach, keine Erklärungen. Nur das JSON-Objekt:
{
  "kurztext": "Kurze Ad Copy hier...",
  "langtext": "Lange Ad Copy hier...",
  "titel": ["Titel 1.", "Titel 2."]
}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages,
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );

  if (!textBlock) {
    throw new Error("No text response from Claude");
  }

  let jsonStr = textBlock.text.trim();

  // Versuche JSON aus verschiedenen Formaten zu extrahieren
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonStr = jsonObjectMatch[0];
    }
  }

  try {
    return JSON.parse(jsonStr) as AdCopyResult;
  } catch {
    console.error("Failed to parse Ad Copy response:", textBlock.text);
    throw new Error("Claude hat kein gültiges JSON zurückgegeben. Bitte erneut versuchen.");
  }
}
