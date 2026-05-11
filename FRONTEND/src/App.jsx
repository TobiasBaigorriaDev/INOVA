import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Favorites from './pages/Favorites';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Collections from './pages/Collections'; // <-- IMPORTAMOS COLECCIONES

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (product) => {
    const isFav = favorites.find(item => item.id === product.id);
    if (isFav) {
      setFavorites(favorites.filter(item => item.id !== product.id));
    } else {
      setFavorites([...favorites, product]);
    }
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id ? { ...item, qty: item.qty + quantity } : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, qty: quantity }]);
    }
  };

  const updateQuantity = (id, amount) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.qty + amount;
        return { ...item, qty: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  return (
    <Router>
      <Navbar onOpenCart={() => setIsCartOpen(true)} cartItems={cartItems} />

      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />} />
        <Route path="/favoritos" element={<Favorites favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} />} />
        <Route path="/producto/:id" element={<ProductDetail addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/checkout" element={<Checkout cartItems={cartItems} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />

        {/* <-- NUEVA RUTA PARA COLECCIONES --> */}
        <Route path="/colecciones" element={<Collections addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />} />
      </Routes>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
      />

      <Footer />
    </Router>
  );
}

export default App;