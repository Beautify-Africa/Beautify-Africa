import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../Components/Shared/Navbar';
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
export default function HomePage({ onOpenAuth }) {
  return (
    <>
      <Helmet>
        <title>Beautify Africa | Premium African Beauty & Skincare</title>
        <meta name="title" content="Beautify Africa | Premium African Beauty & Skincare" />
        <meta name="description" content="Discover luxurious African-inspired skincare, makeup, and beauty essentials. Ethically sourced ingredients celebrating the richness of African beauty traditions." />
        <link rel="canonical" href="https://beautify-africa.com/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://beautify-africa.com/" />
        <meta property="og:title" content="Beautify Africa | Premium African Beauty & Skincare" />
        <meta property="og:description" content="Discover luxurious African-inspired skincare, makeup, and beauty essentials. Ethically sourced ingredients celebrating the richness of African beauty traditions." />
        <meta property="og:image" content="https://beautify-africa.com/og-image.jpg" />
        <meta property="og:site_name" content="Beautify Africa" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://beautify-africa.com/" />
        <meta property="twitter:title" content="Beautify Africa | Premium African Beauty & Skincare" />
        <meta property="twitter:description" content="Discover luxurious African-inspired skincare, makeup, and beauty essentials. Ethically sourced ingredients celebrating the richness of African beauty traditions." />
        <meta property="twitter:image" content="https://beautify-africa.com/og-image.jpg" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Beautify Africa",
            "url": "https://beautify-africa.com",
            "logo": "https://beautify-africa.com/logo.png",
            "description": "Premium African beauty and skincare products with ethically sourced ingredients celebrating African beauty traditions",
            "sameAs": [
              "https://www.instagram.com/beautifyafrica",
              "https://www.tiktok.com/@beautifyafrica",
              "https://www.pinterest.com/beautifyafrica"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Service",
              "email": "hello@beautify-africa.com"
            }
          })}
        </script>
      </Helmet>
      <Navbar onOpenAuth={onOpenAuth} />
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
