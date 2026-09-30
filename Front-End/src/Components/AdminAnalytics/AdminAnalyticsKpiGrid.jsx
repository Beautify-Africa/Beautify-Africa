import { MetricCard } from './AdminAnalyticsUi';

export default function AdminAnalyticsKpiGrid({ analytics }) {
  if (!analytics?.summary || !analytics?.velocity || !analytics?.forecast) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        label="Gross Revenue"
        value={analytics.summary.grossRevenue}
        note="All settled orders captured in the reporting period."
        tone="emerald"
      />
      <MetricCard
        label="Average Order Value"
        value={analytics.summary.averageOrderValue}
        note="Computed across all completed client checkouts."
        tone="amber"
      />
      <MetricCard
        label="Paid Orders"
        value={analytics.summary.paidOrders}
        note={`Captured from ${analytics.summary.totalOrders} total ledger entries.`}
        tone="stone"
      />
      <MetricCard
        label="7d Gross Velocity"
        value={analytics.summary.recentRevenue7d}
        note={`Previous 7d baseline: ${analytics.summary.previousRevenue7d}`}
        tone="emerald"
      />
      <MetricCard
        label="7d Order Volume"
        value={analytics.summary.recentOrders7d}
        note={`Velocity delta: ${analytics.velocity.orderTrend}`}
        tone="stone"
      />
      <MetricCard
        label="Forecast 7d Inflow"
        value={analytics.forecast.next7dRevenue}
        note={`Inventory pressure index: ${analytics.forecast.inventoryPressure}`}
        tone="amber"
      />
    </section>
  );
}
