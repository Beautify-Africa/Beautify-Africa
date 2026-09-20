import { toneClasses } from './toneClasses';

export default function MetricCard({ label, value, note, tone }) {
  const classes = toneClasses(tone);

  return (
    <article className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 shadow-lg backdrop-blur-md transition-all hover:border-zinc-700/80">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${classes.accent}`}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 truncate">
          {label}
        </p>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${classes.dot}`}
          aria-hidden="true"
        />
      </div>
      
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <p className="font-bold text-2xl sm:text-3xl tracking-tight text-white font-mono tabular-nums">
          {value}
        </p>
      </div>

      {note ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">
          {note}
        </p>
      ) : null}
    </article>
  );
}
