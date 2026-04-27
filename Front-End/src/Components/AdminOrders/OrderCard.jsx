import { useState } from 'react';
import ActionButton from './ActionButton';
import StatusBadge from './StatusBadge';

export default function OrderCard({
  order,
  timeline,
  busyActionKey,
  onOrderAction,
  onAddOrderNote,
  onLoadOrderTimeline,
  onOpenOrderDetail,
}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const actions = Array.isArray(order.availableActions) ? order.availableActions : [];
  const [noteText, setNoteText] = useState('');
  const [timelineVisible, setTimelineVisible] = useState(false);

  const noteBusy = busyActionKey === `${order.id}:note`;

  async function handleAddNote() {
    if (!noteText.trim()) {
      return;
    }

    try {
      const wasSaved = await onAddOrderNote(order.id, noteText.trim());
      if (wasSaved) {
        setNoteText('');
      }
    } catch {
      // Workspace-level error handling already surfaces failures.
    }
  }

  function handleToggleTimeline() {
    const nextVisible = !timelineVisible;
    setTimelineVisible(nextVisible);

    if (nextVisible) {
      onLoadOrderTimeline(order.id);
    }
  }

  return (
    <article className="rounded-[1.6rem] border border-stone-200/80 bg-[#fffdf9] p-5 shadow-[0_14px_32px_rgba(28,25,23,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">{order.reference || order.id}</p>
          <h3 className="mt-2 font-serif text-2xl text-stone-900">{order.customer}</h3>
          <p className="mt-1 text-sm text-stone-500">{order.city} / {order.lane}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
          <button
            type="button"
            onClick={() => onOpenOrderDetail(order.id)}
            className="rounded-full border border-stone-300 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
          >
            Open detail
          </button>
        </div>
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

      {order.lastActivity ? (
        <div className="mt-4 rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm text-stone-600">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Last Activity</p>
          <p className="mt-2">{order.lastActivity.label}</p>
          <p className="text-xs text-stone-500">{order.lastActivity.at}</p>
        </div>
      ) : null}

      {order.latestNote ? (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Latest Internal Note</p>
          <p className="mt-2">{order.latestNote.text}</p>
          <p className="text-xs text-amber-700/80">{order.latestNote.by} / {order.latestNote.at}</p>
        </div>
      ) : null}

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

      <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Internal Note</p>
        <textarea
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          rows={3}
          placeholder="Add context for the next operator shift..."
          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={noteBusy || !noteText.trim()}
            onClick={() => { void handleAddNote(); }}
            className="rounded-full bg-stone-900 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {noteBusy ? 'Saving...' : 'Save Note'}
          </button>
          <button
            type="button"
            onClick={handleToggleTimeline}
            className="rounded-full border border-stone-300 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
          >
            {timelineVisible ? 'Hide Timeline' : 'View Timeline'}
          </button>
        </div>

        {timelineVisible ? (
          <div className="space-y-2 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700">
            {timeline.length > 0 ? (
              timeline.map((entry, index) => (
                <div key={`${order.id}-timeline-${index}`} className="rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2">
                  <p className="font-medium text-stone-800">
                    {entry.type === 'note' ? 'Note' : String(entry.action || 'action').replace(/_/g, ' ')}
                  </p>
                  {entry.note ? <p className="mt-1 text-stone-700">{entry.note}</p> : null}
                  <p className="mt-1 text-xs text-stone-500">{entry.adminName || 'Admin'} / {entry.createdAtLabel || entry.createdAt}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">No timeline events recorded yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
