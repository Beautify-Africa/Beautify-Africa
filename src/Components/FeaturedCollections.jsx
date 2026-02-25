import { FEATURED_COLLECTIONS, FEATURED_CONTENT, CARD_POSITIONS } from '../data/featuredCollections';
import { ArrowRightIcon } from './Icons';
import FadeIn from './FadeIn';

import { useState, useEffect } from 'react';

const FeaturedCard = ({ item }) => {
  const positionStyles = CARD_POSITIONS[item.position] || '';
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Rotate items on hover/tap
  useEffect(() => {
    if (isHovered && item.items && item.items.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % item.items.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isHovered, item.items]);

  const currentItem = item.items ? item.items[activeIndex] : item;

  // Toggle hover state for mobile tap
  const handleTap = () => {
    setIsHovered((prev) => {
      // Reset index when toggling off
      if (prev) {
        setActiveIndex(0);
      }
      return !prev;
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveIndex(0);
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
        <button
          className="w-full py-3 md:py-4 bg-white text-stone-900 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] rounded-lg hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 group/btn"
          aria-label={`View details for ${currentItem.productName}`}
        >
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
      className="relative py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white overflow-hidden"
      aria-labelledby="featured-heading"
    >
      {/* ── Botanical corner accents ── */}

      {/* Top-left: Shea leaf */}
      <svg aria-hidden="true" className="absolute -top-6 -left-6 w-48 md:w-72 opacity-[0.045] text-stone-900 pointer-events-none animate-float-slow" viewBox="0 0 200 260" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M100 240 C100 240 20 160 30 80 C40 20 100 10 100 10 C100 10 160 20 170 80 C180 160 100 240 100 240Z" />
        <path d="M100 240 L100 10" />
        <path d="M100 80 C80 60 50 55 30 80" />
        <path d="M100 120 C75 95 45 90 30 120" />
        <path d="M100 160 C80 140 55 135 40 155" />
        <path d="M100 80 C120 60 150 55 170 80" />
        <path d="M100 120 C125 95 155 90 170 120" />
        <path d="M100 160 C120 140 145 135 160 155" />
      </svg>

      {/* Top-right: Aloe branch */}
      <svg aria-hidden="true" className="absolute -top-4 -right-8 w-44 md:w-64 opacity-[0.04] text-stone-900 pointer-events-none animate-float-slow" style={{ animationDelay: '1.5s' }} viewBox="0 0 200 280" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M100 270 L100 40" />
        <path d="M100 40 C100 40 60 10 30 30" />
        <path d="M100 40 C100 40 140 10 170 30" />
        <path d="M100 90 C100 90 55 65 25 80" />
        <path d="M100 90 C100 90 145 65 175 80" />
        <path d="M100 140 C100 140 60 120 35 130" />
        <path d="M100 140 C100 140 140 120 165 130" />
        <path d="M100 190 C100 190 65 175 45 182" />
        <path d="M100 190 C100 190 135 175 155 182" />
      </svg>

      {/* Bottom-left: Fern frond */}
      <svg aria-hidden="true" className="absolute bottom-0 -left-4 w-40 md:w-60 opacity-[0.04] text-stone-900 pointer-events-none animate-float-slow" style={{ animationDelay: '3s' }} viewBox="0 0 180 260" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M90 250 C90 250 90 30 90 10" />
        <path d="M90 50 Q50 30 20 50 Q50 45 90 70" />
        <path d="M90 90 Q45 65 10 85 Q45 80 90 110" />
        <path d="M90 130 Q50 108 20 125 Q50 120 90 148" />
        <path d="M90 170 Q55 150 30 165 Q55 160 90 185" />
        <path d="M90 210 Q65 195 45 207 Q65 203 90 220" />
      </svg>

      {/* Bottom-right: Baobab silhouette */}
      <svg aria-hidden="true" className="absolute bottom-0 -right-4 w-36 md:w-56 opacity-[0.04] text-stone-900 pointer-events-none animate-float-slow" style={{ animationDelay: '4.5s' }} viewBox="0 0 160 240" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M80 240 L80 100" />
        <path d="M80 100 L40 60" />
        <path d="M80 100 L120 60" />
        <path d="M80 100 L80 50" />
        <path d="M80 100 L30 80" />
        <path d="M80 100 L130 80" />
        <ellipse cx="40" cy="50" rx="25" ry="18" />
        <ellipse cx="120" cy="50" rx="25" ry="18" />
        <ellipse cx="80" cy="40" rx="28" ry="20" />
        <ellipse cx="30" cy="72" rx="20" ry="14" />
        <ellipse cx="130" cy="72" rx="20" ry="14" />
      </svg>

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
            <FadeIn key={item.id} delay={index * 0.2}>
              <FeaturedCard item={item} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
