import { useState, useCallback } from 'react';
import { GATE_CONTENT } from '../../data/checkoutGateContent';
import CheckoutAuthOptionCard from './CheckoutAuthOptionCard';
import CheckoutInlineAuthForm from './CheckoutInlineAuthForm';

const G = GATE_CONTENT;

/**
 * Step 0 of checkout auth: lets users sign in, register, or continue as guest.
 * @param {function} onContinue - called with { isGuest: boolean } when ready to proceed
 */
export default function AuthGateStep({ onContinue }) {
  const [view, setView] = useState('options');

  const handleGuest = useCallback(() => {
    onContinue({ isGuest: true });
  }, [onContinue]);

  const handleAuthSuccess = useCallback((user) => {
    onContinue({ isGuest: false, user });
  }, [onContinue]);

  const backToOptions = useCallback(() => {
    setView('options');
  }, []);

  if (view === 'options') {
    return (
      <div className="animate-fade-in">
        <div className="mb-8 text-center">
          <h3 className="mb-2 font-serif text-2xl text-stone-900">{G.heading}</h3>
          <p className="text-sm text-stone-500">{G.subheading}</p>
        </div>

        <div className="space-y-3">
          <CheckoutAuthOptionCard
            icon={G.options.login.icon}
            title={G.options.login.title}
            description={G.options.login.description}
            onClick={() => setView('login')}
          />

          <CheckoutAuthOptionCard
            icon={G.options.register.icon}
            title={G.options.register.title}
            description={G.options.register.description}
            onClick={() => setView('register')}
          />

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">or</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <CheckoutAuthOptionCard
            icon={G.options.guest.icon}
            title={G.options.guest.title}
            description={G.options.guest.description}
            onClick={handleGuest}
            highlighted
          />
        </div>
      </div>
    );
  }

  return <CheckoutInlineAuthForm mode={view} onSubmit={handleAuthSuccess} onBack={backToOptions} />;
}
