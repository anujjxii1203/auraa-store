import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('@aura_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.log('Error loading cart', e);
    }
  };

  const saveCart = async (newCart) => {
    setCart(newCart);
    try {
      await AsyncStorage.setItem('@aura_cart', JSON.stringify(newCart));
    } catch (e) {
      console.log('Error saving cart', e);
    }
  };

  const addToCart = (product, size = 'M', quantity = 1) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex(
      (item) => item.product_id === product.id && item.size === size
    );

    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({
        id: product.id + size + Date.now(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        quantity,
      });
    }

    saveCart(newCart);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter((item) => item.id !== itemId);
    saveCart(newCart);
  };

  const updateQuantity = (itemId, change) => {
    const newCart = [...cart];
    const index = newCart.findIndex((item) => item.id === itemId);
    
    if (index >= 0) {
      const newQuantity = newCart[index].quantity + change;
      if (newQuantity > 0) {
        newCart[index].quantity = newQuantity;
        saveCart(newCart);
      } else {
        removeFromCart(itemId);
      }
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
