import Navbar from '../Components/Navbar';
import ShopPage from '../Components/ShopPage';
import Footer from '../Components/Footer';

/**
 * ShopPageLayout - Product catalogue page with navigation
 */
export default function ShopPageLayout({ onOpenAuth, onOpenCart }) {
  return (
    <>
      <Navbar onOpenAuth={onOpenAuth} onOpenCart={onOpenCart} />
      <main id="main-content">
        <ShopPage />
      </main>
      <Footer />
    </>
  );
}
