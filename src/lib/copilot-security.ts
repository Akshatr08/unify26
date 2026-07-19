// Security helpers for the /api/copilot streaming endpoint.
// - In-memory sliding-window rate limiter keyed by client IP or ID
// - Message payload validation (role, size, count)
// - Input sanitation to strip control chars and cap length
//
// The limiter is per-worker instance (isolate). It is intentionally simple —
// enough to blunt casual abuse and runaway loops without depending on a
// backing store. For production-grade limits, put a real store in front.

export const COPILOT_LIMITS = {
  MAX_MESSAGES: 40,
  MAX_MESSAGE_CHARS: 4_000,
  MAX_TOTAL_CHARS: 20_000,
  MAX_REQUESTS_PER_WINDOW: 20,
  WINDOW_MS: 60_000,
} as const;

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

/**
 * Sliding-window rate limit. Returns remaining budget and a `retryAfter`
 * (seconds) when exhausted.
 */
export function rateLimit(
  key: string,
  now: number = Date.now(),
  limit: number = COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW,
  windowMs: number = COPILOT_LIMITS.WINDOW_MS,
): { allowed: boolean; remaining: number; retryAfter: number } {
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfter };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}

/** Test hook: clear internal state between test cases. */
export function __resetRateLimit() {
  buckets.clear();
}

/**
 * Extract a stable client identifier for rate limiting. Prefers standard
 * proxy headers, falls back to a shared bucket.
 */
export function clientKey(request: Request): string {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "anonymous"
  );
}

/** Strip control characters and clamp length. Preserves newlines/tabs. */
export function sanitizeText(input: unknown, maxChars: number): string {
  if (typeof input !== "string") return "";
  // Remove C0/C1 controls except \n \r \t.
  const cleaned = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  return cleaned.length > maxChars ? cleaned.slice(0, maxChars) : cleaned;
}

export type ValidatedMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: "text"; text: string }>;
};

export type ValidationResult =
  | { ok: true; messages: ValidatedMessage[] }
  | { ok: false; error: string; status: number };

/**
 * Validate an incoming array of UI messages: enforce role whitelist,
 * per-message and total size caps, and normalise the `parts` shape.
 */
export function validateMessages(raw: unknown): ValidationResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "messages must be an array", status: 400 };
  }
  if (raw.length === 0) {
    return { ok: false, error: "messages cannot be empty", status: 400 };
  }
  if (raw.length > COPILOT_LIMITS.MAX_MESSAGES) {
    return {
      ok: false,
      error: `too many messages (max ${COPILOT_LIMITS.MAX_MESSAGES})`,
      status: 413,
    };
  }

  const messages: ValidatedMessage[] = [];
  let totalChars = 0;

  for (const m of raw) {
    if (!m || typeof m !== "object") {
      return { ok: false, error: "invalid message shape", status: 400 };
    }
    const msg = m as { role?: unknown; parts?: unknown; id?: unknown };
    if (msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system") {
      return { ok: false, error: "invalid role", status: 400 };
    }
    if (!Array.isArray(msg.parts)) {
      return { ok: false, error: "message.parts must be an array", status: 400 };
    }
    const parts: Array<{ type: "text"; text: string }> = [];
    for (const p of msg.parts) {
      if (!p || typeof p !== "object") continue;
      const part = p as { type?: unknown; text?: unknown };
      if (part.type !== "text") continue;
      const text = sanitizeText(part.text, COPILOT_LIMITS.MAX_MESSAGE_CHARS);
      totalChars += text.length;
      if (totalChars > COPILOT_LIMITS.MAX_TOTAL_CHARS) {
        return { ok: false, error: "conversation too long", status: 413 };
      }
      parts.push({ type: "text", text });
    }
    if (parts.length === 0) {
      return { ok: false, error: "message has no text parts", status: 400 };
    }
    messages.push({
      id: typeof msg.id === "string" ? msg.id : undefined,
      role: msg.role,
      parts,
    });
  }

  return { ok: true, messages };
}
