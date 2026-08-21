import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { toast } from 'react-toastify';
import AdminPagination from '../Components/AdminPagination';
import '../css/OrderListPage.css';

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter]);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const mainContainer = document.querySelector('.admin-dashboard-main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/allorders');
      if (res.success) {
        setOrders(res.orders || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/orders/updatestatus/${id}`, { 
        status: newStatus,
        orderStatus: newStatus 
      });
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(orders.map(order => 
          order._id === id ? { ...order, orderStatus: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  // Filter orders based on search, status and payment
  const filteredOrders = (orders || []).filter(order => {
    const customerName = order.user ? order.user.name : (order.contactEmail || 'Guest');
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Status' || order.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'All' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="mb-4">
      {/* Page Header */}
      <div className="mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Orders</h1>
        <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>Manage, track, and update the status of customer orders.</p>
      </div>

      {/* Filter & Search Section */}
      <div className="admin-card mb-4" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="admin-input" 
          style={{ flex: '1 1 300px' }}
          placeholder="Search by Order ID or Customer Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="admin-select"
          style={{ flex: '0 1 200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select 
          className="admin-select"
          style={{ flex: '0 1 200px' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="All">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="admin-card admin-table-container" style={{ paddingBottom: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading orders...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map(order => {
                  const customerName = order.user ? order.user.name : (order.contactEmail || 'Guest');
                  const amount = order.pricing?.total || 0;
                  const paymentStatusClass = order.paymentStatus === 'Paid' ? 'admin-badge-success' : 
                                            order.paymentStatus === 'Failed' ? 'admin-badge-danger' : 'admin-badge-warning';
                  
                  return (
                    <tr key={order._id}>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                      <td style={{ fontWeight: 500 }}>{customerName}</td>
                      <td>
                        <span style={{ display: 'block', fontSize: '0.875rem' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-light)' }}>
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{amount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`admin-badge ${paymentStatusClass}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="admin-select" 
                          style={{ padding: '4px 8px', fontSize: '0.875rem', width: 'auto' }}
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/order/${order._id}`} className="admin-btn admin-btn-outline" style={{ padding: '6px', textDecoration: 'none' }} title="View Order Details">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ color: 'var(--admin-text-light)', marginBottom: '16px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '1.125rem', color: 'var(--admin-text-main)', marginBottom: '8px' }}>No orders found</h3>
                      <p style={{ color: 'var(--admin-text-muted)' }}>No orders match your current criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        {/* Pagination Controls for Orders */}
        {!loading && (
          <AdminPagination
            currentPage={activePage}
            totalItems={filteredOrders.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderListPage;
