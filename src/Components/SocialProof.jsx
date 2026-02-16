import { StarIcon } from './Icons';

/**
 * SocialProof content configuration
 */
const SOCIAL_PROOF_CONTENT = {
  userCount: '50,000+ Radiant Faces',
  avatars: [
    { id: 1, src: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', alt: 'Happy customer' },
    { id: 2, src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', alt: 'Happy customer' },
    { id: 3, src: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=150&h=150&fit=crop&crop=face', alt: 'Happy customer' },
  ],
  starCount: 5,
};

/**
 * Avatar stack
 */
function AvatarStack({ avatars }) {
  return (
    <div className="flex -space-x-2">
      {avatars.map((avatar) => (
        <img
          key={avatar.id}
          src={avatar.src}
          alt={avatar.alt}
          className="w-7 h-7 rounded-full border border-white"
          loading="lazy"
        />
      ))}
    </div>
  );
}

/**
 * Star rating display
 */
function StarRating({ count }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
      {[...Array(count)].map((_, i) => (
        <StarIcon key={i} className="w-3 h-3 text-stone-800" />
      ))}
    </div>
  );
}

/**
 * SocialProof - Compact social proof widget showing ratings and user count
 */
export default function SocialProof() {
  return (
    <div
      className="inline-flex items-center gap-4 py-2 px-4 bg-white/40 backdrop-blur-md rounded-full border border-white/50 shadow-sm"
      role="complementary"
      aria-label="Customer satisfaction"
    >
      <AvatarStack avatars={SOCIAL_PROOF_CONTENT.avatars} />
      <div className="flex flex-col">
        <StarRating count={SOCIAL_PROOF_CONTENT.starCount} />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-800">
          {SOCIAL_PROOF_CONTENT.userCount}
        </span>
      </div>
    </div>
  );
}
