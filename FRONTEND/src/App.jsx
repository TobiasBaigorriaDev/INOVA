import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MessageCircle } from 'lucide-react'; // <-- Importamos el ícono del chat aquí
import './index.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Chatbot from './components/Chatbot'; // <-- IMPORTAMOS NUESTRO NUEVO CHATBOT
import { CartProvider } from './context/CartContext'; // <-- IMPORTAMOS EL PROVEEDOR DEL CARRITO

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Favorites from './pages/Favorites'; // <-- IMPORTAMOS LA NUEVA PÁGINA
import Auth from './pages/Auth'; // <-- PÁGINA DE LOGIN Y REGISTRO
import Checkout from './pages/Checkout'; // <-- PÁGINA DE COMPRA
import Collections from './pages/Collections'; // <-- IMPORTAMOS COLECCIONES
import Admin from './pages/Admin'; // <-- PANEL DE ADMINISTRACIÓN

function App() {
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

  return (
    <CartProvider>
      <Router>
        <Navbar />

        <Routes>
          {/* Le pasamos los favoritos al Home para que el corazón se pinte si ya está agregado */}
          <Route path="/" element={<Home toggleFavorite={toggleFavorite} favorites={favorites} />} />

          {/* <-- NUEVA RUTA PARA LOS FAVORITOS --> */}
          <Route path="/favoritos" element={<Favorites favorites={favorites} toggleFavorite={toggleFavorite} />} />

          <Route path="/producto/:id" element={<ProductDetail toggleFavorite={toggleFavorite} favorites={favorites} />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* <-- NUEVA RUTA PARA COLECCIONES --> */}
          <Route path="/colecciones" element={<Collections toggleFavorite={toggleFavorite} favorites={favorites} />} />

          {/* <-- RUTA PARA EL PANEL DE ADMINISTRACIÓN --> */}
          <Route path="/admin" element={<Admin />} />
        </Routes>

        <CartSidebar />

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
    </CartProvider>
  );
}

export default App;