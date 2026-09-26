import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminShell from '../AdminShared/AdminShell';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import RestrictedState from '../AdminOrders/RestrictedState';
import AdminCustomerDetailDrawer from './AdminCustomerDetailDrawer';
import AdminCustomersHeader from './AdminCustomersHeader';
import AdminCustomersMetricsGrid from './AdminCustomersMetricsGrid';
import AdminCustomersFilters from './AdminCustomersFilters';
import AdminCustomersTable from './AdminCustomersTable';
import { useAuth } from '../../hooks/useAuth';
import { fetchAdminCustomers, fetchAdminCustomerDetail } from '../../services/adminApi';

export default function AdminCustomersWorkspace() {
  const { user, token, isAuthenticated, isRestoringSession, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || authIsAdmin);

  const [customersData, setCustomersData] = useState({
    customers: [],
    metrics: {
      totalCustomers: 0,
      registeredCustomers: 0,
      guestCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageCustomerValue: 0,
      vipCustomers: 0,
      newsletterSubscribers: 0,
    },
    pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 1 },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  // Inspection Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const loadCustomers = useCallback(async () => {
    if (!token || !isAuthenticated || !isAdmin) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await fetchAdminCustomers(
        { search, segment, sort, page, limit: 10 },
        token
      );
      setCustomersData(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'Failed to load customer directory.');
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, isAdmin, search, segment, sort, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleInspectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
    setIsDetailLoading(true);
    setDetailError('');

    try {
      const fullDetail = await fetchAdminCustomerDetail(customer.id, token);
      setSelectedCustomer(fullDetail);
    } catch (err) {
      console.error('Failed to load customer detail:', err);
      setDetailError(err.message || 'Could not load complete customer dossier.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!customersData.customers.length) return;
    const headers = ['ID', 'Name', 'Email', 'Type', 'Orders', 'Spent', 'VIP', 'Status'];
    const rows = customersData.customers.map((c) => [
      c.id,
      `"${c.name || ''}"`,
      c.email || '',
      c.isRegistered ? 'Registered' : 'Guest',
      c.ordersCount || 0,
      c.totalSpent || 0,
      c.vipTier || 'bronze',
      c.status || 'active',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `beautify-africa-customers-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isRestoringSession && (!isAuthenticated || !isAdmin)) {
    return (
      <AdminShell sectionLabel="Directory" title="Customers" description="Access restricted">
        <RestrictedState />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      sectionLabel="Intelligence"
      title="Patrons & Clients"
      description="Holistic directory of registered members and checkout guests across continental Africa."
    >
      <Seo title="Customer Intelligence | Admin | Beautify Africa" />
      <Helmet>
        <title>Customer Intelligence | Admin | Beautify Africa</title>
      </Helmet>

      <div className="space-y-6">
        <AdminCustomersHeader
          onExportCsv={handleExportCsv}
          onRefresh={loadCustomers}
          isLoading={isLoading}
        />

        {error && <AdminFlashNotice tone="critical" message={error} />}

        <AdminCustomersMetricsGrid metrics={customersData.metrics} />

        <AdminCustomersFilters
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          segment={segment}
          onSegmentChange={(seg) => { setSegment(seg); setPage(1); }}
          sort={sort}
          onSortChange={(st) => { setSort(st); setPage(1); }}
        />

        <AdminCustomersTable
          customers={customersData.customers}
          isLoading={isLoading}
          pagination={customersData.pagination}
          onPageChange={setPage}
          onInspectCustomer={handleInspectCustomer}
        />
      </div>

      <AdminCustomerDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customer={selectedCustomer}
        isLoading={isDetailLoading}
        error={detailError}
      />
    </AdminShell>
  );
}
