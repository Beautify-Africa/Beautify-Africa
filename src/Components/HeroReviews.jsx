import { StarIcon } from './Icons';
import { SCATTERED_REVIEWS } from '../data/heroReviews';
import FadeIn from './FadeIn';

/**
 * Scattered review chips — desktop (absolute) + mobile (horizontal scroll)
 */
const HeroReviews = () => (
    <>
        {/* ── Desktop: absolutely-positioned chips ─────────── */}
        {SCATTERED_REVIEWS.map((review, idx) => (
            <FadeIn
                key={review.id}
                delay={1.2 + idx * 0.1}
                className="absolute flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-amber-100/50 z-20 hover:scale-105 transition-transform duration-300 cursor-default hidden sm:flex"
                style={{ top: review.top, left: review.left }}
            >
                <img
                    src={review.image}
                    alt={review.name}
                    className="w-8 h-8 rounded-full object-cover border border-stone-100"
                />
                <div className="flex flex-col">
                    <div className="flex gap-0.5 text-amber-500" aria-label="5 stars">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className="w-2.5 h-2.5" filled={true} />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-stone-600 leading-none mt-1">{review.name}</span>
                </div>
            </FadeIn>
        ))}

        {/* ── Mobile: horizontal scroll strip ──────────────── */}
        <div
            className="absolute bottom-24 left-0 right-0 z-20 sm:hidden px-4"
            aria-label="Customer reviews"
        >
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {SCATTERED_REVIEWS.map((review, idx) => (
                    <FadeIn
                        key={`mobile-${review.id}`}
                        delay={1.2 + idx * 0.1}
                        className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-amber-100/50 flex-shrink-0 snap-start"
                    >
                        <img
                            src={review.image}
                            alt={review.name}
                            className="w-8 h-8 rounded-full object-cover border border-stone-100"
                        />
                        <div className="flex flex-col">
                            <div className="flex gap-0.5 text-amber-500" aria-label="5 stars">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon key={i} className="w-2.5 h-2.5" filled={true} />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-stone-600 leading-none mt-1 whitespace-nowrap">
                                {review.name}
                            </span>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </div>
    </>
);

export default HeroReviews;
