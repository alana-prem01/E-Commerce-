import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar, FaHeart, FaRegHeart, FaShoppingCart, FaBolt } from 'react-icons/fa';
import { useCart } from '../utils/CartContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import '../css/ProductDetailsPage.css';

function StarRating({ rating, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star ${interactive ? 'interactive' : ''}`}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(i)}
        >
          {(interactive ? (hovered || rating) : rating) >= i
            ? <FaStar color="#D4AF37" size={interactive ? 24 : 14} />
            : <FaRegStar color="#D4AF37" size={interactive ? 24 : 14} />
          }
        </span>
      ))}
    </div>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0, ratingCounts: {} });
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productRes, relatedRes] = await Promise.all([
          api.get(`/products/getsingleproductdetails/${id}`),
          api.get(`/products/getrelatedproducts/${id}`)
        ]);
        
        let reviewsRes = { success: false, reviews: [] };
        try {
          reviewsRes = await api.get(`/products/${id}/reviews`);
        } catch (reviewErr) {
          console.warn('Could not fetch reviews:', reviewErr.message);
        }

        if (productRes.success) setProduct(productRes.product);
        else setError(productRes.message || 'Product not found');

        if (relatedRes.success) setRelatedProducts(relatedRes.products || []);

        if (reviewsRes.success) {
          setReviews(reviewsRes.reviews || []);
          setReviewStats({ avgRating: reviewsRes.avgRating || 0, count: reviewsRes.count || 0, ratingCounts: reviewsRes.ratingCounts || {} });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch product details.');
      } finally {
        setIsLoading(false);
        setReviewsLoading(false);
      }
    };

    if (id) { fetchData(); setQty(1); }
  }, [id]);

  // Check wishlist
  useEffect(() => {
    if (!isLoggedIn || !id) return;
    api.get('/profile/wishlist')
      .then(data => { if (data.success) setInWishlist(data.wishlist.some(p => p._id === id)); })
      .catch(() => {});
  }, [isLoggedIn, id]);

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const data = await api.post(`/profile/wishlist/${id}`);
      if (data.success) {
        setInWishlist(data.inWishlist);
        toast.success(data.message);
      }
    } catch (err) { toast.error('Failed to update wishlist'); }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, qty);
      // After adding, navigate to the Cart page
      navigate('/cart');
    }
  };

  const handleBuyNow = () => {
    // Ensure user is logged in before proceeding to checkout
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      // Redirect to login with intent to checkout after authentication, preserving product and quantity
      const redirectUrl = `/checkout?productId=${id}&qty=${qty}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }
    if (product) {
      addToCart(product, qty);
      navigate('/checkout');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate('/login'); return; }
    if (reviewForm.rating === 0) { toast.error('Please select a rating'); return; }
    if (reviewForm.comment.trim().length < 5) { toast.error('Comment must be at least 5 characters'); return; }
    setSubmittingReview(true);
    try {
      const data = await api.post(`/products/${id}/reviews`, reviewForm);
      if (data.success) {
        setReviews(prev => [data.review, ...prev]);
        setReviewStats(prev => ({
          avgRating: parseFloat(((prev.avgRating * prev.count + reviewForm.rating) / (prev.count + 1)).toFixed(1)),
          count: prev.count + 1,
          ratingCounts: { ...prev.ratingCounts, [reviewForm.rating]: (prev.ratingCounts[reviewForm.rating] || 0) + 1 }
        }));
        setReviewForm({ rating: 0, comment: '' });
        toast.success('Review submitted!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) return (
    <div className="pdp-loading">
      <div className="pdp-skeleton">
        <div className="skeleton-img-lg"></div>
        <div className="pdp-skeleton-info">
          <div className="skeleton-line lg"></div>
          <div className="skeleton-line md"></div>
          <div className="skeleton-line sm"></div>
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="pdp-error">
      <h2>😔 {error || 'Product not found'}</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="pdp-page">
      {/* ===== Product Hero ===== */}
      <section className="pdp-hero">
        {/* Image */}
        <div className="pdp-image-col">
          <div className="pdp-image-wrapper">
            {discount > 0 && <span className="pdp-discount-badge">-{discount}%</span>}
            <button className={`pdp-wishlist-btn ${inWishlist ? 'active' : ''}`} onClick={handleToggleWishlist}>
              {inWishlist ? <FaHeart /> : <FaRegHeart />}
            </button>
            {product.productImage
              ? <img src={product.productImage} alt={product.productName} className="pdp-main-image" />
              : <div className="pdp-no-image">💎</div>
            }
          </div>
        </div>

        {/* Info */}
        <div className="pdp-info-col">
          <span className="pdp-category-tag">{product.category}</span>
          <h1 className="pdp-product-title">{product.productName}</h1>

          {/* Rating Summary */}
          <div className="pdp-rating-row">
            <StarRating rating={Math.round(reviewStats.avgRating)} />
            <span className="pdp-rating-text">{reviewStats.avgRating} ({reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''})</span>
          </div>

          {/* Price */}
          <div className="pdp-price-row">
            <span className="pdp-price">₹{product.price.toLocaleString('en-IN')}</span>
            {product.compareAtPrice && (
              <span className="pdp-compare-price">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
            )}
            {discount > 0 && <span className="pdp-save-badge">Save {discount}%</span>}
          </div>

          <hr className="pdp-divider" />

          {/* Stock */}
          <div className="pdp-stock-row">
            <span className={`pdp-stock-dot ${product.stockQuantity > 0 ? 'in-stock' : 'out-stock'}`}></span>
            <span className="pdp-stock-text">
              {product.stockQuantity > 5 ? 'In Stock' : product.stockQuantity > 0 ? `Only ${product.stockQuantity} left!` : 'Out of Stock'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="pdp-description">{product.description}</p>
          )}

          {/* Quantity + Add to Cart */}
          {product.stockQuantity > 0 && (
            <>
              <div className="pdp-action-row">
                <div className="pdp-qty-selector">
                  <button className="pdp-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="pdp-qty-value">{qty}</span>
                  <button className="pdp-qty-btn" onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}>+</button>
                </div>
                <button className="pdp-add-cart-btn" onClick={handleAddToCart}>
                  <FaShoppingCart size={16} /> Add to Cart
                </button>
              </div>
              <button className="pdp-buy-now-btn" onClick={handleBuyNow}>
                <FaBolt size={14} /> Buy It Now
              </button>
            </>
          )}

          {/* Trust Badges */}
          <div className="pdp-trust-badges">
            <div className="pdp-badge">🔒 Secure Payment</div>
            <div className="pdp-badge">🚚 Free Shipping ₹500+</div>
            <div className="pdp-badge">↩️ 30-Day Returns</div>
          </div>
        </div>
      </section>

      {/* ===== Reviews Section ===== */}
      <section className="pdp-reviews-section">
        <h2 className="pdp-section-title">Customer Reviews</h2>

        {/* Rating Overview */}
        {reviewStats.count > 0 && (
          <div className="reviews-overview">
            <div className="reviews-avg-block">
              <span className="reviews-avg-number">{reviewStats.avgRating}</span>
              <StarRating rating={Math.round(reviewStats.avgRating)} />
              <span className="reviews-avg-count">{reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''}</span>
            </div>
            <div className="reviews-bars">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviewStats.ratingCounts[star] || 0;
                const pct = reviewStats.count > 0 ? (count / reviewStats.count) * 100 : 0;
                return (
                  <div key={star} className="review-bar-row">
                    <span className="review-bar-label">{star} ★</span>
                    <div className="review-bar-track">
                      <div className="review-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="review-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Write Review Form */}
        <div className="review-form-card">
          <h3 className="review-form-title">Write a Review</h3>
          {!isLoggedIn ? (
            <div className="review-login-prompt">
              <p>Please <button className="review-login-btn" onClick={() => navigate('/login')}>login</button> to write a review.</p>
            </div>
          ) : (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="review-form-rating">
                <label>Your Rating</label>
                <StarRating rating={reviewForm.rating} interactive onRate={r => setReviewForm(f => ({ ...f, rating: r }))} />
              </div>
              <div className="review-form-comment">
                <label>Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  className="review-textarea"
                  rows={4}
                  maxLength={1000}
                />
                <span className="review-char-count">{reviewForm.comment.length}/1000</span>
              </div>
              <button type="submit" className="review-submit-btn" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="reviews-loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review._id} className="review-card">
                <div className="review-card-header">
                  <div className="review-avatar">
                    {review.userName ? review.userName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="review-meta">
                    <span className="review-name">{review.userName || 'Anonymous'}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Related Products ===== */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related-section">
          <h2 className="pdp-section-title">You May Also Like</h2>
          <div className="pdp-related-grid">
            {relatedProducts.map(rp => (
              <div key={rp._id} className="pdp-related-card" onClick={() => navigate(`/product/${rp._id}`)}>
                <div className="pdp-related-img">
                  {rp.productImage
                    ? <img src={rp.productImage} alt={rp.productName} />
                    : <div className="pdp-related-no-img">💎</div>
                  }
                </div>
                <div className="pdp-related-info">
                  <span className="pdp-related-name">{rp.productName}</span>
                  <span className="pdp-related-price">₹{rp.price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
