import { useState } from 'react';
import { NEWSLETTER_CONTENT } from '../../data/newsletterContent';
import FadeIn from './FadeIn';

const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement newsletter signup logic
    console.log('Newsletter signup:', email);
  };

  return (
    <section
      id="society"
      className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-[#faf9f6]"
      aria-labelledby="newsletter-heading"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row bg-[#F2F0EB] rounded-2xl md:rounded-sm overflow-hidden shadow-sm border border-stone-200">
          {/* Image Section */}
          <figure className="relative w-full lg:w-5/12 h-[300px] sm:h-[400px] lg:h-auto overflow-hidden group">
            <div className="absolute inset-0 bg-stone-900/10 z-10" aria-hidden="true" />
            <img
              src={NEWSLETTER_CONTENT.image}
              alt=""
              className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              loading="lazy"
            />
            <figcaption className="absolute bottom-6 left-6 z-20 hidden lg:block">
              <span className="text-white/80 text-[10px] uppercase tracking-[0.4em] font-light">
                {NEWSLETTER_CONTENT.imageCaption}
              </span>
            </figcaption>
          </figure>

          {/* Content Section */}
          <div className="w-full lg:w-7/12 p-8 sm:p-10 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden">
            {/* Radial dot-grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(160,110,40,0.55) 1.5px, transparent 1.5px)',
                backgroundSize: '22px 22px',
                maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 0%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 0%, transparent 100%)',
                opacity: 0.7,
              }}
            />

            {/* Decorative Icon */}
            <div
              className="absolute top-6 right-6 md:top-10 md:right-10 opacity-5 pointer-events-none hidden sm:block"
              aria-hidden="true"
            >
              <svg width="80" height="80" viewBox="0 0 100 100" fill="currentColor" className="text-stone-900">
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M50 20v60M20 50h60" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>

            <FadeIn className="relative z-10" delay={0.2}>
              <span className="inline-block mb-4 md:mb-6 text-amber-700 text-[10px] font-bold uppercase tracking-[0.3em]">
                {NEWSLETTER_CONTENT.tagline}
              </span>

              <h2
                id="newsletter-heading"
                className="text-3xl sm:text-4xl md:text-6xl font-serif text-stone-900 mb-4 md:mb-6 leading-[1.1] md:leading-[0.95] tracking-tight"
              >
                {NEWSLETTER_CONTENT.heading}
              </h2>

              <p className="text-stone-600 font-light text-base md:text-lg leading-relaxed max-w-md mb-8 md:mb-12">
                {NEWSLETTER_CONTENT.description}
              </p>

              {/* Signup Form */}
              <form
                className="w-full max-w-md"
                onSubmit={handleSubmit}
                aria-label="Newsletter signup"
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 sm:gap-6">
                  <div className="flex-1 relative">
                    <label htmlFor="newsletter-email" className="sr-only">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="newsletter-email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-stone-400 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors font-serif italic text-lg md:text-xl"
                      placeholder={NEWSLETTER_CONTENT.placeholder}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-stone-900 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm sm:rounded-none"
                  >
                    {NEWSLETTER_CONTENT.submitLabel}
                  </button>
                </div>

                <p className="mt-4 text-[9px] md:text-[10px] text-stone-400 tracking-wide uppercase">
                  {NEWSLETTER_CONTENT.disclaimer}
                </p>
              </form>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;

