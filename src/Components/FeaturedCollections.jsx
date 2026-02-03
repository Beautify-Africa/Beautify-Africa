import { FEATURED_COLLECTIONS, FEATURED_CONTENT, CARD_POSITIONS } from '../data/featuredCollections';
import { ArrowRightIcon } from './Icons';

import { useState, useEffect } from 'react';

const FeaturedCard = ({ item }) => {
  const positionStyles = CARD_POSITIONS[item.position] || '';
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Rotate items on hover/tap
  useEffect(() => {
    let interval;
    if (isHovered && item.items && item.items.length > 1) {
      interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % item.items.length);
      }, 3500);
      return () => clearInterval(interval);
    }
    // Return activeIndex to 0 when not hovered
    return () => {
      setActiveIndex(0);
    };
  }, [isHovered, item.items]);

  const currentItem = item.items ? item.items[activeIndex] : item;

  // Toggle hover state for mobile tap
  const handleTap = () => {
    setIsHovered((prev) => !prev);
  };

  return (
    <article
      className={`
        group relative w-full max-w-lg lg:w-[480px] h-[450px] sm:h-[500px] lg:h-[580px]
        rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl
        transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
        border border-stone-200
        ${positionStyles}
        ${isHovered ? '!z-50 scale-[1.02] lg:scale-[1.1] rotate-0 translate-y-0 shadow-[0_40px_70px_-12px_rgba(0,0,0,0.5)]' : ''}
        hover:!z-50 hover:scale-[1.02] lg:hover:scale-[1.1] hover:rotate-0 hover:translate-y-0
        hover:shadow-[0_40px_70px_-12px_rgba(0,0,0,0.5)]
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label={`${item.title} - Tap to explore products`}
    >
      {/* Card Image */}
      <figure className="absolute inset-0 bg-stone-200">
        <img
          key={`img-${currentItem.image}`}
          src={currentItem.image}
          alt={`${item.title} - ${currentItem.productName}`}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 animate-fade-in"
          loading="lazy"
        />
      </figure>

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${item.color} via-black/20 to-transparent transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-60'} group-hover:opacity-100`}
        aria-hidden="true"
      />

      {/* Default State - Category Title */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-500 ${isHovered ? 'opacity-0 -translate-y-10' : ''} group-hover:opacity-0 group-hover:-translate-y-10`}>
        <h3 className="text-4xl md:text-5xl font-serif text-white font-bold tracking-wide text-center drop-shadow-2xl">
          {item.title}
        </h3>
        {/* Mobile tap indicator */}
        <span className="mt-4 text-xs text-white/80 uppercase tracking-widest lg:hidden">
          Tap to explore
        </span>
      </div>

      {/* Hover/Tap State - Product Details */}
      <div className={`absolute inset-0 flex flex-col justify-end p-6 md:p-10 transition-all duration-500 delay-100 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-[10%] opacity-0'} group-hover:translate-y-0 group-hover:opacity-100`}>
        {/* Badge & Price */}
        <div className="flex items-center justify-between mb-4">
          <span
            key={`badge-${currentItem.badge}`}
            className="px-2 py-0.5 md:px-3 md:py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white animate-fade-in"
          >
            {currentItem.badge}
          </span>
          <span
            key={`price-${currentItem.price}`}
            className="text-lg md:text-xl font-serif text-amber-200 italic animate-fade-in"
          >
            {currentItem.price}
          </span>
        </div>

        {/* Product Name */}
        <h4
          key={`name-${currentItem.productName}`}
          className="text-2xl md:text-3xl font-serif text-white leading-tight mb-3 md:mb-4 drop-shadow-lg animate-fade-in"
        >
          {currentItem.productName}
        </h4>

        {/* Description */}
        <p
          key={`desc-${currentItem.desc}`}
          className="text-stone-100 text-xs md:text-sm font-normal leading-relaxed mb-6 md:mb-8 line-clamp-3 sm:line-clamp-4 md:line-clamp-none drop-shadow-md animate-fade-in"
        >
          {currentItem.desc}
        </p>

        {/* CTA Button */}
        <button className="w-full py-3 md:py-4 bg-white text-stone-900 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] rounded-lg hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 group/btn">
          View Details
          <ArrowRightIcon className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Inner Border Frame */}
      <div
        className="absolute inset-4 border border-white/10 rounded-2xl pointer-events-none group-hover:border-white/30 transition-colors duration-500"
        aria-hidden="true"
      />
    </article>
  );
};

const FeaturedCollections = () => {
  return (
    <section
      id="collections"
      className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white overflow-hidden"
      aria-labelledby="featured-heading"
    >
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
          {FEATURED_COLLECTIONS.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
