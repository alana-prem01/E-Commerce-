import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from './api';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

// Helper: get the current logged-in user's ID
const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user._id || null;
    }
  } catch {
    // ignore parse errors
  }
  return null;
};

// Helper: build a user-scoped localStorage key for cart
const getCartStorageKey = (userId) => {
  return userId ? `cart_${userId}` : null;
};

// Helper: load cart items from user-scoped localStorage
const loadCartForUser = (userId) => {
  const key = getCartStorageKey(userId);
  if (!key) return [];
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Helper: save cart items to user-scoped localStorage
const saveCartForUser = (userId, items) => {
  const key = getCartStorageKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
};

export const CartProvider = ({ children }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    const userId = getCurrentUserId();
    return loadCartForUser(userId);
  });

  const [cartNotes, setCartNotes] = useState('');

  // Persist cart to user-scoped localStorage whenever cartItems change
  useEffect(() => {
    const userId = getCurrentUserId();
    saveCartForUser(userId, cartItems);
  }, [cartItems]);

  // Listen for auth-change events (login/logout) and re-sync cart state
  const handleAuthChange = useCallback(() => {
    const userId = getCurrentUserId();
    if (userId) {
      // A user just logged in — load their cart
      const userCart = loadCartForUser(userId);
      setCartItems(userCart);
    } else {
      // User logged out — clear in-memory cart immediately
      setCartItems([]);
    }
    setCartNotes('');
  }, []);

  useEffect(() => {
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [handleAuthChange]);

  const addToCart = (product, quantity = 1) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const productId = product._id || product.id;

    const itemPrice = typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;

    const itemImage = product.image || product.productImage || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=300';
    const itemTitle = product.name || product.title || product.productName || 'Jewellery Item';

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => String(item.id) === String(productId));
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: productId,
            title: itemTitle,
            variant: product.variant || 'Standard',
            price: itemPrice,
            quantity: quantity,
            image: itemImage,
            error: '',
          },
        ];
      }
    });

    toast.success(`${itemTitle} added to cart!`);

    // Optionally sync with backend if logged in
    if (isLoggedIn) {
      api.post('/cart/addcart', { productId: productId, quantity }).catch(() => {
        // Silent fallback for guest/offline
      });
    }
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    toast.info('Item removed from cart.');
  };

  const updateQuantity = (id, newQty) => {
    const qty = Number(newQty);
    if (isNaN(qty) || qty < 1) {
      setCartItems((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...item, error: 'Quantity must be at least 1' } : item))
      );
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, quantity: qty, error: '' } : item))
    );
  };

  const clearCart = async () => {
    // Clear in-memory state immediately
    setCartItems([]);
    // Also clear the user-scoped localStorage cache so items don't reappear on refresh
    const userId = getCurrentUserId();
    const key = getCartStorageKey(userId);
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to clear cart from localStorage', e);
      }
    }
    // Also clear cart on the backend so server state stays in sync
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      api.delete('/cart/clearcart').catch(() => {
        // Silent — local cart is already cleared
      });
    }
  };

  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemCount,
        subtotal,
        cartNotes,
        setCartNotes,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
