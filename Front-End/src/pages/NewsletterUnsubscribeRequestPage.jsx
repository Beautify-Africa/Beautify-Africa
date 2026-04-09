import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../Components/Shared/Seo';
import FloatingLabelInput from '../Components/Shared/FloatingLabelInput';
import { requestNewsletterUnsubscribe } from '../services/newsletterApi';

export default function NewsletterUnsubscribeRequestPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const emailField = useMemo(
    () => ({
      id: 'newsletter-unsubscribe-email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email Address',
      autoComplete: 'email',
    }),
    []
  );

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await requestNewsletterUnsubscribe(email);
      setSuccessMessage(response.message || 'If that email is subscribed, we have sent an unsubscribe link.');
      setEmail('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to request an unsubscribe link right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Seo
        title="Unsubscribe Request | Beautify Africa"
        description="Request a secure newsletter unsubscribe link from Beautify Africa."
        path="/newsletter/unsubscribe-request"
        imageAlt="Beautify Africa newsletter preferences"
      />
      <main id="main-content" className="min-h-screen bg-[#faf9f6] px-6 py-16 text-stone-900 sm:py-24">
        <section className="mx-auto max-w-xl rounded-sm border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Newsletter Preferences</p>
          <h1 className="mt-3 font-serif text-4xl text-stone-900">Request unsubscribe link</h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Enter the email address you used to subscribe. If it exists on our active newsletter list, we will send
            a secure confirmation link.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <FloatingLabelInput
              field={emailField}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            {error ? <p className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {successMessage ? (
              <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Sending...' : 'Send Unsubscribe Link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600 underline hover:text-amber-700">
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
