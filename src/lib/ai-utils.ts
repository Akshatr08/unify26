// Client-safe utilities shared by AI features. No server-only imports here.

/**
 * Strip common markdown/code fences and parse the first JSON object found
 * in a model response. Returns `null` on any failure so callers can degrade
 * gracefully instead of crashing.
 */
export function extractJson<T>(raw: string): T | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Clamp a numeric value to an inclusive range. Non-finite input falls back
 * to `min`. Used to defend against out-of-range model output.
 */
export function clamp(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Collapse whitespace and trim. Prevents leading/trailing noise and
 * excessive spacing in model input.
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}
