import { Link } from 'react-router-dom';
import ShippingProgressTimeline from './ShippingProgressTimeline';
import { getTrackingStage } from './trackingStages';
import { buildResponsiveImageProps } from '../../utils/imageUtils';

function statusPill(isActive, label) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-stone-200 bg-stone-50 text-stone-700'
      }`}
    >
      {label}
    </span>
  );
}

function getPublicOrderCode(orderId) {
  return orderId.slice(-8).toUpperCase();
}

export default function TrackOrderCard({ order }) {
  const { stage } = getTrackingStage(order);

  return (
    <article className="overflow-hidden rounded-sm border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-[#f4f1eb] px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Tracking Code</p>
            <p className="mt-1 font-serif text-2xl text-stone-900">#{getPublicOrderCode(order._id)}</p>
            <p className="mt-1 text-xs text-stone-500">
              Ordered on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Order Total</p>
            <p className="mt-1 text-xl font-bold text-stone-900">${order.totalPrice.toFixed(2)}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">{stage.label}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statusPill(order.isPaid, order.isPaid ? 'Payment Cleared' : 'Awaiting Payment')}
          {statusPill(order.isDelivered, order.isDelivered ? 'Delivered' : 'In Transit')}
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <ShippingProgressTimeline order={order} />

        <section>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Items In Shipment</h3>
          <ul className="divide-y divide-stone-100 rounded-sm border border-stone-100">
            {order.orderItems.map((item, idx) => (
              <li key={`${order._id}-${idx}`} className="flex items-center gap-4 px-4 py-4">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border border-stone-200 bg-stone-100">
                  {item.image ? (
                    <img
                      {...buildResponsiveImageProps(item.image, {
                        widths: [160, 240, 320],
                        sizes: '56px',
                      })}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="flex-grow">
                  <Link to={`/shop/${item.product?._id || item.product}`} className="font-serif text-lg text-stone-900 hover:text-amber-800">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">Qty: {item.qty} x ${item.price.toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
