import FadeIn from '../Shared/FadeIn';
import EmptyPanel from './EmptyPanel';
import RegionCard from './RegionCard';

export default function AdminRegionalPanel({ regionalPulse }) {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <FadeIn>
        <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-[0_20px_55px_rgba(28,25,23,0.08)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Regional pulse</p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">Where the order energy is coming from</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {regionalPulse.length > 0 ? regionalPulse.map((region) => (
              <RegionCard key={region.region} {...region} />
            )) : (
              <EmptyPanel title="No regional data" message="Regional demand trends will appear as orders are processed." />
            )}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(145deg,#201a17,#3f3128)] p-6 text-white shadow-[0_24px_60px_rgba(28,25,23,0.20)] md:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Access note</p>
          <h2 className="mt-3 font-serif text-4xl text-white">Visibility and protection</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-300">
            <p>Admin API routes are server-protected and role-checked.</p>
            <p>User purchase history reflects these updates through the standard orders endpoint.</p>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
