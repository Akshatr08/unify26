import { memo, type ReactNode } from "react";

/** Props for the MiniStat component. */
interface MiniStatProps {
  /** Lucide icon element displayed alongside the label. */
  icon: ReactNode;
  /** Short descriptive label for the metric (e.g. "Energy Draw"). */
  label: string;
  /** Formatted metric value string (e.g. "1.24 MW"). */
  value: string;
  /**
   * Percentage delta vs. the previous hour.
   * Positive = up (rendered in green), negative = down (rendered in muted).
   */
  delta: number;
}

/**
 * MiniStat — compact sustainability or secondary-KPI card.
 * Used in the Ops Command dashboard to display energy, water, and waste metrics.
 */
export const MiniStat = memo(function MiniStat({ icon, label, value, delta }: MiniStatProps) {
  const positive = delta >= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <span aria-hidden="true">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
      <p
        className={
          "mt-1 text-xs font-medium " +
          (positive ? "text-[color:var(--field)]" : "text-slate-500")
        }
        aria-label={`${positive ? "Up" : "Down"} ${Math.abs(delta)}% versus last hour`}
      >
        {positive ? "+" : ""}
        {delta}% vs last hour
      </p>
    </div>
  );
});
