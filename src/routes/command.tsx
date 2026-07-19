import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Leaf, Loader2, Zap, Droplet } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { CopilotPanel } from "@/components/CopilotPanel";
import { MiniStat } from "@/components/MiniStat";
import { OpsBriefDialog } from "@/components/OpsBriefDialog";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard, Bar } from "@/components/KpiCard";
import { GATE_THROUGHPUT, INCIDENTS, KPIS, VENUE } from "@/data/mock";
import { sustainabilityAdvisor, type SustainabilityRecommendation } from "@/lib/ai-actions.functions";
import heatmap from "@/assets/heatmap.jpg";

export const Route = createFileRoute("/command")({
  head: () => ({
    meta: [
      { title: "Operations Command — UNIFY/26" },
      {
        name: "description",
        content:
          "Live stadium operations command center: crowd density, gate throughput, transport, incident triage, sustainability, and GenAI decision support.",
      },
      { property: "og:title", content: "Operations Command — UNIFY/26" },
      {
        property: "og:description",
        content:
          "Live stadium operations command center with GenAI decision support for FIFA World Cup 2026.",
      },
    ],
  }),
  component: CommandPage,
});

const SEV_COLOR: Record<string, string> = {
  critical: "bg-[color:var(--fifa-red)]",
  medium: "bg-[color:var(--amber-alert)]",
  low: "bg-slate-400",
};

