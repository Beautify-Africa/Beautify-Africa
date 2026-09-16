import { CHECKOUT_COPY, CHECKOUT_COUNTRIES } from '../../data/checkoutContent';

const { shipping: S } = CHECKOUT_COPY;

function Field({ label, id, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 mb-1.5"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[10px] text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Input({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  inputMode,
  autoComplete,
  hasError,
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      autoComplete={autoComplete}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={`w-full border bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none transition-colors rounded-sm ${
        hasError ? 'border-red-400 focus:border-red-600' : 'border-stone-200 focus:border-stone-900'
      }`}
    />
  );
}

/**
 * Step 1 — Shipping / delivery details form with Zod error presentation and accessibility attributes
 */
export default function ShippingStep({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl text-stone-900 mb-5">{S.heading}</h3>

      <div className="grid grid-cols-2 gap-4">
        <Field label={S.fields.firstName} id="first-name" error={errors.firstName}>
          <Input
            id="first-name"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder={S.placeholders.firstName}
            autoComplete="given-name"
            hasError={Boolean(errors.firstName)}
          />
        </Field>
        <Field label={S.fields.lastName} id="last-name" error={errors.lastName}>
          <Input
            id="last-name"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            placeholder={S.placeholders.lastName}
            autoComplete="family-name"
            hasError={Boolean(errors.lastName)}
          />
        </Field>
      </div>

      <Field label={S.fields.email} id="email" error={errors.email}>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder={S.placeholders.email}
          autoComplete="email"
          hasError={Boolean(errors.email)}
        />
      </Field>

      <Field label={S.fields.address} id="address" error={errors.address}>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder={S.placeholders.address}
          autoComplete="street-address"
          hasError={Boolean(errors.address)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={S.fields.city} id="city" error={errors.city}>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder={S.placeholders.city}
            autoComplete="address-level2"
            hasError={Boolean(errors.city)}
          />
        </Field>
        <Field label={S.fields.zip} id="zip" error={errors.zip}>
          <Input
            id="zip"
            value={data.zip}
            onChange={(e) => onChange('zip', e.target.value)}
            placeholder={S.placeholders.zip}
            autoComplete="postal-code"
            inputMode="numeric"
            hasError={Boolean(errors.zip)}
          />
        </Field>
      </div>

      <Field label={S.fields.country} id="country" error={errors.country}>
        <select
          id="country"
          value={data.country}
          onChange={(e) => onChange('country', e.target.value)}
          aria-invalid={Boolean(errors.country)}
          aria-describedby={errors.country ? 'country-error' : undefined}
          className={`w-full border bg-white px-4 py-3 text-sm text-stone-900 focus:outline-none transition-colors rounded-sm ${
            errors.country
              ? 'border-red-400 focus:border-red-600'
              : 'border-stone-200 focus:border-stone-900'
          }`}
          autoComplete="country-name"
        >
          <option value="">{S.placeholders.country}</option>
          {CHECKOUT_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
