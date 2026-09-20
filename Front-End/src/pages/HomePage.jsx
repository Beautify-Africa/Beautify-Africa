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

function SectionPlaceholder({ minHeight = 'min-h-[600px]' }) {
  return <div className={`${minHeight} w-full bg-[#faf9f6] animate-pulse`} aria-hidden="true" />;
}

/**
 * HomePage - Landing page with all marketing sections
 */
export default function HomePage({ onOpenCart }) {
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
      <Navbar onOpenCart={onOpenCart} />
      <main id="main-content">
        <HeroSection />
        <MarqueeText />
        <TrustBar />
        <Suspense fallback={<SectionPlaceholder minHeight="min-h-[700px]" />}>
          <FeaturedCollections />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder minHeight="min-h-[600px]" />}>
          <RegimenCollection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder minHeight="min-h-[500px]" />}>
          <TheJournal />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder minHeight="min-h-[350px]" />}>
          <Newsletter />
        </Suspense>
      </main>
      <Suspense fallback={<SectionPlaceholder minHeight="min-h-[300px]" />}>
        <Footer />
      </Suspense>
    </>
  );
}
