import { TRUST_ITEMS, USP_CONTENT } from '../data/trustItems';
import { PlusIcon } from './Icons';
import FadeIn from './FadeIn';

const TrustCard = ({ item }) => {
  return (
    <article
      className={`
        group relative min-h-[250px] md:min-h-0 h-full overflow-hidden rounded-2xl md:rounded-3xl 
        shadow-sm hover:shadow-2xl hover:z-10 hover:scale-[1.01] md:hover:scale-[1.02] 
        transition-all duration-500 ease-out cursor-default border border-stone-200/50 
        ${item.className}
      `}
    >
      {/* Card Image */}
      <figure className="absolute inset-0 bg-stone-200">
        <img
          src={item.image}
          alt={item.label}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 opacity-95 group-hover:opacity-100"
          loading="lazy"
        />
      </figure>

      {/* Overlay Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent transition-all duration-500 group-hover:bg-stone-900/60 group-hover:backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Card Content */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end items-center text-center">
        {/* Decorative Line */}
        <div
          className="w-10 md:w-12 h-0.5 bg-amber-500 mb-4 md:mb-6 transition-all duration-500 group-hover:scale-x-150 group-hover:bg-amber-400"
          aria-hidden="true"
        />

        {/* Card Title */}
        <h3 className="text-xl md:text-3xl font-serif text-white font-medium tracking-wide mb-2 drop-shadow-md transform transition-transform duration-500 group-hover:-translate-y-2">
          {item.label}
        </h3>

        {/* Expandable Description */}
        <div className="overflow-hidden max-h-0 group-hover:max-h-[300px] md:group-hover:max-h-[500px] transition-all duration-700 ease-in-out w-full">
          <p className="text-stone-100 text-[13px] md:text-base font-sans font-light leading-relaxed tracking-wide opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
            {item.desc}
          </p>
        </div>

        {/* Expand Indicator */}
        <div
          className="absolute top-4 right-4 md:top-6 md:right-6 opacity-60 group-hover:opacity-0 transition-all duration-300"
          aria-hidden="true"
        >
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm">
            <PlusIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
        </div>
      </div>
    </article>
  );
};

const TrustBar = () => {
  return (
    <section
      className="relative z-10 py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-[#faf9f6]"
      aria-labelledby="usp-heading"
      id="trust"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <FadeIn as="header" className="text-center mb-12 md:mb-16">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-amber-800 mb-4 block">
            {USP_CONTENT.tagline}
          </span>
          <h2
            id="usp-heading"
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight mb-4"
          >
            {USP_CONTENT.heading}
          </h2>
          <p className="text-stone-600 text-lg md:text-xl font-light max-w-2xl mx-auto">
            {USP_CONTENT.description}
          </p>
        </FadeIn>

        {/* Trust Cards Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[300px]"
          role="list"
        >
          {TRUST_ITEMS.map((item, index) => (
            <FadeIn
              key={item.id}
              delay={index * 0.1}
              className={`h-full ${item.className || ''}`}
            >
              <TrustCard item={item} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
