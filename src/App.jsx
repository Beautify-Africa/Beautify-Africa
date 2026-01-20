import Navbar from './Components/Navbar';
import HeroSection from './Components/Hero';
import MarqueeText from './Components/MarqueeText';
import TrustBar from './Components/TrustBar';
import FeaturedCollections from './Components/FeaturedCollections';
import RegimenCollection from './Components/RegimenCollection';
import TheJournal from './Components/TheJournal';
import Newsletter from './Components/Newsletter';
import Footer from './Components/Footer';

function App() {
  return (
    <>
      <Navbar />
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
    </>
  );
}

export default App;

