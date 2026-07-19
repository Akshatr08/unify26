import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, StopCircle } from "lucide-react";

import type { CopilotRole } from "@/lib/ai.server";

const SUGGESTED: Record<CopilotRole, readonly string[]> = {
  command: [
    "Gate C is at 95% — recommend action",
    "Summarize sustainability KPIs vs. target",
    "Predict crowd flow for full-time",
  ],
  staff: [
    "Translate 'Please stay calm, medical is arriving' to Korean",
    "Draft radio callout for spillage at Concourse B",
    "How do I assist a wheelchair guest to Sec 214?",
  ],
  fan: [
    "¿Dónde está la salida más cercana desde sección 214?",
    "Where is halal food?",
    "Nearest accessible restroom to Gate D",
  ],
} as const;

const ROLE_LABEL: Record<CopilotRole, string> = {
  command: "Ops Command",
  staff: "Staff / Volunteer",
  fan: "Fan Concierge",
};

function CopilotPanelImpl({ role }: { role: CopilotRole }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const liveId = useId();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/copilot", body: { role } }),
    [role],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: `copilot-${role}`,
    transport,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      sendMessage({ text: t });
      setInput("");
    },
    [busy, sendMessage],
  );

  const suggestions = SUGGESTED[role];
  const label = ROLE_LABEL[role];

  return (
    <section
      aria-label={`UNIFY Copilot, ${label}`}
      className="flex h-full flex-col rounded-2xl border-2 border-[color:var(--fifa-red)]/20 bg-[color:var(--pitch)] p-5 text-white shadow-xl shadow-[color:var(--fifa-red)]/5"
    >
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
        <div className="grid size-9 place-items-center rounded-lg bg-[color:var(--fifa-red)]" aria-hidden="true">
          <Sparkles className="size-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-sm font-bold tracking-wide">UNIFY COPILOT</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            {label} · Gemini 2.0
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full bg-[color:var(--field)]/10 px-2 py-0.5 text-[10px] font-bold text-[color:var(--field)]"
          role="status"
          aria-label="Copilot online"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--field)]" aria-hidden="true" />
          LIVE
        </span>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Copilot conversation"
        className="flex-1 min-h-[280px] max-h-[420px] space-y-4 overflow-y-auto pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60 rounded-lg"
        tabIndex={0}
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask the copilot anything about matchday operations. It grounds answers in live venue
              context and can reason across crowd, transport, and sustainability signals.
            </p>
            <div className="space-y-2" role="group" aria-label="Suggested prompts">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Try</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const isUser = m.role === "user";
          return (
            <article
              key={m.id}
              aria-label={isUser ? "You" : "UNIFY Copilot"}
              className={"flex gap-2 " + (isUser ? "justify-end" : "")}
            >
              {!isUser && (
                <div
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded bg-[color:var(--fifa-red)]/20 text-[10px] font-bold text-[color:var(--fifa-red)]"
                  aria-hidden="true"
                >
                  AI
                </div>
              )}
              <div
                className={
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed " +
                  (isUser
                    ? "bg-[color:var(--fifa-red)] text-white"
                    : "bg-white/5 border border-white/10 text-slate-100")
                }
              >
                {isUser ? (
                  <span>{text}</span>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    {/* skipHtml prevents raw HTML injection from model output */}
                    <ReactMarkdown skipHtml>{text || "…"}</ReactMarkdown>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {busy && (
          <p className="flex items-center gap-2 text-xs text-slate-400" id={liveId}>
            <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--fifa-red)]" aria-hidden="true" />
            Thinking…
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[color:var(--fifa-red)]/40 bg-[color:var(--fifa-red)]/10 p-3 text-xs text-[color:var(--fifa-red)]"
          >
            Copilot unreachable. Verify the Gemini API key is configured, or try again in a moment.
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-4 relative"
      >
        <label htmlFor={inputId} className="sr-only">
          Ask UNIFY Copilot ({label})
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask Unify Copilot (${label})…`}
          className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-4 pr-12 text-sm placeholder:text-slate-400 focus:border-[color:var(--fifa-red)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
          disabled={busy}
          autoComplete="off"
          maxLength={4000}
          aria-describedby={busy ? liveId : undefined}
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
            aria-label="Stop generating"
          >
            <StopCircle className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-lg bg-[color:var(--fifa-red)] text-white transition-opacity disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Send message"
          >
            <Send className="size-3.5" />
          </button>
        )}
      </form>
    </section>
  );
}

export const CopilotPanel = memo(CopilotPanelImpl);
