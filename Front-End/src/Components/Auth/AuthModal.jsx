import { useState, useCallback, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CloseIcon } from '../Shared/Icons';
import {
  AUTH_CONTENT,
  AUTH_IMAGE,
  FORM_FIELDS,
  LEGAL_LINKS,
} from '../../data/authContent';

/**
 * Floating label input field
 */
function FloatingInput({ field, value, onChange }) {
  return (
    <div className="relative">
      <input
        type={field.type}
        id={field.id}
        name={field.id}
        value={value}
        onChange={onChange}
        className="peer w-full border-b border-stone-300 py-2 text-stone-900 focus:border-stone-900 focus:outline-none transition-colors bg-transparent pt-4 placeholder-transparent"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        required
      />
      <label
        htmlFor={field.id}
        className="absolute left-0 top-0 text-[10px] uppercase tracking-wider text-stone-400 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-stone-800"
      >
        {field.label}
      </label>
    </div>
  );
}

/**
 * Visual side panel with image and quote
 */
function VisualPanel() {
  return (
    <div
      className="w-full md:w-1/2 relative min-h-[250px] md:min-h-0 flex items-end bg-cover bg-center"
      style={{ backgroundImage: `url(${AUTH_IMAGE.src})` }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"
        aria-hidden="true"
      />
      <figure className="relative z-10 p-8 md:p-12 text-white w-full">
        <blockquote className="font-serif italic text-2xl md:text-3xl mb-4 leading-tight">
          {AUTH_IMAGE.quote}
        </blockquote>
        <div className="w-12 h-[1px] bg-white/50 mb-4" aria-hidden="true" />
        <figcaption className="text-[10px] uppercase tracking-[0.3em] opacity-80">
          {AUTH_IMAGE.attribution}
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * Terms checkbox for registration
 */
function TermsCheckbox({ checked, onChange }) {
  return (
    <div className="flex gap-3 items-start">
      <input
        type="checkbox"
        id="auth-terms"
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-stone-900"
        required
      />
      <label htmlFor="auth-terms" className="text-xs text-stone-500 leading-relaxed">
        I agree to the{' '}
        <a href={LEGAL_LINKS.terms.href} className="underline hover:text-stone-900">
          {LEGAL_LINKS.terms.label}
        </a>{' '}
        and{' '}
        <a href={LEGAL_LINKS.privacy.href} className="underline hover:text-stone-900">
          {LEGAL_LINKS.privacy.label}
        </a>
        .
      </label>
    </div>
  );
}

/**
 * AuthModal - Authentication dialog for login/registration
 */
export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { register, login, loading, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const trapRef = useFocusTrap(isOpen);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setTermsAccepted(false);
    clearError();
  }, [clearError]);

  const handleClose = useCallback(() => {
    if (loading) return;

    resetForm();
    onClose();
  }, [loading, onClose, resetForm]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, isOpen]);

  const content = isLogin ? AUTH_CONTENT.login : AUTH_CONTENT.register;

  const toggleMode = useCallback(() => {
    if (loading) return;

    setIsLogin((prev) => !prev);
    resetForm();
  }, [loading, resetForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }

      handleClose();
      navigate('/shop');
    } catch {
      // AuthContext stores the error for display in the modal.
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-md animate-fade-in"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div ref={trapRef} className="relative w-full max-w-4xl bg-[#faf9f6] rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-6 right-6 z-20 p-2 text-stone-400 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-stone-400"
          aria-label="Close authentication dialog"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Visual Side */}
        <VisualPanel />

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white relative">
          <header className="mb-10 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 block mb-4">
              {content.badge}
            </span>
            <h2
              id="auth-modal-title"
              className="font-serif text-4xl md:text-5xl text-stone-900 tracking-tight"
            >
              {content.heading}
            </h2>
          </header>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {!isLogin && (
              <FloatingInput
                field={FORM_FIELDS.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <FloatingInput
              field={FORM_FIELDS.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FloatingInput
              field={{
                ...FORM_FIELDS.password,
                autoComplete: isLogin ? 'current-password' : 'new-password',
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isLogin && (
              <TermsCheckbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
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
              className="w-full bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-stone-900"
            >
              {loading ? 'Please wait...' : content.submitLabel}
            </button>
          </form>

          <footer className="mt-8 text-center md:text-left pt-6 border-t border-stone-100">
            <p className="text-xs text-stone-500">
              {content.switchText}{' '}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="ml-1 font-bold text-stone-900 underline transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-stone-900"
              >
                {content.switchLabel}
              </button>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

