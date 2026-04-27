import { Helmet } from 'react-helmet-async';
import Seo from '../Components/Shared/Seo';
import AdminShell from '../Components/AdminShared/AdminShell';
import InventoryDashboard from '../Components/AdminProducts/InventoryDashboard';
import LowStockDashboard from '../Components/AdminProducts/LowStockDashboard';

export default function AdminInventoryPage() {
  return (
    <>
      <Helmet>
        <title>Inventory Management - Admin</title>
      </Helmet>
      <Seo
        title="Inventory Management"
        description="Monitor and manage product inventory levels, variants, and stock alerts."
        robots="noindex, nofollow"
      />
      <AdminShell>
        <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-8 shadow-[0_18px_44px_rgba(28,25,23,0.08)]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-stone-900">Inventory Management</h1>
            <p className="mt-2 text-sm text-stone-600">
              Monitor stock levels, track variants, and manage low-stock alerts.
            </p>
          </div>

          <div className="space-y-12">
            {/* Overview */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-6">Overview</h2>
              <InventoryDashboard />
            </div>

            {/* Low Stock Items */}
            <div className="pt-6 border-t border-stone-200">
              <h2 className="text-lg font-semibold text-stone-900 mb-6">Low Stock Items</h2>
              <LowStockDashboard />
            </div>
          </div>
        </section>
      </AdminShell>
    </>
  );
}
