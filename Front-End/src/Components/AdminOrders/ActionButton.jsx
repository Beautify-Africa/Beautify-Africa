import { toneClasses } from './toneClasses';

export default function ActionButton({ action, isBusy, onClick }) {
  const classes = toneClasses(action.tone);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-wait disabled:opacity-60 ${classes.button}`}
    >
      {isBusy ? 'Updating...' : action.label}
    </button>
  );
}
