import { useState } from 'react';
import { createReviewApi } from '../../../services/productsApi';

export function useProductReviewState(initialProduct, token) {
  const [product, setProduct] = useState(() => ({
    ...initialProduct,
    reviews: initialProduct.reviews || [],
    numReviews: initialProduct.numReviews || 0,
  }));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitReview = async (event) => {
    event.preventDefault();

    if (!rating || !comment.trim()) {
      setError('Please provide a rating and a comment.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await createReviewApi(token, product._id, { rating, comment });
      setSuccess('Review submitted successfully!');

      const updatedReviewData = response?.data || {};
      setProduct((previousProduct) => ({
        ...previousProduct,
        ...updatedReviewData,
      }));

      setComment('');
      setRating(5);
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    product,
    rating,
    comment,
    isSubmitting,
    error,
    success,
    setRating,
    setComment,
    submitReview,
  };
}
