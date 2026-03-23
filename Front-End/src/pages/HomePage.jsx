import { lazy, Suspense } from 'react';
import Navbar from '../Components/Shared/Navbar';
import Seo from '../Components/Shared/Seo';
import HeroSection from '../Components/Home/Hero';
import MarqueeText from '../Components/Shared/MarqueeText';
import TrustBar from '../Components/Shared/TrustBar';

// Lazy load below-the-fold components
const FeaturedCollections = lazy(() => import('../Components/Home/FeaturedCollections'));
const RegimenCollection = lazy(() => import('../Components/Home/RegimenCollection'));
const TheJournal = lazy(() => import('../Components/Home/TheJournal'));
const Newsletter = lazy(() => import('../Components/Shared/Newsletter'));
const Footer = lazy(() => import('../Components/Shared/Footer'));

// Minimal loader for below-the-fold sections
function SectionLoader() {
  return <div className="min-h-[200px] bg-[#faf9f6]" />;
}

/**
 * HomePage - Landing page with all marketing sections
 */
export default function HomePage() {
  return (
    <>
      <Seo
        title="Beautify Africa | Premium African Beauty & Skincare"
        description="Discover luxurious African-inspired skincare, makeup, and beauty essentials. Ethically sourced ingredients celebrating the richness of African beauty traditions."
        path="/"
        imageAlt="Beautify Africa - Premium African Beauty Products"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Beautify Africa',
          url: 'https://beautify-africa.com',
          logo: 'https://beautify-africa.com/logo.png',
          description:
            'Premium African beauty and skincare products with ethically sourced ingredients celebrating African beauty traditions',
          sameAs: [
            'https://www.instagram.com/beautifyafrica',
            'https://www.tiktok.com/@beautifyafrica',
            'https://www.pinterest.com/beautifyafrica',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'hello@beautify-africa.com',
          },
        }}
      />
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <MarqueeText />
        <TrustBar />
        <Suspense fallback={<SectionLoader />}>
          <FeaturedCollections />
          <RegimenCollection />
          <TheJournal />
          <Newsletter />
        </Suspense>
      </main>
      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </>
  );
}
