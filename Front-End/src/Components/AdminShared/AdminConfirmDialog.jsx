export default function AdminConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'stone',
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  const confirmToneClass =
    tone === 'rose'
      ? 'bg-rose-600 hover:bg-rose-700'
      : tone === 'amber'
        ? 'bg-amber-600 hover:bg-amber-700'
        : 'bg-stone-900 hover:bg-stone-700';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-[0_24px_60px_rgba(28,25,23,0.18)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">Confirm action</p>
        <h2 className="mt-3 font-serif text-3xl text-stone-900">{title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">{description}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-stone-300 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-70 ${confirmToneClass}`}
          >
            {isBusy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

