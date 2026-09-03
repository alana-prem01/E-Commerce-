import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
import AdminLayout from './Components/AdminLayout';
import PrivateRoute from './Components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import SignUp from './pages/SignUp';
import About from './pages/About';
import Contact from './pages/Contact';
import Category from './pages/Category';
import UserProfile from './pages/UserProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DisclaimerPolicy from './pages/DisclaimerPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import RefundPolicy from './pages/RefundPolicy';
import OrderTracking from './pages/OrderTracking';
import Cart from './pages/Cart';
import PopupBestSellers from './Components/PopupBestSellers';
import BestSellerPage from './pages/BestSellerPage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfilePage from './pages/AdminProfilePage';
import ProductListPage from './pages/ProductListPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import OrderListPage from './pages/OrderListPage';
import SingleOrderPage from './pages/SingleOrderPage';
import UserListPage from './pages/UserListPage';
import SingleUserDetailsPage from './pages/SingleUserDetailsPage';
import ProtectedRoute from './utils/ProtectedRoute';
import SearchResultsPage from './pages/SearchResultsPage';
import WishlistPage from './pages/WishlistPage';
import CouponManagementPage from './pages/CouponManagementPage';
import PremiumSubscribersPage from './pages/PremiumSubscribersPage';
import ContactMessagesPage from './pages/ContactMessagesPage';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { CartProvider } from './utils/CartContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-google-client-id.apps.googleusercontent.com";

const Layout = ({ children }) => {
  const location = useLocation();
  const adminRoutes = [
    '/admin-dashboard', '/admin-profile', '/products', '/add-product',
    '/edit-product', '/orders', '/order/', '/users', '/user-details', '/coupons', '/premium-subscribers', '/admin-messages',
  ];

  const isAdminRoute = adminRoutes.some(route => {
    if (route.endsWith('/')) {
      return location.pathname.startsWith(route);
    }
    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  });

  if (isAdminRoute) {
    return (
      <AdminLayout>
        {children}
        <ToastContainer position='top-right' autoClose={1500} />
      </AdminLayout>
    );
  }

  return (
    <>
      <Header />
      {children}
      <ToastContainer position='top-right' autoClose={1500} />
      <Footer />
    </>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <CartProvider>
          <Layout>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/best-sellers" element={<BestSellerPage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="/category/:category" element={<Category />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/otp" element={<OTPVerificationPage />} />
              <Route path="/forgot-password" element={<OTPVerificationPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/disclaimer-policy" element={<DisclaimerPolicy />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/popup-best-sellers" element={<PopupBestSellers />} />

              {/* Protected Pages – require authentication */}
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/ordertracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/ordertracking/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/order-tracking/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

              {/* Protected Admin Pages */}
              <Route path="/admin-dashboard" element={<PrivateRoute role="Admin"><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin-profile" element={<PrivateRoute role="Admin"><AdminProfilePage /></PrivateRoute>} />
              <Route path="/products" element={<PrivateRoute role="Admin"><ProductListPage /></PrivateRoute>} />
              <Route path="/add-product" element={<PrivateRoute role="Admin"><AddProductPage /></PrivateRoute>} />
              <Route path="/edit-product/:id" element={<PrivateRoute role="Admin"><EditProductPage /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute role="Admin"><OrderListPage /></PrivateRoute>} />
              <Route path="/order/:id" element={<PrivateRoute role="Admin"><SingleOrderPage /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute role="Admin"><UserListPage /></PrivateRoute>} />
              <Route path="/user-details/:id" element={<PrivateRoute role="Admin"><SingleUserDetailsPage /></PrivateRoute>} />
              <Route path="/coupons" element={<PrivateRoute role="Admin"><CouponManagementPage /></PrivateRoute>} />
              <Route path="/premium-subscribers" element={<PrivateRoute role="Admin"><PremiumSubscribersPage /></PrivateRoute>} />
              <Route path="/admin-messages" element={<PrivateRoute role="Admin"><ContactMessagesPage /></PrivateRoute>} />
            </Routes>
          </Layout>
        </CartProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
