import { useMemo } from 'react';
import { HERO_BACKGROUND, HERO_CONFIG } from '../../data/heroImages';

/** Generates gold-dust particle data once per mount */
const generateParticles = (count) =>
    [...Array(count)].map((_, i) => ({
        id: i,
        size: Math.random() * 4 + 1,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * -20,
        duration: Math.random() * 10 + 10,
    }));

/**
 * Full-section background image + dark gradient overlay + gold dust particles
 */
const HeroBackground = ({ parallaxTransform }) => {
    const goldDust = useMemo(() => generateParticles(HERO_CONFIG.particleCount), []);

    return (
        <>
            {/* Background image */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ transform: parallaxTransform }}
                aria-hidden="true"
            >
                <img
                    src={HERO_BACKGROUND.src}
                    alt=""
                    className="w-full h-full object-cover object-center"
                    style={{ opacity: 1 }}
                    fetchpriority="high"
                    loading="eager"
                    decoding="async"
                />
            </div>

            {/* Warm left-side wash — keeps text legible without darkening the image */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background:
                        'linear-gradient(to right, rgba(250,247,242,0.55) 0%, rgba(250,247,242,0.25) 45%, rgba(250,247,242,0) 65%)',
                }}
                aria-hidden="true"
            />

            {/* Gold dust particles */}
            <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
                {goldDust.map((p) => (
                    <span
                        key={p.id}
                        className="absolute bg-amber-400/30 rounded-full blur-[1px] animate-shimmer"
                        style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            top: `${p.top}%`,
                            left: `${p.left}%`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                        }}
                    />
                ))}
            </div>
        </>
    );
};

export default HeroBackground;

