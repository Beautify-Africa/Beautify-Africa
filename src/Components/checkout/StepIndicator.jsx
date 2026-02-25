import { CHECKOUT_COPY } from '../../data/checkoutContent';

/**
 * Step progress indicator — 3 steps: Shipping → Payment → Confirmed
 */
export default function StepIndicator({ step }) {
    return (
        <div className="flex items-center justify-center mb-8" aria-label="Checkout progress">
            {CHECKOUT_COPY.steps.map((label, i) => {
                const num = i + 1;
                const isActive = step === num;
                const isDone = step > num;
                return (
                    <div key={label} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${isDone ? 'bg-amber-600 text-white' : isActive ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'
                                    }`}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                {isDone ? '✓' : num}
                            </div>
                            <span className={`text-[9px] uppercase tracking-[0.15em] mt-1 ${isActive ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
                                {label}
                            </span>
                        </div>
                        {i < CHECKOUT_COPY.steps.length - 1 && (
                            <div className={`w-16 h-px mx-2 mb-4 transition-colors duration-500 ${step > num ? 'bg-amber-600' : 'bg-stone-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
