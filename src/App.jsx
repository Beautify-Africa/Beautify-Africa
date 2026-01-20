import Navbar from './Components/Navbar';
import HeroSection from './Components/Hero';
import MarqueeText from './Components/MarqueeText';
import TrustBar from './Components/TrustBar';
import FeaturedCollections from './Components/FeaturedCollections';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <MarqueeText />
        <TrustBar />
        <FeaturedCollections />
      </main>
    </>
  );
}

export default App;

