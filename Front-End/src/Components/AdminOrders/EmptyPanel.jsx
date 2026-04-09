import StatusBadge from './StatusBadge';

export default function EmptyPanel({ title, message, tone = 'stone' }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-stone-300/80 bg-white/70 p-6">
      <StatusBadge tone={tone}>{title}</StatusBadge>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-500">{message}</p>
    </div>
  );
}
