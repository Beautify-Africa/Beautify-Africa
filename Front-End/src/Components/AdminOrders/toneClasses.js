export function toneClasses(tone = 'stone') {
  if (tone === 'amber') {
    return {
      badge: 'border-amber-200 bg-amber-50 text-amber-800',
      dot: 'bg-amber-500',
      accent: 'from-amber-200/70 via-amber-100/70 to-transparent',
      button: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
    };
  }

  if (tone === 'emerald') {
    return {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      dot: 'bg-emerald-500',
      accent: 'from-emerald-200/70 via-emerald-100/70 to-transparent',
      button: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
    };
  }

  if (tone === 'rose') {
    return {
      badge: 'border-rose-200 bg-rose-50 text-rose-800',
      dot: 'bg-rose-500',
      accent: 'from-rose-200/70 via-rose-100/70 to-transparent',
      button: 'border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100',
    };
  }

  return {
    badge: 'border-stone-200 bg-stone-50 text-stone-700',
    dot: 'bg-stone-400',
    accent: 'from-stone-200/70 via-stone-100/70 to-transparent',
    button: 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100',
  };
}
