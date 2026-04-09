import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FloatingLabelInput from '../Shared/FloatingLabelInput';

export default function AdminInlineSignIn() {
  const { adminLogin, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailField = useMemo(
    () => ({
      id: 'admin-login-email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email',
      autoComplete: 'email',
    }),
    []
  );

  const passwordField = useMemo(
    () => ({
      id: 'admin-login-password',
      type: 'password',
      label: 'Password',
      placeholder: 'Password',
      autoComplete: 'current-password',
      minLength: 8,
    }),
    []
  );

  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await adminLogin({ email, password });
    } catch {
      // Auth context handles inline error messaging.
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-[1.5rem] border border-stone-200/80 bg-white/90 p-6 text-left shadow-[0_14px_38px_rgba(28,25,23,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Admin Sign In</p>
      <h2 className="mt-2 font-serif text-2xl text-stone-900">Access Operations Console</h2>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
        <FloatingLabelInput field={emailField} value={email} onChange={(e) => setEmail(e.target.value)} />
        <FloatingLabelInput field={passwordField} value={password} onChange={(e) => setPassword(e.target.value)} />

        {error ? (
          <p className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-stone-900 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