function CommandPage() {
  const [briefKind, setBriefKind] = useState<"report" | "decision" | null>(null);
  const getSustainabilityAdvice = useServerFn(sustainabilityAdvisor);
  const [sustainRecs, setSustainRecs] = useState<SustainabilityRecommendation[] | null>(null);
  const [sustainLoading, setSustainLoading] = useState(false);

  const onSustainAdvise = useCallback(async () => {
    setSustainLoading(true);
    try {
      const recs = await getSustainabilityAdvice({ data: {} });
      setSustainRecs(recs);
      toast.success("Sustainability AI analysis complete");
    } catch {
      toast.error("Sustainability advisor failed", { description: "Check your API key." });
    } finally {
      setSustainLoading(false);
    }
  }, [getSustainabilityAdvice]);

  return (
    <main className="mx-auto max-w-[1440px] p-6">
      <PageHeader
        eyebrow={`${VENUE.code} · ${VENUE.name}`}
        title="Operations Command"
        subtitle="Stadium operations & intelligence control"
        actions={
          <>
            <button
              type="button"
              onClick={() => setBriefKind("report")}
              aria-label="Generate an AI ops situation report"
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
            >
              Generate Report
            </button>
            <button
              type="button"
              onClick={() => setBriefKind("decision")}
              aria-label="Open AI decision support panel"
              className="h-10 rounded-lg bg-[color:var(--pitch)] px-4 text-sm font-medium text-white hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
            >
              AI Decision Support
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 cols */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <KpiCard
            label="Crowd Density"
            value={`${KPIS.crowdDensity.value}%`}
            note={`+${KPIS.crowdDensity.deltaHour}% from previous hour`}
          >
            <Bar pct={KPIS.crowdDensity.value} color="red" />
          </KpiCard>

          <KpiCard label="Transport Load" value={KPIS.transportLoad.value} note={KPIS.transportLoad.note}>
            <div className="flex gap-1">
              {KPIS.transportLoad.segments.map((s, i) => (
                <div
                  key={i}
                  className={
                    "h-1.5 flex-1 rounded-full " +
                    (s === true
                      ? "bg-[color:var(--field)]"
                      : s === "warn"
                      ? "bg-[color:var(--amber-alert)]"
                      : "bg-slate-100")
                  }
                />
              ))}
            </div>
          </KpiCard>

          <KpiCard
            label="Sustainability"
            value={`${KPIS.sustainability.value}${KPIS.sustainability.unit}`}
            note={KPIS.sustainability.note}
          >
            <Bar pct={KPIS.sustainability.value} color="green" />
          </KpiCard>

          {/* Secondary KPIs */}
          <MiniStat icon={<Zap className="size-4" />} label="Energy Draw" value={`${KPIS.energyDrawMw.value} MW`} delta={KPIS.energyDrawMw.deltaHour} />
          <MiniStat icon={<Droplet className="size-4" />} label="Water Use" value={`${KPIS.waterUseM3.value} m³`} delta={KPIS.waterUseM3.deltaHour} />
          <MiniStat icon={<Leaf className="size-4" />} label="Waste Diverted" value={`${KPIS.wasteDiverted.value}%`} delta={KPIS.wasteDiverted.deltaHour} />

          {/* AI Sustainability Advisor */}
          <div className="sm:col-span-3 rounded-2xl border border-[color:var(--field)]/30 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Leaf className="size-4 text-[color:var(--field)]" aria-hidden="true" />
                  AI Sustainability Advisor
                  <span className="ml-1 rounded-full bg-[color:var(--field)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--field)]">Gemini 2.0</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Live KPI analysis → actionable sustainability recommendations</p>
              </div>
              <button
                type="button"
                onClick={onSustainAdvise}
                disabled={sustainLoading}
                aria-label="Run AI sustainability analysis on current KPIs"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--field)]/40 bg-[color:var(--field)]/5 px-4 py-2 text-sm font-medium text-[color:var(--field)] transition-colors hover:bg-[color:var(--field)]/10 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[color:var(--field)]/60"
              >
                {sustainLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Leaf className="size-4" aria-hidden="true" />}
                {sustainLoading ? "Analysing…" : "Analyse KPIs"}
              </button>
            </div>
            {sustainRecs ? (
              <ul className="space-y-2" aria-label="Sustainability recommendations">
                {sustainRecs.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span
                      className={`mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        r.priority === "high"
                          ? "bg-[color:var(--fifa-red)]/10 text-[color:var(--fifa-red)]"
                          : r.priority === "medium"
                          ? "bg-[color:var(--amber-alert)]/10 text-[color:var(--amber-alert)]"
                          : "bg-[color:var(--field)]/10 text-[color:var(--field)]"
                      }`}
                      aria-label={`Priority: ${r.priority}`}
                    >
                      {r.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{r.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.impact}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">{r.owner}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">
                Click &ldquo;Analyse KPIs&rdquo; to generate AI-powered sustainability recommendations based on live energy, water, and waste data.
              </p>
            )}
          </div>

          {/* Heatmap */}
          <div className="sm:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold">Gate 4 & North Plaza Inflow</h3>
                <p className="text-xs text-slate-500">Live crowd heatmap · updated 3s ago</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Thermal
                </span>
                <span className="rounded bg-[color:var(--pitch)] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Predictive
                </span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              <img
                src={heatmap}
                alt="Crowd density heatmap over stadium blueprint"
                width={1600}
                height={800}
                loading="lazy"
                className="w-full aspect-[2/1] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--pitch)]/80 to-transparent p-4">
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-white">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[color:var(--fifa-red)]" /> Critical &gt; 90%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[color:var(--amber-alert)]" /> Elevated 70–90%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[color:var(--field)]" /> Nominal &lt; 70%
                  </span>
                </div>
              </div>
            </div>

            {/* Gate throughput bars */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {GATE_THROUGHPUT.map((g) => {
                const color =
                  g.state === "critical"
                    ? "red"
                    : g.state === "idle" || g.state === "closed"
                    ? "amber"
                    : "green";
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <span className="w-10 text-xs font-mono text-slate-500">{g.id}</span>
                    <Bar pct={g.pct} color={color as "red" | "green" | "amber"} />
                    <span
                      className={
                        "w-10 text-right text-xs font-medium tabular-nums " +
                        (g.state === "critical" ? "text-[color:var(--fifa-red)]" : "text-slate-700")
                      }
                    >
                      {g.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 cols — Copilot + Incidents */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <CopilotPanel role="command" />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold flex items-center gap-2">
                <AlertTriangle className="size-4 text-[color:var(--fifa-red)]" aria-hidden="true" />
                Incident Dispatch
              </h3>
              <span className="rounded-full bg-[color:var(--fifa-red)]/10 px-2 py-0.5 text-[10px] font-bold text-[color:var(--fifa-red)]">
                {INCIDENTS.filter((i) => i.severity === "critical").length} Critical
              </span>
            </div>
            <div className="space-y-2">
              {INCIDENTS.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  aria-label={`Dispatch incident: ${inc.title} at ${inc.location}, ${inc.severity} severity, ${inc.agoMin} minutes ago`}
                  onClick={() =>
                    toast(inc.title, {
                      description: `${inc.location} · ${inc.severity.toUpperCase()} · ${inc.agoMin}m ago`,
                      action: {
                        label: "Dispatch",
                        onClick: () => toast.success(`Dispatched to ${inc.location}`),
                      },
                    })
                  }
                  className="w-full text-left rounded-lg border border-slate-100 p-3 hover:border-[color:var(--fifa-red)]/40 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-2 rounded-full ${SEV_COLOR[inc.severity]}`} />
                      <span className="text-sm font-medium">{inc.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {inc.agoMin}M AGO
                    </span>
                  </div>
                  <p className="mt-1 pl-5 text-xs text-slate-500">{inc.location}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <OpsBriefDialog
        open={briefKind !== null}
        kind={briefKind ?? "report"}
        onOpenChange={(o) => !o && setBriefKind(null)}
      />
    </main>
  );
}

