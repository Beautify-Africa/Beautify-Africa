import StatusBadge from './StatusBadge';

export default function LaneCard({ title, count, note, tone }) {
  return (
    <article className="rounded-[1.5rem] border border-stone-200/80 bg-white px-5 py-5 shadow-[0_14px_32px_rgba(28,25,23,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">{title}</p>
          <p className="mt-3 font-serif text-4xl leading-none text-stone-900">{count}</p>
        </div>
        <StatusBadge tone={tone}>Active lane</StatusBadge>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">{note}</p>
    </article>
  );
}
