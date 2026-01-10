
import React from 'react';

interface Props {
  label: string;
  primary?: boolean;
}

const InteractiveButton: React.FC<Props> = ({ label, primary }) => {
  return (
    <button className={`
      group relative overflow-hidden px-10 py-5 text-[12px] uppercase tracking-[0.3em] font-bold
      transition-all duration-500 rounded-sm
      ${primary ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-transparent text-stone-900 border border-stone-900 hover:text-white'}
    `}>
      {/* Background slide effect */}
      <span className={`
        absolute inset-0 w-0 bg-stone-700 transition-all duration-500 ease-out group-hover:w-full
        ${primary ? 'opacity-0 group-hover:opacity-10' : ''}
      `}></span>

      {/* Modern sliding text */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        <span className="inline-block transform group-hover:-translate-y-10 transition-transform duration-500">{label}</span>
        <span className="absolute transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">{label}</span>
        
        <svg className="w-4 h-4 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>

      {/* Accent corner dots */}
      <span className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
      <span className="absolute bottom-1 right-1 w-1 h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
    </button>
  );
};

export default InteractiveButton;