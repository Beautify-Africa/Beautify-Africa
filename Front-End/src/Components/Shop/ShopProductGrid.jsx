import { useState, useEffect, useMemo } from 'react';
import ProductCard from './ProductCard';
import ShopEmptyState from './ShopEmptyState';

const ITEMS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever the user alters external filters
  useEffect(() => {
    setCurrentPage(1);
  }, [displayedProducts]);

  // Calculate slices for the current page
  const paginatedSlice = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, displayedProducts]);

  const totalPages = Math.ceil(displayedProducts.length / ITEMS_PER_PAGE);

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
          {paginatedSlice.map((product) => (
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
                setCurrentPage((p) => Math.max(1, p - 1));
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
                setCurrentPage((p) => Math.min(totalPages, p + 1));
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
