import { StarIcon } from '../Shared/Icons';

function ReviewRating({ rating }) {
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <StarIcon
          key={index}
          className={`w-3 h-3 ${index < rating ? 'text-amber-500' : 'text-stone-200'}`}
        />
      ))}
    </div>
  );
}

export default function ProductReviewList({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-stone-400 text-sm italic">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, index) => (
        <div key={review._id || index} className="border-b border-stone-100 pb-6">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-sm text-stone-900">{review.name}</span>
            <ReviewRating rating={review.rating} />
          </div>
          <span className="text-[10px] text-stone-400 uppercase tracking-widest block mb-3">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
          <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
