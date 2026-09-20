const TONE_CLASSES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  info: 'border-zinc-800 bg-zinc-900/80 text-zinc-300',
};

export default function AdminFlashNotice({ tone = 'info', message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-xs shadow-md ${TONE_CLASSES[tone] || TONE_CLASSES.info}`}
      role="status"
      aria-live="polite"
    >
      <p className="leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-current/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
