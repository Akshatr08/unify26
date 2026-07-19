import { describe, expect, it } from "vitest";

import { clamp, extractJson, normalizeWhitespace } from "@/lib/ai-utils";

describe("extractJson", () => {
  it("parses a plain JSON object", () => {
    expect(extractJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json fences", () => {
    const raw = "```json\n{\"category\":\"medical\",\"severity\":4}\n```";
    expect(extractJson(raw)).toEqual({ category: "medical", severity: 4 });
  });

  it("strips plain ``` fences", () => {
    expect(extractJson('```\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("recovers JSON embedded in prose", () => {
    const raw = 'Here you go: {"eta":"5m"} — done.';
    expect(extractJson(raw)).toEqual({ eta: "5m" });
  });

  it("returns null for unparseable input", () => {
    expect(extractJson("nope")).toBeNull();
    expect(extractJson("")).toBeNull();
    expect(extractJson("{ not json")).toBeNull();
  });

  it("handles non-string input safely", () => {
    // @ts-expect-error runtime guard
    expect(extractJson(undefined)).toBeNull();
  });
});

describe("clamp", () => {
  it("clamps within bounds", () => {
    expect(clamp(3, 1, 5)).toBe(3);
    expect(clamp(0, 1, 5)).toBe(1);
    expect(clamp(9, 1, 5)).toBe(5);
  });

  it("coerces stringy numbers", () => {
    expect(clamp("4", 1, 5)).toBe(4);
  });

  it("falls back to min for garbage input", () => {
    expect(clamp("nope", 1, 5)).toBe(1);
    expect(clamp(NaN, 2, 9)).toBe(2);
  });
});

describe("normalizeWhitespace", () => {
  it("collapses runs of whitespace", () => {
    expect(normalizeWhitespace("  hello   world \n\n")).toBe("hello world");
  });

  it("leaves single-spaced strings unchanged", () => {
    expect(normalizeWhitespace("gate C surge")).toBe("gate C surge");
  });
});
