import { formatCurrency } from './adminAnalyticsUtils';

export function MetricCard({ label, value, note, tone = 'stone' }) {
  const toneDot = {
    stone: 'bg-zinc-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  }[tone] || 'bg-zinc-400';

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">{label}</p>
        <span className={`inline-block h-2 w-2 rounded-full ${toneDot}`} />
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">{value}</p>
      {note ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{note}</p> : null}
    </div>
  );
}

export function SectionCard({ title, children, eyebrow }) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-6 shadow-xl">
      <div className="border-b border-zinc-800/80 pb-3 mb-5">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-1 text-base font-bold text-white tracking-tight">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function AnalyticsSeries({ series = [] }) {
  const maxRevenue = Math.max(...series.map((entry) => Number(entry.revenue || 0)), 1);

  return (
    <div className="space-y-3.5">
      {series.map((entry) => {
        const width = `${Math.max(6, (Number(entry.revenue || 0) / maxRevenue) * 100)}%`;

        return (
          <div
            key={entry.key}
            className="grid gap-2 sm:grid-cols-[72px_minmax(0,1fr)_80px] sm:items-center"
          >
            <div className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {entry.label}
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-sm" style={{ width }} />
            </div>
            <div className="text-right font-mono text-xs font-semibold text-zinc-200">
              {formatCurrency(entry.revenue)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
