import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrders } from '../services/ordersApi';

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfilePage() {
  const { user, token, updateProfile } = useAuth();
  
  // Account Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      if (!token) return;
      setIsLoadingOrders(true);
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
    return () => { active = false; };
  }, [token]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);
    setUpdateError(null);

    const payload = { name, email };
    if (password.trim() !== '') {
      payload.password = password;
    }

    try {
      await updateProfile(payload);
      setUpdateMessage('Account details successfully updated.');
      setPassword('');
    } catch (err) {
      setUpdateError(err.message || 'Failed to update account.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#faf9f6] flex items-center justify-center">
        <p className="text-stone-500 uppercase tracking-widest text-xs font-bold">Please log in to view your profile.</p>
      </div>
    );
  }

  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.createdAt || Date.now()));

  return (
    <>
      <Helmet>
        <title>My Account | Beautify Africa</title>
        <meta name="description" content="Manage your personal profile and view your past orders with Beautify Africa." />
      </Helmet>

      <div className="min-h-screen bg-[#faf9f6] pt-32 pb-24 text-stone-900">
        <main id="main-content" className="mx-auto max-w-6xl px-6 lg:px-12">
          
          <header className="mb-12 border-b border-stone-200 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-700">Client Dashboard</p>
              <h1 className="font-serif text-5xl md:text-6xl text-stone-900">My Account</h1>
            </div>
            
            <div className="flex items-center gap-4 border border-stone-200 bg-white px-5 py-4 rounded-sm shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold uppercase tracking-widest">
                {getInitials(user.name)}
              </div>
              <div>
                <p className="font-serif text-lg leading-tight">{user.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Member since {memberSince}</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 xl:gap-20">
            {/* Account Settings Column */}
            <section className="lg:col-span-5">
              <div className="sticky top-32 lg:pr-8 border-b lg:border-b-0 lg:border-r border-stone-200 pb-12 lg:pb-0">
                <h2 className="font-serif text-3xl mb-8">Personal Details</h2>
                
                <form onSubmit={handleUpdateAccount} className="space-y-6">
                  {updateMessage && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-sm">
                      {updateMessage}
                    </div>
                  )}
                  {updateError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-sm">
                      {updateError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="w-full border-b border-stone-300 bg-transparent px-0 py-3 text-sm focus:border-stone-900 focus:outline-none focus:ring-0 transition-colors"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full border-b border-stone-300 bg-transparent px-0 py-3 text-sm focus:border-stone-900 focus:outline-none focus:ring-0 transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 mb-2" htmlFor="password">
                      Change Password (Optional)
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Leave blank to keep current password"
                      className="w-full border-b border-stone-300 bg-transparent px-0 py-3 text-sm focus:border-stone-900 focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-300"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full mt-8 bg-stone-900 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.25em] text-white transition-all hover:bg-amber-900 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving Changes...' : 'Update Details'}
                  </button>
                </form>
              </div>
            </section>

            {/* Order History Column */}
            <section className="lg:col-span-7">
              <h2 className="font-serif text-3xl mb-8">Purchase History</h2>
              
              {isLoadingOrders ? (
                <div className="flex py-12 justify-center border border-stone-200 bg-white shadow-sm rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Loading your history...</p>
                </div>
              ) : ordersError ? (
                <div className="p-6 bg-red-50 border border-red-200 text-red-800 text-sm rounded-sm">
                  {ordersError}
                </div>
              ) : orders.length === 0 ? (
                <div className="border border-stone-200 bg-white p-12 text-center shadow-sm rounded-sm">
                  <p className="font-serif text-xl mb-3 text-stone-900">No active orders</p>
                  <p className="text-sm text-stone-500 mb-6 max-w-sm mx-auto">
                    You haven't placed any orders with Beautify Africa yet. Discover our latest formulations in the shop.
                  </p>
                  <a href="/shop" className="inline-block border border-stone-900 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white">
                    Explore Shop
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-stone-200 bg-white shadow-sm rounded-sm overflow-hidden">
                      <div className="bg-[#f5f4ef] px-6 py-4 border-b border-stone-200 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Order Placed</p>
                          <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Total Amount</p>
                          <p className="text-sm font-bold text-stone-900">${order.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right flex-grow md:flex-grow-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-1">Order #</p>
                          <p className="text-xs text-stone-500">{order._id}</p>
                        </div>
                      </div>
                      
                      <div className="px-6 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                          <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center justify-center p-1 rounded-full border ${order.isPaid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                                  <span className={`h-2 w-2 rounded-full ${order.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest text-stone-700">
                                  {order.isPaid ? 'Payment Cleared' : 'Awaiting Payment'}
                              </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center justify-center p-1 rounded-full border ${order.isDelivered ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-stone-50'}`}>
                                  <span className={`h-2 w-2 rounded-full ${order.isDelivered ? 'bg-emerald-500' : 'bg-stone-300'}`}></span>
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest text-stone-700">
                                  {order.isDelivered ? 'Delivered' : 'Processing Cargo'}
                              </span>
                          </div>
                      </div>

                      <div className="px-6 py-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">Packaged Items</h4>
                        <ul className="divide-y divide-stone-100">
                          {order.orderItems.map((item, idx) => (
                            <li key={idx} className="py-4 flex gap-4 items-center">
                              <div className="h-16 w-16 bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden">
                                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />}
                              </div>
                              <div className="flex-grow">
                                <a href={`/shop/${item.product}`} className="font-serif text-lg text-stone-900 transition-colors hover:text-amber-800">
                                  {item.name}
                                </a>
                                <p className="text-xs text-stone-500 mt-1">Qty: {item.qty} &times; ${item.price.toFixed(2)}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
