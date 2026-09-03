import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../css/ShopPage.css';

export default function ShopPage() {
  const navigate = useNavigate();

  // UI State
  const [isPricePopoverOpen, setIsPricePopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Filter & Pagination State
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('Date New to Old');
  const [priceError, setPriceError] = useState(null);

  const itemsPerPage = 24;

  // Data State
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [highestPrice, setHighestPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPricePopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortOption, appliedMinPrice, appliedMaxPrice]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `/products/allproducts?page=${currentPage}&limit=${itemsPerPage}&sort=${encodeURIComponent(sortOption)}`;
      if (appliedMinPrice !== null && appliedMinPrice !== '') endpoint += `&minPrice=${appliedMinPrice}`;
      if (appliedMaxPrice !== null && appliedMaxPrice !== '') endpoint += `&maxPrice=${appliedMaxPrice}`;

      const data = await api.get(endpoint);
      if (data.success) {
        setProducts(data.products || []);
        setTotalCount(data.totalCount !== undefined ? data.totalCount : (data.count || 0));
        setTotalPages(data.totalPages || 1);
        if (data.highestPrice !== undefined) {
          setHighestPrice(data.highestPrice);
        }
      } else {
        setError('Unable to load products. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPrice = () => {
    setPriceError(null);
    if (minPrice !== '' && Number(minPrice) < 0) {
      setPriceError('Minimum price cannot be negative.');
      return;
    }
    if (maxPrice !== '' && Number(maxPrice) < 0) {
      setPriceError('Maximum price cannot be negative.');
      return;
    }
    if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
      setPriceError('Minimum price cannot exceed maximum price.');
      return;
    }

    setAppliedMinPrice(minPrice !== '' ? Number(minPrice) : null);
    setAppliedMaxPrice(maxPrice !== '' ? Number(maxPrice) : null);
    setCurrentPage(1);
    setIsPricePopoverOpen(false);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const isPriceApplied = appliedMinPrice !== null && appliedMaxPrice !== null;
  const priceLabel = isPriceApplied
    ? `Price: Rs. ${appliedMinPrice} - Rs. ${appliedMaxPrice}`
    : 'Price';

  return (
    <div className="shop-wrapper">
      {/* Section 1 – Page Header */}
      <div className="shop-page-header">
        <h1 className="shop-page-title">Find Your Perfect Piece</h1>
        <p className="shop-page-subtitle">Discover our complete collection of exquisite jewelry.</p>
      </div>

      {/* Section 2 – Shell */}
      <div className="shop-shell">

        {/* Section 3 – Toolbar */}
        <div className="shop-toolbar">

          {/* Section 4 – Price Filter */}
          <div className="shop-price-filter-container" ref={popoverRef}>
            <button
              className={`shop-price-trigger ${isPricePopoverOpen ? 'open' : ''}`}
              onClick={() => setIsPricePopoverOpen(!isPricePopoverOpen)}
            >
              <span className="shop-trigger-label">{priceLabel}</span>
              <svg className="shop-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Section 5 – Price Popover */}
            {isPricePopoverOpen && (
              <div className="shop-price-popover">
                <div className="shop-highest-price-hint">
                  Highest priced item in store: <span className="shop-highest-price-value">Rs. {highestPrice}</span>
                </div>
                <div className="shop-min-max-inputs">
                  <div className="shop-input-wrapper">
                    <span className="shop-input-prefix">Rs.</span>
                    <input
                      type="number"
                      className="shop-price-input"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="shop-input-wrapper">
                    <span className="shop-input-prefix">Rs.</span>
                    <input
                      type="number"
                      className="shop-price-input"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                {priceError && (
                  <div className="shop-price-error" style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
                    {priceError}
                  </div>
                )}
                <button className="shop-apply-btn" onClick={handleApplyPrice}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Section 6 – Result Count */}
          <div className="shop-result-count">
            {totalCount} products
          </div>

          {/* Section 7 – Toolbar Right (Sort) */}
          <div className="shop-toolbar-right">
            <span className="shop-sort-label">Sort by</span>
            <select
              className="shop-sort-select"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="Date New to Old">Date New to Old</option>
              <option value="Price Low to High">Price Low to High</option>
              <option value="Price High to Low">Price High to Low</option>
              <option value="Best Selling">Best Selling</option>
            </select>
          </div>

        </div>

        {/* Section 8 – Product Grid */}
        <div className="shop-product-grid-container" style={{ minHeight: '400px' }}>
          {loading ? (
            <div className="shop-loading-state" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--body-font)' }}>
              Loading products...
            </div>
          ) : error ? (
            <div className="shop-error-state" style={{ padding: '40px 0', textAlign: 'center', color: '#EF4444', fontFamily: 'var(--body-font)' }}>
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="shop-empty-state" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--body-font)' }}>
              No products found matching your criteria.
            </div>
          ) : (
            <div className="shop-product-grid">
              {products.map(product => (
                /* Section 9 – Product Card */
                <div
                  key={product._id}
                  className="shop-product-card"
                  onClick={() => navigate(`/product/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="shop-product-image-container">
                    {product.productImage ? (
                      <img src={product.productImage} alt={product.productName} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg className="shop-placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                    {product.isBestSeller && <div className="shop-best-seller-tag">Best Seller</div>}
                  </div>
                  <h3 className="shop-product-name">{product.productName}</h3>
                  <p className="shop-product-price">Rs. {product.price.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 10 – Pagination */}
        {totalCount > 0 && (
          <div className="shop-pagination">
            <button
              className="shop-page-btn"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <svg className="shop-btn-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Prev
            </button>

            <span className="shop-page-indicator">Page {currentPage} of {totalPages}</span>

            <button
              className="shop-page-btn"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
              <svg className="shop-btn-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 9L7.5 6L4.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
