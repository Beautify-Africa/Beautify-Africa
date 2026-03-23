import { useCallback, useEffect, useState } from 'react';
import { GATE_CONTENT } from '../../data/checkoutGateContent';
import { useAuth } from '../../hooks/useAuth';
import FloatingLabelInput from '../Shared/FloatingLabelInput';
import TermsConsentCheckbox from '../Shared/TermsConsentCheckbox';

const G = GATE_CONTENT;

export default function CheckoutInlineAuthForm({ mode, onSubmit, onBack }) {
  const content = mode === 'login' ? G.options.login : G.options.register;
  const { register, login, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => clearError, [clearError]);

  const handleBack = useCallback(() => {
    if (loading) return;

    clearError();
    onBack();
  }, [clearError, loading, onBack]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let authResult;

      if (mode === 'login') {
        authResult = await login({ email, password });
      } else {
        authResult = await register({ name, email, password });
      }

      clearError();
      onSubmit(authResult.user);
    } catch {
      // AuthContext stores the error for inline display.
    }
  };

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={handleBack}
        disabled={loading}
        className="mb-6 flex items-center gap-1 text-xs text-stone-400 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-stone-400"
      >
        {G.backLabel}
      </button>

      <header className="mb-8">
        <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
          {content.badge}
        </span>
        <h3 className="font-serif text-2xl text-stone-900">{content.title}</h3>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <FloatingLabelInput
            field={G.formFields.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <FloatingLabelInput
          field={G.formFields.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FloatingLabelInput
          field={{
            ...G.formFields.password,
            autoComplete: mode === 'login' ? 'current-password' : 'new-password',
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === 'register' && (
          <TermsConsentCheckbox
            id="gate-terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            prefixText={G.termsText}
            termsLabel={G.termsLabel}
            termsHref="/terms"
            privacyLabel={G.privacyLabel}
            privacyHref="/privacy"
          />
        )}

        {error && (
          <p
            role="alert"
            className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-colors duration-500 hover:-translate-y-0.5 hover:bg-amber-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-stone-900"
        >
          {loading ? 'Please wait...' : content.submitLabel}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-stone-500">
        {content.switchText}{' '}
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="font-bold text-stone-900 underline transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-stone-900"
        >
          {content.switchLabel}
        </button>
      </p>
    </div>
  );
}
