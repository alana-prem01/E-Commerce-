import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { toast } from 'react-toastify';
import AdminPagination from '../Components/AdminPagination';
import '../css/ProductListPage.css';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter]);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const mainContainer = document.querySelector('.admin-dashboard-main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/allproducts?all=true');
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const res = await api.delete(`/products/deleteproduct/${id}`);
        if (res.success) {
          toast.success('Product deleted successfully');
          setProducts(products.filter(p => p._id !== id));
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error(error.message || 'Failed to delete product');
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-product/${id}`);
  };

  // Filter products based on search, category and stock
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'In Stock') matchesStock = product.stockQuantity >= 10;
    if (stockFilter === 'Low Stock') matchesStock = product.stockQuantity > 0 && product.stockQuantity < 10;
    if (stockFilter === 'Out of Stock') matchesStock = product.stockQuantity === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="mb-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Products</h1>
          <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>Manage your catalog, stock statuses, and listings.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => navigate('/add-product')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Product
        </button>
      </div>

      {/* Filter & Search Section */}
      <div className="admin-card mb-4" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="admin-input" 
          style={{ flex: '1 1 300px' }}
          placeholder="Search by Product ID or Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="admin-select" style={{ flex: '0 1 200px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Rings">Rings</option>
          <option value="Earrings">Earrings</option>
          <option value="Bangles">Bangles</option>
          <option value="Jhumkas">Jhumkas</option>
          <option value="Bracelets">Bracelets</option>
          <option value="Necklaces">Necklaces</option>
        </select>
        <select className="admin-select" style={{ flex: '0 1 200px' }} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="All">All Stock</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="admin-card admin-table-container" style={{ paddingBottom: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading products...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Stock Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => {
                  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
                  const isOutOfStock = product.stockQuantity === 0;
                  const stockClass = isOutOfStock ? 'admin-badge-danger' : (isLowStock ? 'admin-badge-warning' : 'admin-badge-success');
                  const stockText = isOutOfStock ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'In Stock');

                  return (
                    <tr key={product._id}>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>#{product._id.substring(0, 8).toUpperCase()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img className="admin-img-thumb" src={product.productImage || "https://placehold.co/48x48"} alt={product.productName} loading="lazy" decoding="async" />
                          <span style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>{product.productName}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`admin-badge ${stockClass}`}>
                          {stockText} ({product.stockQuantity})
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-flex justify-content-center gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button className="admin-btn admin-btn-outline" style={{ padding: '6px' }} title="Edit" onClick={() => handleEdit(product._id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                          <button className="admin-btn admin-btn-danger" style={{ padding: '6px' }} title="Delete" onClick={() => handleDelete(product._id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ color: 'var(--admin-text-light)', marginBottom: '16px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '1.125rem', color: 'var(--admin-text-main)', marginBottom: '8px' }}>No products found</h3>
                      <p style={{ color: 'var(--admin-text-muted)' }}>Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        {/* Pagination Controls */}
        {!loading && (
          <AdminPagination
            currentPage={activePage}
            totalItems={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
