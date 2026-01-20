import { useState, useCallback } from 'react';
import { CloseIcon } from './Icons';
import {
  AUTH_CONTENT,
  AUTH_IMAGE,
  FORM_FIELDS,
  LEGAL_LINKS,
} from '../data/authContent';

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
    <div className="hidden md:block w-1/2 relative bg-stone-200">
      <img
        src={AUTH_IMAGE.src}
        alt={AUTH_IMAGE.alt}
        className="absolute inset-0 w-full h-full object-cover opacity-90"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"
        aria-hidden="true"
      />
      <figure className="absolute bottom-12 left-12 right-12 text-white">
        <blockquote className="font-serif italic text-3xl mb-4 leading-tight">
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
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const content = isLogin ? AUTH_CONTENT.login : AUTH_CONTENT.register;

  const toggleMode = useCallback(() => {
    setIsLogin((prev) => !prev);
    // Reset form when switching modes
    setEmail('');
    setPassword('');
    setTermsAccepted(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement authentication logic
    console.log(isLogin ? 'Login' : 'Register', { email, password });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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
      <div className="relative w-full max-w-4xl bg-[#faf9f6] rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 text-stone-400 hover:text-stone-900 transition-colors p-2"
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
            <FloatingInput
              field={FORM_FIELDS.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FloatingInput
              field={FORM_FIELDS.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isLogin && (
              <TermsCheckbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
            )}

            <button
              type="submit"
              className="w-full bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {content.submitLabel}
            </button>
          </form>

          <footer className="mt-8 text-center md:text-left pt-6 border-t border-stone-100">
            <p className="text-xs text-stone-500">
              {content.switchText}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-bold text-stone-900 underline hover:text-amber-700 transition-colors ml-1"
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
