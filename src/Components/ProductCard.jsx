import { HeartIcon, StarIcon } from './Icons';

/**
 * Star rating display
 */
function StarRating({ rating, reviews }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <StarIcon
          key={i}
          className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-amber-500' : 'text-stone-300'}`}
        />
      ))}
      <span className="text-[10px] text-stone-400 ml-1">({reviews})</span>
    </div>
  );
}

/**
 * Product badges (New, Sale, Sold Out)
 */
function ProductBadges({ product }) {
  return (
    <div className="absolute top-3 left-3 flex flex-col gap-1">
      {!product.inStock && (
        <span className="bg-stone-900 text-white text-[9px] uppercase tracking-widest px-2 py-1">
          Sold Out
        </span>
      )}
      {product.isNew && (
        <span className="bg-white/90 text-stone-900 text-[9px] uppercase tracking-widest px-2 py-1 backdrop-blur-sm">
          New
        </span>
      )}
      {product.originalPrice && (
        <span className="bg-amber-900 text-white text-[9px] uppercase tracking-widest px-2 py-1">
          Sale
        </span>
      )}
    </div>
  );
}

/**
 * Hover action overlay
 */
function HoverActions({ product, onAddToCart }) {
  return (
    <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/95 backdrop-blur-sm border-t border-stone-100">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart(product.id);
        }}
        disabled={!product.inStock}
        className="w-full py-2 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Add ${product.name} to cart`}
      >
        Add to Cart
      </button>
    </div>
  );
}

/**
 * Wishlist button
 */
function WishlistButton({ productId, isInWishlist, onToggle }) {
  return (
    <button
      onClick={(e) => onToggle(productId, e)}
      className="absolute top-3 right-3 p-2 bg-white/50 backdrop-blur-sm rounded-full text-stone-900 hover:bg-white transition-colors"
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isInWishlist}
    >
      <HeartIcon
        className={`w-4 h-4 ${isInWishlist ? 'fill-red-600 text-red-600' : ''}`}
        filled={isInWishlist}
      />
    </button>
  );
}

/**
 * ProductCard - Individual product display card
 */
export default function ProductCard({
  product,
  isInWishlist,
  onToggleWishlist,
  onAddToCart,
  onProductClick,
}) {
  return (
    <article className="group relative flex flex-col">
      {/* Product Image */}
      <div
        className="relative aspect-[3/4] bg-stone-100 overflow-hidden cursor-pointer"
        onClick={() => onProductClick(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onProductClick(product)}
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <ProductBadges product={product} />
        <HoverActions product={product} onAddToCart={onAddToCart} />
        <WishlistButton
          productId={product.id}
          isInWishlist={isInWishlist}
          onToggle={onToggleWishlist}
        />
      </div>

      {/* Product Info */}
      <div className="mt-4 flex flex-col items-start">
        <span className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">
          {product.brand}
        </span>
        <h3
          className="font-serif text-lg text-stone-900 cursor-pointer hover:text-amber-800 transition-colors"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-medium text-stone-900">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-stone-500 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <StarRating rating={product.rating} reviews={product.reviews} />
      </div>
    </article>
  );
}
