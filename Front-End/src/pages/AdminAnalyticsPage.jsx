import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Seo from '../Components/Shared/Seo';
import AdminShell from '../Components/AdminShared/AdminShell';
import RestrictedState from '../Components/AdminOrders/RestrictedState';
import AdminFlashNotice from '../Components/AdminShared/AdminFlashNotice';
import { SectionCard, AnalyticsSeries } from '../Components/AdminAnalytics/AdminAnalyticsUi';
import AdminAnalyticsKpiGrid from '../Components/AdminAnalytics/AdminAnalyticsKpiGrid';
import { useAuth } from '../hooks/useAuth';
import { fetchAdminAnalytics } from '../services/adminApi';

export default function AdminAnalyticsPage() {
  const { token, user, isAuthenticated, isRestoringSession, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || authIsAdmin);
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
          <section className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] px-8 py-16 text-center shadow-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
              Restoring Session State...
            </p>
          </section>
        ) : !isAuthenticated || !isAdmin ? (
          <RestrictedState isAuthenticated={isAuthenticated} />
        ) : isLoading ? (
          <section className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] px-8 py-16 text-center shadow-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
              Querying Analytics Data Lake...
            </p>
          </section>
        ) : error ? (
          <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />
        ) : analytics ? (
          <div className="space-y-8">
            <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-[#0E131F] via-[#111827] to-[#090D16] p-8 shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                  Telemetry Engine Active
                </p>
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Revenue velocity, forecasting, and demand signals.
              </h2>
              <p className="mt-3 max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400">
                Live operational layer synthesizing real-time order logs. Monitors transactional velocity,
                regional fulfillment performance, and inventory exhaustion risks.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-xs text-zinc-300">
                <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 shadow-sm">
                  Paid Order Ratio: <strong className="text-amber-400">{analytics.summary.paidOrderRate}</strong>
                </span>
                <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 shadow-sm">
                  7d Revenue Vector: <strong className="text-emerald-400">{analytics.velocity.revenueTrend}</strong>
                </span>
                <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 shadow-sm">
                  Runway Forecast: <strong className="text-white">{analytics.forecast.trendLabel}</strong>
                </span>
              </div>
            </section>

            <AdminAnalyticsKpiGrid analytics={analytics} />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <SectionCard title="Sales Velocity Trajectory" eyebrow="Rolling 14-Day Baseline">
                <AnalyticsSeries series={analytics.velocity.salesSeries || []} />
              </SectionCard>

              <SectionCard title="Forecast Horizon" eyebrow="Predictive Modeling">
                <div className="space-y-3 font-mono text-xs">
                  <div className="rounded-xl border border-zinc-800 bg-[#090D16] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Projected Revenue Run-Rate
                    </p>
                    <p className="mt-1.5 text-xl font-bold text-white">
                      {analytics.forecast.next7dRevenue}
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Projected orders: <span className="text-amber-400 font-semibold">{analytics.forecast.next7dOrders}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-[#090D16] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Period Trend Vector
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-emerald-400">
                      {analytics.forecast.trendLabel}
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Variance: <span className="text-zinc-200">{analytics.forecast.trendValue}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-[#090D16] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Inventory Depletion Warning
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-amber-400">
                      {analytics.summary.lowStockCount} SKU(s) below reserve
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Immediate procurement schedule recommendation triggered.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <SectionCard title="Leading SKU Performance" eyebrow="Volume Generators">
                <div className="space-y-2.5">
                  {(analytics.topProducts || []).length > 0 ? (
                    analytics.topProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-[#090D16] px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-zinc-100 text-sm">{product.name}</p>
                          <p className="font-mono text-xs text-zinc-400">{product.quantity} units cleared</p>
                        </div>
                        <p className="font-mono text-sm font-bold text-amber-400">
                          {product.revenueLabel}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="font-mono text-xs text-zinc-500 py-4 text-center">
                      No settled product volumes identified in current interval.
                    </p>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Fulfillment Pipeline Mix" eyebrow="Operational Health">
                <div className="space-y-3 font-mono">
                  {(analytics.fulfillmentBreakdown || []).map((item) => (
                    <div key={item.status}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium uppercase tracking-wider text-zinc-300">{item.status}</span>
                        <span className="font-bold text-zinc-100">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-amber-400 shadow-sm"
                          style={{ width: `${Math.max(item.count * 12, 4)}%` }}
                        />
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
