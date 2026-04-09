import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../Components/Shared/Seo';
import FloatingLabelInput from '../Components/Shared/FloatingLabelInput';
import { submitPasswordReset } from '../services/authApi';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = String(searchParams.get('token') || '').trim();
  const hasToken = token.length > 0;

  const passwordField = useMemo(
    () => ({
      id: 'reset-password',
      type: 'password',
      label: 'New Password',
      placeholder: 'New Password',
      autoComplete: 'new-password',
      minLength: 8,
    }),
    []
  );

  const confirmField = useMemo(
    () => ({
      id: 'reset-password-confirm',
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm Password',
      autoComplete: 'new-password',
      minLength: 8,
    }),
    []
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await submitPasswordReset({ token, password });
      setSuccessMessage(response.message || 'Password reset successful.');
      setPassword('');
      setConfirmPassword('');
    } catch (resetError) {
      setError(resetError.message || 'Unable to reset your password right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Seo
        title="Reset Password | Beautify Africa"
        description="Reset your Beautify Africa account password securely."
        path="/reset-password"
        imageAlt="Beautify Africa password reset"
      />
      <main id="main-content" className="min-h-screen bg-[#faf9f6] px-6 py-16 text-stone-900 sm:py-24">
        <section className="mx-auto max-w-xl rounded-sm border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Secure Reset</p>
          <h1 className="mt-3 font-serif text-4xl text-stone-900">Set a new password</h1>

          {!hasToken ? (
            <div className="mt-6 rounded-sm border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              Invalid or missing reset token. Please request a new password reset link.
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <FloatingLabelInput field={passwordField} value={password} onChange={(event) => setPassword(event.target.value)} />
              <FloatingLabelInput field={confirmField} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />

              {error ? <p className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {successMessage ? <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/shop?auth=1" className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600 underline hover:text-amber-700">
              Return to Sign In
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
