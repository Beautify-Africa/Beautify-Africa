import { Helmet } from 'react-helmet-async';
import Seo from '../Components/Shared/Seo';
import AdminShell from '../Components/AdminShared/AdminShell';
import InventoryDashboard from '../Components/AdminProducts/InventoryDashboard';
import LowStockDashboard from '../Components/AdminProducts/LowStockDashboard';

export default function AdminInventoryPage() {
  return (
    <>
      <Helmet>
        <title>Inventory Management | Beautify Africa Admin</title>
      </Helmet>
      <Seo
        title="Inventory Management"
        description="Monitor and manage product inventory levels, variants, and stock alerts."
        robots="noindex, nofollow"
      />
      <AdminShell
        sectionLabel="Inventory"
        title="Inventory Command"
        description="Real-time warehouse stock tracking, SKU variant replenishment, and automated reorder triggers."
      >
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                  Stock Overview
                </p>
                <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Warehouse Telemetry</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Synchronized
              </span>
            </div>
            <InventoryDashboard />
          </section>

          <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
                  Replenishment Alerts
                </p>
                <h2 className="mt-1 text-lg font-bold text-white tracking-tight">Critical Low Stock Items</h2>
              </div>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <LowStockDashboard />
          </section>
        </div>
      </AdminShell>
    </>
  );
}
