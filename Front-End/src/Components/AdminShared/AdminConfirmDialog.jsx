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
      ? 'bg-rose-600 hover:bg-rose-500 text-white'
      : tone === 'amber'
        ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold'
        : 'bg-zinc-100 hover:bg-white text-zinc-950 font-bold';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0E131F] p-6 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
          Security Confirmation
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-3 text-xs leading-relaxed text-zinc-300">{description}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-700/80 bg-zinc-800/70 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${confirmToneClass}`}
          >
            {isBusy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
