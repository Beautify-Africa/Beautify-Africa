import { toneClasses } from './toneClasses';

export default function StatusBadge({ children, tone = 'stone' }) {
  const classes = toneClasses(tone);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${classes.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${classes.dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}
