import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MessageCircle } from 'lucide-react'; // <-- Importamos el ícono del chat aquí
import './index.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Chatbot from './components/Chatbot'; // <-- IMPORTAMOS NUESTRO NUEVO CHATBOT

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Favorites from './pages/Favorites'; // <-- IMPORTAMOS LA NUEVA PÁGINA
import Auth from './pages/Auth'; // <-- PÁGINA DE LOGIN Y REGISTRO
import Checkout from './pages/Checkout'; // <-- PÁGINA DE COMPRA
import Collections from './pages/Collections'; // <-- IMPORTAMOS COLECCIONES
import Admin from './pages/Admin'; // <-- PANEL DE ADMINISTRACIÓN

function App() {
  // Lógica del Carrito
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // --- NUEVO: Lógica del Chatbot ---
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- NUEVO: Lógica de Favoritos ---
  const [favorites, setFavorites] = useState([]);

  // Función que agrega si no está, o saca si ya está en favoritos
  const toggleFavorite = (product) => {
    const isFav = favorites.find(item => item.id === product.id);
    if (isFav) {
      setFavorites(favorites.filter(item => item.id !== product.id));
    } else {
      setFavorites([...favorites, product]);
    }
  };
  // -----------------------------------

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
        {/* Le pasamos los favoritos al Home para que el corazón se pinte si ya está agregado */}
        <Route path="/" element={<Home addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />} />

        {/* <-- NUEVA RUTA PARA LOS FAVORITOS --> */}
        <Route path="/favoritos" element={<Favorites favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} />} />

        <Route path="/producto/:id" element={<ProductDetail addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/checkout" element={<Checkout cartItems={cartItems} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />

        {/* <-- NUEVA RUTA PARA COLECCIONES --> */}
        <Route path="/colecciones" element={<Collections addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />} />

        {/* <-- RUTA PARA EL PANEL DE ADMINISTRACIÓN --> */}
        <Route path="/admin" element={<Admin />} />
      </Routes>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
      />

      {/* COMPONENTE DEL CHATBOT */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Si el chat está cerrado, mostramos el botón original. 
          Le sumamos un "delay" de 0.25s para que espere a que la ventana se achique,
          y la animación "chatButtonPop" para que rebote. */}
      {!isChatOpen && (
        <button
          className="chat-btn"
          onClick={() => setIsChatOpen(true)}
          style={{
            animation: 'chatButtonPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.25s backwards'
          }}
        >
          <MessageCircle size={28} strokeWidth={1.5} />
        </button>
      )}

      <Footer />
    </Router>
  );
}

export default App;