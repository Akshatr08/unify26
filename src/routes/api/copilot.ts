import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { ROLE_SYSTEM_PROMPTS, getGeminiModel, type CopilotRole } from "@/lib/ai.server";
import {
  clientKey,
  rateLimit,
  validateMessages,
  COPILOT_LIMITS,
} from "@/lib/copilot-security";

type Body = { messages?: unknown; role?: unknown };

function isRole(v: unknown): v is CopilotRole {
  return v === "command" || v === "staff" || v === "fan";
}

export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Rate limit before parsing to shed load cheaply.
        const key = clientKey(request);
        const rl = rateLimit(key);
        if (!rl.allowed) {
          return new Response(
            JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": String(rl.retryAfter),
                "x-ratelimit-limit": String(COPILOT_LIMITS.MAX_REQUESTS_PER_WINDOW),
                "x-ratelimit-remaining": "0",
              },
            },
          );
        }

        // 2. Parse and validate the payload.
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const check = validateMessages(body.messages);
        if (!check.ok) {
          return new Response(check.error, { status: check.status });
        }
        const activeRole: CopilotRole = isRole(body.role) ? body.role : "command";

        // 3. Stream the response.
        try {
          const model = getGeminiModel();
          const result = streamText({
            model,
            system: ROLE_SYSTEM_PROMPTS[activeRole],
            messages: await convertToModelMessages(check.messages as unknown as UIMessage[]),
            abortSignal: request.signal,
          });
          return result.toUIMessageStreamResponse({
            originalMessages: check.messages as unknown as UIMessage[],
          });
        } catch (err) {
          // Log details server-side; return a generic message to the client.
          console.error("[copilot]", err);
          const status = err instanceof Error && /api key/i.test(err.message) ? 503 : 500;
          return new Response(
            status === 503 ? "Copilot temporarily unavailable" : "Copilot error",
            { status },
          );
        }
      },
    },
  },
});
