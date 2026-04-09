import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import { useAuth } from '../../hooks/useAuth';
import { getFirstName, getInitials } from '../../utils/userDisplay';
import AdminHeroSection from './AdminHeroSection';
import AdminPageHeader from './AdminPageHeader';
import AdminPrimaryPanel from './AdminPrimaryPanel';
import AdminRegionalPanel from './AdminRegionalPanel';
import AdminSidebarPanel from './AdminSidebarPanel';
import AdminStatsGrid from './AdminStatsGrid';
import RestrictedState from './RestrictedState';
import { useAdminDashboard } from './useAdminDashboard';

function WorkspaceLoading() {
  return (
    <section className="mt-10 rounded-[2rem] border border-stone-200/80 bg-white px-8 py-16 text-center shadow-[0_24px_60px_rgba(28,25,23,0.08)]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading dashboard...</p>
    </section>
  );
}

export default function AdminOrdersWorkspace() {
  const MotionDiv = motion.div;
  const { user, token, isAuthenticated, isRestoringSession } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const { dashboard, isLoading, error, busyActionKey, reloadDashboard, runOrderAction } = useAdminDashboard(token, isAuthenticated && isAdmin);

  const pointerX = useMotionValue(-400);
  const pointerY = useMotionValue(-400);
  const pointerVisibility = useMotionValue(0);
  const glowOpacity = useSpring(pointerVisibility, { stiffness: 180, damping: 28, mass: 0.4 });
  const trailOpacity = useSpring(pointerVisibility, { stiffness: 120, damping: 30, mass: 0.7 });
  const glowX = useSpring(pointerX, { stiffness: 220, damping: 30, mass: 0.35 });
  const glowY = useSpring(pointerY, { stiffness: 220, damping: 30, mass: 0.35 });
  const trailX = useSpring(pointerX, { stiffness: 85, damping: 26, mass: 0.9 });
  const trailY = useSpring(pointerY, { stiffness: 85, damping: 26, mass: 0.9 });

  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const firstName = getFirstName(user?.name);
  const initials = getInitials(user?.name);
  const glowBackground = useMotionTemplate`radial-gradient(240px circle at ${glowX}px ${glowY}px, rgba(180, 83, 9, 0.26), rgba(194, 120, 48, 0.14) 32%, rgba(246, 240, 232, 0) 70%)`;
  const trailBackground = useMotionTemplate`radial-gradient(430px circle at ${trailX}px ${trailY}px, rgba(120, 113, 108, 0.18), rgba(87, 83, 78, 0.08) 28%, rgba(246, 240, 232, 0) 74%)`;

  return (
    <>
      <Seo title="Admin Orders Studio | Beautify Africa" description="Private operations workspace for Beautify Africa order management." path="/admin/orders" imageAlt="Beautify Africa admin orders workspace" />
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="relative min-h-screen overflow-hidden bg-[#f6f0e8] text-stone-900" onMouseMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); pointerX.set(e.clientX - b.left); pointerY.set(e.clientY - b.top); pointerVisibility.set(1); }} onMouseLeave={() => pointerVisibility.set(0)}>
        <div className="pointer-events-none absolute inset-0"><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),transparent_28%)]" /><MotionDiv className="absolute inset-0" style={{ background: trailBackground, opacity: trailOpacity, mixBlendMode: 'multiply' }} /><MotionDiv className="absolute inset-0" style={{ background: glowBackground, opacity: glowOpacity, mixBlendMode: 'soft-light' }} /></div>
        <main id="main-content" className="relative mx-auto max-w-[108rem] px-3 pb-18 pt-8 sm:px-4 lg:px-5 xl:px-6 lg:pt-10">
          <AdminPageHeader todayLabel={todayLabel} initials={initials} isAuthenticated={isAuthenticated} firstName={firstName} />
          {isRestoringSession ? <WorkspaceLoading /> : (!isAuthenticated || !isAdmin) ? <RestrictedState isAuthenticated={isAuthenticated} /> : (
            <>
              <AdminHeroSection heroBadges={dashboard.heroBadges} ritualChecklist={dashboard.ritualChecklist} />
              {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button type="button" onClick={() => reloadDashboard({ showLoader: true })} className="ml-4 rounded border border-red-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">Retry</button></div> : null}
              {isLoading ? <WorkspaceLoading /> : (<><AdminStatsGrid stats={dashboard.stats} /><div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]"><AdminPrimaryPanel dashboard={dashboard} busyActionKey={busyActionKey} onOrderAction={runOrderAction} /><AdminSidebarPanel lanes={dashboard.lanes} watchlist={dashboard.watchlist} /></div><AdminRegionalPanel regionalPulse={dashboard.regionalPulse} /></>)}
            </>
          )}
        </main>
      </div>
    </>
  );
}
