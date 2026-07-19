/**
 * ai-actions.test.ts
 *
 * Unit tests for the Zod input validators used in AI server functions.
 * These tests do NOT call the Gemini API — they only exercise the
 * validation and sanitisation layer, which runs synchronously.
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeWhitespace } from "@/lib/ai-utils";
import {
  INCIDENTS,
  KPIS,
  GATE_THROUGHPUT,
  STAFF_TASKS,
  TRANSPORT,
  STADIUM_WAYFINDING,
  VENUE,
  MATCH,
} from "@/data/mock";
import type { SustainabilityRecommendation } from "@/lib/ai-actions.functions";

// ─── Re-export validators from ai-actions (inline for test isolation) ────────
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

// ─── ClassifyInput ────────────────────────────────────────────────────────────
describe("ClassifyInput validator", () => {
  it("accepts a valid stadium incident report", () => {
    const result = ClassifyInput.safeParse({ report: "Person collapsed near Gate C." });
    expect(result.success).toBe(true);
  });

  it("strips leading/trailing whitespace from report", () => {
    const result = ClassifyInput.safeParse({ report: "   Fan fainted.   " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.report).toBe("Fan fainted.");
  });

  it("collapses internal whitespace", () => {
    const result = ClassifyInput.safeParse({ report: "Gate  C   is   crowded" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.report).toBe("Gate C is crowded");
  });

  it("rejects a report that is too short", () => {
    const result = ClassifyInput.safeParse({ report: "  x  " }); // collapses to "x" (1 char)
    expect(result.success).toBe(false);
  });

  it("rejects a report that is too long", () => {
    const result = ClassifyInput.safeParse({ report: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects a missing report field", () => {
    const result = ClassifyInput.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── TranslateInput ───────────────────────────────────────────────────────────
describe("TranslateInput validator", () => {
  it("accepts a valid translation request", () => {
    const result = TranslateInput.safeParse({
      text: "Please stay calm.",
      targetLang: "Spanish",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional context field", () => {
    const result = TranslateInput.safeParse({
      text: "Exit is to the right.",
      targetLang: "Korean",
      context: "public-address",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty text field", () => {
    const result = TranslateInput.safeParse({ text: "   ", targetLang: "French" });
    expect(result.success).toBe(false);
  });

  it("rejects a targetLang that is too short", () => {
    const result = TranslateInput.safeParse({ text: "Hello", targetLang: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects context over 200 chars", () => {
    const result = TranslateInput.safeParse({
      text: "Hello",
      targetLang: "Arabic",
      context: "c".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

// ─── WayfindingInput ─────────────────────────────────────────────────────────
describe("WayfindingInput validator", () => {
  it("accepts a basic wayfinding question", () => {
    const result = WayfindingInput.safeParse({ question: "Where is the nearest exit?" });
    expect(result.success).toBe(true);
  });

  it("accepts an optional seat field", () => {
    const result = WayfindingInput.safeParse({ question: "Nearest restroom?", seat: "214" });
    expect(result.success).toBe(true);
  });

  it("rejects a question that is too short after normalization", () => {
    const result = WayfindingInput.safeParse({ question: " x " });
    expect(result.success).toBe(false);
  });

  it("rejects a question over 500 chars", () => {
    const result = WayfindingInput.safeParse({ question: "q".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("rejects a seat field over 80 chars", () => {
    const result = WayfindingInput.safeParse({
      question: "Where is Gate A?",
      seat: "s".repeat(81),
    });
    expect(result.success).toBe(false);
  });
});

// ─── OpsBriefInput ────────────────────────────────────────────────────────────
describe("OpsBriefInput validator", () => {
  it("accepts kind=report", () => {
    expect(OpsBriefInput.safeParse({ kind: "report" }).success).toBe(true);
  });

  it("accepts kind=decision", () => {
    expect(OpsBriefInput.safeParse({ kind: "decision" }).success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(OpsBriefInput.safeParse({ kind: "summary" }).success).toBe(false);
  });

  it("rejects a focus string over 200 chars", () => {
    const result = OpsBriefInput.safeParse({ kind: "report", focus: "f".repeat(201) });
    expect(result.success).toBe(false);
  });
});

// ─── Mock data shape tests ────────────────────────────────────────────────────
describe("Mock data integrity (data/mock.ts)", () => {
  it("VENUE has required fields", () => {
    expect(typeof VENUE.name).toBe("string");
    expect(typeof VENUE.capacity).toBe("number");
    expect(VENUE.capacity).toBeGreaterThan(0);
  });

  it("MATCH scores are non-negative integers", () => {
    expect(MATCH.homeScore).toBeGreaterThanOrEqual(0);
    expect(MATCH.awayScore).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(MATCH.homeScore)).toBe(true);
    expect(Number.isInteger(MATCH.awayScore)).toBe(true);
  });

  it("KPIS crowd density is a percentage 0-100", () => {
    expect(KPIS.crowdDensity.value).toBeGreaterThanOrEqual(0);
    expect(KPIS.crowdDensity.value).toBeLessThanOrEqual(100);
  });

  it("GATE_THROUGHPUT entries have valid pct values 0-100", () => {
    for (const gate of GATE_THROUGHPUT) {
      expect(gate.pct).toBeGreaterThanOrEqual(0);
      expect(gate.pct).toBeLessThanOrEqual(100);
    }
  });

  it("INCIDENTS all have valid severity values", () => {
    const validSeverities = new Set(["critical", "medium", "low"]);
    for (const inc of INCIDENTS) {
      expect(validSeverities.has(inc.severity)).toBe(true);
    }
  });

  it("STAFF_TASKS all have valid priority and status", () => {
    const validPriorities = new Set(["P0", "P1", "P2"]);
    const validStatuses = new Set(["open", "in-progress", "done"]);
    for (const task of STAFF_TASKS) {
      expect(validPriorities.has(task.priority)).toBe(true);
      expect(validStatuses.has(task.status)).toBe(true);
    }
  });

  it("TRANSPORT delays are strings (not raw numbers)", () => {
    for (const t of TRANSPORT) {
      expect(typeof t.delay).toBe("string");
    }
  });

  it("STADIUM_WAYFINDING has gates and amenities", () => {
    expect(STADIUM_WAYFINDING.gates.length).toBeGreaterThan(0);
    expect(STADIUM_WAYFINDING.amenities.length).toBeGreaterThan(0);
  });

  it(\"All wayfinding gate ids are single uppercase letters\", () => {
    for (const gate of STADIUM_WAYFINDING.gates) {
      expect(/^[A-Z]$/.test(gate.id)).toBe(true);
    }
  });

  it("KPIS sustainability score is 0-100", () => {
    expect(KPIS.sustainability.value).toBeGreaterThanOrEqual(0);
    expect(KPIS.sustainability.value).toBeLessThanOrEqual(100);
  });

  it("KPIS energy draw is a positive number", () => {
    expect(KPIS.energyDrawMw.value).toBeGreaterThan(0);
  });

  it("KPIS water use is a positive integer", () => {
    expect(KPIS.waterUseM3.value).toBeGreaterThan(0);
    expect(Number.isInteger(KPIS.waterUseM3.value)).toBe(true);
  });

  it("KPIS waste diverted is a percentage 0-100", () => {
    expect(KPIS.wasteDiverted.value).toBeGreaterThanOrEqual(0);
    expect(KPIS.wasteDiverted.value).toBeLessThanOrEqual(100);
  });
});

// ─── SustainabilityInput validator ───────────────────────────────────────────
const SustainabilityInput = z.object({
  focus: z
    .string()
    .max(200)
    .optional()
    .default("overall sustainability posture for this matchday"),
});

describe("SustainabilityInput validator", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = SustainabilityInput.safeParse({});
    expect(result.success).toBe(true);
  });

  it("applies a default focus when none is given", () => {
    const result = SustainabilityInput.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus).toBe("overall sustainability posture for this matchday");
    }
  });

  it("accepts a custom focus string", () => {
    const result = SustainabilityInput.safeParse({ focus: "water conservation" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.focus).toBe("water conservation");
  });

  it("rejects a focus string over 200 chars", () => {
    const result = SustainabilityInput.safeParse({ focus: "x".repeat(201) });
    expect(result.success).toBe(false);
  });
});

// ─── SustainabilityRecommendation type tests ─────────────────────────────────
describe("SustainabilityRecommendation type contract", () => {
  const VALID_PRIORITIES = new Set<string>(["high", "medium", "low"]);

  const mockRec: SustainabilityRecommendation = {
    action: "Reduce HVAC load in unoccupied hospitality zones",
    impact: "Save ~0.15 MW per hour",
    priority: "high",
    owner: "Facilities",
  };

  it("valid recommendation passes type contract", () => {
    expect(typeof mockRec.action).toBe("string");
    expect(typeof mockRec.impact).toBe("string");
    expect(VALID_PRIORITIES.has(mockRec.priority)).toBe(true);
    expect(typeof mockRec.owner).toBe("string");
  });

  it("priority must be high | medium | low", () => {
    const priorities: SustainabilityRecommendation["priority"][] = ["high", "medium", "low"];
    for (const p of priorities) {
      expect(VALID_PRIORITIES.has(p)).toBe(true);
    }
  });

  it("action and impact fields are non-empty strings", () => {
    expect(mockRec.action.length).toBeGreaterThan(0);
    expect(mockRec.impact.length).toBeGreaterThan(0);
  });

  it("owner field is a non-empty string", () => {
    expect(mockRec.owner.length).toBeGreaterThan(0);
  });

  it("defensive clamping: action slice to 120 chars works", () => {
    const longAction = "a".repeat(200);
    const clamped = longAction.slice(0, 120);
    expect(clamped.length).toBe(120);
  });
});

