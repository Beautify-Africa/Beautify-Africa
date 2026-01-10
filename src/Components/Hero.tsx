import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import SocialProof from './SocialProof.js';
import InteractiveButton from './InteractiveButton.js';

const Hero: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [smoothMousePos, setSmoothMousePos] = useState({ x: 0, y: 0 });
  const bgImage = "https://images.unsplash.com/photo-1596462502278-27bfad450216?q=80&w=3280&auto=format&fit=crop";
  
  const requestRef = useRef<number>(null);
  const targetPos = useRef({ x: 0, y: 0 });

  // Generate a stable set of particles with memoization
  const particles = useMemo(() => {
    return [...Array(65)].map((_, i) => ({
      id: i,
      // Significantly increased size for better visibility
      size: Math.random() * 12 + 4,
      top: Math.random() * 100,
      left: Math.random() * 100,
      // Increased opacity and vibrancy for visibility
      color: i % 3 === 0 ? 'bg-rose-400/50' : (i % 2 === 0 ? 'bg-amber-400/50' : 'bg-white/70'),
      duration: Math.random() * 15 + 10, // 10-25s duration
      delay: Math.random() * -20,
      // Increased parallax factor for more dramatic movement
      parallaxFactor: Math.random() * 1.5 + 0.2,
      blur: Math.random() * 2,
    }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Increased sensitivity by reducing divisor (50 -> 35)
    const x = (clientX - innerWidth / 2) / 35;
    const y = (clientY - innerHeight / 2) / 35;
    setMousePos({ x, y });
    
    targetPos.current = { x: clientX, y: clientY };
  }, []);

  const animate = useCallback(() => {
    setSmoothMousePos(prev => ({
      x: prev.x + (targetPos.current.x - prev.x) * 0.08, // Slightly faster follow speed
      y: prev.y + (targetPos.current.y - prev.y) * 0.08
    }));
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center text-center bg-[#faf9f6]"
    >
      {/* 1. Deep Background Layer (Parallax Image) */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-100 ease-out pointer-events-none"
        style={{ 
          // Increased scale and translation for more dramatic depth
          transform: `scale(1.25) translate(${mousePos.x * -1.5}px, ${mousePos.y * -1.5}px)`,
        }}
      >
        <img 
          src={bgImage} 
          alt="Éclat Beauty Excellence" 
          className="w-full h-full object-cover grayscale-[0.1] brightness-[0.95]"
          loading="eager"
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-[#faf9f6]/60"></div>
        <div className="absolute inset-0 bg-[#faf9f6]/10 backdrop-sepia-[0.05]"></div>
      </div>

      {/* 2. Enhanced Particle Animation Layer */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div 
            key={p.id}
            className="absolute transition-transform duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1)"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              transform: `translate(${mousePos.x * p.parallaxFactor}px, ${mousePos.y * p.parallaxFactor}px)`
            }}
          >
            {/* Inner div handles the float animation to avoid transform conflicts */}
            <div 
              className={`rounded-full ${p.color} animate-float-particle`}
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                filter: `blur(${p.blur}px)`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* 3. Interactive Aura (Follows mouse) */}
      <div 
        // Increased size, opacity, and changed mix-blend for better visibility
        className="absolute z-[2] w-[800px] h-[800px] rounded-full blur-[100px] bg-amber-200/40 pointer-events-none mix-blend-screen transition-opacity duration-500"
        style={{
          left: smoothMousePos.x - 400 + 'px',
          top: smoothMousePos.y - 400 + 'px',
        }}
      />

      {/* 4. Film Grain Texture Layer */}
      <div className="absolute inset-0 z-[3] pointer-events-none opacity-[0.05] animate-grain"></div>

      {/* Center Content Container */}
      <div className="relative z-10 w-full max-w-4xl px-6 md:px-12 flex flex-col items-center">
        
        <div className="reveal-up" style={{ animationDelay: '0.2s' }}>
          <SocialProof />
        </div>

        <h1 className="mt-8 font-serif text-5xl md:text-7xl lg:text-9xl text-stone-900 leading-[0.95] tracking-tight reveal-up" style={{ animationDelay: '0.4s' }}>
          Unveiling the <br />
          <span className="italic font-normal text-amber-800 drop-shadow-sm">Essential</span> Glow
        </h1>

        <p className="mt-8 max-w-2xl text-lg md:text-2xl text-stone-800 font-light leading-relaxed reveal-up" style={{ animationDelay: '0.6s' }}>
          Merging the healing potency of rare botanical infusions with the precision of professional artistry. Éclat invites you into a curated sanctuary where high-performance formulas and velvet-smooth finishes transform every application into a deliberate act of elegance and self-care.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-8 items-center justify-center reveal-up" style={{ animationDelay: '0.8s' }}>
          <InteractiveButton label="Explore Collections" primary />
          <button className="group flex items-center gap-3 px-2 py-4 text-[11px] uppercase tracking-[0.4em] font-bold text-stone-900 border-b-2 border-transparent hover:border-amber-800 hover:text-amber-800 transition-all duration-300">
            Discover the Lab
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Decorative Parallax Elements (Foreground Blurs) */}
      <div 
        className="absolute top-[15%] left-[-5%] w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-[100px] z-[5] pointer-events-none transition-transform duration-[1200ms] ease-out"
        style={{ transform: `translate(${mousePos.x * 6}px, ${mousePos.y * 6}px)` }}
      ></div>
      <div 
        className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-rose-100/20 rounded-full blur-[120px] z-[5] pointer-events-none transition-transform duration-[1500ms] ease-out"
        style={{ transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)` }}
      ></div>

      {/* Z-Pattern Bottom Anchors */}
      <div className="absolute bottom-10 left-12 hidden lg:block reveal-up" style={{ animationDelay: '1.5s' }}>
        <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-stone-400 mb-1">Clean Beauty</p>
        <div className="w-8 h-[1px] bg-stone-300"></div>
      </div>
      <div className="absolute bottom-10 right-12 hidden lg:block reveal-up" style={{ animationDelay: '1.5s' }}>
        <div className="flex flex-col items-end">
          <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-stone-400 mb-1">Artisan Crafted</p>
          <div className="w-8 h-[1px] bg-stone-300"></div>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0% { transform: translate(0, 0); opacity: 0; }
          25% { opacity: 0.8; }
          50% { transform: translate(30px, -40px); opacity: 0.6; }
          75% { opacity: 0.8; }
          100% { transform: translate(60px, -80px); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-2%, -2%); }
          40% { transform: translate(2%, 2%); }
          50% { transform: translate(-1%, 1%); }
          60% { transform: translate(1%, -1%); }
          70% { transform: translate(2%, 1%); }
          80% { transform: translate(-2%, -1%); }
          90% { transform: translate(1%, 2%); }
        }
        .animate-grain {
          background-image: url("https://grainy-gradients.vercel.app/noise.svg");
          animation: grain 8s steps(10) infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
