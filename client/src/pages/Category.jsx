import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../utils/CartContext';
import api from '../utils/api';
import '../css/Category.css';

function Category() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [sortOption, setSortOption] = useState('best-selling');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedPrice, setAppliedPrice] = useState({ min: '', max: '' });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // API State
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Meta State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [highestPriceInList, setHighestPriceInList] = useState(0);

  const popoverRef = useRef(null);

  const displayCategoryTitle = useMemo(() => {
    if (!category) return 'Fine Jewellery';
    const formatted = category.charAt(0).toUpperCase() + category.slice(1);
    return `${formatted} Collection`;
  }, [category]);

  // Click Outside Popover to Close
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch API
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const formattedCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 12,
          sort: sortOption,
        });

        if (appliedPrice.min) queryParams.append('minPrice', appliedPrice.min);
        if (appliedPrice.max) queryParams.append('maxPrice', appliedPrice.max);

        const response = await api.get(`/products/getproductsbycategory/${formattedCategory}?${queryParams.toString()}`);
        
        if (response.success) {
          setProducts(response.products);
          setTotalPages(response.totalPages);
          setTotalCount(response.totalCount);
          setHighestPriceInList(response.highestPrice || 0);
        } else {
          setError(response.message || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err.message || 'Failed to connect to the server');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryProducts();
  }, [category, currentPage, sortOption, appliedPrice]);

  // Reset pagination when category, sort, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [category, sortOption, appliedPrice]);

  // Apply Price Filter
  const handleApplyPrice = () => {
    setAppliedPrice({ min: minPrice, max: maxPrice });
    setIsPopoverOpen(false);
  };

  // Price Trigger Label Text
  const priceTriggerLabel = useMemo(() => {
    const { min, max } = appliedPrice;
    if (min !== '' && max !== '') return `Price: Rs. ${min} - Rs. ${max}`;
    if (min !== '') return `Price: From Rs. ${min}`;
    if (max !== '') return `Price: Up to Rs. ${max}`;
    return 'Price';
  }, [appliedPrice]);

  return (
    <div className="page-root">
      {/* 1. Page Header */}
      <header className="page-header">
        <h1 className="page-title">{displayCategoryTitle}</h1>
        <p className="page-subtitle">
          Explore our handcrafted gold and diamond collections designed for timeless elegance.
        </p>
      </header>

      {/* 2. Shell */}
      <main className="shell">
        {/* 3. Toolbar */}
        <div className="toolbar">
          {/* 4. Price Filter */}
          <div className="price-filter-container" ref={popoverRef}>
            <button
              type="button"
              className={`price-trigger ${isPopoverOpen ? 'open' : ''}`}
              onClick={() => setIsPopoverOpen((prev) => !prev)}
            >
              <span className="price-trigger-label">{priceTriggerLabel}</span>
              <svg className={`arrow-icon ${isPopoverOpen ? 'rotated' : ''}`} viewBox="0 0 12 7">
                <path d="M1 1L6 6L11 1" />
              </svg>
            </button>

            {/* 5. Price Popover */}
            {isPopoverOpen && (
              <div className="price-popover">
                <div className="highest-price-hint">
                  Highest priced item in this list: Rs.{' '}
                  <span className="highest-price-value">{highestPriceInList.toLocaleString()}</span>
                </div>
                <div className="inputs-row">
                  <div className="input-wrapper">
                    <span className="input-prefix">Rs.</span>
                    <input
                      type="number"
                      className="price-input"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="input-wrapper">
                    <span className="input-prefix">Rs.</span>
                    <input
                      type="number"
                      className="price-input"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <button type="button" className="apply-btn" onClick={handleApplyPrice}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* 6. Result Count */}
          <div className="result-count">{totalCount} products</div>

          {/* 7. Toolbar Right (Sort) */}
          <div className="toolbar-right">
            <span className="sort-label">Sort by</span>
            <div className="sort-select-wrapper">
              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="best-selling">Best Selling</option>
                <option value="price-low-high">Price Low to High</option>
                <option value="date-new-old">Date New to Old</option>
              </select>
              <svg className="sort-chevron" viewBox="0 0 12 7">
                <path d="M1 1L6 6L11 1" />
              </svg>
            </div>
          </div>
        </div>

        {/* 8. Product Grid */}
        <div className="product-grid">
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>Loading products...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'red', gridColumn: '1 / -1' }}>{error}</div>
          ) : products.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>No products found.</div>
          ) : (
            products.map((product) => (
              /* 9. Product Card */
              <div
                key={product._id}
                className="product-card"
                onClick={() => navigate(`/product/${product._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image-container">
                  {product.isBestSeller && <span className="bestseller-tag">Best seller</span>}
                  {product.productImage ? (
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <svg className="placeholder-icon" viewBox="0 0 24 24">
                      <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
                      <path d="M11 3v18" />
                      <path d="M2 9h20" />
                    </svg>
                  )}
                </div>
                <h3 className="product-name">{product.productName}</h3>
                <p className="product-price">Rs. {product.price.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>

        {/* 10. Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Prev
            </button>

            <span className="page-indicator">Page {currentPage} of {totalPages}</span>

            <button
              type="button"
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Category;