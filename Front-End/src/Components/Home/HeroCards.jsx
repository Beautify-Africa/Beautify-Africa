import { HERO_CARDS } from '../../data/heroImages';

/**
 * Desktop card stack + mobile carousel for the Hero section
 */
const HeroCards = ({ hasInteracted }) => (
    <>
        {/* ── Desktop Card Stack ─────────────────────────── */}
        <aside
            className="absolute top-0 right-0 w-[55%] h-full z-20 hidden lg:block pointer-events-none"
            aria-label="Featured product images"
        >
            {/* Card 1: Serum Bottle */}
            <figure className="absolute top-[8%] right-[8%] w-[200px] aspect-[3/4] z-20 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:-rotate-2 rotate-[12deg] shadow-2xl pointer-events-auto">
                <div className="w-full h-full overflow-hidden rounded-sm bg-stone-100">
                    <img src={HERO_CARDS[0].src} alt={HERO_CARDS[0].alt}
                        className="w-full h-full object-cover opacity-95" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-amber-900/5 mix-blend-multiply" />
                </div>
                <figcaption className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-md px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-stone-900 shadow-sm border border-stone-100">
                    {HERO_CARDS[0].label}
                </figcaption>
            </figure>

            {/* Card 2: Cream Texture */}
            <figure className="absolute top-[52%] right-[36%] w-[160px] aspect-square z-10 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:rotate-2 rotate-[-15deg] shadow-xl pointer-events-auto">
                <div className="w-full h-full overflow-hidden rounded-sm bg-stone-200 border-4 border-white shadow-inner">
                    <img src={HERO_CARDS[1].src} alt={HERO_CARDS[1].alt}
                        className="w-full h-full object-cover scale-110" loading="lazy" decoding="async" />
                </div>
                <figcaption className="absolute -top-3 -left-3 bg-stone-900 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest">
                    {HERO_CARDS[1].label}
                </figcaption>
            </figure>

            {/* Card 3: Model Portrait (Main) */}
            <figure className="absolute bottom-[8%] right-[6%] w-[340px] aspect-[4/5] z-30 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:rotate-0 rotate-[-5deg] shadow-2xl pointer-events-auto">
                <div className="w-full h-full overflow-hidden rounded-sm bg-white">
                    <img src={HERO_CARDS[2].src} alt={HERO_CARDS[2].alt}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2s]"
                        loading="eager" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/10 to-transparent mix-blend-overlay" />
                </div>
                <figcaption className="absolute bottom-6 -left-6 bg-white/95 backdrop-blur-md px-6 py-3 shadow-lg border border-stone-100">
                    <span className="block text-[8px] text-stone-400 uppercase tracking-widest mb-1">{HERO_CARDS[2].sublabel}</span>
                    <span className="block text-sm font-serif italic text-stone-900">{HERO_CARDS[2].label}</span>
                </figcaption>
                <span className="absolute top-6 -right-4 bg-stone-900 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-sm">
                    {HERO_CARDS[2].badge}
                </span>
            </figure>

            {/* Card 4: Gold Oil Texture */}
            <figure className="absolute top-[20%] right-[32%] w-[150px] aspect-[2/3] z-10 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:-rotate-3 rotate-[8deg] shadow-lg pointer-events-auto opacity-90">
                <div className="w-full h-full overflow-hidden rounded-sm bg-stone-300">
                    <img src={HERO_CARDS[3].src} alt={HERO_CARDS[3].alt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-stone-900/5" />
                </div>
            </figure>

            {/* Card 5: Makeup Powder */}
            <figure className="absolute bottom-[35%] right-[24%] w-[170px] aspect-square z-40 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-110 hover:rotate-6 rotate-[20deg] shadow-2xl pointer-events-auto">
                <div className="w-full h-full overflow-hidden rounded-sm bg-stone-100 p-1.5 bg-white">
                    <div className="w-full h-full overflow-hidden bg-stone-200">
                        <img src={HERO_CARDS[4].src} alt={HERO_CARDS[4].alt} className="w-full h-full object-cover" />
                    </div>
                </div>
                <figcaption className="absolute -top-2 right-4 bg-amber-800/90 text-white px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest">
                    {HERO_CARDS[4].label}
                </figcaption>
            </figure>
        </aside>

        {/* ── Mobile / Tablet Carousel ─────────────────────── */}
        <aside
            className={`absolute bottom-32 sm:bottom-24 right-4 w-[45%] sm:w-[40%] lg:hidden pointer-events-none transition-all duration-1000 ease-in-out ${hasInteracted ? 'z-0 opacity-20 scale-90 blur-[1px]' : 'z-20'
                }`}
            aria-label="Featured product images"
        >
            <div className="relative h-[320px] sm:h-[400px] flex items-center justify-center">
                {/* Main: Model Portrait */}
                <figure className="absolute w-full aspect-[3/4] z-30 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl pointer-events-auto">
                    <div className="w-full h-full overflow-hidden rounded-sm bg-white">
                        <img src={HERO_CARDS[2].src} alt={HERO_CARDS[2].alt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/10 to-transparent mix-blend-overlay" />
                    </div>
                    <figcaption className="absolute -bottom-3 -left-3 bg-white/95 backdrop-blur-md px-4 py-2 shadow-lg border border-stone-100">
                        <span className="block text-[7px] text-stone-400 uppercase tracking-widest mb-0.5">{HERO_CARDS[2].sublabel}</span>
                        <span className="block text-xs font-serif italic text-stone-900">{HERO_CARDS[2].label}</span>
                    </figcaption>
                    <span className="absolute top-4 -right-2 bg-stone-900 text-white px-2 py-1 text-[7px] font-bold uppercase tracking-widest shadow-sm">
                        {HERO_CARDS[2].badge}
                    </span>
                </figure>

                {/* Secondary: Serum Bottle */}
                <figure className="absolute top-0 -right-4 w-[35%] aspect-[3/4] z-10 rotate-[8deg] shadow-xl pointer-events-auto opacity-90">
                    <div className="w-full h-full overflow-hidden rounded-sm bg-stone-100">
                        <img src={HERO_CARDS[0].src} alt={HERO_CARDS[0].alt} className="w-full h-full object-cover opacity-95" />
                        <div className="absolute inset-0 bg-amber-900/5 mix-blend-multiply" />
                    </div>
                    <figcaption className="absolute -bottom-2 -right-2 bg-white/90 backdrop-blur-md px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-stone-900 shadow-sm border border-stone-100">
                        {HERO_CARDS[0].label}
                    </figcaption>
                </figure>
            </div>
        </aside>
    </>
);

export default HeroCards;

