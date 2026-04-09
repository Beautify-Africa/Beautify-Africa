import { Link } from 'react-router-dom';
import OrderStatusBadge from './OrderStatusBadge';

const STAGE_LABELS = {
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

function fulfillmentTone(status) {
  if (status === 'delivered') return 'emerald';
  if (status === 'shipped') return 'stone';
  if (status === 'packed') return 'amber';
  return 'rose';
}

export default function ProfileOrderCard({ order }) {
  const fulfillmentStatus = order.fulfillmentStatus || 'processing';

  return (
    <article className="overflow-hidden rounded-sm border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-[#f5f4ef] px-6 py-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Order Placed</p>
          <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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

      <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 bg-stone-50 px-6 py-4">
        <OrderStatusBadge label={order.isPaid ? 'Payment Cleared' : 'Awaiting Payment'} tone={order.isPaid ? 'emerald' : 'amber'} />
        <OrderStatusBadge label={`Fulfillment: ${STAGE_LABELS[fulfillmentStatus] || 'Processing'}`} tone={fulfillmentTone(fulfillmentStatus)} />
        <OrderStatusBadge label={order.isDelivered ? 'Delivered' : 'In Progress'} tone={order.isDelivered ? 'emerald' : 'stone'} />
      </div>

      <div className="px-6 py-6">
        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Packaged Items</h4>
        <ul className="divide-y divide-stone-100">
          {order.orderItems.map((item, idx) => (
            <li key={`${order._id}-${idx}`} className="flex items-center gap-4 py-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover mix-blend-multiply" /> : null}
              </div>
              <div className="flex-grow">
                <Link to={`/shop/${item.product?._id || item.product}`} className="font-serif text-lg text-stone-900 transition-colors hover:text-amber-800">{item.name}</Link>
                <p className="mt-1 text-xs text-stone-500">Qty: {item.qty} × ${item.price.toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
