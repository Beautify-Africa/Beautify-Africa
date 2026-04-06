import { ProfileIcon } from '../Shared/Icons';

export default function CustomerProfileTrigger({
  isOpen,
  toggleMenu,
  isAuthenticated,
  isRestoringSession,
  initials,
  firstName,
}) {
  return (
    <button
      type="button"
      onClick={toggleMenu}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls="customer-profile-menu"
      className="group flex items-center gap-3 rounded-full border border-transparent px-1 py-1 text-left transition-colors hover:border-stone-200 focus:outline-none focus-visible:border-stone-300"
    >
      <span
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-stone-900 transition-colors ${
          isAuthenticated
            ? 'border-amber-200 bg-amber-50'
            : 'border-stone-200 bg-white group-hover:border-stone-300'
        }`}
      >
        {isAuthenticated && initials ? (
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{initials}</span>
        ) : (
          <ProfileIcon className="h-5 w-5" />
        )}

        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            isAuthenticated ? 'bg-emerald-500' : 'bg-stone-300'
          }`}
          aria-hidden="true"
        />
      </span>

      <span className="hidden xl:block">
        <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400">
          {isAuthenticated ? 'Profile' : 'Account'}
        </span>
        <span className="block text-xs text-stone-900">
          {isRestoringSession ? 'Checking...' : isAuthenticated ? firstName : 'Sign In'}
        </span>
      </span>
    </button>
  );
}
