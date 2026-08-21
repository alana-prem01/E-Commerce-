import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { toast } from 'react-toastify';
import AdminPagination from '../Components/AdminPagination';
import { FiSearch, FiFilter } from 'react-icons/fi';
import '../css/AdminDashboard.css';

const PremiumSubscribersPage = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchSubscribers();
    }, []);

    // Reset to page 1 whenever filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Scroll to top whenever page changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const mainContainer = document.querySelector('.admin-dashboard-main');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users?limit=1000');
            if (res.success && (res.data || res.users)) {
                const allUsers = res.data || res.users || [];
                // Filter only users who have premium membership data
                const premiumUsers = allUsers.filter(u => 
                    u.membership && (u.membership.isPremium || u.membership.startDate)
                );
                setSubscribers(premiumUsers);
            }
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            toast.error(error.message || 'Failed to fetch subscribers');
        } finally {
            setLoading(false);
        }
    };

    const getMembershipStatus = (user) => {
        if (!user.membership || !user.membership.expiryDate) return 'Expired';
        const isExpired = new Date(user.membership.expiryDate) < new Date();
        return isExpired ? 'Expired' : 'Active';
    };

    const filteredSubscribers = useMemo(() => {
        return subscribers.filter(u => {
            const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  u.email?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const mStatus = getMembershipStatus(u);
            const matchesStatus = statusFilter === 'All' || mStatus === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [subscribers, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredSubscribers.length / PAGE_SIZE) || 1;
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * PAGE_SIZE;
    const paginatedSubscribers = filteredSubscribers.slice(startIndex, startIndex + PAGE_SIZE);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="mb-4">
            {/* Page Header */}
            <div className="mb-4">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Premium Subscribers</h1>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>View and manage users who have subscribed to Elora Premium.</p>
            </div>

            {/* Filter & Search Section */}
            <div className="admin-card mb-4" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input 
                        type="text" 
                        className="admin-input" 
                        style={{ width: '100%', paddingLeft: '36px' }}
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div style={{ flex: '0 1 200px', position: 'relative' }}>
                    <FiFilter style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <select 
                        className="admin-select"
                        style={{ width: '100%', paddingLeft: '36px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                    </select>
                </div>
            </div>

            {/* Subscribers Table */}
            <div className="admin-card admin-table-container" style={{ paddingBottom: 0 }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading subscribers...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Status</th>
                                <th>Start Date</th>
                                <th>Expiry Date</th>
                                <th>Amount Paid</th>
                                <th>Payment / Order ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSubscribers.length > 0 ? (
                                paginatedSubscribers.map(user => {
                                    const mStatus = getMembershipStatus(user);
                                    const statusClass = mStatus === 'Active' ? 'admin-badge-success' : 'admin-badge-danger';
                                    const membership = user.membership || {};
                                    
                                    // Extract payment IDs if present
                                    const orderId = membership.razorpay_order_id || '—';
                                    const paymentId = membership.razorpay_payment_id || '—';
                                    const paymentInfo = orderId !== '—' || paymentId !== '—' ? (
                                        <>
                                            {orderId !== '—' && <div style={{ fontSize: '0.8rem', color: '#666' }}>Order: {orderId}</div>}
                                            {paymentId !== '—' && <div style={{ fontSize: '0.8rem', color: '#666' }}>Pay: {paymentId}</div>}
                                        </>
                                    ) : '—';

                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        backgroundColor: 'var(--admin-bg)', color: 'var(--primary-color)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 600, fontSize: '0.875rem'
                                                    }}>
                                                        {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>{user.name}</div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`admin-badge ${statusClass}`}>
                                                    {mStatus}
                                                </span>
                                            </td>
                                            <td>{formatDate(membership.startDate)}</td>
                                            <td>{formatDate(membership.expiryDate)}</td>
                                            <td style={{ fontWeight: 500 }}>
                                                {membership.startDate ? '₹599' : '—'}
                                            </td>
                                            <td>{paymentInfo}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <div style={{ color: 'var(--admin-text-light)', marginBottom: '16px' }}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                </svg>
                                            </div>
                                            <h3 style={{ fontSize: '1.125rem', color: 'var(--admin-text-main)', marginBottom: '8px' }}>No subscribers found</h3>
                                            <p style={{ color: 'var(--admin-text-muted)' }}>No premium subscribers match your criteria.</p>
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
                        totalItems={filteredSubscribers.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                )}
            </div>
        </div>
    );
};

export default PremiumSubscribersPage;
