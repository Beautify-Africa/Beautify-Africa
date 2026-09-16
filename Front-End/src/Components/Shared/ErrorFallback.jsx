export default function ErrorFallback({ error, resetErrorBoundary }) {
  const isDev = Boolean(import.meta.env.DEV);

  return (
    <div
      role="alert"
      className="min-h-[400px] flex items-center justify-center bg-[#faf9f6] px-6 py-16 text-center"
    >
      <div className="max-w-md w-full bg-white border border-stone-200 p-8 md:p-10 shadow-sm rounded-sm">
        <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400 block mb-2">
          System Notice
        </span>
        <h2 className="font-serif text-2xl text-stone-900 mb-3">Something went wrong</h2>
        <p className="text-xs text-stone-600 leading-relaxed mb-6">
          We encountered an unexpected issue while loading this section. You can try refreshing the
          component or return to the main storefront.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {resetErrorBoundary && (
            <button
              type="button"
              onClick={resetErrorBoundary}
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors rounded-sm"
            >
              Try Again
            </button>
          )}
          <a
            href="/"
            className="w-full sm:w-auto px-6 py-3 border border-stone-300 text-stone-800 text-[11px] font-bold uppercase tracking-[0.2em] hover:border-stone-900 transition-colors rounded-sm inline-block"
          >
            Back to Home
          </a>
        </div>

        {isDev && error && (
          <details className="mt-8 text-left border-t border-stone-100 pt-4">
            <summary className="text-[11px] text-stone-500 cursor-pointer font-mono hover:text-stone-800">
              Debug Information
            </summary>
            <div className="mt-3 p-3 bg-stone-900 text-stone-100 rounded text-[11px] font-mono overflow-auto max-h-48 whitespace-pre-wrap">
              <p className="font-bold text-red-400 mb-1">
                {error.name}: {error.message}
              </p>
              {error.stack}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
