import React from 'react';

const SocialProof: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-4 py-2 px-4 bg-white/40 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
      <div className="flex -space-x-2">
        <img src="https://picsum.photos/id/1027/40/40" className="w-7 h-7 rounded-full border border-white" alt="User" />
        <img src="https://picsum.photos/id/1012/40/40" className="w-7 h-7 rounded-full border border-white" alt="User" />
        <img src="https://picsum.photos/id/1011/40/40" className="w-7 h-7 rounded-full border border-white" alt="User" />
      </div>
      <div className="flex flex-col">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-3 h-3 text-stone-800 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-800">50,000+ Radiant Faces</span>
      </div>
    </div>
  );
};

export default SocialProof;
