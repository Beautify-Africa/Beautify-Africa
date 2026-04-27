import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminShell from './AdminShell';
import RestrictedState from '../AdminOrders/RestrictedState';
import { useAuth } from '../../hooks/useAuth';

function WorkspaceLoading() {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-16 text-center shadow-[0_18px_44px_rgba(28,25,23,0.08)]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading workspace...</p>
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
  const { user, isAuthenticated, isRestoringSession } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);

  return (
    <>
      <Seo title={`${title} | Beautify Africa`} description={description} path={path} />
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>

      <AdminShell
        sectionLabel={sectionLabel}
        title={title}
        description={description}
      >
        {isRestoringSession ? (
          <WorkspaceLoading />
        ) : !isAuthenticated || !isAdmin ? (
          <RestrictedState isAuthenticated={isAuthenticated} />
        ) : (
          <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,#fffefb,#f5ede4)] p-8 shadow-[0_20px_55px_rgba(28,25,23,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-stone-400">Phase 1 structure</p>
            <h2 className="mt-3 font-serif text-4xl text-stone-900">This workspace is reserved and ready for the next phase.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
              We now have a shared admin shell and route structure in place, so this section can grow into a proper module without reworking navigation later.
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {plannedItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-stone-200 bg-white px-5 py-4 shadow-sm"
                >
                  <p className="text-sm leading-relaxed text-stone-700">{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </AdminShell>
    </>
  );
}

