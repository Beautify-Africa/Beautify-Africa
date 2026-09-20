import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AdminNavIcon from './AdminNavIcon';
import { useAuth } from '../../hooks/useAuth';
import { getFirstName, getInitials } from '../../utils/userDisplay';
import { ADMIN_NAV_ITEMS } from '../../data/adminNavigation';

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
      <AdminNavIcon name={item.icon} className="w-3.5 h-3.5" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AdminHeader({ sectionLabel, title, description }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const firstName = getFirstName(user?.name) || 'Admin';
  const initials = getInitials(user?.name) || 'AD';

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[#0A0D14]/90 backdrop-blur-xl px-6 py-4 md:px-10">
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb Context */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-amber-400/90">{sectionLabel}</span>
          </div>
          <h1 className="mt-0.5 truncate font-serif text-xl font-bold tracking-tight text-white md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="hidden text-xs text-zinc-400 sm:block sm:truncate mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* User Badge / Quick Actions */}
        <div className="relative flex items-center gap-3 shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Admin account menu"
            className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/90 py-1.5 pl-2 pr-3 transition-colors hover:border-zinc-700"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 font-mono text-xs font-bold text-amber-300">
              {initials}
            </span>
            <span className="hidden text-xs font-semibold text-zinc-200 md:inline">
              {firstName}
            </span>
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Menu Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-zinc-800 bg-[#0E131F] p-2 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="border-b border-zinc-800/80 px-3 py-2.5">
                <p className="truncate text-xs font-semibold text-white">{user?.name || 'Administrator'}</p>
                <p className="truncate text-[10px] text-zinc-400">{user?.email || 'admin@beautifyafrica.com'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Horizontal Navigation Scroller */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {ADMIN_NAV_ITEMS.map((item) => (
          <MobileNavItem key={item.id} item={item} />
        ))}
      </div>
    </header>
  );
}
