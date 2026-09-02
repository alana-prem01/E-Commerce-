import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaHeart, FaRegHeart, FaStar, FaFilter, FaTimes } from 'react-icons/fa';
import { useCart } from '../utils/CartContext';
import api from '../utils/api';
import '../css/SearchResultsPage.css';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [wishlist, setWishlist] = useState([]);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Fetch search results
  useEffect(() => {
    if (!query.trim()) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=12`);
        if (data.success) {
          let sorted = [...(data.products || [])];
          if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
          else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
          setProducts(sorted);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, page, sortBy]);

  // Fetch wishlist
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/profile/wishlist')
      .then(data => { if (data.success) setWishlist(data.wishlist.map(p => p._id)); })
      .catch(() => {});
  }, [isLoggedIn]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setPage(1);
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const handleToggleWishlist = async (productId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const data = await api.post(`/profile/wishlist/${productId}`);
      if (data.success) {
        setWishlist(prev =>
          data.inWishlist ? [...prev, productId] : prev.filter(id => id !== productId)
        );
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-page-header">
        <div className="search-page-header-inner">
          <h1 className="search-page-title">
            {query ? `Results for "${query}"` : 'Search Jewellery'}
          </h1>
          {query && <p className="search-result-count">{total} product{total !== 1 ? 's' : ''} found</p>}
          
          <form className="search-bar-large" onSubmit={handleSearch}>
            <FaSearch className="search-bar-icon" />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search rings, necklaces, bangles..."
              className="search-bar-input"
              autoFocus
            />
            {inputValue && (
              <button type="button" className="search-clear-btn" onClick={() => { setInputValue(''); setSearchParams({}); }}>
                <FaTimes />
              </button>
            )}
            <button type="submit" className="search-submit-btn">Search</button>
          </form>
        </div>
      </div>

      <div className="search-page-body">
        {/* Controls */}
        {query && (
          <div className="search-controls">
            <div className="search-controls-left">
              <FaFilter size={14} />
              <span>Sort by:</span>
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="sort-select">
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            {total > 0 && (
              <span className="search-controls-right">
                Showing {Math.min((page - 1) * 12 + 1, total)}–{Math.min(page * 12, total)} of {total}
              </span>
            )}
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="search-skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="search-skeleton-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line medium"></div>
              </div>
            ))}
          </div>
        ) : !query ? (
          <div className="search-empty">
            <div className="search-empty-icon">🔍</div>
            <h2>What are you looking for?</h2>
            <p>Search for rings, necklaces, earrings, bangles and more</p>
          </div>
        ) : products.length === 0 ? (
          <div className="search-empty">
            <div className="search-empty-icon">💎</div>
            <h2>No results found for "{query}"</h2>
            <p>Try different keywords or browse our categories</p>
            <button className="browse-btn" onClick={() => navigate('/best-sellers')}>Browse Best Sellers</button>
          </div>
        ) : (
          <>
            <div className="search-results-grid">
              {products.map(product => {
                const inWishlist = wishlist.includes(product._id);
                const discount = product.compareAtPrice
                  ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                  : 0;
                return (
                  <div key={product._id} className="search-product-card" onClick={() => navigate(`/product/${product._id}`)}>
                    <div className="search-card-image">
                      {discount > 0 && <span className="search-card-badge">-{discount}%</span>}
                      <button
                        className={`search-wishlist-btn ${inWishlist ? 'active' : ''}`}
                        onClick={e => { e.stopPropagation(); handleToggleWishlist(product._id); }}
                        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {inWishlist ? <FaHeart /> : <FaRegHeart />}
                      </button>
                      {product.productImage
                        ? <img src={product.productImage} alt={product.productName} loading="lazy" decoding="async" />
                        : <div className="no-image-placeholder">💎</div>
                      }
                    </div>
                    <div className="search-card-info">
                      <span className="search-card-category">{product.category}</span>
                      <h3 className="search-card-name">{product.productName}</h3>
                      <div className="search-card-rating">
                        {[...Array(5)].map((_, i) => <FaStar key={i} size={12} color="#D4AF37" />)}
                      </div>
                      <div className="search-card-price-row">
                        <span className="search-card-price">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.compareAtPrice && (
                          <span className="search-card-original">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <button
                        className="search-add-to-cart"
                        onClick={e => { e.stopPropagation(); addToCart(product); }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="search-pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >← Prev</button>
                <div className="pagination-pages">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`pagination-page ${page === i + 1 ? 'active' : ''}`}
                      onClick={() => setPage(i + 1)}
                    >{i + 1}</button>
                  ))}
                </div>
                <button
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
