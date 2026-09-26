import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchInventoryDashboard } from '../../services/adminApi';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

function StatCard({ label, value, unit = '', color = 'stone' }) {
  const bgColor = {
    stone: 'bg-zinc-900/60 border-zinc-800/80',
    green: 'bg-emerald-500/10 border-emerald-500/30',
    amber: 'bg-amber-500/10 border-amber-500/30',
    red: 'bg-rose-500/10 border-rose-500/30',
  }[color];

  const valueColor = {
    stone: 'text-zinc-100',
    green: 'text-emerald-400',
    amber: 'text-amber-300',
    red: 'text-rose-400',
  }[color];

  return (
    <div className={`rounded-xl border ${bgColor} p-4 sm:p-5 backdrop-blur-sm shadow-md`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`mt-2 font-mono font-bold text-2xl sm:text-3xl tabular-nums ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-xs ml-1 font-sans text-zinc-400">{unit}</span>}
      </p>
    </div>
  );
}

export default function InventoryDashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await fetchInventoryDashboard(token);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load inventory dashboard:', err);
      setError(err.message || 'Failed to load inventory dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-amber-500" />
      </div>
    );
  }

  if (error) {
    return <AdminFlashNotice tone="error" message={error} onDismiss={() => setError('')} />;
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-xs">No inventory data available</p>
      </div>
    );
  }

  const data = dashboardData.data || dashboardData;
  const lowStockColor = data.lowStockItemsCount > 0 ? 'red' : 'green';

  return (
    <div className="space-y-5">
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Products" value={data.totalProducts || 0} />
          <StatCard label="Total Variants" value={data.totalVariants || 0} />
          <StatCard label="Total Stock" value={data.totalStock || 0} unit="units" color="green" />
          <StatCard label="Main Stock" value={data.mainStock || 0} />
          <StatCard
            label="Low Stock Items"
            value={data.lowStockItemsCount || 0}
            color={lowStockColor}
          />
        </div>
      </div>

      {/* Variant Stock Breakdown */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Stock Breakdown</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-xs">
            <span className="text-zinc-400">Variant Stock</span>
            <span className="font-mono font-bold text-white tabular-nums">{data.variantStock || 0} units</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Main SKU Stock</span>
            <span className="font-mono font-bold text-white tabular-nums">{data.mainStock || 0} units</span>
          </div>
        </div>
        {data.totalStock > 0 && (
          <div className="mt-4">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                style={{
                  width: `${((data.variantStock || 0) / (data.totalStock || 1)) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] font-mono text-zinc-500 text-right">
              {(((data.variantStock || 0) / (data.totalStock || 1)) * 100).toFixed(1)}% in active variants
            </p>
          </div>
        )}
      </div>

      {/* Status Distribution */}
      {data.statusDistribution && (
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Catalog Status Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.statusDistribution).map(([status, count]) => (
              <div key={status} className="rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 capitalize">{status || 'Standard'}</span>
                <p className="mt-1 font-mono font-bold text-lg text-white tabular-nums">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-[11px] font-mono text-zinc-500 text-right">
        Last synced: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
