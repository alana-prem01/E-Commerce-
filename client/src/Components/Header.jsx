import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaChevronDown, FaTimes, FaBars, FaHeart } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { IoCart } from "react-icons/io5";
import { useCart } from "../utils/CartContext";
import "../css/Header.css";

const CATEGORIES = [
  { name: 'Rings', slug: 'rings' },
  { name: 'Necklaces', slug: 'necklaces' },
  { name: 'Bracelets', slug: 'bracelets' },
  { name: 'Earrings', slug: 'earrings' },
  { name: 'Bangles', slug: 'bangles' },
  { name: 'Jhumkas', slug: 'jhumkas' },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItemCount } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");
  const [isAdmin, setIsAdmin] = useState(() => {
    const userStr = localStorage.getItem("user");
    try {
      return userStr ? JSON.parse(userStr).role === 'Admin' : false;
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const categoriesRef = useRef(null);
  const searchInputRef = useRef(null);

  // Scroll listener for sticky blur effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth change listener
  useEffect(() => {
    const handle = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      const userStr = localStorage.getItem("user");
      try {
        setIsAdmin(userStr ? JSON.parse(userStr).role === 'Admin' : false);
      } catch {
        setIsAdmin(false);
      }
    };
    window.addEventListener('auth-change', handle);
    return () => window.removeEventListener('auth-change', handle);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    if ((e.key === "Enter" || e.type === "click") && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isActive = (path) => location.pathname === path ? "active-link" : "";

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-announcement-bar">
        <span className="sparkle">✨</span>
        <p>FREE SHIPPING ON ORDERS ABOVE ₹999 | 10% OFF ON FIRST ORDER</p>
        <span className="sparkle">✨</span>
      </div>

      <header className={`header-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="logo-brand text-logo-container">
            <div className="text-logo">
              <span className="logo-title">ELORA</span>
              <span className="logo-subtitle">JEWELLERY</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-links desktop-nav">
            <Link to="/" className={`nav-link-custom ${isActive("/")}`}>Home</Link>
            <Link to="/shop" className={`nav-link-custom ${isActive("/shop")}`}>Shop</Link>

            <div className="categories-wrapper" ref={categoriesRef}>
              <button
                className={`categories-link nav-link-custom ${location.pathname.startsWith("/category") ? "active-link" : ""}`}
                onClick={() => setIsCategoriesOpen(p => !p)}
              >
                <span>Categories</span>
                <FaChevronDown className={`chevron-icon ${isCategoriesOpen ? "open" : ""}`} size={10} />
              </button>
              <div className={`categories-dropdown ${isCategoriesOpen ? "active" : ""}`}>
                {CATEGORIES.map(c => (
                  <Link key={c.slug} to={`/category/${c.slug}`} className="category-item" onClick={() => setIsCategoriesOpen(false)}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/best-sellers" className={`nav-link-custom ${isActive("/best-sellers")}`}>Best Sellers</Link>
            <Link to="/about" className={`nav-link-custom ${isActive("/about")}`}>About</Link>
            <Link to="/contact" className={`nav-link-custom ${isActive("/contact")}`}>Contact</Link>
          </nav>

          {/* Right Icons */}
          <div className="icon-group">
            {/* Search */}
            <div className={`search-box ${searchOpen ? 'open' : ''}`}>
              {searchOpen && (
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search jewellery..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  className="search-input"
                />
              )}
              {searchOpen && searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery("")}><FaTimes size={12} /></button>
              )}
              <button
                className="search-icon-btn"
                onClick={() => {
                  if (searchOpen) handleSearchSubmit({ type: 'click' });
                  else setSearchOpen(true);
                }}
              >
                <FaSearch className="icon" />
              </button>
            </div>

            {/* Wishlist */}
            {isLoggedIn && (
              <Link to="/wishlist" className={`nav-link-custom icon-btn ${isActive("/wishlist")}`} title="Wishlist">
                <FaHeart className="icon wishlist-icon" />
              </Link>
            )}

            {/* Profile */}
            <Link to={isLoggedIn ? (isAdmin ? "/admin-dashboard" : "/profile") : "/login"} className={`nav-link-custom icon-btn ${isActive(isAdmin ? "/admin-dashboard" : "/profile")}`} title={isAdmin ? "Admin Dashboard" : "Profile"}>
              <CgProfile className="icon" />
            </Link>

            {/* Cart */}
            <Link to={isLoggedIn ? "/cart" : "/login"} className={`cart-link nav-link-custom ${isActive("/cart")}`} title="Cart">
              <IoCart className="icon" />
              {totalItemCount > 0 && <span className="cart-badge">{totalItemCount}</span>}
            </Link>

            {/* Mobile Menu Hamburger */}
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(p => !p)}>
              {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="logo-text">Elora Jewellery</span>
              <button onClick={() => setMobileMenuOpen(false)}><FaTimes size={20} /></button>
            </div>

            {/* Mobile Search */}
            <div className="mobile-search-wrapper">
              <input
                type="text"
                placeholder="Search jewellery..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setMobileMenuOpen(false);
                  }
                }}
                className="mobile-search-input"
              />
              <FaSearch className="mobile-search-icon" />
            </div>

            <nav className="mobile-nav">
              <Link to="/" className="mobile-nav-link">Home</Link>
              <Link to="/shop" className="mobile-nav-link">Shop</Link>
              <div className="mobile-nav-divider">Categories</div>
              {CATEGORIES.map(c => (
                <Link key={c.slug} to={`/category/${c.slug}`} className="mobile-nav-link sub">
                  {c.name}
                </Link>
              ))}
              <Link to="/best-sellers" className="mobile-nav-link">Best Sellers</Link>
              <Link to="/about" className="mobile-nav-link">About</Link>
              <Link to="/contact" className="mobile-nav-link">Contact</Link>
              <hr className="mobile-nav-hr" />
              {isLoggedIn ? (
                <>
                  <Link to={isAdmin ? "/admin-dashboard" : "/profile"} className="mobile-nav-link">
                    {isAdmin ? "Admin Dashboard" : "My Profile"}
                  </Link>
                  <Link to="/wishlist" className="mobile-nav-link">My Wishlist</Link>
                  <Link to="/cart" className="mobile-nav-link">Cart ({totalItemCount})</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-nav-link">Login</Link>
                  <Link to="/signup" className="mobile-nav-link">Sign Up</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;