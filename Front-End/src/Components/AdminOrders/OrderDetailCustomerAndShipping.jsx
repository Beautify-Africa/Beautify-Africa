export default function OrderDetailCustomerAndShipping({ activeOrder }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 text-xs">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Customer Profile
        </p>
        <p className="mt-1 font-bold text-white text-sm">{activeOrder.customer.name}</p>
        <p className="mt-0.5 text-zinc-400 font-mono">
          {activeOrder.customer.shippingEmail || 'No shipping email'}
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Account Status
        </p>
        <p className="mt-0.5 text-zinc-300">
          {activeOrder.customer.accountEmail || 'Guest Account'}
        </p>
        {activeOrder.customer.accountCreatedAtLabel ? (
          <p className="mt-1 text-[11px] text-zinc-500">
            Customer since {activeOrder.customer.accountCreatedAtLabel}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Delivery Address
        </p>
        <p className="mt-1 font-bold text-white">
          {activeOrder.shippingAddress.firstName} {activeOrder.shippingAddress.lastName}
        </p>
        <p className="mt-0.5 text-zinc-300">{activeOrder.shippingAddress.address}</p>
        <p className="text-zinc-300">
          {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.zip}
        </p>
        <p className="text-zinc-400 font-semibold">{activeOrder.shippingAddress.country}</p>
        <p className="mt-2 text-[11px] font-mono text-zinc-500">{activeOrder.shippingAddress.email}</p>
      </div>
    </div>
  );
}
