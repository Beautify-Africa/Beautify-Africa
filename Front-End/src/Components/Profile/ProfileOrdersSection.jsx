import { Link } from 'react-router-dom';

function OrderStatusBadge({ active, activeLabel, inactiveLabel, inactiveTone = 'stone' }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center justify-center rounded-full border p-1 ${
          active
            ? 'border-emerald-200 bg-emerald-50'
            : inactiveTone === 'amber'
              ? 'border-amber-200 bg-amber-50'
              : 'border-stone-200 bg-stone-50'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            active
              ? 'bg-emerald-500'
              : inactiveTone === 'amber'
                ? 'bg-amber-500'
                : 'bg-stone-300'
          }`}
        ></span>
      </span>
      <span className="text-xs font-bold uppercase tracking-widest text-stone-700">
        {active ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}

function OrderCard({ order }) {
  return (
    <div className="overflow-hidden rounded-sm border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-[#f5f4ef] px-6 py-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Order Placed</p>
          <p className="text-sm font-medium">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Total Amount</p>
          <p className="text-sm font-bold text-stone-900">${order.totalPrice.toFixed(2)}</p>
        </div>
        <div className="flex-grow text-right md:flex-grow-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Order #</p>
          <p className="text-xs text-stone-500">{order._id}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-6">
        <OrderStatusBadge
          active={order.isPaid}
          activeLabel="Payment Cleared"
          inactiveLabel="Awaiting Payment"
          inactiveTone="amber"
        />

        <OrderStatusBadge
          active={order.isDelivered}
          activeLabel="Delivered"
          inactiveLabel="Processing Cargo"
        />
      </div>

      <div className="px-6 py-6">
        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Packaged Items</h4>
        <ul className="divide-y divide-stone-100">
          {order.orderItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 py-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover mix-blend-multiply"
                  />
                )}
              </div>
              <div className="flex-grow">
                <Link
                  to={`/shop/${item.product}`}
                  className="font-serif text-lg text-stone-900 transition-colors hover:text-amber-800"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-xs text-stone-500">
                  Qty: {item.qty} &times; ${item.price.toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ProfileOrdersSection({ isLoadingOrders, ordersError, orders }) {
  return (
    <section className="lg:col-span-7">
      <h2 className="mb-8 font-serif text-3xl">Purchase History</h2>

      {isLoadingOrders ? (
        <div className="flex justify-center rounded-sm border border-stone-200 bg-white py-12 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Loading your history...
          </p>
        </div>
      ) : ordersError ? (
        <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {ordersError}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-sm border border-stone-200 bg-white p-12 text-center shadow-sm">
          <p className="mb-3 font-serif text-xl text-stone-900">No active orders</p>
          <p className="mx-auto mb-6 max-w-sm text-sm text-stone-500">
            You haven't placed any orders with Beautify Africa yet. Discover our latest formulations in the shop.
          </p>
          <Link
            to="/shop"
            className="inline-block border border-stone-900 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
          >
            Explore Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}
