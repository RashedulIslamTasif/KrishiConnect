import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const cartKey = user ? 'krishi_cart_' + user._id : 'krishi_cart_guest';

  const [cart, setCart] = useState([]);

  // Load correct cart when user changes (login/logout)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey)) || [];
      setCart(saved);
    } catch {
      setCart([]);
    }
  }, [cartKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        return prev.map(i =>
          i._id === product._id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i._id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(prev =>
      prev.map(i => i._id === productId ? { ...i, qty } : i)
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart,
      updateQty, clearCart, cartCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};