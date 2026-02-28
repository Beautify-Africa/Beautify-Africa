import { StarIcon } from './Icons';
import { SOCIAL_PROOF_CONTENT } from '../../data/socialProof';


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

