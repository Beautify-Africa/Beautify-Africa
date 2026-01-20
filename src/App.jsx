import { useState, useCallback } from 'react';
import Navbar from './Components/Navbar';
import HeroSection from './Components/Hero';
import MarqueeText from './Components/MarqueeText';
import TrustBar from './Components/TrustBar';
import FeaturedCollections from './Components/FeaturedCollections';
import RegimenCollection from './Components/RegimenCollection';
import TheJournal from './Components/TheJournal';
import Newsletter from './Components/Newsletter';
import Footer from './Components/Footer';
import AuthModal from './Components/AuthModal';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);

  return (
    <>
      <Navbar onOpenAuth={openAuth} />
      <main>
        <HeroSection />
        <MarqueeText />
        <TrustBar />
        <FeaturedCollections />
        <RegimenCollection />
        <TheJournal />
        <Newsletter />
      </main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
    </>
  );
}

export default App;

