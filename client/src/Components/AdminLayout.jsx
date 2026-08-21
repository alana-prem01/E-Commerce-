import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiPackage, FiLayers, FiShoppingBag, FiUsers, FiUser, FiLogOut, FiMenu, FiX, FiTag, FiStar } from 'react-icons/fi';
import AdminNavbar from './AdminNavbar';
import '../css/AdminDashboard.css';
import '../css/admin-core.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const name = user?.name || "Admin";
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    // Protect Admin Routes
    useEffect(() => {
        const checkAdminAuth = () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                navigate("/login");
                return;
            }

            try {
                const user = JSON.parse(userStr);
                if (user.role !== "Admin") {
                    navigate("/");
                }
            } catch (e) {
                navigate("/login");
            }
        };

        checkAdminAuth();
    }, [navigate]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("cartItems");
        window.dispatchEvent(new Event('auth-change'));
        navigate("/login");
    };

    const navItems = [
        { label: 'Dashboard', icon: <FiGrid size={20} />, path: '/admin-dashboard' },
        { label: 'Products', icon: <FiPackage size={20} />, path: '/products' },
        { label: 'Orders', icon: <FiShoppingBag size={20} />, path: '/orders' },
        { label: 'Users', icon: <FiUsers size={20} />, path: '/users' },
        { label: 'Premium', icon: <FiStar size={20} />, path: '/premium-subscribers' },
        { label: 'Coupons', icon: <FiTag size={20} />, path: '/coupons' },
        { label: 'Profile', icon: <FiUser size={20} />, path: '/admin-profile' },
    ];

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/admin-dashboard') return 'Dashboard';
        if (path === '/products') return 'Products';
        if (path === '/add-product') return 'Add Product';
        if (path.startsWith('/edit-product')) return 'Edit Product';
        if (path === '/orders') return 'Orders';
        if (path.startsWith('/order/')) return 'Order Details';
        if (path === '/users') return 'Users';
        if (path.startsWith('/user-details')) return 'User Details';
        if (path === '/premium-subscribers') return 'Premium Subscribers';
        if (path === '/admin-profile') return 'Profile';
        if (path === '/coupons') return 'Coupon Management';
        return 'Dashboard';
    };

    const isActive = (itemPath, itemLabel) => {
        const path = location.pathname;
        if (itemLabel === 'Dashboard') return path === '/admin-dashboard';
        if (itemLabel === 'Products') return path === '/products' || path === '/add-product' || path.startsWith('/edit-product');
        if (itemLabel === 'Categories') return false;
        if (itemLabel === 'Orders') return path === '/orders' || path.startsWith('/order/');
        if (itemLabel === 'Users') return path === '/users' || path.startsWith('/user-details');
        if (itemLabel === 'Premium') return path === '/premium-subscribers';
        if (itemLabel === 'Coupons') return path === '/coupons';
        if (itemLabel === 'Profile') return path === '/admin-profile';
        return false;
    };

    return (
        <div className="admin-dashboard-wrapper">
            {/* Mobile overlay */}
            {mobileOpen && <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />}

            {/* Sidebar */}
            <aside className={`admin-dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Logo Section */}
                <div className="admin-sidebar-logo-section">
                    <div className="admin-sidebar-logo-badge">
                        <span style={{ color: '#D4AF37', fontSize: '28px' }}>✨</span>
                    </div>
                    <span className="admin-sidebar-brand-name">ELORA</span>
                    <span className="admin-sidebar-brand-subtitle">FINE JEWELLERY</span>
                </div>

                {/* Navigation */}
                <nav className="admin-sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`admin-nav-item ${isActive(item.path, item.label) ? 'active' : ''}`}
                            style={{ textDecoration: 'none' }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Divider */}
                <div className="admin-sidebar-divider" />

                {/* Logout */}
                <div className="admin-sidebar-logout-btn" onClick={handleLogout}>
                    <FiLogOut size={20} />
                    <span>Logout</span>
                </div>

                {/* Quote */}
                <div className="admin-sidebar-quote">
                    <p className="admin-quote-text">"Elegance is the only beauty that never fades."</p>
                    <p className="admin-quote-author">— Audrey Hepburn</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-dashboard-main">
                <div className="mobile-hamburger-wrapper">
                    <button className="hamburger-menu" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <FiX size={24} color="var(--text-dark)" /> : <FiMenu size={24} color="var(--text-dark)" />}
                    </button>
                </div>
                <AdminNavbar />

                {/* Page Content */}
                <div className="admin-page-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
