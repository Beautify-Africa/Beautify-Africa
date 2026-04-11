import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../Components/Shared/Seo';
import { confirmNewsletterUnsubscribe } from '../services/newsletterApi';

export default function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = String(searchParams.get('token') || '').trim();
  const hasToken = token.length > 0;

  async function handleConfirm(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await confirmNewsletterUnsubscribe(token);
      setSuccessMessage(response.message || 'You have been unsubscribed from the Beautify Africa newsletter.');
    } catch (unsubscribeError) {
      setError(unsubscribeError.message || 'Unable to unsubscribe right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Seo
        title="Unsubscribe | Beautify Africa"
        description="Confirm newsletter unsubscribe for Beautify Africa updates."
        path="/newsletter/unsubscribe"
        imageAlt="Beautify Africa unsubscribe confirmation"
      />
      <main id="main-content" className="min-h-screen bg-[#faf9f6] px-6 py-16 text-stone-900 sm:py-24">
        <section className="mx-auto max-w-xl rounded-sm border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Newsletter Preferences</p>
          <h1 className="mt-3 font-serif text-4xl text-stone-900">Confirm unsubscribe</h1>

          {!hasToken ? (
            <div className="mt-6 rounded-sm border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              Invalid or missing unsubscribe token. Request a fresh unsubscribe link.
            </div>
          ) : (
            <form className="mt-6 space-y-6" onSubmit={handleConfirm}>
              <p className="text-sm leading-relaxed text-stone-600">
                Click confirm to stop receiving Beautify Africa newsletter emails for this address.
              </p>

              {error ? <p className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {successMessage ? (
                <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || Boolean(successMessage)}
                className="w-full rounded-sm bg-stone-900 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Unsubscribe'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center space-x-4">
            <Link to="/newsletter/unsubscribe-request" className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600 underline hover:text-amber-700">
              Request New Link
            </Link>
            <Link to="/" className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600 underline hover:text-amber-700">
              Home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
