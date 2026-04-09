import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { TRACKING_STAGES, getTrackingStageIndex, resolveTrackingStatus } from './trackingStages';

function stepTone(completed, current) {
  if (completed || current) return 'border-amber-700 bg-amber-700 text-white';
  return 'border-stone-300 bg-white text-stone-400';
}

export default function ShippingProgressTimeline({ order }) {
  const MotionDiv = motion.div;
  const MotionSpan = motion.span;
  const prefersReducedMotion = usePrefersReducedMotion();
  const status = resolveTrackingStatus(order);
  const currentStageIndex = getTrackingStageIndex(status);
  const completion = (currentStageIndex / (TRACKING_STAGES.length - 1)) * 100;
  const currentStage = TRACKING_STAGES[currentStageIndex];

  return (
    <section className="rounded-sm border border-stone-200 bg-[#fbfaf7] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Shipping Progress</p>
          <p className="mt-1 font-serif text-xl text-stone-900">{currentStage.label}</p>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">{Math.round(completion)}% Complete</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
        <MotionDiv
          className="h-full bg-gradient-to-r from-amber-700 via-amber-600 to-emerald-600"
          initial={false}
          animate={{ width: `${completion}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.75, ease: 'easeOut' }}
        />
      </div>

      <ul className="mt-6 space-y-4">
        {TRACKING_STAGES.map((stage, index) => {
          const completed = index < currentStageIndex;
          const current = index === currentStageIndex;
          const connectorTone = completed ? 'bg-amber-600' : 'bg-stone-200';

          return (
            <li key={stage.key} className="relative pl-10">
              {index < TRACKING_STAGES.length - 1 ? (
                <span
                  className={`absolute left-[11px] top-7 h-[calc(100%+0.65rem)] w-[2px] ${connectorTone}`}
                  aria-hidden="true"
                />
              ) : null}

              <MotionSpan
                className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${stepTone(completed, current)}`}
                animate={
                  current && !prefersReducedMotion
                    ? {
                        scale: [1, 1.12, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(180, 83, 9, 0.28)',
                          '0 0 0 8px rgba(180, 83, 9, 0)',
                          '0 0 0 0 rgba(180, 83, 9, 0)',
                        ],
                      }
                    : { scale: 1, boxShadow: '0 0 0 0 rgba(180, 83, 9, 0)' }
                }
                transition={
                  current && !prefersReducedMotion
                    ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0 }
                }
              >
                {index + 1}
              </MotionSpan>

              <p className={`text-sm font-bold uppercase tracking-[0.12em] ${current || completed ? 'text-stone-900' : 'text-stone-500'}`}>
                {stage.label}
              </p>
              <p className="mt-1 text-sm text-stone-500">{stage.detail}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
