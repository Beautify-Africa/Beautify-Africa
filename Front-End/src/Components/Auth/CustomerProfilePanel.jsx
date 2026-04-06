import { CloseIcon } from '../Shared/Icons';
import AppLink from '../Shared/AppLink';

function InfoRow({ label, value, subtle = false }) {
  return (
    <div className="rounded-sm border border-stone-100 bg-stone-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className={`mt-1 text-sm ${subtle ? 'text-stone-500' : 'text-stone-900'}`}>{value}</p>
    </div>
  );
}

function RecentOrdersBlock({ isLoadingOrders, ordersError, orders }) {
  if (isLoadingOrders) {
    return <p className="text-xs text-stone-500">Loading orders...</p>;
  }

  if (ordersError) {
    return <p className="text-xs text-red-500">{ordersError}</p>;
  }

  if (orders.length === 0) {
    return <p className="text-xs text-stone-500">No recent orders found.</p>;
  }

  return (
    <ul className="max-h-48 space-y-3 overflow-y-auto pr-2">
      {orders.map((order) => (
        <li
          key={order._id}
          className="flex items-center justify-between rounded-sm border border-stone-100 bg-stone-50 p-3 text-xs"
        >
          <div>
            <p className="mb-0.5 font-bold text-stone-900">#{order._id.substring(18).toUpperCase()}</p>
            <p className="text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 font-bold text-stone-900">${order.totalPrice.toFixed(2)}</p>
            <p className="text-[9px] uppercase tracking-wider text-amber-600">
              {order.isDelivered ? 'Delivered' : 'Processing'}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function CustomerProfilePanel({
  isOpen,
  panelRef,
  closeMenu,
  isRestoringSession,
  isAuthenticated,
  user,
  memberSince,
  isLoadingOrders,
  ordersError,
  orders,
  handleLogout,
}) {
  if (!isOpen) return null;

  return (
    <section
      id="customer-profile-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Customer profile"
      className="absolute right-0 top-[calc(100%+0.9rem)] z-[130] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-stone-200 bg-white shadow-2xl shadow-stone-300/20 animate-fade-in"
    >
      <div className="border-b border-stone-100 bg-[#faf9f6] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">
              My Account
            </p>
            <h3 className="mt-2 font-serif text-2xl text-stone-900">
              {isRestoringSession
                ? 'Restoring your session'
                : isAuthenticated
                  ? user.name
                  : 'Account access'}
            </h3>
          </div>

          <button
            type="button"
            onClick={closeMenu}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-white hover:text-stone-900"
            aria-label="Close profile"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">
          <span
            className={`h-2 w-2 rounded-full ${
              isAuthenticated ? 'bg-emerald-500' : isRestoringSession ? 'bg-amber-500' : 'bg-stone-300'
            }`}
            aria-hidden="true"
          />
          {isRestoringSession ? 'Checking status' : isAuthenticated ? 'Signed in' : 'Not signed in'}
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        {isRestoringSession ? (
          <p className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-stone-700">
            We are reconnecting your saved account details.
          </p>
        ) : isAuthenticated ? (
          <>
            <InfoRow label="Name" value={user.name || 'Not available'} />
            <InfoRow label="Email" value={user.email || 'Not available'} />
            <InfoRow label="Member Since" value={memberSince} />

            <div className="mt-6 border-t border-stone-100 pt-5">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Recent Orders
              </h4>
              <RecentOrdersBlock
                isLoadingOrders={isLoadingOrders}
                ordersError={ordersError}
                orders={orders}
              />
            </div>

            <p className="mt-5 text-sm leading-relaxed text-stone-500">
              Manage your personal details and view your complete order history in your account dashboard.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <AppLink
                href="/profile"
                onClick={closeMenu}
                className="block w-full rounded-sm bg-stone-900 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-900"
              >
                Manage Account
              </AppLink>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-sm border border-stone-900 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-50"
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Account Status" value="Signed out" subtle />

            <p className="text-sm leading-relaxed text-stone-500">
              Sign in here to keep your session ready while you shop. When you later open checkout, we will recognize your account automatically.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
