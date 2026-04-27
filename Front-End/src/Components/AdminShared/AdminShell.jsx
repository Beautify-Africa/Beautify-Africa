import { NavLink } from 'react-router-dom';
import AppLink from '../Shared/AppLink';
import { useAuth } from '../../hooks/useAuth';
import { getFirstName, getInitials } from '../../utils/userDisplay';
import { ADMIN_NAV_ITEMS } from '../../data/adminNavigation';

function DesktopNavItem({ item }) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `block rounded-[1.25rem] border px-4 py-3 transition-colors ${
          isActive
            ? 'border-stone-900 bg-stone-900 text-white shadow-[0_12px_30px_rgba(28,25,23,0.15)]'
            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-900'
        }`
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-80">{item.description}</p>
        </div>
        {item.isSoon ? (
          <span className="rounded-full border border-current/20 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]">
            Soon
          </span>
        ) : null}
      </div>
    </NavLink>
  );
}

function MobileNavItem({ item }) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `min-w-[150px] rounded-[1.1rem] border px-4 py-3 ${
          isActive
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-200 bg-white text-stone-700'
        }`
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em]">{item.label}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{item.isSoon ? 'Planned workspace' : item.description}</p>
    </NavLink>
  );
}

export default function AdminShell({
  sectionLabel,
  title,
  description,
  children,
  headerContent = null,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const firstName = getFirstName(user?.name);
  const initials = getInitials(user?.name);
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f1e8de_100%)] text-stone-900">
      <div className="mx-auto max-w-[118rem] px-4 py-5 sm:px-5 lg:px-6">
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-5 overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffdf9,#f6efe6)] p-6 shadow-[0_18px_48px_rgba(28,25,23,0.08)]">
              <div className="rounded-[1.6rem] border border-stone-200 bg-white/85 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Beautify Africa</p>
                <h1 className="mt-3 font-serif text-3xl text-stone-900">Admin Studio</h1>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  Shared command center for order operations, catalog control, and the next admin phases.
                </p>
              </div>

              <nav className="mt-5 space-y-3" aria-label="Admin workspace navigation">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <DesktopNavItem key={item.href} item={item} />
                ))}
              </nav>

              <div className="mt-5 rounded-[1.6rem] border border-stone-200 bg-stone-950 p-5 text-stone-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">Session</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/40 bg-amber-50 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                    {initials || 'BA'}
                  </span>
                  <div>
                    <p className="font-serif text-xl text-white">{isAuthenticated ? firstName : 'Guest'}</p>
                    <p className="text-xs text-stone-400">{todayLabel}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <AppLink
                    href="/shop"
                    className="rounded-full border border-stone-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-100"
                  >
                    View Store
                  </AppLink>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-full border border-stone-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-100"
                    >
                      Sign Out
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <header className="rounded-[2rem] border border-stone-200/80 bg-white/80 px-5 py-5 shadow-[0_14px_40px_rgba(28,25,23,0.06)] backdrop-blur-xl sm:px-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-stone-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-900">
                      {sectionLabel}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-800">
                      {todayLabel}
                    </span>
                  </div>
                  <h2 className="mt-4 font-serif text-4xl text-stone-900 sm:text-5xl">{title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">{description}</p>
                </div>

                {headerContent ? <div className="lg:max-w-sm">{headerContent}</div> : null}
              </div>

              <div className="mt-5 flex gap-3 overflow-x-auto pb-1 xl:hidden">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <MobileNavItem key={item.href} item={item} />
                ))}
              </div>
            </header>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

