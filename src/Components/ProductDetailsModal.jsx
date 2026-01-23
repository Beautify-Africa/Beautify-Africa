import { CloseIcon, StarIcon } from './Icons';

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
      <span className="text-sm font-bold text-stone-800">{rating}</span>
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
export default function ProductDetailsModal({ product, onClose, onAddToCart }) {
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
              <RatingDisplay rating={product.rating} reviews={product.reviews} />
            </div>

            <p className="text-stone-600 font-light leading-relaxed mb-8">
              {product.description}
            </p>

            <button
              onClick={() => onAddToCart(product.id)}
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

          <footer className="space-y-6 border-t border-stone-100 pt-8 mt-auto">
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
        </div>
      </article>
    </div>
  );
}
