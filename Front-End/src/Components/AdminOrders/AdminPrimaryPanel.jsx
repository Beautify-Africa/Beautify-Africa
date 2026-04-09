import FadeIn from '../Shared/FadeIn';
import DispatchCadenceCard from './DispatchCadenceCard';
import EmptyPanel from './EmptyPanel';
import OrderCard from './OrderCard';
import StatusBadge from './StatusBadge';

export default function AdminPrimaryPanel({ dashboard, busyActionKey, onOrderAction }) {
  const orders = dashboard.priorityOrders;
  const cadence = dashboard.dispatchCadence;

  return (
    <FadeIn className="h-full">
      <div className="flex h-full flex-col gap-6">
        <section className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur-sm md:p-7">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Priority queue</p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">Orders needing your eye first</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-stone-500">Use this board for the next physical action in payment, packing, courier, and delivery flow.</p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {orders.length > 0 ? (
              orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busyActionKey={busyActionKey}
                  onOrderAction={onOrderAction}
                />
              ))
            ) : (
              <EmptyPanel
                title="Priority queue empty"
                message="No orders currently require immediate manual attention."
              />
            )}
          </div>
        </section>

        <section className="flex-1 rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffdf9,#f5eee7)] p-6 shadow-[0_18px_48px_rgba(28,25,23,0.07)] md:p-7">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">Dispatch cadence</p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">A lower deck that keeps the column in motion</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {cadence.length > 0 ? cadence.map((item) => <DispatchCadenceCard key={item.label} {...item} />) : (
              <EmptyPanel
                title="No cadence data"
                message="Dispatch timing cards will appear once active fulfillment data is available."
              />
            )}
          </div>

          <div className="mt-5 rounded-[1.55rem] border border-stone-200/80 bg-white/80 px-5 py-5">
            <StatusBadge tone="amber">{dashboard.atelierNote.title}</StatusBadge>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">{dashboard.atelierNote.body}</p>
          </div>
        </section>
      </div>
    </FadeIn>
  );
}
