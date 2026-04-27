import AdminPlaceholderWorkspace from '../Components/AdminShared/AdminPlaceholderWorkspace';

export default function AdminAnalyticsPage() {
  return (
    <AdminPlaceholderWorkspace
      sectionLabel="Analytics"
      title="Commerce Analytics"
      description="Reserved workspace for revenue monitoring, reporting, and performance insights."
      path="/admin/analytics"
      plannedItems={[
        'Revenue, order velocity, and regional trend dashboards.',
        'Top product, payment failure, and fulfillment SLA reporting.',
        'Export center for CSV and scheduled reporting jobs.',
        'A calmer place to review business health without leaving the admin shell.',
      ]}
    />
  );
}

