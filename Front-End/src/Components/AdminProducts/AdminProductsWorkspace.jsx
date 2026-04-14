import { Helmet } from 'react-helmet-async';
import Seo from '../Shared/Seo';
import { useAuth } from '../../hooks/useAuth';
import ImageUploader from './ImageUploader';

export default function AdminProductsWorkspace() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f0e8]">
        <h2 className="font-serif text-2xl text-stone-900">Restricted Area</h2>
      </div>
    );
  }

  return (
    <>
      <Seo title="Admin Products Studio | Beautify Africa" description="Private operations workspace for Beautify Africa product management." path="/admin/products" />
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      
      <div className="min-h-screen bg-[#f6f0e8] text-stone-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10 text-center">
            <h1 className="font-serif text-4xl text-stone-900">Product Studio</h1>
            <p className="mt-3 text-sm text-stone-500 uppercase tracking-widest">Inventory & Asset Management</p>
          </header>

          <main className="grid gap-8 lg:grid-cols-2">
            <section>
              <ImageUploader />
            </section>
            
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm opacity-60">
               <h3 className="mb-4 font-serif text-2xl text-stone-900">Catalogue Management</h3>
               <p className="text-sm text-stone-500 mb-4">
                 Future UI module for fully integrating Cloudinary assets into existing MongoDB Product Schemas.
                 Create, edit, and curate items here.
               </p>
               <button disabled className="rounded-full bg-stone-300 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-500">
                  Coming Soon
               </button>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
