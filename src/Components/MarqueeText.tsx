import React from 'react';

const MarqueeText: React.FC = () => {
  const text = "Intentional Beauty. Transparent Science. Unapologetic Luxury. Every drop is a promise kept to your skin. ";
  
  // Create a sufficient repeat to ensure seamless scrolling
  const contentBlock = [1, 2, 3, 4].map((_, i) => (
    <span key={i} className="inline-flex items-center">
      {text}
      <span className="inline-block mx-6 text-amber-700 text-2xl">•</span>
    </span>
  ));

  return (
    <div className="relative bg-stone-900 py-16 overflow-hidden border-y border-stone-800 z-20">
      {/* Gradient fade on sides for depth */}
      <div className="absolute top-0 left-0 w-24 md:w-48 h-full bg-gradient-to-r from-stone-900 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-24 md:w-48 h-full bg-gradient-to-l from-stone-900 to-transparent z-10 pointer-events-none"></div>

      <div className="flex whitespace-nowrap animate-marquee w-fit">
        {/* Render two sets of the content block for seamless looping */}
        <div className="flex items-center text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-amber-100 to-stone-400 opacity-90 tracking-tight">
          {contentBlock}
        </div>
        <div className="flex items-center text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-amber-100 to-stone-400 opacity-90 tracking-tight">
          {contentBlock}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 120s linear infinite;
        }
        .animate-marquee:hover {
            animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default MarqueeText;
