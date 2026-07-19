// Client-safe server functions that call Google Gemini via the AI SDK.
// Handler bodies run server-side and read process.env at call time.

import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { clamp, extractJson, normalizeWhitespace } from "./ai-utils";

// Input schemas. Keep bounds tight enough to reject abuse but permissive
// enough for real stadium reports.
const ClassifyInput = z.object({
  report: z.string().transform(normalizeWhitespace).pipe(z.string().min(3).max(2000)),
});
const TranslateInput = z.object({
  text: z.string().transform(normalizeWhitespace).pipe(z.string().min(1).max(2000)),
  targetLang: z.string().min(2).max(40),
  context: z.string().max(200).optional(),
});
const WayfindingInput = z.object({
  question: z.string().transform(normalizeWhitespace).pipe(z.string().min(2).max(500)),
  seat: z.string().max(80).optional(),
});
const OpsBriefInput = z.object({
  kind: z.enum(["report", "decision"]),
  focus: z.string().max(200).optional(),
});

const CATEGORY_WHITELIST = new Set([
  "medical",
  "crowd",
  "security",
  "transport",
  "sanitation",
  "technical",
  "weather",
  "other",
]);

export const classifyIncident = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ClassifyInput.parse(input))
  .handler(async ({ data }) => {
    const { getGeminiModel } = await import("./ai.server");
    const model = getGeminiModel();
    const { text } = await generateText({
      model,
      system: `You classify FIFA World Cup 2026 stadium incidents. Respond with ONLY a JSON object matching:
{"category": "medical" | "crowd" | "security" | "transport" | "sanitation" | "technical" | "weather" | "other",
 "severity": 1 | 2 | 3 | 4 | 5,
 "suggestedTeam": string,
 "rationale": string (max 20 words),
 "eta": string (e.g. "immediate", "5m", "15m")}
No prose, no markdown fences.`,
      prompt: `Incident report: """${data.report}"""`,
    });

    const parsed = extractJson<{
      category: string;
      severity: number;
      suggestedTeam: string;
      rationale: string;
      eta: string;
    }>(text);

    if (!parsed) {
      return {
        category: "other",
        severity: 3,
        suggestedTeam: "Ops Duty Manager",
        rationale: "Auto-classifier fallback — review manually.",
        eta: "15m",
      };
    }

    // Defensive clamps: never trust raw model output for UI-critical fields.
    return {
      category: CATEGORY_WHITELIST.has(parsed.category) ? parsed.category : "other",
      severity: clamp(parsed.severity, 1, 5),
      suggestedTeam: String(parsed.suggestedTeam ?? "Ops Duty Manager").slice(0, 80),
      rationale: String(parsed.rationale ?? "").slice(0, 240),
      eta: String(parsed.eta ?? "15m").slice(0, 40),
    };
  });

export const translateMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranslateInput.parse(input))
  .handler(async ({ data }) => {
    const { getGeminiModel } = await import("./ai.server");
    const model = getGeminiModel();
    const { text } = await generateText({
      model,
      system: `You are a professional stadium interpreter for FIFA World Cup 2026.
Translate the user's text into the target language. Respond with ONLY a JSON object:
{"translation": string, "romanization": string (optional, "" if unnecessary), "note": string (optional, "" if none)}
Keep tone respectful and clear for public-address / staff radio use.`,
      prompt: `Target language: ${data.targetLang}
Context: ${data.context ?? "general stadium communication"}
Text: """${data.text}"""`,
    });

    const parsed = extractJson<{
      translation: string;
      romanization?: string;
      note?: string;
    }>(text);

    return (
      parsed ?? {
        translation: text.trim(),
        romanization: "",
        note: "Raw model output — formatting fallback.",
      }
    );
  });

export const wayfindingAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WayfindingInput.parse(input))
  .handler(async ({ data }) => {
    const { getGeminiModel } = await import("./ai.server");
    const { STADIUM_WAYFINDING } = await import("@/data/mock");
    const model = getGeminiModel();

    const grounding = JSON.stringify(STADIUM_WAYFINDING);
    const { text } = await generateText({
      model,
      system: `You are UNIFY Concierge for MetLife Stadium at FIFA World Cup 2026.
Answer wayfinding questions using ONLY the grounding JSON. Reply in the user's language.
Be warm, concrete, and under 90 words. If the user gave a seat/section, name the nearest gate.
Always include one accessibility or safety tip when relevant.`,
      prompt: `Grounding data: ${grounding}
Seat/section (optional): ${data.seat ?? "unknown"}
Question: """${data.question}"""`,
    });

    return { answer: text.trim() };
  });

export const generateOpsBrief = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OpsBriefInput.parse(input))
  .handler(async ({ data }) => {
    const { getGeminiModel } = await import("./ai.server");
    const { KPIS, GATE_THROUGHPUT, INCIDENTS, TRANSPORT, VENUE } = await import("@/data/mock");
    const model = getGeminiModel();

    const grounding = JSON.stringify({
      venue: VENUE,
      kpis: KPIS,
      gates: GATE_THROUGHPUT,
      incidents: INCIDENTS,
      transport: TRANSPORT,
    });

    const system =
      data.kind === "report"
        ? `You are UNIFY Ops Analyst. Produce a concise MATCHDAY SITUATION REPORT for the operations director.
Use ONLY the grounding JSON. Structure with markdown headings:
## Situation
## Key KPIs (bullet list, with numbers)
## Incidents (bullet list, severity first)
## Transport
## Sustainability
## Recommended Actions (numbered, 3 items, each with expected impact)
Keep under 220 words. No emojis. No preamble.`
        : `You are UNIFY Decision Support. Given the live grounding JSON, output THREE ranked
recommendations for the ops director right now. For each: **Action**, **Why**, **Impact** (numbers),
**Owner**. Use markdown. No preamble, no more than 180 words total. No emojis.`;

    const { text } = await generateText({
      model,
      system,
      prompt: `Grounding data: ${grounding}
Focus (optional): ${data.focus ?? "overall matchday posture"}`,
    });

    return { markdown: text.trim() };
  });
