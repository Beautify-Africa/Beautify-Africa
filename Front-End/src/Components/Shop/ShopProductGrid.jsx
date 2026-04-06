import ProductCard from './ProductCard';
import ShopEmptyState from './ShopEmptyState';

export default function ShopProductGrid({
  isLoading,
  displayedProducts,
  isSavedCollection,
  wishlistSet,
  onToggleWishlist,
  onAddToCart,
  onProductClick,
  mode,
  savedProductCount,
  onClearFilters,
  onShowAllProducts,
}) {
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-xl text-stone-400">Loading products...</p>
      </div>
    );
  }

  if (displayedProducts.length > 0) {
    return (
      <div
        className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-label={isSavedCollection ? 'Saved products' : 'Products'}
      >
        {displayedProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            isInWishlist={wishlistSet.has(product._id)}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
          />
        ))}
      </div>
    );
  }

  return (
    <ShopEmptyState
      mode={mode}
      hasSavedItems={savedProductCount > 0}
      onClearFilters={onClearFilters}
      onShowAllProducts={onShowAllProducts}
    />
  );
}
