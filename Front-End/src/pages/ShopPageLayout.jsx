import Navbar from '../Components/Shared/Navbar';
import Seo from '../Components/Shared/Seo';
import ShopPage from '../Components/Shop/ShopPage';
import Footer from '../Components/Shared/Footer';

/**
 * ShopPageLayout - Product catalogue page with navigation
 */
export default function ShopPageLayout({ onOpenAuth, onOpenCart }) {
  return (
    <>
      <Seo
        title="Shop | Beautify Africa - Premium African Beauty Products"
        description="Browse our collection of luxurious African-inspired skincare, makeup, and beauty essentials. Shop ethically sourced ingredients celebrating African beauty traditions."
        path="/shop"
        imageAlt="Beautify Africa - Shop Premium African Beauty Products"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Shop African Beauty Products',
          description:
            'Browse our collection of luxurious African-inspired skincare, makeup, and beauty essentials',
          url: 'https://beautify-africa.com/shop',
          provider: {
            '@type': 'Organization',
            name: 'Beautify Africa',
            url: 'https://beautify-africa.com',
          },
        }}
      />
      <Navbar onOpenAuth={onOpenAuth} onOpenCart={onOpenCart} />
      <main id="main-content">
        <ShopPage />
      </main>
      <Footer />
    </>
  );
}
