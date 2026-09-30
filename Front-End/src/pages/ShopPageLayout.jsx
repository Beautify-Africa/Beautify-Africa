import Navbar from '../Components/Shared/Navbar';
import Seo from '../Components/Shared/Seo';
import ShopPage from '../Components/Shop/ShopPage';
import Footer from '../Components/Shared/Footer';

/**
 * ShopPageLayout - Product catalogue page with navigation
 */
export default function ShopPageLayout({ onOpenCart }) {
  return (
    <>
      <Seo
        title="Shop | Beautify Africa - Premium Global Beauty & Cosmetics"
        description="Browse our curated collection of luxury skincare, high-pigment makeup, and beauty essentials from top global brands for every skin tone."
        path="/shop"
        imageAlt="Beautify Africa - Shop Premium Global Beauty & Cosmetics"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Shop Premium Beauty & Cosmetics',
          description:
            'Browse our collection of world-class makeup, clinical skincare, and luxury beauty essentials for every skin tone',
          url: 'https://beautify-africa.com/shop',
          provider: {
            '@type': 'Organization',
            name: 'Beautify Africa',
            url: 'https://beautify-africa.com',
          },
        }}
      />
      <Navbar onOpenCart={onOpenCart} />
      <main id="main-content">
        <ShopPage />
      </main>
      <Footer />
    </>
  );
}
