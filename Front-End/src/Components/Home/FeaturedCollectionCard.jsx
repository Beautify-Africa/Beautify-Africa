import { useEffect, useState } from 'react';
import { CARD_POSITIONS } from '../../data/featuredCollections';
import { ArrowRightIcon } from '../Shared/Icons';

export default function FeaturedCollectionCard({ item }) {
  const positionStyles = CARD_POSITIONS[item.position] || '';
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isHovered || !item.items || item.items.length <= 1) return undefined;

    const interval = setInterval(() => {
      setActiveIndex((previousIndex) => (previousIndex + 1) % item.items.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered, item.items]);

  const currentItem = item.items ? item.items[activeIndex] : item;

  const handleTap = () => {
    setIsHovered((previousIsHovered) => {
      if (previousIsHovered) {
        setActiveIndex(0);
      }
      return !previousIsHovered;
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
      <figure className="absolute inset-0 bg-stone-200">
        <img
          key={`img-${currentItem.image}`}
          src={currentItem.image}
          alt={`${item.title} - ${currentItem.productName}`}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 animate-fade-in"
          loading="lazy"
        />
      </figure>

      <div
        className={`absolute inset-0 bg-gradient-to-t ${item.color} via-black/20 to-transparent transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-60'} group-hover:opacity-100`}
        aria-hidden="true"
      />

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-500 ${isHovered ? 'opacity-0 -translate-y-10' : ''} group-hover:opacity-0 group-hover:-translate-y-10`}
      >
        <h3 className="text-4xl md:text-5xl font-serif text-white font-bold tracking-wide text-center drop-shadow-2xl">
          {item.title}
        </h3>
        <span className="mt-4 text-xs text-white/80 uppercase tracking-widest lg:hidden">
          Tap to explore
        </span>
      </div>

      <div
        className={`absolute inset-0 flex flex-col justify-end p-6 md:p-10 transition-all duration-500 delay-100 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-[10%] opacity-0'} group-hover:translate-y-0 group-hover:opacity-100`}
      >
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

        <h4
          key={`name-${currentItem.productName}`}
          className="text-2xl md:text-3xl font-serif text-white leading-tight mb-3 md:mb-4 drop-shadow-lg animate-fade-in"
        >
          {currentItem.productName}
        </h4>

        <p
          key={`desc-${currentItem.desc}`}
          className="text-stone-100 text-xs md:text-sm font-normal leading-relaxed mb-6 md:mb-8 line-clamp-3 sm:line-clamp-4 md:line-clamp-none drop-shadow-md animate-fade-in"
        >
          {currentItem.desc}
        </p>

        <button
          className="w-full py-3 md:py-4 bg-white text-stone-900 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] rounded-lg hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 group/btn"
          aria-label={`View details for ${currentItem.productName}`}
        >
          View Details
          <ArrowRightIcon className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>

      <div
        className="absolute inset-4 border border-white/10 rounded-2xl pointer-events-none group-hover:border-white/30 transition-colors duration-500"
        aria-hidden="true"
      />
    </article>
  );
}
