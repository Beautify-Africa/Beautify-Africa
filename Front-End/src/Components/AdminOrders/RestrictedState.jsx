import AppLink from '../Shared/AppLink';
import { useAuth } from '../../hooks/useAuth';
import FadeIn from '../Shared/FadeIn';
import AdminInlineSignIn from './AdminInlineSignIn';
import StatusBadge from './StatusBadge';

export default function RestrictedState({ isAuthenticated }) {
  const { logout } = useAuth();

  const message = isAuthenticated
    ? 'You are currently signed in, but your account lacks administrative privileges for this enterprise console.'
    : 'Restricted workspace. Please authenticate with system owner credentials to proceed.';

  const helperText = isAuthenticated
    ? 'Authenticate with system owner credentials below, or sign out to switch sessions.'
    : 'System owner authorization required to open operations dashboard.';

  function handleSignOutCurrentAccount() {
    logout();
  }

  return (
    <FadeIn className="mt-6">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 shadow-2xl p-8 sm:p-10 text-center">
        <StatusBadge tone="amber">Restricted Vault</StatusBadge>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Admin Studio Access Restricted
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-xs sm:text-sm leading-relaxed text-zinc-400">
          {message}
        </p>
        <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-zinc-500">
          {helperText}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOutCurrentAccount}
              className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Sign Out Account
            </button>
          ) : null}

          <AppLink
            href="/"
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            Return to Store
          </AppLink>
        </div>

        <AdminInlineSignIn />
      </section>
    </FadeIn>
  );
}
