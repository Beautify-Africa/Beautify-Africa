import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { fetchMyOrders } from '../../services/ordersApi';
import CustomerProfileTrigger from './CustomerProfileTrigger';
import CustomerProfilePanel from './CustomerProfilePanel';
import { formatMemberSince, getFirstName, getInitials } from '../../utils/userDisplay';

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
  const memberSince = useMemo(() => formatMemberSince(user?.createdAt), [user?.createdAt]);

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
      <CustomerProfileTrigger
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        isAuthenticated={isAuthenticated}
        isRestoringSession={isRestoringSession}
        initials={initials}
        firstName={firstName}
      />

      <CustomerProfilePanel
        isOpen={isOpen}
        panelRef={panelRef}
        closeMenu={closeMenu}
        isRestoringSession={isRestoringSession}
        isAuthenticated={isAuthenticated}
        user={user}
        memberSince={memberSince}
        isLoadingOrders={isLoadingOrders}
        ordersError={ordersError}
        orders={orders}
        handleLogout={handleLogout}
      />

    </div>
  );
}
