import FadeIn from '../Shared/FadeIn';
import StatusBadge from './StatusBadge';

export default function AdminHeroSection({ heroBadges, ritualChecklist }) {
  const checklist = ritualChecklist.length > 0 ? ritualChecklist : ['No urgent tasks are currently queued.'];

  return (
    <FadeIn className="mt-10">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-stone-200/80 bg-[linear-gradient(135deg,#fffefb_0%,#f4ede4_55%,#efe5da_100%)] px-8 py-10 shadow-[0_28px_70px_rgba(28,25,23,0.10)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(180,83,9,0.12),_transparent_58%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.85fr)]">
          <div>
            <StatusBadge tone="amber">Fulfillment command view</StatusBadge>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-tight text-stone-900 md:text-6xl">Shape the order flow with the same polish your clients feel in the storefront.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">This admin space keeps dispatch priorities, regional signals, and customer touchpoints in one place.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroBadges.map((badge, idx) => (
                <StatusBadge key={`${badge.label}-${idx}`} tone={badge.tone}>{badge.label}</StatusBadge>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/80 bg-white/85 p-6 shadow-[0_18px_45px_rgba(28,25,23,0.08)] backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Operations ritual</p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900">Current dispatch wave</h2>
            <div className="mt-6 space-y-3">
              {checklist.map((item, idx) => (
                <div key={`ritual-${idx}`} className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-stone-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
