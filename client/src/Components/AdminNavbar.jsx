import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import '../css/AdminNavbar.css';

const AdminNavbar = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const name = user?.name || "Admin";

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = (e) => {
        e.preventDefault();
        setIsProfileOpen(false);
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        toast.success("Successfully logged out!");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("cartItems");
        window.dispatchEvent(new Event('auth-change'));
        navigate("/admin-login");
    };

    return (
        <div className="admin-navbar-container">
            {/* Logo Container */}
            <div className="admin-navbar-logo-container">
                <div className="admin-navbar-logo-mark">
                    <span style={{ color: '#D4AF37', fontSize: '20px' }}>✨</span>
                </div>
                <div className="admin-navbar-logo-text">ELORA</div>
            </div>

            {/* Navigation Links */}
            <div className="admin-navbar-links">
                <Link 
                    to="/" 
                    className="admin-navbar-link"
                >
                    Home
                </Link>
                <Link 
                    to="/admin-dashboard" 
                    className={`admin-navbar-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
                >
                    Dashboard
                </Link>
                <Link 
                    to="/add-product" 
                    className={`admin-navbar-link ${location.pathname === '/add-product' ? 'active' : ''}`}
                >
                    Add Product
                </Link>
                <Link 
                    to="/admin-profile" 
                    className={`admin-navbar-link ${location.pathname === '/admin-profile' ? 'active' : ''}`}
                >
                    Settings
                </Link>
            </div>

            {/* Icons Container */}
            <div className="admin-navbar-icons">
                {/* Profile */}
                <div className="admin-navbar-profile-container" ref={dropdownRef}>
                    <FiUser 
                        className="admin-navbar-profile-icon" 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    />
                    
                    {/* Dropdown */}
                    <div className={`admin-navbar-dropdown ${isProfileOpen ? 'active' : ''}`}>
                        <div className="admin-navbar-dropdown-name">{name}</div>
                        <div className="admin-navbar-dropdown-item" onClick={() => { setIsProfileOpen(false); navigate('/admin-profile'); }}>
                            Settings & Profile
                        </div>
                        <div className="admin-navbar-dropdown-item logout" onClick={handleLogoutClick}>
                            Logout
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Logout Confirmation Modal (SETTINGS-278) */}
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">Portal Logout</div>
                        <div className="modal-body">Are you sure you want to log out of the Admin Portal?</div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                            <button className="btn-danger" onClick={confirmLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNavbar;

