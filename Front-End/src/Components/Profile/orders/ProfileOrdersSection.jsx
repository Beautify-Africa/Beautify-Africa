import { Link } from 'react-router-dom';
import ProfileOrderCard from './ProfileOrderCard';

export default function ProfileOrdersSection({ isLoadingOrders, ordersError, orders, onRefresh, lastSyncedAt }) {
  return (
    <section className="lg:col-span-7">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-3xl">Purchase History</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-sm border border-stone-300 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
        >
          Refresh Orders
        </button>
      </div>

      {lastSyncedAt ? <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Last synced: {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(lastSyncedAt)}</p> : null}

      {isLoadingOrders ? (
        <div className="flex justify-center rounded-sm border border-stone-200 bg-white py-12 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-stone-400">Loading your history...</p></div>
      ) : ordersError ? (
        <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-800">{ordersError}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-sm border border-stone-200 bg-white p-12 text-center shadow-sm">
          <p className="mb-3 font-serif text-xl text-stone-900">No active orders</p>
          <p className="mx-auto mb-6 max-w-sm text-sm text-stone-500">You have not placed any orders with Beautify Africa yet. Discover our latest formulations in the shop.</p>
          <Link to="/shop" className="inline-block border border-stone-900 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white">Explore Shop</Link>
        </div>
      ) : (
        <div className="space-y-6">{orders.map((order) => <ProfileOrderCard key={order._id} order={order} />)}</div>
      )}
    </section>
  );
}
