import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { toast } from 'react-toastify';
import '../css/AddProductPage.css';

const AddProductPage = () => {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    bestSeller: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.category || !formData.price || !formData.stockQuantity) {
      return toast.error("Please fill in all required fields.");
    }

    try {
      setIsSubmitting(true);
      const submitData = new FormData();
      submitData.append('productName', formData.productName);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price);
      if (formData.discountPrice) submitData.append('discountPrice', formData.discountPrice);
      submitData.append('stockQuantity', formData.stockQuantity);
      submitData.append('isBestSeller', formData.bestSeller);
      
      if (imageFile) {
        submitData.append('productImage', imageFile);
      } else {
        return toast.error("Product image is required");
      }

      const res = await api.post('/products/addproduct', submitData);
      
      if (res.success) {
        toast.success("Product added successfully!");
        navigate('/products');
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--admin-text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '0.875rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <path d="M15 18L9 12L15 6"/>
        </svg>
        Back to Products
      </Link>

      <div className="mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Add Product</h1>
        <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>Enter the details below to add a new piece of jewellery to your store's inventory.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="d-flex flex-wrap gap-4" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Main Column */}
          <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Product Information</h2>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Product Name</label>
                <input 
                  type="text" 
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className="admin-input" 
                  placeholder="e.g. Emerald Drop Earrings" 
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="admin-textarea" 
                  placeholder="Describe the product's material, style, and details..."
                  rows="4"
                ></textarea>
              </div>
              <div className="admin-form-group mb-0">
                <label className="admin-label">Category</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="admin-select" 
                  required
                >
                  <option value="">Select category</option>
                  <option value="Rings">Rings</option>
                  <option value="Necklaces">Necklaces</option>
                  <option value="Bracelets">Bracelets</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Bangles">Bangles</option>
                  <option value="Jhumkas">Jhumkas</option>
                </select>
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Pricing</h2>
              </div>
              <div className="admin-grid-2">
                 <div className="admin-form-group mb-0">
                   <label className="admin-label">Price (₹)</label>
                   <input 
                     type="number" 
                     name="price"
                     value={formData.price}
                     onChange={handleInputChange}
                     className="admin-input" 
                     placeholder="0.00" 
                     min="0"
                     required 
                   />
                 </div>
                 <div className="admin-form-group mb-0">
                   <label className="admin-label">Discount Price (₹)</label>
                   <input 
                     type="number" 
                     name="discountPrice"
                     value={formData.discountPrice}
                     onChange={handleInputChange}
                     className="admin-input" 
                     placeholder="0.00" 
                     min="0"
                   />
                 </div>
              </div>
              <p style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--admin-text-light)' }}>Discount price is shown as a strikethrough price if lower than the current price.</p>
            </div>

            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Product Image</h2>
              </div>
              <div 
                onClick={triggerFileInput} 
                style={{ 
                  cursor: 'pointer', 
                  border: '2px dashed var(--admin-border)', 
                  borderRadius: 'var(--admin-radius-md)', 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  backgroundColor: 'var(--admin-bg)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--admin-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--admin-border)'}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '250px' }} />
                ) : (
                  <div className="d-flex flex-column align-items-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg style={{ color: 'var(--admin-text-light)', marginBottom: '12px' }} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>Click to upload image</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-light)', marginTop: '4px' }}>PNG, JPG up to 5MB (square image recommended)</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef} 
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
          
          {/* Side Column */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Inventory</h2>
              </div>
              <div className="admin-form-group mb-0">
                <label className="admin-label">Stock Quantity</label>
                <input 
                  type="number" 
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  className="admin-input" 
                  placeholder="0" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 0 }}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">Visibility</h2>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <label className="admin-label mb-0">Mark as Best Seller</label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="bestSeller"
                    checked={formData.bestSeller}
                    onChange={handleInputChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button type="button" onClick={() => navigate('/products')} className="admin-btn admin-btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
