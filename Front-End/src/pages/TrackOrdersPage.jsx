import Navbar from '../Components/Shared/Navbar';
import Footer from '../Components/Shared/Footer';
import Seo from '../Components/Shared/Seo';
import TrackOrdersWorkspace from '../Components/Tracking/TrackOrdersWorkspace';

export default function TrackOrdersPage({ onOpenCart }) {
  return (
    <>
      <Seo
        title="Track Your Order | Beautify Africa"
        description="View your Beautify Africa purchase history and live shipping progress updates in one place."
        path="/track-orders"
        imageAlt="Beautify Africa order tracking workspace"
      />
      <Navbar onOpenCart={onOpenCart} />
      <main id="main-content">
        <TrackOrdersWorkspace />
      </main>
      <Footer />
    </>
  );
}
