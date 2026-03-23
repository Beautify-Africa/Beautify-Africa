import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FloatingLabelInput from '../Shared/FloatingLabelInput';
import TermsConsentCheckbox from '../Shared/TermsConsentCheckbox';

function withIdPrefix(field, prefix) {
  return {
    ...field,
    id: `${prefix}-${field.id}`,
  };
}

export default function AuthModeForm({
  mode,
  content,
  fields,
  terms,
  onSuccess,
  onBack,
  backLabel,
  onSecondaryAction,
  inputIdPrefix = 'auth',
}) {
  const { register, login, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const nameField = useMemo(() => withIdPrefix(fields.name, inputIdPrefix), [fields.name, inputIdPrefix]);
  const emailField = useMemo(() => withIdPrefix(fields.email, inputIdPrefix), [fields.email, inputIdPrefix]);
  const passwordField = useMemo(
    () =>
      withIdPrefix(
        {
          ...fields.password,
          autoComplete: mode === 'login' ? 'current-password' : 'new-password',
        },
        inputIdPrefix
      ),
    [fields.password, inputIdPrefix, mode]
  );

  useEffect(() => {
    clearError();

    return clearError;
  }, [clearError, mode]);

  const handleBack = useCallback(() => {
    if (loading || !onBack) return;

    clearError();
    onBack();
  }, [clearError, loading, onBack]);

  const handleSecondaryAction = useCallback(() => {
    if (loading || !onSecondaryAction) return;

    clearError();
    onSecondaryAction();
  }, [clearError, loading, onSecondaryAction]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      let authResult;

      if (mode === 'login') {
        authResult = await login({ email, password });
      } else {
        authResult = await register({ name, email, password });
      }

      clearError();
      onSuccess(authResult.user);
    } catch {
      // AuthContext stores the error for inline display.
    }
  };

  return (
    <div className="animate-fade-in">
      {onBack && backLabel && (
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="mb-6 flex items-center gap-1 text-xs text-stone-400 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-stone-400"
        >
          {backLabel}
        </button>
      )}

      <header className="mb-8">
        {content.badge && (
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
            {content.badge}
          </span>
        )}
        <h3 className="font-serif text-2xl text-stone-900">{content.title}</h3>
        {content.description && <p className="mt-3 text-sm leading-relaxed text-stone-500">{content.description}</p>}
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <FloatingLabelInput
            field={nameField}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}

        <FloatingLabelInput
          field={emailField}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <FloatingLabelInput
          field={passwordField}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {mode === 'register' && terms && (
          <TermsConsentCheckbox
            id={`${inputIdPrefix}-terms`}
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            prefixText={terms.prefixText}
            termsLabel={terms.termsLabel}
            termsHref={terms.termsHref}
            privacyLabel={terms.privacyLabel}
            privacyHref={terms.privacyHref}
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
          {loading ? content.loadingLabel || 'Please wait...' : content.submitLabel}
        </button>
      </form>

      {content.switchText && content.switchLabel && onSecondaryAction && (
        <p className="mt-6 text-center text-xs text-stone-500">
          {content.switchText}{' '}
          <button
            type="button"
            onClick={handleSecondaryAction}
            disabled={loading}
            className="font-bold text-stone-900 underline transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-stone-900"
          >
            {content.switchLabel}
          </button>
        </p>
      )}
    </div>
  );
}
