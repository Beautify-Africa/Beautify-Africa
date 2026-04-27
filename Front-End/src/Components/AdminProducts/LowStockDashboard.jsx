import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchLowStockItems, triggerLowStockNotification } from '../../services/adminApi';
import AdminFlashNotice from '../AdminShared/AdminFlashNotice';

export default function LowStockDashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [threshold, setThreshold] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadLowStockItems = useCallback(
    async (page = 1) => {
      if (!token) return;

      try {
        setIsLoading(true);
        setError('');
        const data = await fetchLowStockItems(
          {
            threshold,
            limit: pagination.limit,
            skip: (page - 1) * pagination.limit,
          },
          token
        );

        setItems(data.data || []);
        setPagination({
          page,
          limit: data.limit || pagination.limit,
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 0,
        });
      } catch (err) {
        console.error('Failed to load low stock items:', err);
        setError(err.message || 'Failed to load low stock items');
      } finally {
        setIsLoading(false);
      }
    },
    [token, threshold, pagination.limit]
  );

  useEffect(() => {
    loadLowStockItems(1);
  }, [loadLowStockItems]);

  const handleThresholdChange = (e) => {
    const newThreshold = parseInt(e.target.value, 10);
    if (newThreshold > 0) {
      setThreshold(newThreshold);
    }
  };

  const handleNotifyAdmins = async () => {
    if (!token) return;

    try {
      setIsSending(true);
      setError('');
      const result = await triggerLowStockNotification(threshold, token);
      setSuccessMessage(
        `${result.jobsQueued} notification(s) queued for ${result.itemsNotified} item(s) below threshold`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to send notification:', err);
      setError(err.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-50', label: 'OUT OF STOCK' };
    if (stock < threshold / 2) return { color: 'text-red-500', bg: 'bg-red-100', label: 'CRITICAL' };
    return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'LOW' };
  };

  return (
    <div className="space-y-6">
      {error && (
        <AdminFlashNotice type="error" message={error} onDismiss={() => setError('')} />
      )}
      {successMessage && (
        <AdminFlashNotice type="success" message={successMessage} onDismiss={() => setSuccessMessage('')} />
      )}

      {/* Controls */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Low Stock Threshold
          </label>
          <div className="flex gap-3 items-end">
            <input
              type="number"
              value={threshold}
              onChange={handleThresholdChange}
              min="1"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <button
              onClick={handleNotifyAdmins}
              disabled={isSending || items.length === 0}
              className="rounded-lg bg-stone-900 px-6 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {isSending ? 'Sending...' : 'Notify Admins'}
            </button>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Items with stock below {threshold} units will be shown below
          </p>
        </div>
      </div>

      {/* Summary */}
      {pagination.totalCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            ⚠️ {pagination.totalCount} item(s) with stock below {threshold} units
          </p>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-8 text-center">
          <p className="text-stone-600">
            {threshold === 10
              ? 'No items with low stock. Everything looks good!'
              : `No items below ${threshold} units.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const stockStatus = getStockStatus(item.stock);
            return (
              <div
                key={`${item.productId}-${item.variantId || 'main'}`}
                className="rounded-lg border border-stone-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{item.productName}</p>
                    <p className="text-sm text-stone-600 mt-1">SKU: {item.sku}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-stone-100 px-2 py-1 rounded">
                        {item.type === 'variant' ? 'Variant' : 'Main'}
                      </span>
                      <span className="text-xs bg-stone-100 px-2 py-1 rounded capitalize">
                        {item.status || 'published'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-stone-600 uppercase">Stock Level</p>
                      <p className={`text-2xl font-bold mt-1 ${stockStatus.color}`}>
                        {item.stock}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold text-white ${
                          stockStatus.label === 'OUT OF STOCK'
                            ? 'bg-red-600'
                            : stockStatus.label === 'CRITICAL'
                              ? 'bg-red-500'
                              : 'bg-amber-600'
                        }`}
                      >
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-600">
            Page {pagination.page} of {pagination.totalPages} •{' '}
            {pagination.totalCount} total items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadLowStockItems(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="px-3 py-1 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - 2) + i;
              if (pageNum > pagination.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => loadLowStockItems(pageNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    pageNum === pagination.page
                      ? 'bg-stone-900 text-white'
                      : 'border border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => loadLowStockItems(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isLoading}
              className="px-3 py-1 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
