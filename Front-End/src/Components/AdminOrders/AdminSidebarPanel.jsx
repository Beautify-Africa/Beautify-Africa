import FadeIn from '../Shared/FadeIn';
import EmptyPanel from './EmptyPanel';
import LaneCard from './LaneCard';
import WatchCard from './WatchCard';

export default function AdminSidebarPanel({ lanes, watchlist }) {
  return (
    <FadeIn>
      <aside className="space-y-8">
        <section className="rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffdf9,#f8f2eb)] p-6 shadow-[0_18px_50px_rgba(28,25,23,0.08)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Lane control</p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900">Fulfillment pulse</h2>
          <div className="mt-5 space-y-4">
            {lanes.length > 0 ? lanes.map((lane) => <LaneCard key={lane.title} {...lane} />) : (
              <EmptyPanel title="No lane data" message="Lane cards appear when live order lanes are available." />
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-stone-950 p-6 text-stone-100 shadow-[0_18px_50px_rgba(28,25,23,0.18)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-500">Watch list</p>
          <h2 className="mt-3 font-serif text-3xl text-white">Signals that could slow dispatch</h2>
          <div className="mt-5 space-y-4">
            {watchlist.length > 0 ? watchlist.map((item) => <WatchCard key={item.title} {...item} />) : (
              <EmptyPanel title="All clear" message="No blockers are currently reported for the queue." tone="emerald" />
            )}
          </div>
        </section>
      </aside>
    </FadeIn>
  );
}
