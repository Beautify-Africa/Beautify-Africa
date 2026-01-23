import Navbar from '../Components/Navbar';
import HeroSection from '../Components/Hero';
import MarqueeText from '../Components/MarqueeText';
import TrustBar from '../Components/TrustBar';
import FeaturedCollections from '../Components/FeaturedCollections';
import RegimenCollection from '../Components/RegimenCollection';
import TheJournal from '../Components/TheJournal';
import Newsletter from '../Components/Newsletter';
import Footer from '../Components/Footer';

/**
 * HomePage - Landing page with all marketing sections
 */
export default function HomePage({ onOpenAuth }) {
  return (
    <>
      <Navbar onOpenAuth={onOpenAuth} />
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
