import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface AnalysisResult {
  zielgruppe: string;
  ansprache: "Du" | "Sie";
  headlines: string[];
}

export async function analyzeAndGenerateHeadlines(
  url: string
): Promise<AnalysisResult> {
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

  return JSON.parse(jsonStr) as AnalysisResult;
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
