import { useEffect, useState } from 'react';
import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';
import AdminShippingProgressTimeline from './AdminShippingProgressTimeline';
import OrderDetailCustomerAndShipping from './OrderDetailCustomerAndShipping';
import OrderDetailFinancials from './OrderDetailFinancials';
import OrderDetailItems from './OrderDetailItems';
import { useFocusTrap } from '../../hooks/useFocusTrap';

function DetailSection({ eyebrow, title, children }) {
  return (
    <section className="rounded-xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 shadow-md">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p>
      <h3 className="mt-1 text-base font-bold text-white tracking-tight">{title}</h3>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function DrawerLoading() {
  return (
    <div className="flex h-full items-center justify-center px-8 py-16 text-center">
      <div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Loading order details...
        </p>
      </div>
    </div>
  );
}

export default function AdminOrderDetailDrawer({
  isOpen,
  orderDetail,
  isLoading,
  error,
  busyActionKey,
  onClose,
  onRetry,
  onOrderAction,
  onAddOrderNote,
}) {
  const [noteText, setNoteText] = useState('');
  const focusTrapRef = useFocusTrap(isOpen);
  const activeOrder = orderDetail || null;
  const actions = Array.isArray(activeOrder?.availableActions) ? activeOrder.availableActions : [];
  const timeline = Array.isArray(activeOrder?.timeline) ? activeOrder.timeline : [];
  const noteBusy = activeOrder ? busyActionKey === `${activeOrder.id}:note` : false;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleWindowKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [isOpen, onClose]);

  async function handleAddNote() {
    if (!activeOrder?.id || !noteText.trim()) {
      return;
    }

    try {
      const wasSaved = await onAddOrderNote(activeOrder.id, noteText.trim());
      if (wasSaved) {
        setNoteText('');
      }
    } catch {
      // Workspace-level error handling already surfaces failures.
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130] flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <aside
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Order detail"
        className="flex h-full w-full max-w-[44rem] flex-col overflow-hidden bg-[#0A0E17] text-zinc-100 border-l border-zinc-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/90 bg-[#0E131F] px-6 py-5">
          <div>
            <span className="font-mono text-xs font-bold tracking-wider text-amber-400">
              {activeOrder?.reference || 'Order Inspection'}
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
              {activeOrder?.customer?.name || 'Loading order'}
            </h2>
            {activeOrder ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <StatusBadge tone={activeOrder.statusTone}>{activeOrder.status}</StatusBadge>
                <StatusBadge tone={activeOrder.isPaid ? 'emerald' : 'amber'}>
                  {activeOrder.paymentLabel}
                </StatusBadge>
                {activeOrder.customer?.isGuest ? (
                  <StatusBadge tone="stone">Guest Checkout</StatusBadge>
                ) : (
                  <StatusBadge tone="stone">Registered Customer</StatusBadge>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700/80 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            Close &times;
          </button>
        </div>

        {isLoading ? (
          <DrawerLoading />
        ) : error ? (
          <div className="px-6 py-8">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-300">
              <p>{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
              >
                Retry Load
              </button>
            </div>
          </div>
        ) : activeOrder ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <DetailSection eyebrow="Workflow" title="Fulfillment Status &amp; Timeline">
                <div className="mb-3.5">
                  <AdminShippingProgressTimeline order={activeOrder} />
                </div>

                <div className="grid gap-3 md:grid-cols-2 text-xs">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Next Milestone
                    </p>
                    <p className="mt-1 text-zinc-200 leading-relaxed font-medium">
                      {activeOrder.eta}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 font-mono text-[11px] space-y-1">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Audit Timestamps
                    </p>
                    <p className="text-zinc-300">Placed: {activeOrder.placedAtLabel}</p>
                    <p className="text-zinc-400">Updated: {activeOrder.updatedAtLabel || 'Pending'}</p>
                    <p className="text-zinc-400">Paid: {activeOrder.paidAtLabel || 'Unpaid'}</p>
                    <p className="text-zinc-400">Delivered: {activeOrder.deliveredAtLabel || 'In progress'}</p>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  {actions.length > 0 ? (
                    actions.map((action) => (
                      <ActionButton
                        key={`${activeOrder.id}:${action.type}`}
                        action={action}
                        isBusy={busyActionKey === `${activeOrder.id}:${action.type}`}
                        onClick={() => onOrderAction(activeOrder.id, action.type)}
                      />
                    ))
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      No manual actions available
                    </p>
                  )}
                </div>
              </DetailSection>

              <DetailSection eyebrow="Customer" title="Identity &amp; Shipping Destination">
                <OrderDetailCustomerAndShipping activeOrder={activeOrder} />
              </DetailSection>

              <DetailSection eyebrow="Financials" title="Payment Clearance &amp; Ledger">
                <OrderDetailFinancials activeOrder={activeOrder} />
              </DetailSection>

              <DetailSection eyebrow="Inventory" title="Manifest Items">
                <OrderDetailItems items={activeOrder.items} />
              </DetailSection>

              <DetailSection eyebrow="Operator Shift" title="Internal Communication Note">
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={3}
                  placeholder="Record fulfillment exceptions, customer requests, or courier details..."
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
                <div className="mt-2.5">
                  <button
                    type="button"
                    disabled={noteBusy || !noteText.trim()}
                    onClick={handleAddNote}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {noteBusy ? 'Recording Note...' : 'Record Note to Order'}
                  </button>
                </div>
              </DetailSection>

              <DetailSection eyebrow="Audit Trail" title="Complete Historical Timeline">
                {timeline.length > 0 ? (
                  <div className="space-y-2">
                    {timeline.map((entry, index) => (
                      <div
                        key={`${activeOrder.id}-detail-timeline-${index}`}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs"
                      >
                        <p className="font-semibold text-zinc-200 uppercase text-[10px] tracking-wider">
                          {entry.type === 'note'
                            ? 'Operator Internal Note'
                            : String(entry.action || 'action').replace(/_/g, ' ')}
                        </p>
                        {entry.note ? (
                          <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                            {entry.note}
                          </p>
                        ) : null}
                        <p className="mt-1.5 text-[10px] font-mono text-zinc-500">
                          {entry.adminName || 'Admin'} &bull; {entry.createdAtLabel || entry.createdAt}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No timeline events recorded yet.</p>
                )}
              </DetailSection>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-xs text-zinc-500">
            No order detail is currently available.
          </div>
        )}
      </aside>
    </div>
  );
}
