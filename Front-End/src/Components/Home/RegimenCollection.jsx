import { REGIMEN_CATEGORIES, REGIMEN_CONTENT, REGIMEN_CONFIG } from '../../data/regimenCategories';
import { ArrowRightIcon } from '../Shared/Icons';
import FadeIn from '../Shared/FadeIn';

const CategoryCard = ({ category }) => {
  return (
    <article className="group relative flex-shrink-0 w-[240px] sm:w-[300px] md:w-[360px] h-[400px] sm:h-[480px] md:h-[520px] cursor-pointer">
      <div className="w-full h-full relative overflow-hidden rounded-t-[140px] md:rounded-t-[180px] rounded-b-sm shadow-sm transition-shadow duration-500 group-hover:shadow-2xl">
        {/* Card Image */}
        <figure className="absolute inset-0 bg-stone-200">
          <img
            src={category.image}
            alt={`${category.title} skincare collection`}
            className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
            loading="lazy"
          />
        </figure>

        {/* Default Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-900/60 opacity-100 transition-opacity duration-500 group-hover:opacity-0"
          aria-hidden="true"
        />

        {/* Hover Overlay */}
        <div
          className="absolute inset-0 bg-stone-900/80 backdrop-blur-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        />

        {/* Inner Border Frame */}
        <div
          className="absolute inset-0 border border-white/20 rounded-t-[140px] md:rounded-t-[180px] rounded-b-sm z-10 pointer-events-none"
          aria-hidden="true"
        />

        {/* Default State - Title Only */}
        <div className="absolute bottom-6 md:bottom-10 left-0 w-full text-center transition-all duration-500 group-hover:translate-y-10 group-hover:opacity-0">
          <h3 className="text-2xl md:text-3xl font-serif text-white tracking-wide drop-shadow-md">
            {category.title}
          </h3>
        </div>

        {/* Hover State - Full Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 md:p-8 text-center transition-all duration-500 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
          <span className="text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase text-amber-200 mb-2 md:mb-4">
            Explore
          </span>

          <h3 className="text-2xl md:text-4xl font-serif text-white mb-4 md:mb-6">
            {category.title}
          </h3>

          <div className="w-8 md:w-12 h-[1px] bg-white/40 mb-4 md:mb-6" aria-hidden="true" />

          <p className="text-stone-200 font-light text-xs md:text-sm leading-relaxed max-w-[200px] md:max-w-[240px]">
            {category.desc}
          </p>

          <button
            className="mt-6 md:mt-8 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-stone-900 transition-all duration-300"
            aria-label={`Explore ${category.title}`}
          >
            <ArrowRightIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </article>
  );
};

const RegimenCollection = () => {
  // Duplicate categories for seamless infinite scroll
  const duplicatedCategories = [...REGIMEN_CATEGORIES, ...REGIMEN_CATEGORIES];

  return (
    <section
      id="regimen"
      className="relative py-16 md:py-32 bg-[#F2F0EB] overflow-hidden border-t border-stone-200"
      aria-labelledby="regimen-heading"
    >
      {/* ── Ghost step numbers + editorial connector ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Vertical dotted connector */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-stone-300/50 -translate-x-1/2" />

        {/* Ghost step numbers */}
        <span className="absolute top-8 left-[5%] text-[clamp(80px,18vw,200px)] font-serif font-bold text-stone-900 opacity-[0.08] leading-none select-none">01</span>
        <span className="absolute top-1/3 right-[4%] text-[clamp(80px,18vw,200px)] font-serif font-bold text-stone-900 opacity-[0.08] leading-none select-none">02</span>
        <span className="absolute bottom-8 left-[8%] text-[clamp(80px,18vw,200px)] font-serif font-bold text-stone-900 opacity-[0.08] leading-none select-none">03</span>
      </div>

      {/* Section Header */}
      <header className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 mb-12 md:mb-20">
        <FadeIn as="div" className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 md:space-y-6">
          {/* Decorative Line & Tagline */}
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <span className="w-[1px] h-8 md:h-12 bg-stone-400" aria-hidden="true" />
            <span className="text-[9px] md:text-[11px] font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase text-stone-500">
              {REGIMEN_CONTENT.tagline}
            </span>
          </div>

          <h2
            id="regimen-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 tracking-tight"
          >
            {REGIMEN_CONTENT.heading}
          </h2>

          <p className="text-stone-600 font-light text-base md:text-lg leading-relaxed">
            {REGIMEN_CONTENT.description}
          </p>
        </FadeIn>
      </header>

      {/* Carousel */}
      <FadeIn delay={0.3} direction="up" className="relative w-full">
        {/* Fade Overlays */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 z-20 bg-gradient-to-r from-[#F2F0EB] to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 z-20 bg-gradient-to-l from-[#F2F0EB] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Scrolling Cards */}
        <div
          className="flex w-fit animate-marquee-slow gap-4 md:gap-8 pl-4 sm:pl-8"
          style={{ '--carousel-duration': REGIMEN_CONFIG.animationDuration }}
          role="list"
          aria-label="Product categories carousel"
        >
          {duplicatedCategories.map((category, index) => (
            <CategoryCard
              key={`${category.id}-${index}`}
              category={category}
            />
          ))}
        </div>
      </FadeIn>
    </section>
  );
};

export default RegimenCollection;

