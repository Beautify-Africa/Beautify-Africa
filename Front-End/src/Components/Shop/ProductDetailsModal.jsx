import { useState } from 'react';
import { CloseIcon, StarIcon } from '../Shared/Icons';
import { useAuth } from '../../hooks/useAuth';
import { createReviewApi } from '../../services/productsApi';

/**
 * Product image with badge
 */
function ProductImage({ product }) {
  return (
    <div className="w-full md:w-1/2 h-[40vh] md:h-auto relative bg-stone-100">
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {product.isBestSeller && (
        <div className="absolute top-6 left-6 bg-amber-900 text-white text-[10px] uppercase tracking-widest px-3 py-1">
          Best Seller
        </div>
      )}
      {product.isNew && (
        <div className="absolute top-6 left-6 bg-stone-900 text-white text-[10px] uppercase tracking-widest px-3 py-1">
          New
        </div>
      )}
    </div>
  );
}

/**
 * Price display with sale price
 */
function PriceDisplay({ price, originalPrice }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-2xl font-serif text-amber-800">
        ${price.toFixed(2)}
      </span>
      {originalPrice && (
        <span className="text-lg text-stone-400 line-through">
          ${originalPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}

/**
 * Star rating with review count
 */
function RatingDisplay({ rating, reviews }) {
  return (
    <div className="flex items-center gap-1 ml-auto">
      <StarIcon className="w-4 h-4 text-amber-500" />
      <span className="text-sm font-bold text-stone-800">{Number(rating).toFixed(1)}</span>
      <span className="text-xs text-stone-400">({reviews} reviews)</span>
    </div>
  );
}

/**
 * Detail section (ingredients, how to use, etc.)
 */
function DetailSection({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-900 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * Skin type tags
 */
function SkinTypeTags({ skinTypes }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skinTypes.map((type) => (
        <span
          key={type}
          className="px-2 py-1 bg-stone-100 text-stone-600 text-[9px] uppercase tracking-wider"
        >
          {type}
        </span>
      ))}
    </div>
  );
}

/**
 * ProductDetailsModal - Quick view modal for product details
 */
export default function ProductDetailsModal({ product: initialProduct, onClose, onAddToCart }) {
  const { isAuthenticated, token } = useAuth();
  const [product, setProduct] = useState({ 
    ...initialProduct, 
    reviews: initialProduct.reviews || [], 
    numReviews: initialProduct.numReviews || 0 
  });
  const [activeTab, setActiveTab] = useState('details');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setError('Please provide a rating and a comment.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await createReviewApi(token, product._id, { rating, comment });
      setSuccess('Review submitted successfully!');
      
      // Optimistic update
      const newReview = { _id: Date.now().toString(), name: 'You', rating, comment, createdAt: new Date().toISOString() };
      const updatedReviews = [newReview, ...product.reviews];
      const newNum = updatedReviews.length;
      const newRating = updatedReviews.reduce((acc, item) => item.rating + acc, 0) / newNum;
      
      setProduct({ ...product, reviews: updatedReviews, numReviews: newNum, rating: newRating });
      setComment('');
      setRating(5);
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <article className="relative w-full max-w-6xl bg-[#faf9f6] rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] text-stone-500 hover:text-stone-900 transition-colors p-2 bg-white/50 backdrop-blur-sm rounded-full"
          aria-label="Close product details"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Image Side */}
        <ProductImage product={product} />

        {/* Content Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-white flex flex-col">
          <header className="mb-8">
            <span className="text-stone-500 text-[10px] uppercase tracking-[0.2em]">
              {product.brand}
            </span>
            <h2
              id="product-modal-title"
              className="font-serif text-3xl md:text-5xl text-stone-900 mt-2 mb-4 leading-tight"
            >
              {product.name}
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <PriceDisplay
                price={product.price}
                originalPrice={product.originalPrice}
              />
              <RatingDisplay rating={product.rating} reviews={product.numReviews} />
            </div>

            <p className="text-stone-600 font-light leading-relaxed mb-8">
              {product.description}
            </p>

            <button
              onClick={() => onAddToCart(product)}
              disabled={!product.inStock}
              className={`w-full py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                product.inStock
                  ? 'bg-stone-900 text-white hover:bg-amber-900'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
              aria-label={
                product.inStock
                  ? `Add ${product.name} to cart`
                  : `${product.name} is out of stock`
              }
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </header>

          <nav className="flex gap-6 mb-6 border-b border-stone-100 pb-2">
            <button 
              className={`text-[10px] uppercase tracking-widest font-bold ${activeTab === 'details' ? 'border-b-2 border-stone-900 text-stone-900 pb-1' : 'text-stone-400 hover:text-stone-600'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`text-[10px] uppercase tracking-widest font-bold ${activeTab === 'reviews' ? 'border-b-2 border-stone-900 text-stone-900 pb-1' : 'text-stone-400 hover:text-stone-600'}`}
              onClick={() => setActiveTab('reviews')}
            >
              Customer Reviews ({product.numReviews})
            </button>
          </nav>

          {activeTab === 'details' ? (
            <footer className="space-y-6 pt-2 mt-auto">
              <DetailSection title="Ingredients">
                <p className="text-xs text-stone-500 leading-relaxed font-mono">
                  {product.ingredients}
                </p>
              </DetailSection>

              <DetailSection title="How to Use">
                <p className="text-xs text-stone-500 leading-relaxed">
                  {product.howToUse}
                </p>
              </DetailSection>

              <DetailSection title="Recommended For">
                <SkinTypeTags skinTypes={product.skinType} />
              </DetailSection>
            </footer>
          ) : (
            <div className="space-y-8 pt-2">
              {/* Write Review Form */}
              <div className="bg-stone-50 p-6 rounded-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 mb-4">Write a Review</h4>
                {isAuthenticated ? (
                  <form onSubmit={submitReview} className="space-y-4">
                    {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
                    {success && <div className="text-green-600 text-xs font-bold">{success}</div>}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Rating</label>
                      <select 
                        value={rating} 
                        onChange={(e) => setRating(Number(e.target.value))}
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
                      <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Comment</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
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

              {/* Review List */}
              <div className="space-y-6">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev, idx) => (
                    <div key={rev._id || idx} className="border-b border-stone-100 pb-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-stone-900">{rev.name}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-500' : 'text-stone-200'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest block mb-3">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                      <p className="text-sm text-stone-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-400 text-sm italic">No reviews yet. Be the first to review this product!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
