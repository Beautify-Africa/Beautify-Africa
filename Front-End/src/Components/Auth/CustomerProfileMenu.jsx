import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { fetchMyOrders } from '../../services/ordersApi';
import { CloseIcon, ProfileIcon } from '../Shared/Icons';
import AppLink from '../Shared/AppLink';

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getFirstName(name) {
  return name?.trim().split(/\s+/).filter(Boolean)[0] || 'Guest';
}

function InfoRow({ label, value, subtle = false }) {
  return (
    <div className="rounded-sm border border-stone-100 bg-stone-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className={`mt-1 text-sm ${subtle ? 'text-stone-500' : 'text-stone-900'}`}>{value}</p>
    </div>
  );
}

export default function CustomerProfileMenu() {
  const { user, token, logout, isAuthenticated, isRestoringSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const wrapperRef = useRef(null);
  const panelRef = useFocusTrap(isOpen);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const firstName = useMemo(() => getFirstName(user?.name), [user?.name]);
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Just now';

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(user?.createdAt));
  }, [user?.createdAt]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsOpen(false);
  }, [logout]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      if (!isOpen || !isAuthenticated || !token) return;
      
      setIsLoadingOrders(true);
      setOrdersError(null);
      
      try {
        const data = await fetchMyOrders(token);
        if (active) setOrders(data);
      } catch (err) {
        if (active) setOrdersError(err.message);
      } finally {
        if (active) setIsLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated, token]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="customer-profile-menu"
        className="group flex items-center gap-3 rounded-full border border-transparent px-1 py-1 text-left transition-colors hover:border-stone-200 focus:outline-none focus-visible:border-stone-300"
      >
        <span
          className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-stone-900 transition-colors ${
            isAuthenticated
              ? 'border-amber-200 bg-amber-50'
              : 'border-stone-200 bg-white group-hover:border-stone-300'
          }`}
        >
          {isAuthenticated && initials ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{initials}</span>
          ) : (
            <ProfileIcon className="h-5 w-5" />
          )}

          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
              isAuthenticated ? 'bg-emerald-500' : 'bg-stone-300'
            }`}
            aria-hidden="true"
          />
        </span>

        <span className="hidden xl:block">
          <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-stone-400">
            {isAuthenticated ? 'Profile' : 'Account'}
          </span>
          <span className="block text-xs text-stone-900">
            {isRestoringSession ? 'Checking...' : isAuthenticated ? firstName : 'Sign In'}
          </span>
        </span>
      </button>

      {isOpen && (
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
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-3">
                    Recent Orders
                  </h4>
                  {isLoadingOrders ? (
                    <p className="text-xs text-stone-500">Loading orders...</p>
                  ) : ordersError ? (
                    <p className="text-xs text-red-500">{ordersError}</p>
                  ) : orders.length > 0 ? (
                    <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      {orders.map((order) => (
                        <li key={order._id} className="rounded-sm border border-stone-100 bg-stone-50 p-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-stone-900 mb-0.5">#{order._id.substring(18).toUpperCase()}</p>
                            <p className="text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-stone-900 mb-0.5">${order.totalPrice.toFixed(2)}</p>
                            <p className="text-[9px] uppercase tracking-wider text-amber-600">{order.isDelivered ? 'Delivered' : 'Processing'}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500">No recent orders found.</p>
                  )}
                </div>

                <p className="text-sm mt-5 leading-relaxed text-stone-500">
                  Manage your personal details and view your complete order history in your account dashboard.
                </p>

                <div className="pt-2 flex flex-col gap-3">
                  <AppLink
                    href="/profile"
                    onClick={closeMenu}
                    className="block text-center w-full rounded-sm bg-stone-900 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-900"
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
                  Sign in here to keep your session ready while you shop. When you later open
                  checkout, we will recognize your account automatically.
                </p>
              </>
            )}
          </div>
        </section>
      )}


    </div>
  );
}
