export default function RegionCard({ region, share, movement, note }) {
  return (
    <article className="rounded-[1.5rem] border border-stone-200/80 bg-white p-5 shadow-[0_10px_22px_rgba(28,25,23,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">{region}</p>
          <p className="mt-3 font-serif text-3xl text-stone-900">{share}</p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
          {movement}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">{note}</p>
    </article>
  );
}
