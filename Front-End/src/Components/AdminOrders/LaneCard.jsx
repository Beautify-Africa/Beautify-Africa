import StatusBadge from './StatusBadge';

export default function LaneCard({ title, count, note, tone }) {
  return (
    <article className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </p>
          <p className="mt-1.5 font-mono font-bold text-2xl leading-none text-white tabular-nums">
            {count}
          </p>
        </div>
        <StatusBadge tone={tone}>Active lane</StatusBadge>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">{note}</p>
    </article>
  );
}
