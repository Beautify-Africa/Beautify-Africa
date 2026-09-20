import StatusBadge from './StatusBadge';

export default function WatchCard({ title, detail, tone }) {
  return (
    <article className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <StatusBadge tone={tone}>{title}</StatusBadge>
      <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">{detail}</p>
    </article>
  );
}
