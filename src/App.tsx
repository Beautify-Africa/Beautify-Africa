import Hero from './Components/Hero.js';
import Navbar from './Components/Navbar.js';
import MarqueeText from './Components/MarqueeText.js';
import TrustBar from './Components/TrustBar.js';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#faf9f6]">
      <Navbar />
      <main>
        <Hero />
        <MarqueeText />
        <TrustBar />
      </main>
      
      {/* Decorative side scroll indicator */}
      <div className="hidden lg:flex fixed right-10 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-50 pointer-events-none mix-blend-multiply">
        <span className="text-[10px] uppercase tracking-[0.3em] rotate-90 text-stone-400">Scroll</span>
        <div className="w-[1px] h-20 bg-stone-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-stone-800 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
