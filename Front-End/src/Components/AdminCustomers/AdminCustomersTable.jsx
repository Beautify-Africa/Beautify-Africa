import StatusBadge from '../AdminOrders/StatusBadge';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase() || 'CU';
}

function VipBadge({ tier = 'bronze' }) {
  const badgeClasses = {
    platinum: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    gold: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    silver: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
    bronze: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  }[tier.toLowerCase()] || 'border-zinc-700 bg-zinc-800 text-zinc-400';

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeClasses}`}>
      {tier}
    </span>
  );
}

export default function AdminCustomersTable({
  customers = [],
  isLoading,
  pagination,
  onPageChange,
  onInspectCustomer,
}) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-8">
        <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400">
          <svg className="h-5 w-5 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading customer directory...
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-8 text-center">
        <p className="font-serif text-lg text-white">No patrons found</p>
        <p className="mt-1 text-xs text-zinc-400">Try adjusting your search terms or segment filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 shadow-xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800/90 bg-zinc-900/40 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            <tr>
              <th className="px-6 py-4">Patron</th>
              <th className="px-6 py-4">Account Type</th>
              <th className="px-6 py-4">VIP Tier</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Lifetime Spend</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {customers.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 font-mono text-[11px] font-bold text-amber-300">
                      {getInitials(c.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{c.name || 'Anonymous Guest'}</p>
                      <p className="truncate text-[11px] text-zinc-400">{c.email || 'No email provided'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    c.isRegistered ? 'text-sky-300 bg-sky-500/10' : 'text-zinc-400 bg-zinc-800/60'
                  }`}>
                    {c.isRegistered ? 'Registered Member' : 'Guest Buyer'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <VipBadge tier={c.vipTier || 'bronze'} />
                </td>
                <td className="px-6 py-4 font-mono font-semibold text-zinc-200">
                  {c.ordersCount || 0}
                </td>
                <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                  ${Number(c.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={c.status || 'active'} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onInspectCustomer(c)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/30 px-6 py-3.5 text-xs text-zinc-400">
          <p>
            Showing <span className="font-semibold text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-semibold text-white">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>{' '}
            of <span className="font-semibold text-white">{pagination.totalCount}</span> patrons
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-[11px] font-semibold text-zinc-400">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
