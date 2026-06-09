import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchLowStockItems, fetchReorderPlan, triggerLowStockNotification } from '../../services/adminApi';

function getStockStatus(stock, threshold) {
  if (stock === 0) return { color: 'text-red-600', label: 'OUT OF STOCK' };
  if (stock < threshold / 2) return { color: 'text-red-500', label: 'CRITICAL' };
  return { color: 'text-amber-600', label: 'LOW' };
}

export default function useLowStockDashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 0 });
  const [threshold, setThreshold] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReorderPlan, setIsLoadingReorderPlan] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExportingPlan, setIsExportingPlan] = useState(false);
  const [error, setError] = useState('');
  const [planError, setPlanError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reorderPlan, setReorderPlan] = useState(null);

  const loadLowStockItems = useCallback(async (page = 1) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await fetchLowStockItems({ threshold, limit: pagination.limit, skip: (page - 1) * pagination.limit }, token);
      setItems(data.data || []);
      setPagination({
        page,
        limit: data.limit || pagination.limit,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (fetchError) {
      console.error('Failed to load low stock items:', fetchError);
      setError(fetchError.message || 'Failed to load low stock items');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, threshold, token]);

  const loadReorderPlan = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoadingReorderPlan(true);
      setPlanError('');
      const data = await fetchReorderPlan({ threshold, leadTimeDays: 14, windowDays: 30 }, token);
      setReorderPlan(data);
    } catch (fetchError) {
      console.error('Failed to load reorder plan:', fetchError);
      setPlanError(fetchError.message || 'Failed to load reorder recommendations');
    } finally {
      setIsLoadingReorderPlan(false);
    }
  }, [threshold, token]);

  useEffect(() => {
    loadLowStockItems(1);
    loadReorderPlan();
  }, [loadLowStockItems, loadReorderPlan]);

  const handleThresholdChange = useCallback((event) => {
    const nextThreshold = Number.parseInt(event.target.value, 10);
    if (Number.isInteger(nextThreshold) && nextThreshold > 0) setThreshold(nextThreshold);
  }, []);

  const handleNotifyAdmins = useCallback(async () => {
    if (!token) return;

    try {
      setIsSending(true);
      setError('');
      const result = await triggerLowStockNotification(threshold, token);
      setSuccessMessage(`${result.jobsQueued} notification(s) queued for ${result.itemsNotified} item(s) below threshold`);
      window.setTimeout(() => setSuccessMessage(''), 5000);
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
      setError(notifyError.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  }, [threshold, token]);

  const handleDownloadPlanCsv = useCallback(async () => {
    if (!reorderPlan?.csv) return;

    try {
      setIsExportingPlan(true);
      const blob = new Blob([reorderPlan.csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = reorderPlan.filename || 'beautify-africa-reorder-plan.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Reorder plan CSV downloaded.');
      window.setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setIsExportingPlan(false);
    }
  }, [reorderPlan]);

  return {
    items,
    pagination,
    threshold,
    isLoading,
    isLoadingReorderPlan,
    isSending,
    isExportingPlan,
    error,
    planError,
    successMessage,
    reorderPlan,
    setError,
    setPlanError,
    setSuccessMessage,
    handleThresholdChange,
    handleNotifyAdmins,
    handleDownloadPlanCsv,
    loadLowStockItems,
    getStockStatus,
  };
}