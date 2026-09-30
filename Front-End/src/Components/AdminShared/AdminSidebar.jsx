import { NavLink } from 'react-router-dom';
import AppLink from '../Shared/AppLink';
import AdminNavIcon from './AdminNavIcon';
import { ADMIN_NAV_ITEMS } from '../../data/adminNavigation';

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
          <AdminNavIcon name={item.icon} className="w-4 h-4" />
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

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-zinc-800/90 bg-[#0A0D14]/95 p-5">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
        <AppLink to="/admin" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-serif text-black font-extrabold text-lg shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            BA
          </div>
          <div>
            <span className="font-serif text-sm font-bold tracking-tight text-white block">
              Beautify Africa
            </span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-amber-400/90 block">
              Admin Ops
            </span>
          </div>
        </AppLink>
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Admin navigation" className="flex-1 py-6 space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Workspaces
        </p>
        {ADMIN_NAV_ITEMS.map((item) => (
          <DesktopNavItem key={item.id} item={item} />
        ))}
      </nav>

      {/* Return to Storefront */}
      <div className="pt-4 border-t border-zinc-800/80">
        <AppLink
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Storefront View</span>
        </AppLink>
      </div>
    </aside>
  );
}
