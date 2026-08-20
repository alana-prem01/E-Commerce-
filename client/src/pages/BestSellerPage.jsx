import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../css/BestSellerPage.css';

export default function BestSellerPage() {
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
  const [sortOption, setSortOption] = useState('Best Selling');
  const [priceError, setPriceError] = useState(null);

  // Data State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [highestPrice, setHighestPrice] = useState(0);

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
    fetchBestSellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortOption, appliedMinPrice, appliedMaxPrice]);

  const fetchBestSellers = async () => {
    setLoading(true);
    setError(null);
    try {
      let sortParam = 'best-selling';
      if (sortOption === 'Price Low to High') sortParam = 'price-low-high';
      else if (sortOption === 'Date New to Old') sortParam = 'date-new-old';

      let endpoint = `/products/getbestsellers?page=${currentPage}&limit=24&sort=${sortParam}`;
      if (appliedMinPrice !== null && appliedMinPrice !== '') endpoint += `&minPrice=${appliedMinPrice}`;
      if (appliedMaxPrice !== null && appliedMaxPrice !== '') endpoint += `&maxPrice=${appliedMaxPrice}`;

      const data = await api.get(endpoint);
      if (data.success) {
        setProducts(data.products || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        if (data.highestPrice !== undefined) {
          setHighestPrice(data.highestPrice);
        }
      } else {
        setError('Unable to load best sellers. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load best sellers. Please try again.');
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

    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
    setIsPricePopoverOpen(false);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const isPriceApplied = appliedMinPrice !== null && appliedMinPrice !== '' && appliedMaxPrice !== null && appliedMaxPrice !== '';
  const priceLabel = isPriceApplied 
    ? `Price: Rs. ${appliedMinPrice} - Rs. ${appliedMaxPrice}` 
    : 'Price';

  return (
    <div className="bsp-wrapper">
      {/* Section 1 – Page Header */}
      <div className="bsp-page-header">
        <h1 className="bsp-page-title">Best Sellers</h1>
        <p className="bsp-page-subtitle">Our most loved pieces, chosen by you.</p>
      </div>

      {/* Section 2 – Shell */}
      <div className="bsp-shell">
        
        {/* Section 3 – Toolbar */}
        <div className="bsp-toolbar">
          
          {/* Section 4 – Price Filter */}
          <div className="bsp-price-filter-container" ref={popoverRef}>
            <button 
              className={`bsp-price-trigger ${isPricePopoverOpen ? 'open' : ''}`}
              onClick={() => setIsPricePopoverOpen(!isPricePopoverOpen)}
            >
              <span className="bsp-trigger-label">{priceLabel}</span>
              <svg className="bsp-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Section 5 – Price Popover */}
            {isPricePopoverOpen && (
              <div className="bsp-price-popover">
                <div className="bsp-highest-price-hint">
                  Highest priced item in this list: <span className="bsp-highest-price-value">Rs. {highestPrice}</span>
                </div>
                <div className="bsp-min-max-inputs">
                  <div className="bsp-input-wrapper">
                    <span className="bsp-input-prefix">Rs.</span>
                    <input 
                      type="number" 
                      className="bsp-price-input" 
                      value={minPrice} 
                      onChange={(e) => setMinPrice(e.target.value)} 
                    />
                  </div>
                  <div className="bsp-input-wrapper">
                    <span className="bsp-input-prefix">Rs.</span>
                    <input 
                      type="number" 
                      className="bsp-price-input" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(e.target.value)} 
                    />
                  </div>
                </div>
                {priceError && (
                  <div className="bsp-price-error" style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
                    {priceError}
                  </div>
                )}
                <button className="bsp-apply-btn" onClick={handleApplyPrice}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Section 6 – Result Count */}
          <div className="bsp-result-count">
            {totalCount} products
          </div>

          {/* Section 7 – Toolbar Right (Sort) */}
          <div className="bsp-toolbar-right">
            <span className="bsp-sort-label">Sort by</span>
            <select 
              className="bsp-sort-select" 
              value={sortOption} 
              onChange={handleSortChange}
            >
              <option value="Best Selling">Best Selling</option>
              <option value="Price Low to High">Price Low to High</option>
              <option value="Date New to Old">Date New to Old</option>
            </select>
          </div>

        </div>

        {/* Section 8 – Product Grid */}
        <div className="bsp-product-grid-container" style={{ minHeight: '400px' }}>
          {loading ? (
            <div className="bsp-loading-state" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--body-font)' }}>
              Loading best sellers...
            </div>
          ) : error ? (
            <div className="bsp-error-state" style={{ padding: '40px 0', textAlign: 'center', color: '#EF4444', fontFamily: 'var(--body-font)' }}>
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="bsp-empty-state" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--body-font)' }}>
              No best seller products found matching your criteria.
            </div>
          ) : (
            <div className="bsp-product-grid">
              {products.map(product => (
                /* Section 9 – Product Card */
                <div
                  key={product._id}
                  className="bsp-product-card"
                  onClick={() => navigate(`/product/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="bsp-product-image-container">
                    {product.productImage ? (
                      <img src={product.productImage} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg className="bsp-placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                    {product.isBestSeller && <div className="bsp-best-seller-tag">Best Seller</div>}
                  </div>
                  <h3 className="bsp-product-name">{product.productName}</h3>
                  <p className="bsp-product-price">Rs. {product.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 10 – Pagination */}
        {totalCount > 0 && (
          <div className="bsp-pagination">
            <button 
              className="bsp-page-btn" 
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <svg className="bsp-btn-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Prev
            </button>
            
            <span className="bsp-page-indicator">Page {currentPage} of {totalPages}</span>
            
            <button 
              className="bsp-page-btn" 
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
              <svg className="bsp-btn-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 9L7.5 6L4.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
