import { CHECKOUT_COPY, CHECKOUT_COUNTRIES } from '../../data/checkoutContent';

const { shipping: S } = CHECKOUT_COPY;

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

function Input({ id, value, onChange, placeholder, type = 'text', maxLength, inputMode, autoComplete }) {
    return (
        <input
            id={id} type={type} value={value} onChange={onChange}
            placeholder={placeholder} maxLength={maxLength}
            inputMode={inputMode} autoComplete={autoComplete}
            className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors rounded-sm"
        />
    );
}

/**
 * Step 1 — Shipping / delivery details form
 */
export default function ShippingStep({ data, onChange, errors }) {
    return (
        <div className="space-y-4">
            <h3 className="font-serif text-xl text-stone-900 mb-5">{S.heading}</h3>

            <div className="grid grid-cols-2 gap-4">
                <Field label={S.fields.firstName} id="first-name" error={errors.firstName}>
                    <Input id="first-name" value={data.firstName} onChange={(e) => onChange('firstName', e.target.value)}
                        placeholder={S.placeholders.firstName} autoComplete="given-name" />
                </Field>
                <Field label={S.fields.lastName} id="last-name" error={errors.lastName}>
                    <Input id="last-name" value={data.lastName} onChange={(e) => onChange('lastName', e.target.value)}
                        placeholder={S.placeholders.lastName} autoComplete="family-name" />
                </Field>
            </div>

            <Field label={S.fields.email} id="email" error={errors.email}>
                <Input id="email" type="email" value={data.email} onChange={(e) => onChange('email', e.target.value)}
                    placeholder={S.placeholders.email} autoComplete="email" />
            </Field>

            <Field label={S.fields.address} id="address" error={errors.address}>
                <Input id="address" value={data.address} onChange={(e) => onChange('address', e.target.value)}
                    placeholder={S.placeholders.address} autoComplete="street-address" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label={S.fields.city} id="city" error={errors.city}>
                    <Input id="city" value={data.city} onChange={(e) => onChange('city', e.target.value)}
                        placeholder={S.placeholders.city} autoComplete="address-level2" />
                </Field>
                <Field label={S.fields.zip} id="zip" error={errors.zip}>
                    <Input id="zip" value={data.zip} onChange={(e) => onChange('zip', e.target.value)}
                        placeholder={S.placeholders.zip} autoComplete="postal-code" inputMode="numeric" />
                </Field>
            </div>

            <Field label={S.fields.country} id="country" error={errors.country}>
                <select
                    id="country" value={data.country} onChange={(e) => onChange('country', e.target.value)}
                    className="w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors rounded-sm"
                    autoComplete="country-name"
                >
                    <option value="">{S.placeholders.country}</option>
                    {CHECKOUT_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
            </Field>
        </div>
    );
}
