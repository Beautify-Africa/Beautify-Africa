function CheckoutAuthIcon({ variant }) {
  if (variant === 'account') {
    return (
      <svg
        className="h-7 w-7 text-stone-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.7}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.5 7.5 0 0115 0"
        />
      </svg>
    );
  }

  if (variant === 'spark') {
    return (
      <svg
        className="h-7 w-7 text-amber-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.7}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-7 w-7 text-stone-700"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5l-1.5 9a2.25 2.25 0 01-2.22 1.88H7.47a2.25 2.25 0 01-2.22-1.88l-1.5-9zM9 10.5V6.75a3 3 0 016 0v3.75"
      />
    </svg>
  );
}

export default function CheckoutAuthOptionCard({ icon, title, description, onClick, highlighted = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-sm border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        highlighted
          ? 'border-stone-900 bg-stone-50 shadow-md'
          : 'border-stone-200 hover:border-stone-400'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5" aria-hidden="true">
          <CheckoutAuthIcon variant={icon} />
        </span>

        <div>
          <h4 className="font-serif text-lg text-stone-900 transition-colors group-hover:text-amber-800">
            {title}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
        </div>

        <svg
          className="mt-1 ml-auto h-5 w-5 flex-shrink-0 text-stone-300 transition-colors group-hover:text-stone-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
