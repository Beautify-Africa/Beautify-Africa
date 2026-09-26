import { useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import StatusBadge from '../AdminOrders/StatusBadge';

export default function AdminCustomerDetailDrawer({
  isOpen,
  customerData,
  isLoading,
  error,
  onClose,
}) {
  const focusTrapRef = useFocusTrap(isOpen);
  const customer = customerData?.customer || null;
  const addresses = customerData?.addresses || [];
  const orders = customerData?.orders || [];

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Customer detail"
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#0A0E17] text-zinc-100 border-l border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/90 bg-[#0E131F] px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Customer Intelligence
              </span>
              {customer?.isVip ? (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                  ★ VIP Client
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
              {customer?.name || 'Customer Dossier'}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-zinc-400">{customer?.email}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            Close &times;
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-12 text-center">
            <div>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Loading customer telemetry...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300">
              {error}
            </div>
          </div>
        ) : customer ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-[#0E131F] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Lifetime Value
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                  ${customer.totalSpend.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#0E131F] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Total Orders
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  {customer.ordersCount}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#0E131F] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Avg Order
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-amber-300">
                  ${customer.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Profile & Status Card */}
            <section className="rounded-xl border border-zinc-800 bg-[#0E131F] p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Relationship Profile
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-zinc-500">Account Classification:</span>
                  <div className="mt-1">
                    <StatusBadge tone={customer.isRegistered ? 'emerald' : 'stone'}>
                      {customer.isRegistered ? 'Registered Member' : 'Guest Buyer'}
                    </StatusBadge>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500">Newsletter Status:</span>
                  <div className="mt-1">
                    <StatusBadge tone={customer.isNewsletterSubscribed ? 'emerald' : 'stone'}>
                      {customer.isNewsletterSubscribed ? 'Active Subscriber' : 'Not Subscribed'}
                    </StatusBadge>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500">First Interaction / Registered:</span>
                  <p className="mt-1 font-mono text-zinc-300">
                    {customer.registeredAt
                      ? new Date(customer.registeredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'First checkout record'}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Contact Action:</span>
                  <p className="mt-1">
                    <a
                      href={`mailto:${customer.email}?subject=Beautify%20Africa%20Concierge`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                    >
                      <span>✉ Dispatch Email</span>
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Shipping Addresses */}
            <section className="rounded-xl border border-zinc-800 bg-[#0E131F] p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Known Shipping Destinations ({addresses.length})
              </p>
              {addresses.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">No physical addresses on file.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3 text-xs text-zinc-300"
                    >
                      <p className="font-semibold text-white">
                        {addr.firstName} {addr.lastName}
                      </p>
                      <p className="mt-0.5 text-zinc-400">
                        {addr.address}, {addr.city} {addr.zip}
                      </p>
                      <p className="text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
                        {addr.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Order History */}
            <section className="rounded-xl border border-zinc-800 bg-[#0E131F] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Order History ({orders.length})
                </p>
                <span className="text-[10px] font-mono text-zinc-500">Chronological</span>
              </div>

              {orders.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-500">No order history available.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                        <div>
                          <span className="font-mono text-xs font-bold text-amber-400">
                            #{ord.id.slice(-8).toUpperCase()}
                          </span>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {new Date(ord.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">
                            ${ord.totalPrice.toFixed(2)}
                          </span>
                          <StatusBadge tone={ord.isPaid ? 'emerald' : 'amber'}>
                            {ord.isPaid ? 'Paid' : 'Unpaid'}
                          </StatusBadge>
                          <StatusBadge tone={ord.isDelivered ? 'emerald' : 'amber'}>
                            {ord.fulfillmentStatus?.toUpperCase()}
                          </StatusBadge>
                        </div>
                      </div>

                      {/* Items list preview */}
                      <div className="mt-3 space-y-2">
                        {ord.items?.map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300 truncate max-w-xs">
                              {item.qty}x {item.name}
                            </span>
                            <span className="font-mono text-zinc-400">
                              ${Number(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
