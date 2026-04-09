import { toneClasses } from './toneClasses';

export default function MetricCard({ label, value, note, tone }) {
  const classes = toneClasses(tone);

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(28,25,23,0.08)] backdrop-blur-sm">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${classes.accent}`} />
      <p className="relative text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <div className="relative mt-4 flex items-end justify-between gap-4">
        <p className="font-serif text-4xl leading-none text-stone-900">{value}</p>
        <span className={`h-3 w-3 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.85)] ${classes.dot}`} />
      </div>
      <p className="relative mt-4 max-w-[22rem] text-sm leading-relaxed text-stone-500">{note}</p>
    </article>
  );
}
