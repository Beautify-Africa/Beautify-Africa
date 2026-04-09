import StatusBadge from './StatusBadge';

export default function DispatchCadenceCard({ label, time, note, tone }) {
  return (
    <article className="rounded-[1.4rem] border border-stone-200/80 bg-[#fffdf9] p-4 shadow-[0_10px_20px_rgba(28,25,23,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">{label}</p>
          <p className="mt-2 font-serif text-2xl text-stone-900">{time}</p>
        </div>
        <StatusBadge tone={tone}>Live</StatusBadge>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">{note}</p>
    </article>
  );
}
