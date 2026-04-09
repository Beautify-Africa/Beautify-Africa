import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ProfileDetailsForm from '../Components/Profile/ProfileDetailsForm';
import ProfileHeader from '../Components/Profile/ProfileHeader';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
  }, [user]);

  const handleUpdateAccount = async (event) => {
    event.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);
    setUpdateError(null);

    const payload = { name, email };
    if (password.trim() !== '') payload.password = password;

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
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-[#faf9f6]">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Please log in to view your profile.</p>
      </div>
    );
  }

  const memberSince = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt || Date.now()));

  return (
    <>
      <Helmet>
        <title>My Account | Beautify Africa</title>
        <meta name="description" content="Manage your personal profile settings with Beautify Africa." />
      </Helmet>

      <div className="min-h-screen bg-[#faf9f6] pb-24 pt-32 text-stone-900">
        <main id="main-content" className="mx-auto max-w-6xl px-6 lg:px-12">
          <ProfileHeader user={user} memberSince={memberSince} />

          <div className="mx-auto max-w-3xl">
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
          </div>
        </main>
      </div>
    </>
  );
}
