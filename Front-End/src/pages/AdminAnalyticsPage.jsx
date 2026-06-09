import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Seo from '../Components/Shared/Seo';
import AdminShell from '../Components/AdminShared/AdminShell';
import RestrictedState from '../Components/AdminOrders/RestrictedState';
import AdminFlashNotice from '../Components/AdminShared/AdminFlashNotice';
import { useAuth } from '../hooks/useAuth';
import { fetchAdminAnalytics } from '../services/adminApi';

function MetricCard({ label, value, note, tone = 'stone' }) {
  const toneClasses = {
    stone: 'border-stone-200 bg-stone-50 text-stone-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  }[tone];

  return (
    <div className={`rounded-[1.4rem] border p-5 shadow-sm ${toneClasses}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-current/60">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {note ? <p className="mt-2 text-sm leading-relaxed text-current/70">{note}</p> : null}
    </div>
  );
}

function SectionCard({ title, children, eyebrow }) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_44px_rgba(28,25,23,0.06)]">
      {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">{eyebrow}</p> : null}
      <h3 className="mt-2 text-lg font-semibold text-stone-900">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function AnalyticsSeries({ series = [] }) {
  const maxRevenue = Math.max(...series.map((entry) => Number(entry.revenue || 0)), 1);

  return (
    <div className="space-y-3">
      {series.map((entry) => {
        const width = `${Math.max(6, (Number(entry.revenue || 0) / maxRevenue) * 100)}%`;

        return (
          <div key={entry.key} className="grid gap-2 sm:grid-cols-[72px_minmax(0,1fr)_72px] sm:items-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{entry.label}</div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-stone-900" style={{ width }} />
            </div>
            <div className="text-right text-sm font-semibold text-stone-900">{formatCurrency(entry.revenue)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { token, user, isAuthenticated, isRestoringSession } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!token || !isAuthenticated || !isAdmin) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const data = await fetchAdminAnalytics(token);
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, isAdmin]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <>
      <Seo
        title="Commerce Analytics | Beautify Africa"
        description="Revenue reporting, sales velocity, and forecasting for the admin team."
        path="/admin/analytics"
      />
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AdminShell
        sectionLabel="Analytics"
        title="Commerce Analytics"
        description="Revenue reporting, velocity trends, and inventory pressure signals."
      >
        {isRestoringSession ? (
          <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-16 text-center shadow-[0_18px_44px_rgba(28,25,23,0.08)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading workspace...</p>
          </section>
        ) : !isAuthenticated || !isAdmin ? (
          <RestrictedState isAuthenticated={isAuthenticated} />
        ) : isLoading ? (
          <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-16 text-center shadow-[0_18px_44px_rgba(28,25,23,0.08)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading analytics...</p>
          </section>
        ) : error ? (
          <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />
        ) : analytics ? (
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,#fffefb,#f5ede4)] p-8 shadow-[0_20px_55px_rgba(28,25,23,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-stone-400">Phase 4A reporting</p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">Revenue, velocity, and forecast signals in one place.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">
                This view turns recent order history into a lightweight reporting layer for the admin team. It highlights what sold, how quickly it sold, and where inventory pressure is building.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1">Paid order rate {analytics.summary.paidOrderRate}</span>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1">7d revenue trend {analytics.velocity.revenueTrend}</span>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1">Forecast {analytics.forecast.trendLabel}</span>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Gross Revenue" value={analytics.summary.grossRevenue} note="All paid orders captured in the current reporting window." tone="stone" />
              <MetricCard label="Average Order Value" value={analytics.summary.averageOrderValue} note="A simple average based on paid order totals." tone="emerald" />
              <MetricCard label="Paid Orders" value={analytics.summary.paidOrders} note={`Out of ${analytics.summary.totalOrders} total orders.`} tone="amber" />
              <MetricCard label="7d Revenue" value={analytics.summary.recentRevenue7d} note={`Previous 7d: ${analytics.summary.previousRevenue7d}`} tone="rose" />
              <MetricCard label="7d Orders" value={analytics.summary.recentOrders7d} note={`Trend: ${analytics.velocity.orderTrend}`} tone="stone" />
              <MetricCard label="Forecast Next 7d" value={analytics.forecast.next7dRevenue} note={`Inventory pressure score: ${analytics.forecast.inventoryPressure}`} tone="emerald" />
            </section>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
              <SectionCard title="Sales Velocity" eyebrow="Last 14 days">
                <AnalyticsSeries series={analytics.velocity.salesSeries || []} />
              </SectionCard>

              <SectionCard title="Forecast Snapshot" eyebrow="Planning window">
                <div className="space-y-4 text-sm text-stone-600">
                  <div className="rounded-[1.2rem] border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Projection</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{analytics.forecast.next7dRevenue} expected revenue</p>
                    <p className="mt-1">Projected order count: <span className="font-semibold text-stone-900">{analytics.forecast.next7dOrders}</span></p>
                  </div>
                  <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Trend</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{analytics.forecast.trendLabel}</p>
                    <p className="mt-1">Change from the previous period: <span className="font-semibold text-stone-900">{analytics.forecast.trendValue}</span></p>
                  </div>
                  <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Inventory pressure</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{analytics.summary.lowStockCount} low-stock item(s)</p>
                    <p className="mt-1">Use this as an early signal for restock and reorder planning.</p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <SectionCard title="Top Selling Products" eyebrow="Best performers">
                <div className="space-y-3">
                  {(analytics.topProducts || []).length > 0 ? (
                    analytics.topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-[1.15rem] border border-stone-200 px-4 py-4">
                        <div>
                          <p className="font-semibold text-stone-900">{product.name}</p>
                          <p className="text-xs text-stone-500">{product.quantity} unit(s) sold</p>
                        </div>
                        <p className="text-sm font-semibold text-stone-900">{product.revenueLabel}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">No paid product sales were found in the current dataset.</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Fulfillment Mix" eyebrow="Operational health">
                <div className="space-y-3">
                  {(analytics.fulfillmentBreakdown || []).map((item) => (
                    <div key={item.status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium capitalize text-stone-700">{item.status}</span>
                        <span className="font-semibold text-stone-900">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-stone-900" style={{ width: `${Math.max(item.count * 12, 4)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        ) : null}
      </AdminShell>
    </>
  );
}

