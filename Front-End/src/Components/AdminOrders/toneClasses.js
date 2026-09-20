export function toneClasses(tone = 'stone') {
  if (tone === 'amber') {
    return {
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
      accent: 'from-amber-500/15 via-amber-500/5 to-transparent',
      button: 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20',
    };
  }

  if (tone === 'emerald') {
    return {
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
      accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      button: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
    };
  }

  if (tone === 'rose') {
    return {
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]',
      accent: 'from-rose-500/15 via-rose-500/5 to-transparent',
      button: 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
    };
  }

  return {
    badge: 'border-zinc-700/60 bg-zinc-800/60 text-zinc-300',
    dot: 'bg-zinc-400',
    accent: 'from-zinc-700/15 via-zinc-800/10 to-transparent',
    button: 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700',
  };
}
