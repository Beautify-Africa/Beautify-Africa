import { useState, useCallback } from 'react';
import { GATE_CONTENT } from '../../data/checkoutGateContent';
import { LEGAL_LINKS } from '../../data/authContent';

const G = GATE_CONTENT;

/* ─── Shared floating-label input (mirrors AuthModal pattern) ─── */
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

/* ─── Option card ─── */
function OptionCard({ icon, title, description, onClick, highlighted }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left p-5 rounded-sm border transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-lg ${highlighted
                    ? 'border-stone-900 bg-stone-50 shadow-md'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
        >
            <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
                    {icon}
                </span>
                <div>
                    <h4 className="font-serif text-lg text-stone-900 group-hover:text-amber-800 transition-colors">
                        {title}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {description}
                    </p>
                </div>
                <svg
                    className="w-5 h-5 text-stone-300 group-hover:text-stone-600 flex-shrink-0 mt-1 ml-auto transition-colors"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}

/* ─── Inline auth form (login / register) ─── */
function InlineAuthForm({ mode, onSubmit, onBack }) {
    const content = mode === 'login' ? G.options.login : G.options.register;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: wire up real auth
        console.log(mode, { email, password });
        onSubmit();
    };

    return (
        <div className="animate-fade-in">
            {/* Back link */}
            <button
                type="button"
                onClick={onBack}
                className="text-xs text-stone-400 hover:text-stone-900 transition-colors mb-6 flex items-center gap-1"
            >
                {G.backLabel}
            </button>

            <header className="mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 block mb-3">
                    {content.badge}
                </span>
                <h3 className="font-serif text-2xl text-stone-900">{content.title}</h3>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <FloatingInput
                    field={G.formFields.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <FloatingInput
                    field={G.formFields.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {mode === 'register' && (
                    <div className="flex gap-3 items-start">
                        <input
                            type="checkbox"
                            id="gate-terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 accent-stone-900"
                            required
                        />
                        <label htmlFor="gate-terms" className="text-xs text-stone-500 leading-relaxed">
                            {G.termsText}{' '}
                            <a href={LEGAL_LINKS.terms.href} className="underline hover:text-stone-900">
                                {G.termsLabel}
                            </a>{' '}
                            and{' '}
                            <a href={LEGAL_LINKS.privacy.href} className="underline hover:text-stone-900">
                                {G.privacyLabel}
                            </a>.
                        </label>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-stone-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    {content.submitLabel}
                </button>
            </form>

            <p className="text-xs text-stone-500 mt-6 text-center">
                {content.switchText}{' '}
                <button
                    type="button"
                    onClick={onBack}
                    className="font-bold text-stone-900 underline hover:text-amber-700 transition-colors"
                >
                    {content.switchLabel}
                </button>
            </p>
        </div>
    );
}

/* ─── Main AuthGateStep ─── */
/**
 * Step 0 — Auth gate: lets users sign in, register, or continue as guest
 * @param {function} onContinue - called with { isGuest: boolean } when ready to proceed
 */
export default function AuthGateStep({ onContinue }) {
    const [view, setView] = useState('options'); // 'options' | 'login' | 'register'

    const handleGuest = useCallback(() => {
        onContinue({ isGuest: true });
    }, [onContinue]);

    const handleAuthSuccess = useCallback(() => {
        onContinue({ isGuest: false });
    }, [onContinue]);

    const backToOptions = useCallback(() => {
        setView('options');
    }, []);

    /* Options view */
    if (view === 'options') {
        return (
            <div className="animate-fade-in">
                <div className="text-center mb-8">
                    <h3 className="font-serif text-2xl text-stone-900 mb-2">
                        {G.heading}
                    </h3>
                    <p className="text-sm text-stone-500">{G.subheading}</p>
                </div>

                <div className="space-y-3">
                    <OptionCard
                        icon={G.options.login.icon}
                        title={G.options.login.title}
                        description={G.options.login.description}
                        onClick={() => setView('login')}
                    />
                    <OptionCard
                        icon={G.options.register.icon}
                        title={G.options.register.title}
                        description={G.options.register.description}
                        onClick={() => setView('register')}
                    />

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">or</span>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>

                    <OptionCard
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

    /* Login / Register form view */
    return (
        <InlineAuthForm
            mode={view}
            onSubmit={handleAuthSuccess}
            onBack={backToOptions}
        />
    );
}
