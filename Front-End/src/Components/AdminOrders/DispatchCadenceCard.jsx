import StatusBadge from './StatusBadge';

export default function DispatchCadenceCard({ label, time, note, tone }) {
  return (
    <article className="rounded-xl border border-zinc-800/90 bg-[#0E131F]/90 p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
            {label}
          </p>
          <p className="mt-1.5 font-mono font-bold text-xl text-white tabular-nums">{time}</p>
        </div>
        <StatusBadge tone={tone}>Live</StatusBadge>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-zinc-400">{note}</p>
    </article>
  );
}
