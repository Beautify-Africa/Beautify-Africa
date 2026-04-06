export default function ProductReviewForm({
  isAuthenticated,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  onSubmit,
  isSubmitting,
  error,
  success,
}) {
  return (
    <div className="bg-stone-50 p-6 rounded-sm">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 mb-4">
        Write a Review
      </h4>

      {isAuthenticated ? (
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <div className="text-red-500 text-xs font-bold">{error}</div> : null}
          {success ? <div className="text-green-600 text-xs font-bold">{success}</div> : null}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">
              Rating
            </label>
            <select
              value={rating}
              onChange={(event) => onRatingChange(Number(event.target.value))}
              className="w-full p-3 text-sm border border-stone-200 outline-none focus:border-stone-400 bg-white"
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very Good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              rows="3"
              className="w-full p-3 text-sm border border-stone-200 outline-none focus:border-stone-400"
              placeholder="Share your experience..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <p className="text-xs text-stone-500">Please sign in to write a review.</p>
      )}
    </div>
  );
}
