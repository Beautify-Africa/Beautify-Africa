export default function OrderDetailFinancials({ activeOrder }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 text-xs">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Payment Method
        </p>
        <p className="mt-1 font-bold text-white">{activeOrder.payment.method}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Gateway Confirmation
        </p>
        <p className="mt-0.5 text-zinc-300">{activeOrder.payment.resultStatus || 'Pending'}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Intent Reference
        </p>
        <p className="mt-0.5 break-all text-[11px] font-mono text-zinc-500">
          {activeOrder.payment.stripePaymentIntentId || 'None'}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 font-mono text-xs">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Items Subtotal</span>
          <span className="text-zinc-200">{activeOrder.totals.items}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-zinc-400">
          <span>Shipping Fee</span>
          <span className="text-zinc-200">{activeOrder.totals.shipping}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-zinc-400">
          <span>VAT / Duties</span>
          <span className="text-zinc-200">{activeOrder.totals.tax}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 font-bold text-sm text-white">
          <span>Final Captured Total</span>
          <span className="text-amber-400 tabular-nums">{activeOrder.totals.total}</span>
        </div>
      </div>
    </div>
  );
}
