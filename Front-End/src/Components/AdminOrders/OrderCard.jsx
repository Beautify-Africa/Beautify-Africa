import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order, busyActionKey, onOrderAction }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const actions = Array.isArray(order.availableActions) ? order.availableActions : [];

  return (
    <article className="rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_14px_32px_rgba(28,25,23,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">{order.reference || order.id}</p>
          <h3 className="mt-2 font-serif text-2xl text-stone-900">{order.customer}</h3>
          <p className="mt-1 text-sm text-stone-500">{order.city} · {order.lane}</p>
        </div>
        <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-100 bg-white px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Order Total</p>
          <p className="mt-2 font-serif text-xl text-stone-900">{order.total}</p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Next Milestone</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{order.eta}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Packed Items</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span
              key={`${order.id}-item-${idx}`}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-stone-100 pt-4">
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const actionKey = `${order.id}:${action.type}`;
              return (
                <ActionButton
                  key={actionKey}
                  action={action}
                  isBusy={busyActionKey === actionKey}
                  onClick={() => onOrderAction(order.id, action.type)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">No manual actions available</p>
        )}
      </div>
    </article>
  );
}
