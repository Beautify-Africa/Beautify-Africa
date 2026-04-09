import FadeIn from '../Shared/FadeIn';
import EmptyPanel from './EmptyPanel';
import MetricCard from './MetricCard';

export default function AdminStatsGrid({ stats }) {
  return (
    <FadeIn className="mt-8">
      {stats.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>
      ) : (
        <EmptyPanel
          title="No live metrics"
          message="Admin metrics will appear once orders are available in the system."
        />
      )}
    </FadeIn>
  );
}
