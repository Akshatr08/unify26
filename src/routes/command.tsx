import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Leaf, Zap, Droplet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CopilotPanel } from "@/components/CopilotPanel";
import { OpsBriefDialog } from "@/components/OpsBriefDialog";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard, Bar } from "@/components/KpiCard";
import { GATE_THROUGHPUT, INCIDENTS, KPIS, VENUE } from "@/data/mock";
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

function MiniStat({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
}) {
  const positive = delta >= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
      <p
        className={
          "mt-1 text-xs font-medium " +
          (positive ? "text-[color:var(--field)]" : "text-slate-500")
        }
      >
        {positive ? "+" : ""}
        {delta}% vs last hour
      </p>
    </div>
  );
}
