import FadeIn from '../Shared/FadeIn';
import EmptyPanel from './EmptyPanel';
import LaneCard from './LaneCard';
import WatchCard from './WatchCard';

export default function AdminSidebarPanel({ lanes = [], watchlist = [] }) {
  const safeLanes = Array.isArray(lanes) ? lanes : [];
  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];

  return (
    <FadeIn>
      <aside className="space-y-6">
        <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              Lane Routing
            </p>
            <span className="text-[10px] font-mono text-zinc-500">LIVE CHANNELS</span>
          </div>

          <h2 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-white">
            Fulfillment Radar
          </h2>

          <div className="mt-4 space-y-3">
            {safeLanes.length > 0 ? (
              safeLanes.map((lane) => <LaneCard key={lane.title} {...lane} />)
            ) : (
              <EmptyPanel
                title="No lane data"
                message="Lane cards appear when live order lanes are available."
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-[#121828] to-[#0A0E18] p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
              Active Watchlist
            </p>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          <h2 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-white">
            Dispatch Friction Alerts
          </h2>

          <div className="mt-4 space-y-3">
            {safeWatchlist.length > 0 ? (
              safeWatchlist.map((item) => <WatchCard key={item.title} {...item} />)
            ) : (
              <EmptyPanel
                title="All clear"
                message="No blockers are currently reported for the queue."
                tone="emerald"
              />
            )}
          </div>
        </section>
      </aside>
    </FadeIn>
  );
}
