import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useId, useState } from "react";
import { Accessibility, Bus, Loader2, MapPin, Send, Trophy } from "lucide-react";
import { toast } from "sonner";

import { CopilotPanel } from "@/components/CopilotPanel";
import { PageHeader } from "@/components/PageHeader";
import { MATCH, TRANSPORT, VENUE } from "@/data/mock";
import { wayfindingAnswer } from "@/lib/ai-actions.functions";
import stadiumMap from "@/assets/stadium-map.jpg";

export const Route = createFileRoute("/fan")({
  head: () => ({
    meta: [
      { title: "Fan Concierge — UNIFY/26" },
      {
        name: "description",
        content:
          "Multilingual fan concierge for FIFA World Cup 2026: stadium wayfinding, transport, accessibility, and live match info.",
      },
      { property: "og:title", content: "Fan Concierge — UNIFY/26" },
      {
        property: "og:description",
        content:
          "Multilingual fan concierge with AI wayfinding, transport timings, and accessibility support.",
      },
    ],
  }),
  component: FanPage,
});

function FanPage() {
  const wayfind = useServerFn(wayfindingAnswer);
  const [seat, setSeat] = useState("214");
  const [question, setQuestion] = useState("Where is the nearest halal food?");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [a11y, setA11y] = useState(false);
  const seatId = useId();
  const questionId = useId();

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await wayfind({ data: { question, seat } });
      setAnswer(res.answer);
    } catch (err) {
      console.error(err);
      setAnswer("Concierge is briefly unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={"mx-auto max-w-[1440px] p-6 " + (a11y ? "text-[17px]" : "")}>
      <PageHeader
        eyebrow={`${VENUE.name} · ${VENUE.city}`}
        title="Fan Concierge"
        subtitle="Wayfinding, transport, accessibility, and match info in your language"
        actions={
          <button
            type="button"
            onClick={() => setA11y((v) => !v)}
            aria-pressed={a11y}
            aria-label={a11y ? "Disable accessibility mode" : "Enable accessibility mode"}
            className={
              "h-10 rounded-lg border px-4 text-sm font-medium transition-colors flex items-center gap-2 " +
              (a11y
                ? "border-[color:var(--pitch)] bg-[color:var(--pitch)] text-white"
                : "border-slate-200 bg-white hover:bg-slate-50")
            }
          >
            <Accessibility className="size-4" aria-hidden="true" />
            {a11y ? "Accessibility ON" : "Accessibility"}
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Match card */}
          <article
            aria-label={`Live match: ${MATCH.home} ${MATCH.homeScore}–${MATCH.awayScore} ${MATCH.away}, minute ${MATCH.minute}`}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[color:var(--pitch)] to-[color:var(--stadium-blue)] p-6 text-white shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                aria-live="polite"
                aria-label={`Live match, minute ${MATCH.minute}`}
                className="flex items-center gap-1.5 rounded-full bg-[color:var(--fifa-red)]/20 px-2 py-0.5 text-[10px] font-bold text-[color:var(--fifa-red)]"
              >
                <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--fifa-red)]" aria-hidden="true" />
                LIVE · {MATCH.minute}'
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                {MATCH.group}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Home</p>
                <p className="font-display text-3xl font-bold">{MATCH.home}</p>
              </div>
              <div className="font-display text-5xl font-bold tabular-nums" aria-label={`Score: ${MATCH.homeScore} to ${MATCH.awayScore}`}>
                {MATCH.homeScore}
                <span className="mx-3 text-slate-500" aria-hidden="true">—</span>
                {MATCH.awayScore}
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Away</p>
                <p className="font-display text-3xl font-bold">{MATCH.away}</p>
              </div>
            </div>
            <Trophy className="absolute -right-4 -bottom-4 size-32 text-white/5" aria-hidden="true" />
          </article>

          {/* Wayfinder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold flex items-center gap-2">
                  <MapPin className="size-4 text-[color:var(--fifa-red)]" />
                  Stadium Wayfinder
                </h3>
                <p className="text-xs text-slate-500">
                  Grounded AI concierge · answers in your language
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Gemini 2.0
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <img
                src={stadiumMap}
                alt="Isometric wayfinding map of MetLife Stadium"
                width={1600}
                height={900}
                loading="lazy"
                className="w-full aspect-[16/9] object-cover bg-slate-50"
              />
            </div>

            <form onSubmit={onAsk} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_auto]" aria-label="Stadium wayfinder form">
              <label htmlFor={seatId} className="sr-only">Seat or section number</label>
              <input
                id={seatId}
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                placeholder="Seat / Sec"
                aria-label="Seat or section number"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[color:var(--pitch)] focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
              />
              <label htmlFor={questionId} className="sr-only">Your question</label>
              <input
                id={questionId}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything — try Spanish, Arabic, Korean…"
                aria-label="Your question for the stadium concierge"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[color:var(--pitch)] focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                aria-label={loading ? "Asking concierge, please wait" : "Ask concierge"}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--fifa-red)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                Ask
              </button>
            </form>

            {answer && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                {answer}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
              {[
                "¿Dónde está la salida más cercana?",
                "Where is halal food?",
                "가장 가까운 화장실은 어디예요?",
                "Accessible route from Gate D",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  aria-label={`Use suggestion: ${q}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-[color:var(--pitch)] focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Bus className="size-4 text-[color:var(--pitch)]" />
              Getting Home
            </h3>
            <div className="mt-4 space-y-2">
              {TRANSPORT.map((t) => (
                <button
                  type="button"
                  key={t.line}
                  onClick={() =>
                    toast(t.line, {
                      description: `${t.status} · Delay ${t.delay}`,
                      action: {
                        label: "Directions",
                        onClick: () =>
                          toast.success(`Route to ${t.line} sent to your device`),
                      },
                    })
                  }
                  className="w-full flex items-center justify-between rounded-lg border border-slate-100 p-3 text-left hover:border-[color:var(--pitch)]/40 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
                >
                  <div>
                    <p className="text-sm font-medium">{t.line}</p>
                    <p className="text-xs text-slate-500">{t.status}</p>
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-bold " +
                      (t.color === "green"
                        ? "bg-[color:var(--field)]/10 text-[color:var(--field)]"
                        : "bg-[color:var(--amber-alert)]/10 text-[color:var(--amber-alert)]")
                    }
                  >
                    {t.delay}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — Copilot */}
        <div className="col-span-12 lg:col-span-4">
          <CopilotPanel role="fan" />
        </div>
      </div>
    </main>
  );
}
