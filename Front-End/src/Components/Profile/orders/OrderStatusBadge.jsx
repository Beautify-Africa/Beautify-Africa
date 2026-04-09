export default function OrderStatusBadge({ label, tone = 'stone' }) {
  const classes =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : tone === 'rose'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-stone-200 bg-stone-50 text-stone-700';

  const dotClass =
    tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-stone-400';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${classes}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      {label}
    </div>
  );
}
