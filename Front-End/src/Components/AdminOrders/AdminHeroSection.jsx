import FadeIn from '../Shared/FadeIn';
import StatusBadge from './StatusBadge';

export default function AdminHeroSection({ heroBadges = [], ritualChecklist = [] }) {
  const safeBadges = Array.isArray(heroBadges) ? heroBadges : [];
  const checklist =
    Array.isArray(ritualChecklist) && ritualChecklist.length > 0
      ? ritualChecklist
      : ['No urgent tasks are currently queued.'];

  return (
    <FadeIn className="mt-2">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-[#0E131F] via-[#121828] to-[#0A0E18] p-6 sm:p-8 shadow-xl">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.06),_transparent_70%)]" />
        
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)]">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge tone="amber">Fulfillment Command</StatusBadge>
              <span className="text-[11px] text-zinc-500 font-mono">ID: OPS-DISPATCH-LIVE</span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-white">
              Precision Fulfillment &amp; Operations Center
            </h1>
            <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-400">
              Synchronize dispatch priorities, cross-regional logistics, and customer touchpoints in real time with enterprise-grade reliability.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {safeBadges.map((badge, idx) => (
                <StatusBadge key={`${badge.label}-${idx}`} tone={badge.tone}>
                  {badge.label}
                </StatusBadge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                Operations Ritual
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>

            <h2 className="mt-3 text-sm font-bold uppercase tracking-wider text-white">
              Current Dispatch Wave
            </h2>

            <div className="mt-4 space-y-2.5">
              {checklist.map((item, idx) => (
                <div
                  key={`ritual-${idx}`}
                  className="flex items-start gap-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2.5 text-xs text-zinc-300"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
