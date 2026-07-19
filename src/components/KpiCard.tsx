import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
      {children && <div className="mt-4">{children}</div>}
      {note && <p className="mt-2 text-xs font-medium text-slate-500">{note}</p>}
    </div>
  );
}

export function Bar({ pct, color = "red" }: { pct: number; color?: "red" | "green" | "amber" }) {
  const bg =
    color === "green"
      ? "bg-[color:var(--field)]"
      : color === "amber"
      ? "bg-[color:var(--amber-alert)]"
      : "bg-[color:var(--fifa-red)]";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full ${bg} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}
