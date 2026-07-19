import { beforeEach, describe, expect, it } from "vitest";

import {
  COPILOT_LIMITS,
  __resetRateLimit,
  clientKey,
  rateLimit,
  sanitizeText,
  validateMessages,
} from "@/lib/copilot-security";

beforeEach(() => __resetRateLimit());

describe("rateLimit", () => {
  it("allows requests up to the limit and blocks the next one", () => {
    const key = "1.1.1.1";
    const now = 1_700_000_000_000;
    for (let i = 0; i < COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW; i++) {
      expect(rateLimit(key, now + i, COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW, 60_000).allowed).toBe(true);
    }
    const blocked = rateLimit(key, now + 100, COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("refills after the window elapses", () => {
    const key = "2.2.2.2";
    for (let i = 0; i < COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW; i++) {
      rateLimit(key, 1000 + i, COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW, 100);
    }
    // After more than 100ms passes, the sliding window empties.
    const after = rateLimit(key, 2_000, COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW, 100);
    expect(after.allowed).toBe(true);
  });

  it("isolates keys from one another", () => {
    const now = 5_000;
    for (let i = 0; i < COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW; i++) {
      rateLimit("A", now + i);
    }
    expect(rateLimit("A", now + 100).allowed).toBe(false);
    expect(rateLimit("B", now + 100).allowed).toBe(true);
  });
});

describe("clientKey", () => {
  it("prefers cf-connecting-ip", () => {
    const req = new Request("http://x", { headers: { "cf-connecting-ip": "9.9.9.9" } });
    expect(clientKey(req)).toBe("9.9.9.9");
  });

  it("falls back to x-forwarded-for (first hop)", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" } });
    expect(clientKey(req)).toBe("10.0.0.1");
  });

  it("returns 'anonymous' when no identifying header is present", () => {
    expect(clientKey(new Request("http://x"))).toBe("anonymous");
  });
});

describe("sanitizeText", () => {
  it("strips control characters but preserves whitespace", () => {
    expect(sanitizeText("hello\u0000\u0001world\n", 100)).toBe("helloworld\n");
  });

  it("clamps to maxChars", () => {
    expect(sanitizeText("a".repeat(200), 10)).toHaveLength(10);
  });

  it("returns empty string for non-strings", () => {
    expect(sanitizeText(null, 10)).toBe("");
    expect(sanitizeText(42, 10)).toBe("");
  });
});

describe("validateMessages", () => {
  const okMsg = (text: string) => ({ role: "user", parts: [{ type: "text", text }] });

  it("accepts a valid conversation", () => {
    const result = validateMessages([okMsg("hi"), { role: "assistant", parts: [{ type: "text", text: "hello" }] }]);
    expect(result.ok).toBe(true);
  });

  it("rejects non-array input", () => {
    const result = validateMessages("nope");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects empty arrays", () => {
    const result = validateMessages([]);
    expect(result.ok).toBe(false);
  });

  it("rejects too many messages", () => {
    const many = Array.from({ length: COPILOT_LIMITS.MAX_MESSAGES + 1 }, () => okMsg("x"));
    const result = validateMessages(many);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("rejects invalid roles", () => {
    const result = validateMessages([{ role: "root", parts: [{ type: "text", text: "pwn" }] }]);
    expect(result.ok).toBe(false);
  });

  it("rejects when total chars exceed cap", () => {
    const big = "a".repeat(COPILOT_LIMITS.MAX_MESSAGE_CHARS);
    const msgs = Array.from({ length: 10 }, () => okMsg(big));
    const result = validateMessages(msgs);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("strips control chars from message text", () => {
    const result = validateMessages([okMsg("safe\u0000danger")]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.messages[0].parts[0].text).toBe("safedanger");
  });

  it("rejects messages with no text parts", () => {
    const result = validateMessages([{ role: "user", parts: [{ type: "image", url: "x" }] }]);
    expect(result.ok).toBe(false);
  });
});
