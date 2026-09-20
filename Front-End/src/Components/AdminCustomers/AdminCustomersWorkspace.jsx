import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import AdminShell from '../AdminShared/AdminShell';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';
import StatusBadge from '../AdminOrders/StatusBadge';
import RestrictedState from '../AdminOrders/RestrictedState';
import AdminCustomerDetailDrawer from './AdminCustomerDetailDrawer';
import { useAuth } from '../../hooks/useAuth';
import { fetchAdminCustomers, fetchAdminCustomerDetail } from '../../services/adminApi';

function TelemetryCard({ label, value, note, tone = 'amber' }) {
  const dotColor = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-sky-400',
    stone: 'bg-zinc-400',
  }[tone] || 'bg-amber-400';

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">{label}</p>
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">{value}</p>
      {note ? <p className="mt-1.5 text-xs text-zinc-400">{note}</p> : null}
    </div>
  );
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase() || 'CU';
}

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
        {
          search,
          segment,
          sort,
          page,
          limit: 10,
        },
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

  async function handleInspectCustomer(customer) {
    if (!customer?.id) return;
    setIsDrawerOpen(true);
    setIsDetailLoading(true);
    setDetailError('');
    try {
      const detail = await fetchAdminCustomerDetail(customer.id, token);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error('Failed to load customer detail:', err);
      setDetailError(err.message || 'Failed to fetch customer profile.');
    } finally {
      setIsDetailLoading(false);
    }
  }

  function handleExportCsv() {
    const list = customersData.customers || [];
    if (list.length === 0) return;

    const headers = ['Name', 'Email', 'Type', 'VIP', 'Orders', 'Total Spend', 'Avg Order', 'Last Order Date', 'Newsletter'];
    const rows = list.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      c.isRegistered ? 'Registered' : 'Guest',
      c.isVip ? 'Yes' : 'No',
      c.ordersCount,
      c.totalSpend.toFixed(2),
      c.averageOrderValue.toFixed(2),
      c.latestOrderDate ? new Date(c.latestOrderDate).toISOString().split('T')[0] : 'N/A',
      c.isNewsletterSubscribed ? 'Subscribed' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `beautify_africa_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const metrics = customersData.metrics || {};
  const customers = customersData.customers || [];
  const pagination = customersData.pagination || { page: 1, totalPages: 1 };

  return (
    <>
      <Seo
        title="Admin Customers | Beautify Africa"
        description="Private customer intelligence and account directory for Beautify Africa operations."
        path="/admin/customers"
      />
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <AdminShell
        sectionLabel="Customers"
        title="Customer Intelligence"
        description="Audience directory, lifetime value metrics, VIP client profiles, and historical order dossiers."
        headerContent={
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-3 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Audience Master
            </p>
            <p className="mt-1 text-xs text-zinc-300">
              Live shopper intelligence with purchase frequency, VIP segmentation, and direct concierge contact.
            </p>
          </div>
        }
      >
        {isRestoringSession ? (
          <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 px-8 py-16 text-center shadow-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Loading Customer Studio...
            </p>
          </section>
        ) : !isAuthenticated || !isAdmin ? (
          <RestrictedState isAuthenticated={isAuthenticated} />
        ) : (
          <div className="space-y-6">
            {/* Flash error notice */}
            {error ? (
              <AdminFlashNotice tone="error" message={error} onDismiss={() => setError('')} />
            ) : null}

            {/* Telemetry KPI Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TelemetryCard
                label="Directory Clients"
                value={metrics.totalCustomers || 0}
                note={`${metrics.registeredCustomers || 0} registered • ${metrics.guestCustomers || 0} guest buyers`}
                tone="amber"
              />
              <TelemetryCard
                label="Gross Lifetime Value"
                value={`$${Number(metrics.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                note={`$${Number(metrics.averageCustomerValue || 0).toFixed(2)} average per client`}
                tone="emerald"
              />
              <TelemetryCard
                label="VIP Client Accounts"
                value={metrics.vipCustomers || 0}
                note="Clients with > $200 spent or 3+ orders"
                tone="blue"
              />
              <TelemetryCard
                label="Newsletter Audience"
                value={metrics.newsletterSubscribers || 0}
                note="Active email subscribers"
                tone="stone"
              />
            </div>

            {/* Control Bar: Filters, Search, Export */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 shadow-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search customers by name, email, or ID..."
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-white"
                    >
                      &times;
                    </button>
                  ) : null}
                </div>

                {/* Filters & Export */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Segment Pills */}
                  <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'registered', label: 'Members' },
                      { key: 'guest', label: 'Guests' },
                      { key: 'vip', label: '★ VIP' },
                      { key: 'newsletter', label: 'Newsletter' },
                    ].map((pill) => (
                      <button
                        key={pill.key}
                        type="button"
                        onClick={() => {
                          setSegment(pill.key);
                          setPage(1);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          segment === pill.key
                            ? 'bg-amber-500 text-zinc-950 shadow'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Selector */}
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="recent">Sort: Most Recent</option>
                    <option value="spent_desc">Sort: Highest Spend</option>
                    <option value="orders_desc">Sort: Most Orders</option>
                    <option value="name_asc">Sort: Name (A-Z)</option>
                  </select>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </section>

            {/* Customers Directory Table */}
            <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Customer Directory</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Showing {customers.length} of {pagination.totalCount || 0} clients
                  </p>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    Synchronizing...
                  </div>
                ) : null}
              </div>

              {customers.length === 0 && !isLoading ? (
                <div className="py-16 text-center text-xs text-zinc-400">
                  <p className="text-sm font-semibold text-zinc-300">No customers found</p>
                  <p className="mt-1">Try adjusting your search query or segment filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-800/80 bg-zinc-900/40 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                      <tr>
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-4 py-3.5">Account Type</th>
                        <th className="px-4 py-3.5 text-center">Orders</th>
                        <th className="px-4 py-3.5 text-right">Lifetime Spend</th>
                        <th className="px-4 py-3.5 text-right">Avg Order</th>
                        <th className="px-4 py-3.5">Last Order</th>
                        <th className="px-4 py-3.5 text-center">Newsletter</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {customers.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                          onClick={() => handleInspectCustomer(c)}
                        >
                          {/* Name & Email with Avatar */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-600/30 to-amber-400/10 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300 font-mono shadow-sm">
                                {getInitials(c.name)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                                    {c.name}
                                  </p>
                                  {c.isVip ? (
                                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                                      ★ VIP
                                    </span>
                                  ) : null}
                                </div>
                                <p className="font-mono text-[11px] text-zinc-400">{c.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Account Classification */}
                          <td className="px-4 py-4">
                            <StatusBadge tone={c.isRegistered ? 'emerald' : 'stone'}>
                              {c.isRegistered ? 'Registered' : 'Guest'}
                            </StatusBadge>
                          </td>

                          {/* Orders */}
                          <td className="px-4 py-4 text-center font-mono font-semibold text-zinc-200">
                            {c.ordersCount}
                          </td>

                          {/* Total Spend */}
                          <td className="px-4 py-4 text-right font-mono font-bold text-emerald-400">
                            ${c.totalSpend.toFixed(2)}
                          </td>

                          {/* Avg Order */}
                          <td className="px-4 py-4 text-right font-mono text-zinc-300">
                            ${c.averageOrderValue.toFixed(2)}
                          </td>

                          {/* Last Order */}
                          <td className="px-4 py-4">
                            {c.latestOrderDate ? (
                              <div>
                                <p className="text-zinc-200">
                                  {new Date(c.latestOrderDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                                <span className="inline-block mt-0.5 text-[10px] font-mono text-zinc-500 uppercase">
                                  {c.latestOrderStatus || 'Processing'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-500">No purchases</span>
                            )}
                          </td>

                          {/* Newsletter */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                c.isNewsletterSubscribed ? 'bg-emerald-400' : 'bg-zinc-600'
                              }`}
                              title={c.isNewsletterSubscribed ? 'Subscribed' : 'Not subscribed'}
                            />
                          </td>

                          {/* Inspect Trigger */}
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleInspectCustomer(c)}
                              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-amber-500 hover:text-amber-400 transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/30 px-6 py-3.5">
                  <p className="text-xs text-zinc-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-zinc-700"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-zinc-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </AdminShell>

      {/* Customer Detail Drawer */}
      <AdminCustomerDetailDrawer
        isOpen={isDrawerOpen}
        customerData={selectedCustomer}
        isLoading={isDetailLoading}
        error={detailError}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </>
  );
}
