import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaTimes, FaTag } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../utils/api';
import '../css/CouponManagementPage.css';

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState([]);
  const [totalCouponUsers, setTotalCouponUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '', discountType: 'percent', discountValue: '',
    minOrderAmount: '', maxDiscount: '', expiresAt: '', usageLimit: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.get('/coupons');
      if (data.success) {
        setCoupons(data.coupons || []);
        setTotalCouponUsers(data.totalCouponUsers || 0);
      }
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || form.discountValue === '' || !form.expiresAt) {
      toast.error('Please fill all required fields');
      return;
    }

    const val = Number(form.discountValue);
    if (form.discountType === 'percent') {
      if (isNaN(val) || val < 1 || val > 70) {
        toast.error('Percentage discount must be between 1% and 70%.');
        return;
      }
    } else if (isNaN(val) || val <= 0) {
      toast.error('Discount value must be greater than 0.');
      return;
    }

    if (form.usageLimit !== '' && form.usageLimit !== null && form.usageLimit !== undefined) {
      const limit = Number(form.usageLimit);
      if (isNaN(limit) || limit <= 0) {
        toast.error('Usage limit must be greater than 0.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = await api.post('/coupons', form);
      if (data.success) {
        toast.success('Coupon created!');
        setCoupons(prev => [data.coupon, ...prev]);
        setShowForm(false);
        setForm({ code: '', discountType: 'percent', discountValue: '', minOrderAmount: '', maxDiscount: '', expiresAt: '', usageLimit: '' });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const data = await api.put(`/coupons/${id}/toggle`);
      if (data.success) {
        setCoupons(prev => prev.map(c => c._id === id ? data.coupon : c));
        toast.success(`Coupon ${data.coupon.isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (err) {
      toast.error('Failed to toggle coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const data = await api.delete(`/coupons/${id}`);
      if (data.success) {
        setCoupons(prev => prev.filter(c => c._id !== id));
        toast.success('Coupon deleted');
      }
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

    return (
        <div className="mb-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Coupon Management</h1>
                    <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>Create and manage discount coupons for your store.</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(true)}>
                    <FaPlus style={{ marginRight: '8px' }} />
                    Create Coupon
                </button>
            </div>

            {/* Stats */}
            <div className="admin-grid-4 mb-4">
                <div className="admin-card text-center py-4" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--admin-primary)', marginBottom: '4px' }}>{coupons.length}</div>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Total Coupons</div>
                </div>
                <div className="admin-card text-center py-4" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--admin-text-success)', marginBottom: '4px' }}>{coupons.filter(c => c.isActive && !isExpired(c.expiresAt)).length}</div>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Active Coupons</div>
                </div>
                <div className="admin-card text-center py-4" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--admin-text-danger)', marginBottom: '4px' }}>{coupons.filter(c => isExpired(c.expiresAt)).length}</div>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Expired Coupons</div>
                </div>
                <div className="admin-card text-center py-4" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--admin-secondary)', marginBottom: '4px' }}>{totalCouponUsers}</div>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Coupon Users</div>
                </div>
            </div>

            {/* Create Coupon Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="admin-card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaTag color="var(--admin-primary)" /> Create New Coupon
                            </h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="admin-grid-2 mb-4">
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. SAVE20"
                                        className="admin-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Discount Type *</label>
                                    <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="admin-select">
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Discount Value *</label>
                                    <input
                                        type="number"
                                        value={form.discountValue}
                                        onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                                        placeholder={form.discountType === 'percent' ? 'e.g. 20' : 'e.g. 500'}
                                        className="admin-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Min Order Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={form.minOrderAmount}
                                        onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                                        placeholder="e.g. 1000"
                                        className="admin-input"
                                    />
                                </div>
                                {form.discountType === 'percent' && (
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Max Discount Cap (₹)</label>
                                        <input
                                            type="number"
                                            value={form.maxDiscount}
                                            onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                                            placeholder="e.g. 2000"
                                            className="admin-input"
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Expires At *</label>
                                    <input
                                        type="datetime-local"
                                        value={form.expiresAt}
                                        onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                        className="admin-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>Usage Limit</label>
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                                        placeholder="Leave empty for unlimited"
                                        className="admin-input"
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-end gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupons Table */}
            <div className="admin-card admin-table-container">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading coupons...</div>
                ) : coupons.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <FaTag size={48} color="var(--admin-primary)" style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--admin-text-main)', marginBottom: '8px' }}>No coupons yet</h3>
                        <p style={{ color: 'var(--admin-text-muted)', maxWidth: '400px', margin: '0 auto' }}>Create your first coupon to offer discounts to customers and boost your sales.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Min Order</th>
                                <th>Expires</th>
                                <th>Usage</th>
                                <th>Users</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map(coupon => {
                                const expired = isExpired(coupon.expiresAt);
                                return (
                                    <tr key={coupon._id} style={{ opacity: expired ? 0.6 : 1 }}>
                                        <td>
                                            <span style={{ backgroundColor: 'var(--admin-bg)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, color: 'var(--admin-primary)', border: '1px dashed var(--admin-primary)' }}>
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>
                                                {coupon.discountType === 'percent'
                                                    ? `${coupon.discountValue}% OFF`
                                                    : `₹${coupon.discountValue} OFF`
                                                }
                                            </div>
                                            {coupon.maxDiscount && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                                    Max ₹{coupon.maxDiscount}
                                                </div>
                                            )}
                                        </td>
                                        <td>₹{(coupon.minOrderAmount || 0).toLocaleString('en-IN')}</td>
                                        <td>
                                            <div style={{ color: expired ? 'var(--admin-text-danger)' : 'inherit' }}>
                                                {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            {expired && <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-danger)', fontWeight: 500 }}>Expired</div>}
                                        </td>
                                        <td>
                                            {coupon.usedCount}/{coupon.usageLimit ?? '∞'}
                                        </td>
                                        <td>
                                            <span title="Unique users who purchased with this coupon">
                                                {coupon.uniqueUserCount ?? 0}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${expired ? 'admin-badge-danger' : (coupon.isActive ? 'admin-badge-success' : 'admin-badge-warning')}`}>
                                                {expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="d-flex justify-content-end gap-2">
                                                {!expired && (
                                                    <button
                                                        className="admin-btn admin-btn-outline"
                                                        style={{ padding: '6px' }}
                                                        onClick={() => handleToggle(coupon._id)}
                                                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {coupon.isActive ? <FaToggleOn size={16} color="var(--admin-text-success)" /> : <FaToggleOff size={16} color="var(--admin-text-muted)" />}
                                                    </button>
                                                )}
                                                <button
                                                    className="admin-btn admin-btn-danger"
                                                    style={{ padding: '6px' }}
                                                    onClick={() => handleDelete(coupon._id)}
                                                    title="Delete coupon"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
