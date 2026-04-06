import { FEATURED_COLLECTIONS, FEATURED_CONTENT } from '../../data/featuredCollections';
import FadeIn from '../Shared/FadeIn';
import FeaturedCollectionCard from './FeaturedCollectionCard';
import FeaturedCollectionsDecorations from './FeaturedCollectionsDecorations';

const FeaturedCollections = () => {
  return (
    <section
      id="collections"
      className="relative py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white overflow-hidden"
      aria-labelledby="featured-heading"
    >
      <FeaturedCollectionsDecorations />

      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-24 space-y-4">
          <h2
            id="featured-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 tracking-tight"
          >
            {FEATURED_CONTENT.heading}
          </h2>
          <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] md:tracking-[0.3em] text-stone-500 uppercase">
            {FEATURED_CONTENT.tagline}
          </p>
        </header>

        {/* Featured Cards */}
        <div
          className="flex flex-col lg:flex-row items-center justify-center lg:-space-x-12 xl:-space-x-20 space-y-8 lg:space-y-0 py-6 md:py-10 perspective-1000"
          role="list"
        >
          {FEATURED_COLLECTIONS.map((item, index) => (
            <FadeIn key={item.id} delay={index * 0.2} className="w-full lg:w-auto">
              <FeaturedCollectionCard item={item} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;

