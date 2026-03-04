import { Helmet } from 'react-helmet-async';
import Navbar from '../Components/Shared/Navbar';
import ShopPage from '../Components/Shop/ShopPage';
import Footer from '../Components/Shared/Footer';

/**
 * ShopPageLayout - Product catalogue page with navigation
 */
export default function ShopPageLayout({ onOpenAuth, onOpenCart }) {
  return (
    <>
      <Helmet>
        <title>Shop | Beautify Africa - Premium African Beauty Products</title>
        <meta name="title" content="Shop | Beautify Africa - Premium African Beauty Products" />
        <meta name="description" content="Browse our collection of luxurious African-inspired skincare, makeup, and beauty essentials. Shop ethically sourced ingredients celebrating African beauty traditions." />
        <link rel="canonical" href="https://beautify-africa.com/shop" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://beautify-africa.com/shop" />
        <meta property="og:title" content="Shop | Beautify Africa - Premium African Beauty Products" />
        <meta property="og:description" content="Browse our collection of luxurious African-inspired skincare, makeup, and beauty essentials. Shop ethically sourced ingredients celebrating African beauty traditions." />
        <meta property="og:image" content="https://beautify-africa.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Beautify Africa - Shop Premium African Beauty Products" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://beautify-africa.com/shop" />
        <meta name="twitter:title" content="Shop | Beautify Africa - Premium African Beauty Products" />
        <meta name="twitter:description" content="Browse our collection of luxurious African-inspired skincare, makeup, and beauty essentials. Shop ethically sourced ingredients celebrating African beauty traditions." />
        <meta name="twitter:image" content="https://beautify-africa.com/og-image.jpg" />
        <meta name="twitter:image:alt" content="Beautify Africa - Shop Premium African Beauty Products" />
        
        {/* JSON-LD Structured Data for Product Listing */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Shop African Beauty Products",
            "description": "Browse our collection of luxurious African-inspired skincare, makeup, and beauty essentials",
            "url": "https://beautify-africa.com/shop",
            "provider": {
              "@type": "Organization",
              "name": "Beautify Africa",
              "url": "https://beautify-africa.com"
            }
          })}
        </script>
      </Helmet>
      <Navbar onOpenAuth={onOpenAuth} onOpenCart={onOpenCart} />
      <main id="main-content">
        <ShopPage />
      </main>
      <Footer />
    </>
  );
}
