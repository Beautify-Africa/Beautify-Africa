import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchInventoryDashboard } from '../../services/adminApi';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

function StatCard({ label, value, unit = '', color = 'stone' }) {
  const bgColor = {
    stone: 'bg-stone-50 border-stone-200',
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  }[color];

  const textColor = {
    stone: 'text-stone-900',
    green: 'text-green-900',
    amber: 'text-amber-900',
    red: 'text-red-900',
  }[color];

  const valueColor = {
    stone: 'text-stone-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }[color];

  return (
    <div className={`rounded-lg border ${bgColor} p-6`}>
      <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-lg ml-1">{unit}</span>}
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminFlashNotice
        type="error"
        message={error}
        onDismiss={() => setError('')}
      />
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-600">No inventory data available</p>
      </div>
    );
  }

  const data = dashboardData.data || dashboardData;
  const lowStockColor = data.lowStockItemsCount > 0 ? 'red' : 'green';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-stone-900 mb-4">Inventory Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Products"
            value={data.totalProducts || 0}
          />
          <StatCard
            label="Total Variants"
            value={data.totalVariants || 0}
          />
          <StatCard
            label="Total Stock"
            value={data.totalStock || 0}
            unit="units"
            color="green"
          />
          <StatCard
            label="Main Stock"
            value={data.mainStock || 0}
          />
          <StatCard
            label="Low Stock Items"
            value={data.lowStockItemsCount || 0}
            color={lowStockColor}
          />
        </div>
      </div>

      {/* Variant Stock Breakdown */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="font-semibold text-stone-900 mb-4">Stock Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <span className="text-sm text-stone-600">Variant Stock</span>
            <span className="text-lg font-bold text-stone-900">
              {data.variantStock || 0} units
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Main Stock</span>
            <span className="text-lg font-bold text-stone-900">
              {data.mainStock || 0} units
            </span>
          </div>
        </div>
        {data.totalStock > 0 && (
          <div className="mt-4">
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-stone-900 h-full"
                style={{
                  width: `${
                    ((data.variantStock || 0) / (data.totalStock || 1)) * 100
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-stone-500">
              {(((data.variantStock || 0) / (data.totalStock || 1)) * 100).toFixed(1)}%
              {' '}
              variant stock
            </p>
          </div>
        )}
      </div>

      {/* Status Distribution */}
      {data.statusDistribution && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="font-semibold text-stone-900 mb-4">Product Status Distribution</h3>
          <div className="space-y-2">
            {Object.entries(data.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 capitalize">{status || 'Unknown'}</span>
                <span className="text-sm font-semibold text-stone-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-stone-500 text-right">
        Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
