import AppLink from '../Shared/AppLink';
import { useAuth } from '../../hooks/useAuth';
import FadeIn from '../Shared/FadeIn';
import AdminInlineSignIn from './AdminInlineSignIn';
import StatusBadge from './StatusBadge';

export default function RestrictedState({ isAuthenticated }) {
  const { logout } = useAuth();

  const message = isAuthenticated
    ? 'You are signed in, but your account does not have admin privileges for this private operations workspace.'
    : 'Please sign in with an admin account to open your private operations workspace.';

  const helperText = isAuthenticated
    ? 'Enter your admin credentials below, or sign out first if you prefer to switch accounts manually.'
    : 'Use the admin sign-in form below to authenticate and open the dashboard.';

  function handleSignOutCurrentAccount() {
    logout();
  }

  return (
    <FadeIn className="mt-10">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-[0_24px_60px_rgba(28,25,23,0.10)]">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(180,83,9,0.14),_transparent_40%),linear-gradient(135deg,_#fffdf9,_#f5efe7)] px-8 py-10 text-center">
          <StatusBadge tone="amber">Restricted workspace</StatusBadge>
          <h1 className="mt-6 font-serif text-5xl text-stone-900">Admin access is reserved for internal operations.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-600">{message}</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">{helperText}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOutCurrentAccount}
                className="rounded-sm bg-stone-900 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-amber-900"
              >
                Sign Out Current Account
              </button>
            ) : null}

            <AppLink href="/shop" className="rounded-sm border border-stone-900 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white">
              Return to Shop
            </AppLink>
          </div>

          <AdminInlineSignIn />
        </div>
      </section>
    </FadeIn>
  );
}
