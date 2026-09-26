import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import {
  TRACKING_STAGES,
  getTrackingStageIndex,
  resolveTrackingStatus,
} from '../Tracking/trackingStages';

function stepClasses(completed, current) {
  if (completed) {
    return 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
  }
  if (current) {
    return 'border-amber-400 bg-amber-400/20 text-amber-300 ring-4 ring-amber-400/10';
  }
  return 'border-zinc-700 bg-zinc-900/60 text-zinc-500';
}

export default function AdminShippingProgressTimeline({ order }) {
  const MotionDiv = motion.div;
  const prefersReducedMotion = usePrefersReducedMotion();
  const status = resolveTrackingStatus(order);
  const currentStageIndex = getTrackingStageIndex(status);
  const completion = Math.round((currentStageIndex / (TRACKING_STAGES.length - 1)) * 100);
  const currentStage = TRACKING_STAGES[currentStageIndex];

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/60 p-4 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Fulfillment Stage
          </span>
          <p className="mt-0.5 text-sm font-bold text-white tracking-tight">
            {currentStage.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-400">
            {completion}%
          </span>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              order?.isDelivered
                ? 'bg-emerald-400'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <MotionDiv
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400"
          initial={false}
          animate={{ width: `${completion}%` }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }
          }
        />
      </div>

      {/* 4-Step Stepper */}
      <ol className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TRACKING_STAGES.map((stage, index) => {
          const completed = index < currentStageIndex;
          const current = index === currentStageIndex;

          return (
            <li
              key={stage.key}
              className={`rounded-lg border p-2.5 transition-colors ${
                current
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : completed
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-zinc-800/80 bg-zinc-900/40 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${stepClasses(
                    completed,
                    current
                  )}`}
                >
                  {completed ? '✓' : index + 1}
                </span>
                <span
                  className={`text-[11px] font-semibold truncate ${
                    current
                      ? 'text-amber-300 font-bold'
                      : completed
                      ? 'text-emerald-300'
                      : 'text-zinc-400'
                  }`}
                  title={stage.label}
                >
                  {stage.label}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-400 line-clamp-1">
                {stage.key.toUpperCase()}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
