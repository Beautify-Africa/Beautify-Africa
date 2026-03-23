import { useCallback, useEffect } from 'react';
import { GATE_CONTENT } from '../../data/checkoutGateContent';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import AuthModeForm from './AuthModeForm';
import { CloseIcon } from '../Shared/Icons';

const ACCOUNT_AUTH_COPY = {
  badge: 'Member Access',
  title: 'Sign in before you are ready to buy',
  description: 'Keep your account active while you browse, then head to checkout whenever it feels right.',
  submitLabel: 'Sign In',
};

const TERMS_COPY = {
  prefixText: GATE_CONTENT.termsText,
  termsLabel: GATE_CONTENT.termsLabel,
  termsHref: '/terms',
  privacyLabel: GATE_CONTENT.privacyLabel,
  privacyHref: '/privacy',
};

export default function AccountAuthDialog({ isOpen, onClose }) {
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSuccess = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to your account"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        ref={trapRef}
        className="relative w-full max-w-xl overflow-hidden rounded-sm border border-stone-200 bg-white shadow-2xl shadow-stone-900/20"
      >
        <div className="border-b border-stone-100 bg-[#faf9f6] px-6 py-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-400">My Account</p>
              <h2 className="mt-2 font-serif text-3xl text-stone-900">Stay signed in while you shop</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-500">
                This keeps your account ready without sending you into checkout before you want to go there.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-stone-400 transition-colors hover:bg-white hover:text-stone-900"
              aria-label="Close account dialog"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

        </div>

        <div className="px-6 py-6 sm:px-8">
          <AuthModeForm
            mode="login"
            content={ACCOUNT_AUTH_COPY}
            fields={GATE_CONTENT.formFields}
            terms={TERMS_COPY}
            onSuccess={handleSuccess}
            inputIdPrefix="account"
          />
        </div>
      </section>
    </div>
  );
}
