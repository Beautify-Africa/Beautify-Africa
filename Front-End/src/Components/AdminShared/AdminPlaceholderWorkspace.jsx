import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminShell from './AdminShell';
import RestrictedState from '../AdminOrders/RestrictedState';
import { useAuth } from '../../hooks/useAuth';

function WorkspaceLoading() {
  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 px-8 py-16 text-center shadow-xl">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
        Loading workspace...
      </p>
    </section>
  );
}

export default function AdminPlaceholderWorkspace({
  sectionLabel,
  title,
  description,
  path,
  plannedItems = [],
}) {
  const { user, isAuthenticated, isRestoringSession, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || authIsAdmin);

  return (
    <>
      <Seo title={`${title} | Beautify Africa`} description={description} path={path} />
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AdminShell sectionLabel={sectionLabel} title={title} description={description}>
        {isRestoringSession ? (
          <WorkspaceLoading />
        ) : !isAuthenticated || !isAdmin ? (
          <RestrictedState isAuthenticated={isAuthenticated} />
        ) : (
          <section className="rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-[#0E131F] via-[#121828] to-[#0A0E18] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
                Roadmap Architecture
              </span>
              <span className="text-[10px] font-mono text-zinc-500">STAGE 2 READY</span>
            </div>

            <h2 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white">
              {title} Infrastructure Reserved
            </h2>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400">
              This corporate module is pre-wired to the enterprise navigation mesh, permission model, and audit framework.
            </p>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {plannedItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-300 flex items-start gap-3"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </AdminShell>
    </>
  );
}
