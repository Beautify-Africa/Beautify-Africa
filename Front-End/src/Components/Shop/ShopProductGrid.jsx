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
  currentPage,
  totalPages,
  onPageChange,
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
      <div>
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

        {/* Premium Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-between border-t border-stone-200 pt-8 sm:px-6">
            <button
              onClick={() => {
                onPageChange(Math.max(1, currentPage - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className={`flex flex-col text-sm font-medium tracking-widest uppercase transition-colors sm:flex-row sm:items-center sm:gap-2 ${
                currentPage === 1
                  ? 'cursor-not-allowed text-stone-300'
                  : 'text-stone-900 hover:text-stone-500'
              }`}
            >
              <span aria-hidden="true">&larr;</span> Previous
            </button>
            <span className="font-serif text-sm italic text-stone-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                onPageChange(Math.min(totalPages, currentPage + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className={`flex flex-col text-sm font-medium tracking-widest uppercase transition-colors sm:flex-row sm:items-center sm:gap-2 ${
                currentPage === totalPages
                  ? 'cursor-not-allowed text-stone-300'
                  : 'text-stone-900 hover:text-stone-500'
              }`}
            >
              Next <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
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
