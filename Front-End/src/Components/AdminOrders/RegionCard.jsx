export default function RegionCard({ region, share, movement, note }) {
  return (
    <article className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {region}
          </p>
          <p className="mt-1.5 font-mono font-bold text-2xl text-white tabular-nums">{share}</p>
        </div>
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
          {movement}
        </span>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">{note}</p>
    </article>
  );
}
