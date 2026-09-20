function TelemetryCard({ label, value, note, tone = 'amber' }) {
  const dotColor =
    {
      amber: 'bg-amber-400',
      emerald: 'bg-emerald-400',
      blue: 'bg-sky-400',
      stone: 'bg-zinc-400',
    }[tone] || 'bg-amber-400';

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">{label}</p>
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">{value}</p>
      {note ? <p className="mt-1.5 text-xs text-zinc-400">{note}</p> : null}
    </div>
  );
}

export default function AdminCustomersMetricsGrid({ metrics }) {
  const repeatRate =
    metrics.totalCustomers > 0
      ? Math.round(
          ((metrics.totalCustomers - (metrics.guestCustomers || 0)) / metrics.totalCustomers) * 100
        )
      : 0;

  return (
    <section aria-label="Customer Intelligence Telemetry" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TelemetryCard
        label="Customer Base"
        value={Number(metrics.totalCustomers || 0).toLocaleString()}
        note={`${metrics.registeredCustomers || 0} registered • ${metrics.guestCustomers || 0} guest buyers`}
        tone="amber"
      />
      <TelemetryCard
        label="VIP & High-Value"
        value={Number(metrics.vipCustomers || 0).toLocaleString()}
        note="Gold & Platinum tier patrons"
        tone="emerald"
      />
      <TelemetryCard
        label="Repeat Order Rate"
        value={`${repeatRate}%`}
        note={`${metrics.totalOrders || 0} total fulfilled orders`}
        tone="blue"
      />
      <TelemetryCard
        label="Newsletter Audience"
        value={Number(metrics.newsletterSubscribers || 0).toLocaleString()}
        note="Active ritual subscribers"
        tone="stone"
      />
    </section>
  );
}
