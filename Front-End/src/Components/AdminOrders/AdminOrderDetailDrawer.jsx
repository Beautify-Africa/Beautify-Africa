import { useEffect, useState } from 'react';
import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';
import { useFocusTrap } from '../../hooks/useFocusTrap';

function DetailSection({ eyebrow, title, children }) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">{eyebrow}</p>
      <h3 className="mt-2 font-serif text-2xl text-stone-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DrawerLoading() {
  return (
    <div className="flex h-full items-center justify-center px-8 py-16 text-center">
      <div>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-500">Loading order detail...</p>
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
    <div className="fixed inset-0 z-[130] flex justify-end bg-stone-950/45" onClick={onClose}>
      <aside
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Order detail"
        className="flex h-full w-full max-w-[44rem] flex-col overflow-hidden bg-[#f7f2ea] shadow-[-20px_0_60px_rgba(28,25,23,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white/85 px-6 py-5 backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">
              {activeOrder?.reference || 'Order detail'}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-stone-900">
              {activeOrder?.customer?.name || 'Loading order'}
            </h2>
            {activeOrder ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge tone={activeOrder.statusTone}>{activeOrder.status}</StatusBadge>
                <StatusBadge tone={activeOrder.isPaid ? 'emerald' : 'amber'}>
                  {activeOrder.paymentLabel}
                </StatusBadge>
                {activeOrder.customer?.isGuest ? (
                  <StatusBadge tone="stone">Guest checkout</StatusBadge>
                ) : (
                  <StatusBadge tone="stone">Registered account</StatusBadge>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <DrawerLoading />
        ) : error ? (
          <div className="px-6 py-8">
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-5 text-sm text-rose-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-full border border-rose-300 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700"
              >
                Retry detail load
              </button>
            </div>
          </div>
        ) : activeOrder ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <DetailSection eyebrow="Workflow" title="Next steps and activity">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Next milestone</p>
                      <p className="mt-2 text-sm leading-relaxed text-stone-700">{activeOrder.eta}</p>
                    </div>
                    <div className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Timestamps</p>
                      <p className="mt-2 text-sm text-stone-700">Placed: {activeOrder.placedAtLabel}</p>
                      <p className="mt-1 text-sm text-stone-700">Updated: {activeOrder.updatedAtLabel || 'Not yet available'}</p>
                      <p className="mt-1 text-sm text-stone-700">Paid: {activeOrder.paidAtLabel || 'Not yet paid'}</p>
                      <p className="mt-1 text-sm text-stone-700">Delivered: {activeOrder.deliveredAtLabel || 'Not delivered'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
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
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">No manual actions available</p>
                    )}
                  </div>
                </DetailSection>

                <DetailSection eyebrow="Customer" title="Customer and shipping context">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4 text-sm text-stone-700">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Customer</p>
                      <p className="mt-2 font-medium text-stone-900">{activeOrder.customer.name}</p>
                      <p className="mt-1">{activeOrder.customer.shippingEmail || 'No shipping email'}</p>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Account</p>
                      <p className="mt-2">{activeOrder.customer.accountEmail || 'Guest checkout'}</p>
                      {activeOrder.customer.accountCreatedAtLabel ? (
                        <p className="mt-1 text-stone-500">Customer since {activeOrder.customer.accountCreatedAtLabel}</p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4 text-sm text-stone-700">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Shipping address</p>
                      <p className="mt-2 font-medium text-stone-900">
                        {activeOrder.shippingAddress.firstName} {activeOrder.shippingAddress.lastName}
                      </p>
                      <p className="mt-1">{activeOrder.shippingAddress.address}</p>
                      <p className="mt-1">
                        {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.zip}
                      </p>
                      <p className="mt-1">{activeOrder.shippingAddress.country}</p>
                      <p className="mt-3 text-stone-500">{activeOrder.shippingAddress.email}</p>
                    </div>
                  </div>
                </DetailSection>

                <DetailSection eyebrow="Payment" title="Payment and totals snapshot">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4 text-sm text-stone-700">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Payment method</p>
                      <p className="mt-2 font-medium text-stone-900">{activeOrder.payment.method}</p>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Gateway status</p>
                      <p className="mt-2">{activeOrder.payment.resultStatus || 'Pending'}</p>
                      <p className="mt-1 text-stone-500">{activeOrder.payment.emailAddress || 'No gateway email'}</p>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Stripe intent</p>
                      <p className="mt-2 break-all text-xs text-stone-500">{activeOrder.payment.stripePaymentIntentId || 'Not available'}</p>
                    </div>

                    <div className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4 text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span>Items</span>
                        <span>{activeOrder.totals.items}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Shipping</span>
                        <span>{activeOrder.totals.shipping}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Tax</span>
                        <span>{activeOrder.totals.tax}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4 font-semibold text-stone-900">
                        <span>Total</span>
                        <span>{activeOrder.totals.total}</span>
                      </div>
                    </div>
                  </div>
                </DetailSection>

                <DetailSection eyebrow="Items" title="Order contents">
                  <div className="space-y-3">
                    {activeOrder.items.map((item, index) => (
                      <div
                        key={`${item.productId || item.name}-${index}`}
                        className="flex items-start gap-4 rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl border border-stone-200 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                            No image
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-900">{item.name}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            {item.productBrand || 'Unknown brand'} / {item.productCategory || 'Uncategorized'}
                          </p>
                          <p className="mt-2 text-sm text-stone-600">
                            Qty {item.qty} / Unit {item.unitPrice} / Line {item.lineTotal}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                <DetailSection eyebrow="Internal note" title="Shift handoff">
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    rows={4}
                    placeholder="Add customer, courier, or fulfillment context for the next operator..."
                    className="w-full rounded-2xl border border-stone-200 bg-[#fffdf9] px-4 py-3 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                  />
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={noteBusy || !noteText.trim()}
                      onClick={handleAddNote}
                      className="rounded-full bg-stone-900 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {noteBusy ? 'Saving...' : 'Save internal note'}
                    </button>
                  </div>
                </DetailSection>

                <DetailSection eyebrow="Timeline" title="Admin activity trail">
                  {timeline.length > 0 ? (
                    <div className="space-y-3">
                      {timeline.map((entry, index) => (
                        <div
                          key={`${activeOrder.id}-detail-timeline-${index}`}
                          className="rounded-2xl border border-stone-100 bg-[#fffdf9] px-4 py-4"
                        >
                          <p className="font-medium text-stone-900">
                            {entry.type === 'note'
                              ? 'Internal note'
                              : String(entry.action || 'action').replace(/_/g, ' ')}
                          </p>
                          {entry.note ? <p className="mt-2 text-sm leading-relaxed text-stone-700">{entry.note}</p> : null}
                          <p className="mt-2 text-xs text-stone-500">
                            {entry.adminName || 'Admin'} / {entry.createdAtLabel || entry.createdAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">No timeline events recorded yet.</p>
                  )}
                </DetailSection>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-sm text-stone-500">No order detail is currently available.</div>
        )}
      </aside>
    </div>
  );
}
