import { JOURNAL_ARTICLES, JOURNAL_CONTENT } from '../data/journalArticles';
import { ArrowRightIcon } from './Icons';
import FadeIn from './FadeIn';

const FeaturedArticle = ({ article }) => {
  return (
    <article className="relative group w-full h-[400px] sm:h-[500px] lg:h-full overflow-hidden rounded-2xl cursor-pointer">
      {/* Article Image */}
      <figure className="absolute inset-0 bg-stone-900">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105 opacity-80 group-hover:opacity-60"
          loading="lazy"
        />
      </figure>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-90"
        aria-hidden="true"
      />

      {/* Article Content */}
      <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col items-start transform transition-transform duration-700">
        <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 mb-4 md:mb-6 border border-white/30 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
          {article.category}
        </span>

        <h3 className="text-2xl md:text-5xl font-serif text-white mb-4 md:mb-6 leading-tight drop-shadow-lg">
          {article.title.split(' / ').map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </h3>

        <p className="text-stone-300 text-[13px] md:text-base font-light leading-relaxed max-w-md mb-6 md:mb-8 md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-500">
          {article.excerpt}
        </p>

        <button className="flex items-center gap-3 text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] group/btn">
          <span className="border-b border-white md:border-transparent md:group-hover/btn:border-white transition-all pb-1">
            {article.cta}
          </span>
          <ArrowRightIcon className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  );
};

const SecondaryArticle = ({ article }) => {
  return (
    <article className="relative group flex-1 w-full h-[300px] sm:h-[350px] overflow-hidden rounded-2xl cursor-pointer">
      {/* Article Image */}
      <figure className="absolute inset-0 bg-stone-800">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105 opacity-80 group-hover:opacity-60"
          loading="lazy"
        />
      </figure>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent"
        aria-hidden="true"
      />

      {/* Article Content */}
      <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
        <span className={`${article.categoryColor} text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block`}>
          {article.category}
        </span>

        <h3 className="text-xl md:text-3xl font-serif text-white mb-3 md:mb-4 leading-snug">
          {article.title}
        </h3>

        {/* Expandable Content */}
        <div className="overflow-hidden max-h-0 md:group-hover:max-h-40 transition-all duration-500 ease-in-out">
          <p className="text-stone-300 text-[13px] md:text-sm font-light leading-relaxed mb-4 md:mb-6">
            {article.excerpt}
          </p>

          <button className={`text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${article.hoverColor} transition-colors`}>
            {article.cta}
            <ArrowRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </article>
  );
};

const TheJournal = () => {
  const { featured, secondary } = JOURNAL_ARTICLES;

  return (
    <section
      id="journal"
      className="relative py-16 md:py-32 px-4 sm:px-6 md:px-12 bg-[#faf9f6] border-t border-stone-200 overflow-hidden"
      aria-labelledby="journal-heading"
    >
      {/* ── Editorial background: ruled lines + drop-cap ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 39px, rgba(168,162,158,0.30) 39px, rgba(168,162,158,0.30) 40px)',
          backgroundSize: '100% 40px',
        }}
      />
      {/* Giant decorative drop-cap */}
      <span
        className="absolute -top-8 right-0 md:right-4 text-[clamp(160px,25vw,320px)] font-serif font-bold leading-none text-stone-900 opacity-[0.07] pointer-events-none select-none"
        aria-hidden="true"
      >
        J
      </span>

      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <FadeIn as="header" className="flex flex-col items-center text-center mb-12 md:mb-20 space-y-4 md:space-y-6">
          {/* Decorative Line & Tagline */}
          <div className="flex flex-col items-center gap-2 md:gap-4">
            <span className="w-[1px] h-8 md:h-12 bg-stone-400" aria-hidden="true" />
            <span className="text-[9px] md:text-[11px] font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase text-stone-500">
              {JOURNAL_CONTENT.tagline}
            </span>
          </div>

          <h2
            id="journal-heading"
            className="text-3xl sm:text-4xl md:text-6xl font-serif text-stone-900 tracking-tight"
          >
            {JOURNAL_CONTENT.heading}
          </h2>

          <p className="text-stone-600 font-light text-base md:text-lg tracking-wide max-w-xl">
            {JOURNAL_CONTENT.description}
          </p>
        </FadeIn>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[800px]">
          {/* Featured Article */}
          <FadeIn delay={0.2} className="h-full">
            <FeaturedArticle article={featured} />
          </FadeIn>

          {/* Secondary Articles Column */}
          <div className="flex flex-col gap-6 h-auto lg:h-full">
            {secondary.map((article, index) => (
              <FadeIn key={article.id} delay={0.3 + index * 0.1} className="flex-1">
                <SecondaryArticle article={article} />
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheJournal;
