import { useMemo, useState } from 'react';
import FloatingLabelInput from '../Shared/FloatingLabelInput';
import { requestPasswordReset } from '../../services/authApi';

export default function ForgotPasswordForm({ emailTemplate, inputIdPrefix = 'forgot', onBack }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const emailField = useMemo(
    () => ({ ...emailTemplate, id: `${inputIdPrefix}-${emailTemplate.id}` }),
    [emailTemplate, inputIdPrefix]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await requestPasswordReset({ email });
      setSuccessMessage(response.message || 'If an account exists, reset instructions were sent.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to start password reset right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="mb-6 text-xs text-stone-400 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Back to sign in
      </button>

      <header className="mb-8">
        <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Password Recovery</span>
        <h3 className="font-serif text-2xl text-stone-900">Forgot your password?</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">Enter your account email and we will send you a secure password reset link.</p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FloatingLabelInput
          field={emailField}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {error ? <p className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {successMessage ? <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
