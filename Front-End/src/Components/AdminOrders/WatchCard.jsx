import StatusBadge from './StatusBadge';

export default function WatchCard({ title, detail, tone }) {
  return (
    <article className="rounded-[1.45rem] border border-stone-200/80 bg-[#fffdf9] p-5">
      <StatusBadge tone={tone}>{title}</StatusBadge>
      <p className="mt-4 text-sm leading-relaxed text-stone-600">{detail}</p>
    </article>
  );
}
