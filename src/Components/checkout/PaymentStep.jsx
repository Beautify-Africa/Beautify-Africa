import { CHECKOUT_COPY } from '../../data/checkoutContent';
import { maskCard, maskExpiry } from './checkoutUtils';

const { payment: P } = CHECKOUT_COPY;

function Field({ label, id, error, children }) {
    return (
        <div>
            <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="text-[10px] text-red-500 mt-1" role="alert">{error}</p>}
        </div>
    );
}

function Input({ id, value, onChange, placeholder, maxLength, inputMode, autoComplete }) {
    return (
        <input
            id={id} type="text" value={value} onChange={onChange}
            placeholder={placeholder} maxLength={maxLength}
            inputMode={inputMode} autoComplete={autoComplete}
            className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors rounded-sm"
        />
    );
}

/**
 * Step 2 — Payment details form with live card masking
 */
export default function PaymentStep({ data, onChange, errors }) {
    return (
        <div className="space-y-4">
            <h3 className="font-serif text-xl text-stone-900 mb-5">{P.heading}</h3>

            {/* Accepted card brands */}
            <div className="flex gap-2 mb-2">
                {P.acceptedBrands.map((brand) => (
                    <span key={brand} className="px-2 py-1 text-[9px] font-bold border border-stone-200 rounded text-stone-400">
                        {brand}
                    </span>
                ))}
                <span className="text-[9px] text-stone-400 self-center ml-1">Payments are demo-only</span>
            </div>

            <Field label={P.fields.cardNumber} id="card-number" error={errors.cardNumber}>
                <Input id="card-number" value={data.cardNumber}
                    onChange={(e) => onChange('cardNumber', maskCard(e.target.value))}
                    placeholder={P.placeholders.cardNumber} inputMode="numeric" maxLength={19} autoComplete="cc-number" />
            </Field>

            <Field label={P.fields.cardName} id="card-name" error={errors.cardName}>
                <Input id="card-name" value={data.cardName}
                    onChange={(e) => onChange('cardName', e.target.value)}
                    placeholder={P.placeholders.cardName} autoComplete="cc-name" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label={P.fields.expiry} id="expiry" error={errors.expiry}>
                    <Input id="expiry" value={data.expiry}
                        onChange={(e) => onChange('expiry', maskExpiry(e.target.value))}
                        placeholder={P.placeholders.expiry} inputMode="numeric" maxLength={5} autoComplete="cc-exp" />
                </Field>
                <Field label={P.fields.cvv} id="cvv" error={errors.cvv}>
                    <Input id="cvv" value={data.cvv}
                        onChange={(e) => onChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder={P.placeholders.cvv} inputMode="numeric" maxLength={4} autoComplete="cc-csc" />
                </Field>
            </div>

            <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">{P.demoNote}</p>
        </div>
    );
}
