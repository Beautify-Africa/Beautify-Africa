import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AppLink from '../Shared/AppLink';
import { useAuth } from '../../hooks/useAuth';
import { getFirstName, getInitials } from '../../utils/userDisplay';
import { ADMIN_NAV_ITEMS } from '../../data/adminNavigation';

function NavItemIcon({ name, className = 'w-4 h-4' }) {
  if (name === 'orders') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  }
  if (name === 'products') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
  if (name === 'inventory') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7h16m-8 4v6m-3-3h6" />
      </svg>
    );
  }
  if (name === 'customers') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (name === 'analytics') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function DesktopNavItem({ item }) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `group flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent'
        }`
      }
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
          <NavItemIcon name={item.icon} className="w-4 h-4" />
        </span>
        <span className="truncate">{item.label}</span>
      </div>

      {item.isSoon ? (
        <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
          Phase 2
        </span>
      ) : null}
    </NavLink>
  );
}

function MobileNavItem({ item }) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `flex items-center gap-2 shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
          isActive
            ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
        }`
      }
    >
      <NavItemIcon name={item.icon} className="w-3.5 h-3.5" />
      <span>{item.label}</span>
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
  const { user, isAuthenticated, logout, adminLogin } = useAuth();
  const navigate = useNavigate();

  const firstName = getFirstName(user?.name);
  const initials = getInitials(user?.name);
  const userEmail = user?.email || 'owner@beautifyafrica.app';

  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Inactivity timeout: 15 minutes (Tier 4 requirement)
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
  const lastActivityRef = useRef(Date.now());

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const handleUserActivity = () => {
      if (!isVaultLocked) {
        resetActivity();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    const intervalId = setInterval(() => {
      if (!isVaultLocked && isAuthenticated) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          setIsVaultLocked(true);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(intervalId);
    };
  }, [isVaultLocked, isAuthenticated, INACTIVITY_TIMEOUT_MS, resetActivity]);

  async function handleUnlock(e) {
    e.preventDefault();
    if (!unlockPassword) return;

    setIsUnlocking(true);
    setUnlockError('');

    try {
      await adminLogin({ email: userEmail, password: unlockPassword });
      setIsVaultLocked(false);
      setUnlockPassword('');
      resetActivity();
    } catch {
      setUnlockError('Incorrect password. Vault remains locked.');
    } finally {
      setIsUnlocking(false);
    }
  }

  function handleSignOutFromLock() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Vault Auto-Lock Screen (Tier 4 Inactivity Protection) */}
      {isVaultLocked && (
        <div className="fixed inset-0 z-[999] bg-[#090D16]/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#0E131F] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-center">
            <div className="mx-auto w-12 h-12 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">Studio Vault Locked</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Session locked after 15 minutes of inactivity for your security.
            </p>

            {unlockError && (
              <p className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                {unlockError}
              </p>
            )}

            <form onSubmit={handleUnlock} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirm Master Password
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isUnlocking}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isUnlocking ? 'Verifying...' : 'Unlock Workspace'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleSignOutFromLock}
              className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign out instead
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="mx-auto max-w-[124rem] px-3 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Collapsible/Sticky Enterprise Sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-5 flex flex-col justify-between h-[calc(100vh-2.5rem)] rounded-2xl border border-zinc-800/80 bg-[#0E131F]/90 backdrop-blur-xl p-5 shadow-2xl">
              <div className="space-y-6">
                {/* Brand Header */}
                <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                      Operations Hub
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <h1 className="mt-2 text-xl font-bold tracking-tight text-white">
                    Beautify Africa
                  </h1>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Enterprise Studio v2.4 &bull; Corporate Operations
                  </p>
                </div>

                {/* Navigation Links */}
                <div>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 mb-2.5">
                    Command Modules
                  </p>
                  <nav className="space-y-1.5" aria-label="Admin workspace navigation">
                    {ADMIN_NAV_ITEMS.map((item) => (
                      <DesktopNavItem key={item.href} item={item} />
                    ))}
                  </nav>
                </div>
              </div>

              {/* Identity & Session Control */}
              <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-xs font-bold tracking-wider text-amber-300 shadow-inner">
                    {initials || 'BA'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isAuthenticated ? firstName : 'Administrator'}
                    </p>
                    <span className="inline-block mt-0.5 text-[9px] font-bold tracking-wider uppercase text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Sole Owner
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <AppLink
                    href="/"
                    className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Store
                  </AppLink>

                  <button
                    type="button"
                    onClick={() => setIsVaultLocked(true)}
                    className="text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                    title="Lock dashboard immediately"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Lock
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="text-rose-400/80 hover:text-rose-300 transition-colors flex items-center gap-1"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="space-y-5 min-w-0">
            {/* Top Command Bar */}
            <header className="rounded-2xl border border-zinc-800/80 bg-[#0E131F]/90 backdrop-blur-xl px-5 py-4 sm:px-6 shadow-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  {/* Breadcrumb row */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">Studio</span>
                    <span className="text-zinc-600">/</span>
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      {sectionLabel}
                    </span>
                    <span className="text-zinc-600 hidden sm:inline">&bull;</span>
                    <span className="hidden sm:inline text-zinc-500">
                      Encrypted Workspace
                    </span>
                  </div>

                  <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                    {description}
                  </p>
                </div>

                {headerContent ? (
                  <div className="lg:max-w-md shrink-0">{headerContent}</div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsVaultLocked(true)}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Lock Vault
                    </button>
                    <AppLink
                      href="/shop"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Storefront
                    </AppLink>
                  </div>
                )}
              </div>

              {/* Mobile Horizontal Module Switcher */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <MobileNavItem key={item.href} item={item} />
                ))}
              </div>
            </header>

            {/* Injected Children View */}
            <main id="admin-main-view">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
