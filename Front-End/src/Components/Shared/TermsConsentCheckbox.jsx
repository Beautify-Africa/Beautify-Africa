import AppLink from './AppLink';

export default function TermsConsentCheckbox({
  id,
  checked,
  onChange,
  prefixText,
  termsLabel,
  termsHref,
  privacyLabel,
  privacyHref,
  required = true,
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-stone-900"
        required={required}
      />

      <label htmlFor={id} className="text-xs leading-relaxed text-stone-500">
        {prefixText}{' '}
        <AppLink href={termsHref} className="underline hover:text-stone-900">
          {termsLabel}
        </AppLink>{' '}
        and{' '}
        <AppLink href={privacyHref} className="underline hover:text-stone-900">
          {privacyLabel}
        </AppLink>
        .
      </label>
    </div>
  );
}
