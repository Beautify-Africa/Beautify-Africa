const InteractiveButton = ({ label, primary = false }) => {
  const baseStyles = `
    group relative overflow-hidden px-10 py-5 text-[11px] uppercase tracking-[0.4em] font-bold
    transition-all duration-700 rounded-sm w-full sm:w-auto
  `;
  
  const variantStyles = primary 
    ? 'bg-stone-900 text-white hover:bg-black' 
    : 'bg-transparent text-stone-900 border border-stone-200 hover:border-stone-900';
  
  const fillStyles = primary ? 'bg-stone-800' : 'bg-stone-50';

  return (
    <button className={`${baseStyles} ${variantStyles}`}>
      {/* Minimalist fill effect */}
      <span 
        className={`absolute inset-0 w-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:w-full ${fillStyles}`}
        aria-hidden="true"
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-3">
        <span>{label}</span>
        <svg 
          className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.2" 
            d="M14 5l7 7m0 0l-7 7m7-7H3" 
          />
        </svg>
      </span>
    </button>
  );
};

export default InteractiveButton;
