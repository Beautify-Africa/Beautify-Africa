import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfileOrders } from '../../hooks/useProfileOrders';
import TrackOrderCard from './TrackOrderCard';

function WorkspaceLoader() {
  return (
    <div className="rounded-sm border border-stone-200 bg-white px-8 py-12 text-center shadow-sm">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Loading your shipment timeline...</p>
    </div>
  );
}

function SignInGate() {
  return (
    <section className="rounded-sm border border-stone-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Track Your Order</p>
      <h2 className="mt-3 font-serif text-4xl text-stone-900">Sign in to continue</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
        Use the customer account you used during checkout to view purchase history and live shipping progress updates.
      </p>
      <Link
        to="/shop?auth=1"
        className="mt-7 inline-flex rounded-sm bg-stone-900 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-900"
      >
        Sign In To Track
      </Link>
    </section>
  );
}

export default function TrackOrdersWorkspace() {
  const MotionDiv = motion.div;
  const { token, isAuthenticated, isRestoringSession } = useAuth();
  const { orders, isLoadingOrders, ordersError, lastSyncedAt, refreshOrders } = useProfileOrders(token);
  return (
    <section className="min-h-screen bg-[#faf9f6] pb-20 pt-32 text-stone-900">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-700">Shipping Concierge</p>
            <h1 className="mt-2 font-serif text-5xl leading-none text-stone-900 md:text-6xl">Track Your Order</h1>
            <p className="mt-3 max-w-2xl text-sm text-stone-500">
              Purchase history and shipping stages update as soon as your admin team changes shipment status.
            </p>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={refreshOrders}
              className="rounded-sm border border-stone-300 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
            >
              Refresh Timeline
            </button>
          ) : null}
        </header>

        {lastSyncedAt && isAuthenticated ? (
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Last synced: {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(lastSyncedAt)}
          </p>
        ) : null}

        {isRestoringSession ? (
          <WorkspaceLoader />
        ) : !isAuthenticated ? (
          <SignInGate />
        ) : isLoadingOrders ? (
          <WorkspaceLoader />
        ) : ordersError ? (
          <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-800">{ordersError}</div>
        ) : orders.length === 0 ? (
          <section className="rounded-sm border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-serif text-3xl text-stone-900">No orders yet</p>
            <p className="mx-auto mt-3 max-w-lg text-sm text-stone-500">Your shipping timeline will appear here once you complete a purchase.</p>
            <Link
              to="/shop"
              className="mt-7 inline-flex rounded-sm border border-stone-900 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Start Shopping
            </Link>
          </section>
        ) : (
          <MotionDiv
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {orders.map((order) => (
              <MotionDiv
                key={order._id}
                variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <TrackOrderCard order={order} />
              </MotionDiv>
            ))}
          </MotionDiv>
        )}
      </div>
    </section>
  );
}
