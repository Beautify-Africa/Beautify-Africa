import AdminPlaceholderWorkspace from '../Components/AdminShared/AdminPlaceholderWorkspace';

export default function AdminCustomersPage() {
  return (
    <AdminPlaceholderWorkspace
      sectionLabel="Customers"
      title="Customer Studio"
      description="Reserved workspace for customer support, segmentation, and account-level operations."
      path="/admin/customers"
      plannedItems={[
        'Customer directory with search, segmentation, and order history.',
        'Internal customer notes, tags, and support handoff context.',
        'Newsletter audience management and relationship health signals.',
        'Shared profile view for commerce, support, and retention work.',
      ]}
    />
  );
}

