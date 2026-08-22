import { StarIcon } from '../Shared/Icons';
import { SCATTERED_REVIEWS } from '../../data/heroReviews';
import FadeIn from '../Shared/FadeIn';
import { buildResponsiveImageProps } from '../../utils/imageUtils';

const reviewChipClass =
    'items-center gap-3 rounded-full border border-white/70 bg-white/95 px-4 py-2 shadow-[0_18px_50px_rgba(41,37,36,0.18)] ring-1 ring-amber-900/5 backdrop-blur-xl transition-transform duration-300 hover:scale-105';
const reviewAvatarClass = 'h-8 w-8 shrink-0 rounded-full border border-stone-100 object-cover';
const reviewBodyClass = 'flex min-w-0 flex-col items-start leading-none';
const reviewStarsClass = 'flex gap-0.5 text-amber-500';
const reviewNameClass = 'mt-1 whitespace-nowrap text-[10px] font-bold tracking-normal text-stone-700';

/**
 * Scattered review chips: desktop (absolute) + mobile (horizontal scroll)
 */
const HeroReviews = () => (
    <>
        {/* Desktop: absolutely-positioned chips */}
        {SCATTERED_REVIEWS.filter((r) => !r.inline).map((review, idx) => (
            (() => {
                const imageProps = buildResponsiveImageProps(review.image, {
                    widths: [64, 96, 128],
                    sizes: '32px',
                });

                return (
                    <FadeIn
                        key={review.id}
                        delay={1.2 + idx * 0.1}
                        aria-label={`5 star review from ${review.name}`}
                        className={`absolute z-20 hidden min-w-[8.75rem] cursor-default sm:flex ${reviewChipClass}`}
                        style={{ top: review.top, left: review.left }}
                    >
                        <img
                            src={imageProps.src}
                            srcSet={imageProps.srcSet}
                            sizes={imageProps.sizes}
                            alt={review.name}
                            className={reviewAvatarClass}
                            loading="lazy"
                            decoding="async"
                            width="32"
                            height="32"
                        />
                        <div className={reviewBodyClass}>
                            <div className={reviewStarsClass} aria-hidden>
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon key={i} className="h-2.5 w-2.5" filled={true} />
                                ))}
                            </div>
                            <span className={reviewNameClass}>{review.name}</span>
                        </div>
                    </FadeIn>
                );
            })()
        ))}

        {/* Mobile: horizontal scroll strip */}
        <div
            className="absolute bottom-6 left-0 right-0 z-20 px-4 sm:hidden"
            aria-label="Customer reviews"
        >
            <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                {SCATTERED_REVIEWS.filter((r) => !r.inline).map((review, idx) => (
                    (() => {
                        const imageProps = buildResponsiveImageProps(review.image, {
                            widths: [64, 96, 128],
                            sizes: '32px',
                        });

                        return (
                            <FadeIn
                                key={`mobile-${review.id}`}
                                delay={1.2 + idx * 0.1}
                                aria-label={`5 star review from ${review.name}`}
                                className={`flex min-w-[8.75rem] flex-shrink-0 snap-start ${reviewChipClass}`}
                            >
                                <img
                                    src={imageProps.src}
                                    srcSet={imageProps.srcSet}
                                    sizes={imageProps.sizes}
                                    alt={review.name}
                                    className={reviewAvatarClass}
                                    loading="lazy"
                                    decoding="async"
                                    width="32"
                                    height="32"
                                />
                                <div className={reviewBodyClass}>
                                    <div className={reviewStarsClass} aria-hidden>
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className="h-2.5 w-2.5" filled={true} />
                                        ))}
                                    </div>
                                    <span className={reviewNameClass}>{review.name}</span>
                                </div>
                            </FadeIn>
                        );
                    })()
                ))}
            </div>
        </div>
    </>
);

export default HeroReviews;
