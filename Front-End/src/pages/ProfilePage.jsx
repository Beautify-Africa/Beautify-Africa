import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrders } from '../services/ordersApi';
import ProfileHeader from '../Components/Profile/ProfileHeader';
import ProfileDetailsForm from '../Components/Profile/ProfileDetailsForm';
import ProfileOrdersSection from '../Components/Profile/ProfileOrdersSection';

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
          <ProfileHeader user={user} memberSince={memberSince} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 xl:gap-20">
            <ProfileDetailsForm
              name={name}
              email={email}
              password={password}
              isUpdating={isUpdating}
              updateMessage={updateMessage}
              updateError={updateError}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleUpdateAccount}
            />

            <ProfileOrdersSection
              isLoadingOrders={isLoadingOrders}
              ordersError={ordersError}
              orders={orders}
            />
          </div>
        </main>
      </div>
    </>
  );
}
