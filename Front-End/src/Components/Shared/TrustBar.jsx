import { TRUST_ITEMS, USP_CONTENT } from '../../data/trustItems';
import { PlusIcon } from './Icons';
import FadeIn from './FadeIn';
import { buildResponsiveImageProps } from '../../utils/imageUtils';

const TrustCard = ({ item }) => {
  const imageProps = buildResponsiveImageProps(item.image, {
    widths: [320, 480, 720],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  });

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
          src={imageProps.src}
          srcSet={imageProps.srcSet}
          sizes={imageProps.sizes}
          alt={item.label}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 opacity-95 group-hover:opacity-100"
          loading="lazy"
          decoding="async"
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

const TrustBackgroundPattern = () => (
  <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
    <div
      className="absolute inset-0 opacity-[0.32]"
      style={{
        backgroundImage: [
          'linear-gradient(90deg, rgba(120, 113, 108, 0.08) 1px, transparent 1px)',
          'linear-gradient(0deg, rgba(120, 113, 108, 0.06) 1px, transparent 1px)',
          'radial-gradient(circle at center, rgba(180, 83, 9, 0.10) 1px, transparent 1.6px)',
        ].join(', '),
        backgroundSize: '112px 112px, 112px 112px, 28px 28px',
      }}
    />

    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      style={{ color: 'rgba(28, 25, 23, 0.085)' }}
    >
      <defs>
        <pattern
          id="trust-botanical-pattern"
          width="240"
          height="190"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-6)"
        >
          <path
            d="M24 168 C78 132 118 104 158 36"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M72 128 C48 112 36 88 42 66 C66 72 82 92 72 128Z"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M116 90 C94 74 86 50 96 30 C118 40 130 62 116 90Z"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M148 48 C168 34 194 30 212 42 C196 64 172 68 148 48Z"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M58 146 C82 150 104 164 116 184"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#trust-botanical-pattern)" />
    </svg>

    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, rgba(250, 249, 246, 0.92) 0%, rgba(250, 249, 246, 0.64) 42%, rgba(250, 249, 246, 0.88) 100%)',
      }}
    />
  </div>
);

const TrustBar = () => {
  return (
    <section
      className="relative isolate z-10 py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-[#faf9f6] overflow-hidden"
      aria-labelledby="usp-heading"
      id="trust"
    >
      <TrustBackgroundPattern />

      {/* Clean amber accent line */}
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" aria-hidden="true" />

      <div className="relative z-10 max-w-[1400px] mx-auto">
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

