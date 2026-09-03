import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { toast } from 'react-toastify';
import '../css/SingleOrderPage.css';

const SingleOrderPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get(`/orders/getorder/${id}`);
                if (res.success && res.order) {
                    setOrder(res.order);
                } else {
                    setError(res.message || 'Order not found');
                }
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError(err.message || 'Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        try {
            setUpdatingStatus(true);
            const res = await api.put(`/orders/updatestatus/${id}`, {
                status: newStatus,
                orderStatus: newStatus
            });
            if (res.success) {
                toast.success(`Order status updated to ${newStatus}`);
                setOrder(prev => ({ ...prev, orderStatus: newStatus }));
            }
        } catch (err) {
            console.error('Error updating order status:', err);
            toast.error(err.message || 'Failed to update order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="mb-4 text-center" style={{ padding: '60px 20px', color: 'var(--admin-text-muted)' }}>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>Loading order details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="mb-4">
                <div className="mb-3">
                    <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--admin-text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                            <path d="M15 18L9 12L15 6"/>
                        </svg>
                        Back to Orders
                    </Link>
                </div>
                <div className="admin-card text-center" style={{ padding: '60px 20px' }}>
                    <div style={{ color: 'var(--admin-text-light)', marginBottom: '16px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--admin-text-main)', marginBottom: '8px' }}>Order Not Found</h2>
                    <p style={{ color: 'var(--admin-text-muted)', marginBottom: '24px' }}>{error || "The requested order could not be found."}</p>
                    <Link to="/orders" className="admin-btn admin-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                        Return to Orders List
                    </Link>
                </div>
            </div>
        );
    }

    const orderStatus = order.orderStatus || 'Pending';

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Pending': return 'admin-badge-warning';
            case 'Processing': return 'admin-badge-info';
            case 'Shipped': return 'admin-badge-primary';
            case 'Out for Delivery': return 'admin-badge-info';
            case 'Delivered': return 'admin-badge-success';
            case 'Cancelled': return 'admin-badge-danger';
            default: return 'admin-badge-secondary';
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'Pending': return 'Order is pending and awaiting processing.';
            case 'Processing': return 'The order has been processed and is being prepared.';
            case 'Shipped': return 'The order has been shipped and is on its way to the customer.';
            case 'Out for Delivery': return 'The order is out for delivery today.';
            case 'Delivered': return 'The order has been successfully delivered to the customer.';
            case 'Cancelled': return 'This order has been cancelled.';
            default: return `Order status is currently ${status}.`;
        }
    };

    const paymentBadgeClass = order.paymentStatus === 'Paid' 
        ? 'admin-badge-success' 
        : order.paymentStatus === 'Failed' 
            ? 'admin-badge-danger' 
            : 'admin-badge-warning';

    const customerFirstName = order.shippingAddress?.firstName || '';
    const customerLastName = order.shippingAddress?.lastName || '';
    const fullName = `${customerFirstName} ${customerLastName}`.trim();
    const customerName = fullName || order.user?.name || order.contactEmail || 'Guest Customer';
    const emailAddress = order.contactEmail || order.user?.email || 'N/A';
    const phoneNumber = order.shippingAddress?.phone || 'N/A';

    const addressParts = [
        order.shippingAddress?.address,
        order.shippingAddress?.city,
        order.shippingAddress?.state,
        order.shippingAddress?.pinCode,
        order.shippingAddress?.country
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No shipping address provided';

    const formattedDate = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    const totalItems = order.orderItems 
        ? order.orderItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
        : 0;

    const shortOrderId = order._id ? `#ORD-${order._id.substring(order._id.length - 6).toUpperCase()}` : '';

    return (
        <div className="mb-4">
            {/* Header Navigation */}
            <div className="mb-3 d-flex justify-content-between align-items-center">
                <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--admin-text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d="M15 18L9 12L15 6"/>
                    </svg>
                    Back to Orders
                </Link>
            </div>

            {/* Main Header */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: 0 }}>
                            Order {shortOrderId}
                        </h1>
                        <span className={`admin-badge ${getStatusBadgeClass(orderStatus)}`}>
                            {orderStatus}
                        </span>
                    </div>
                    <p style={{ color: 'var(--admin-text-muted)', margin: '8px 0 0 0', fontSize: '0.95rem' }}>
                        Placed on {formattedDate} · {customerName}
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="admin-btn admin-btn-outline" onClick={() => window.print()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Print Order
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 2' }}>
                    
                    {/* Order Status Section */}
                    <div className="admin-card" style={{ marginBottom: 0 }}>
                        <div className="admin-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h2 className="admin-card-title">Order Status</h2>
                            <div className="d-flex align-items-center gap-2">
                                <label htmlFor="order-status-select" style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0, fontWeight: 500 }}>
                                    Update Status:
                                </label>
                                <select 
                                    id="order-status-select"
                                    className="admin-select" 
                                    style={{ padding: '6px 12px', fontSize: '0.875rem', width: 'auto' }}
                                    value={orderStatus}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={updatingStatus || orderStatus === 'Delivered' || orderStatus === 'Cancelled'}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Out for Delivery">Out for Delivery</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-3">
                            <span className={`admin-badge ${getStatusBadgeClass(orderStatus)}`} style={{ fontSize: '0.875rem', padding: '6px 12px' }}>
                                {orderStatus}
                            </span>
                        </div>
                        <p style={{ color: 'var(--admin-text-muted)', marginBottom: '0' }}>{getStatusMessage(orderStatus)}</p>
                    </div>

                    {/* Order Details Section */}
                    <div className="admin-card" style={{ marginBottom: 0 }}>
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Order Details</h2>
                        </div>
                        
                        <div className="admin-grid-2 mb-4">
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Customer Name</div>
                                <div style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>{customerName}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Email Address</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{emailAddress}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Phone Number</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{phoneNumber}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Shipping Address</div>
                                <div style={{ color: 'var(--admin-text-main)', lineHeight: 1.4 }}>{fullAddress}</div>
                            </div>
                        </div>

                        <div className="admin-grid-2 mb-4" style={{ paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Order Date</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{formattedDate}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Total Items</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{totalItems}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Payment Method</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{order.paymentDetails?.payment_method || 'Razorpay / Online'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Delivery Method</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{order.deliveryMethod || 'Standard'}</div>
                            </div>
                        </div>

                        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '16px' }}>Items Ordered</h3>
                            
                            {order.orderItems && order.orderItems.length > 0 ? (
                                order.orderItems.map((item, idx) => (
                                    <div key={item._id || idx} className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: idx < order.orderItems.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                                        <div className="d-flex align-items-center gap-3">
                                            {item.image ? (
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name} 
                                                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)' }} 
                                                />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--admin-bg)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-light)', fontWeight: 600 }}>
                                                    {item.name ? item.name.charAt(0).toUpperCase() : 'P'}
                                                </div>
                                            )}
                                            <div>
                                                <span style={{ fontWeight: 500, color: 'var(--admin-text-main)', display: 'block' }}>{item.name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>₹{(item.price || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', display: 'block' }}>Qty {item.quantity || 1}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                                                ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', margin: 0 }}>No items in this order.</p>
                            )}
                        </div>

                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Order Summary Section */}
                    <div className="admin-card" style={{ marginBottom: 0 }}>
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Order Summary</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="d-flex justify-content-between text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                                <span>Subtotal</span>
                                <span style={{ color: 'var(--admin-text-main)' }}>₹{(order.pricing?.subtotal || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="d-flex justify-content-between text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                                <span>Shipping Charge</span>
                                <span style={{ color: 'var(--admin-text-main)' }}>₹{(order.pricing?.shipping || 0).toLocaleString('en-IN')}</span>
                            </div>
                            {(order.pricing?.discount || 0) > 0 && (
                                <div className="d-flex justify-content-between text-sm" style={{ color: 'var(--admin-text-success)' }}>
                                    <span>Discount</span>
                                    <span>-₹{(order.pricing?.discount || 0).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div style={{ borderTop: '1px dashed var(--admin-border)', margin: '8px 0' }}></div>
                            <div className="d-flex justify-content-between font-weight-bold" style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--admin-text-main)' }}>
                                <span>Total Amount</span>
                                <span>₹{(order.pricing?.total || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="admin-card" style={{ marginBottom: 0 }}>
                        <div className="admin-card-header">
                            <h2 className="admin-card-title">Payment Details</h2>
                        </div>
                        
                        <div className="mb-4">
                            <span className={`admin-badge ${paymentBadgeClass}`}>
                                {order.paymentStatus || 'Pending'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Payment Method</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>{order.paymentDetails?.payment_method || 'Razorpay / Online'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Transaction ID</div>
                                <div style={{ color: 'var(--admin-text-main)' }}>
                                    {order.paymentDetails?.razorpay_payment_id || order.paymentDetails?.razorpay_order_id || '—'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)', marginBottom: '4px' }}>Amount Paid</div>
                                <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                                    {order.paymentStatus === 'Paid' ? `₹${(order.pricing?.total || 0).toLocaleString('en-IN')}` : '—'}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default SingleOrderPage;
