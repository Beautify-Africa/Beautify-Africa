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
      // Workspace-level error handling surfaces failures.
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
    <article className="rounded-xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider text-amber-400">
            {order.reference || order.id}
          </span>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-white">{order.customer}</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {order.city} &bull; {order.lane}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
          <button
            type="button"
            onClick={() => onOpenOrderDetail(order.id)}
            className="rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Open Detail
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Order Total
          </p>
          <p className="mt-1 font-mono font-bold text-base text-white tabular-nums">{order.total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Next Milestone
          </p>
          <p className="mt-1 text-xs text-zinc-300 leading-relaxed truncate">{order.eta}</p>
        </div>
      </div>

      {order.lastActivity ? (
        <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs text-zinc-400">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Last Activity
          </p>
          <p className="mt-1 text-zinc-300">{order.lastActivity.label}</p>
          <p className="mt-0.5 text-[11px] font-mono text-zinc-500">{order.lastActivity.at}</p>
        </div>
      ) : null}

      {order.latestNote ? (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Latest Internal Note
          </p>
          <p className="mt-1 text-amber-100 leading-relaxed">{order.latestNote.text}</p>
          <p className="mt-1 text-[10px] text-amber-400/70 font-mono">
            {order.latestNote.by} &bull; {order.latestNote.at}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Packed Items
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, idx) => (
            <span
              key={`${order.id}-item-${idx}`}
              className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-300 font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-800/80 pt-3">
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
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            No manual actions available
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2.5 border-t border-zinc-800/80 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Add Internal Operator Note
        </p>
        <textarea
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          rows={2}
          placeholder="Shift notes, handoff details, shipping exceptions..."
          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={noteBusy || !noteText.trim()}
            onClick={() => {
              void handleAddNote();
            }}
            className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {noteBusy ? 'Saving...' : 'Save Note'}
          </button>
          <button
            type="button"
            onClick={handleToggleTimeline}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {timelineVisible ? 'Hide Timeline' : 'View Timeline'}
          </button>
        </div>

        {timelineVisible ? (
          <div className="mt-2 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-300">
            {timeline.length > 0 ? (
              timeline.map((entry, index) => (
                <div
                  key={`${order.id}-timeline-${index}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-2.5"
                >
                  <p className="font-semibold text-zinc-200 uppercase text-[10px] tracking-wider">
                    {entry.type === 'note'
                      ? 'Operator Note'
                      : String(entry.action || 'action').replace(/_/g, ' ')}
                  </p>
                  {entry.note ? <p className="mt-1 text-zinc-300 text-xs">{entry.note}</p> : null}
                  <p className="mt-1 text-[10px] font-mono text-zinc-500">
                    {entry.adminName || 'Admin'} &bull; {entry.createdAtLabel || entry.createdAt}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No timeline events recorded yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
