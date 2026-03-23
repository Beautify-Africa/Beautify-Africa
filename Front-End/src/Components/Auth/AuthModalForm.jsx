import { AUTH_CONTENT, FORM_FIELDS, LEGAL_LINKS } from '../../data/authContent';
import FloatingLabelInput from '../Shared/FloatingLabelInput';
import TermsConsentCheckbox from '../Shared/TermsConsentCheckbox';

export default function AuthModalForm({
  isLogin,
  loading,
  error,
  name,
  email,
  password,
  termsAccepted,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onTermsChange,
  onSubmit,
  onToggleMode,
}) {
  const content = isLogin ? AUTH_CONTENT.login : AUTH_CONTENT.register;

  return (
    <div className="relative flex w-full flex-col justify-center bg-white p-10 md:w-1/2 md:p-16">
      <header className="mb-10 text-center md:text-left">
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
          {content.badge}
        </span>
        <h2 id="auth-modal-title" className="font-serif text-4xl tracking-tight text-stone-900 md:text-5xl">
          {content.heading}
        </h2>
      </header>

      <form className="space-y-8" onSubmit={onSubmit}>
        {!isLogin && (
          <FloatingLabelInput
            field={FORM_FIELDS.name}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        )}

        <FloatingLabelInput
          field={FORM_FIELDS.email}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />

        <FloatingLabelInput
          field={{
            ...FORM_FIELDS.password,
            autoComplete: isLogin ? 'current-password' : 'new-password',
          }}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />

        {!isLogin && (
          <TermsConsentCheckbox
            id="auth-terms"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            prefixText="I agree to the"
            termsLabel={LEGAL_LINKS.terms.label}
            termsHref={LEGAL_LINKS.terms.href}
            privacyLabel={LEGAL_LINKS.privacy.label}
            privacyHref={LEGAL_LINKS.privacy.href}
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
          className="w-full bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-stone-900"
        >
          {loading ? 'Please wait...' : content.submitLabel}
        </button>
      </form>

      <footer className="mt-8 border-t border-stone-100 pt-6 text-center md:text-left">
        <p className="text-xs text-stone-500">
          {content.switchText}{' '}
          <button
            type="button"
            onClick={onToggleMode}
            disabled={loading}
            className="ml-1 font-bold text-stone-900 underline transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-stone-900"
          >
            {content.switchLabel}
          </button>
        </p>
      </footer>
    </div>
  );
}
