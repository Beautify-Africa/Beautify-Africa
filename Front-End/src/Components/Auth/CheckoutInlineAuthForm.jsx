import { GATE_CONTENT } from '../../data/checkoutGateContent';
import AuthModeForm from './AuthModeForm';

const G = GATE_CONTENT;

export default function CheckoutInlineAuthForm({ mode, onSubmit, onBack }) {
  const content = mode === 'login' ? G.options.login : G.options.register;

  return (
    <AuthModeForm
      mode={mode}
      content={content}
      fields={G.formFields}
      terms={{
        prefixText: G.termsText,
        termsLabel: G.termsLabel,
        termsHref: '/terms',
        privacyLabel: G.privacyLabel,
        privacyHref: '/privacy',
      }}
      onSuccess={onSubmit}
      onBack={onBack}
      backLabel={G.backLabel}
      onSecondaryAction={onBack}
      inputIdPrefix="checkout"
    />
  );
}
