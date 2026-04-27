const TONE_CLASSES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-stone-200 bg-white text-stone-700',
};

export default function AdminFlashNotice({ tone = 'info', message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-[1.4rem] border px-4 py-3 text-sm shadow-sm ${TONE_CLASSES[tone] || TONE_CLASSES.info}`}
      role="status"
      aria-live="polite"
    >
      <p className="leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-current/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

