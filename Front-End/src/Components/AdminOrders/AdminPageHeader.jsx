import AppLink from '../Shared/AppLink';
import FadeIn from '../Shared/FadeIn';

export default function AdminPageHeader({ todayLabel, initials, isAuthenticated, firstName }) {
  return (
    <FadeIn
      as="header"
      className="rounded-[2rem] border border-stone-200/80 bg-white/70 px-6 py-5 shadow-[0_14px_40px_rgba(28,25,23,0.06)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-stone-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-stone-900">Beautify Africa</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-800">Private orders studio</span>
          </div>
          <p className="mt-4 text-sm uppercase tracking-[0.28em] text-stone-400">{todayLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AppLink href="/shop" className="rounded-sm border border-stone-200 bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900">
            View Storefront
          </AppLink>
          <AppLink href="/profile" className="inline-flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-[#fffdf9] px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">{initials || 'BA'}</span>
            <span className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Session</span>
              <span className="block font-serif text-lg text-stone-900">{isAuthenticated ? firstName : 'Guest'}</span>
            </span>
          </AppLink>
        </div>
      </div>
    </FadeIn>
  );
}
