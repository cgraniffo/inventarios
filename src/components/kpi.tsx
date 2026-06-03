/** Tarjeta KPI (server-safe, sin estado). */
export function Kpi({
  label,
  value,
  tono = "emerald",
  sub,
}: {
  label: string;
  value: string;
  tono?: "emerald" | "amber" | "rose" | "blue" | "slate";
  sub?: string;
}) {
  const c = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    slate: "border-slate-200 bg-white text-slate-900",
  }[tono];
  return (
    <div className={`rounded-lg border p-3 ${c}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] opacity-70">{sub}</p>}
    </div>
  );
}
