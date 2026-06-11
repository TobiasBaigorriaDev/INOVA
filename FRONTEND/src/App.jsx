import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import './index.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Chatbot from './components/Chatbot';

import { CartProvider } from './context/CartContext';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Favorites from './pages/Favorites';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Collections from './pages/Collections';
import Admin from './pages/Admin';
import Contacto from './pages/Contacto';
import Historia from './pages/Historia';

function App() {

  // =========================
  // CHATBOT
  // =========================

  const [isChatOpen, setIsChatOpen] =
    useState(false);

  // =========================
  // FAVORITOS
  // =========================

  const [favorites, setFavorites] =
    useState(() => {

      const favoritosGuardados =
        localStorage.getItem('favoritos');

      return favoritosGuardados
        ? JSON.parse(favoritosGuardados)
        : [];

    });

  // =========================
  // USUARIO
  // =========================

  const [usuario, setUsuario] =
    useState(null);

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('favoritos');
    localStorage.removeItem('inova_cart');
    localStorage.removeItem('inova_cart_timestamp');
    setUsuario(null);
    window.location.href = '/login';
  };

  // =========================
  // CARGAR USUARIO
  // =========================

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }

    if (token) {
      fetch('http://localhost:3000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) {
          logout();
          throw new Error('Sesión inválida o expirada');
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('token', data.token);
        setUsuario(data.usuario);
      })
      .catch(err => {
        console.error('Error al verificar sesión con backend:', err);
      });
    }
  }, []);

  // =========================
  // GUARDAR FAVORITOS
  // =========================

  useEffect(() => {

    localStorage.setItem(
      'favoritos',
      JSON.stringify(favorites)
    );

  }, [favorites]);

  // =========================
  // FAVORITOS
  // =========================

  const toggleFavorite = (product) => {

    const isFav = favorites.find(
      item => item.id === product.id
    );

    if (isFav) {

      setFavorites(

        favorites.filter(
          item => item.id !== product.id
        )

      );

    } else {

      setFavorites([
        ...favorites,
        product
      ]);

    }

  };

  return (

    <CartProvider>

      <Router>

        <Navbar
          usuario={usuario}
          logout={logout}
          favorites={favorites}
        />

        <Routes>

          {/* HOME */}

          <Route
            path="/"
            element={
              <Home
                toggleFavorite={toggleFavorite}
                favorites={favorites}
              />
            }
          />

          {/* FAVORITOS */}

          <Route
            path="/favoritos"
            element={
              <Favorites
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            }
          />

          {/* PRODUCTO */}

          <Route
            path="/producto/:id"
            element={
              <ProductDetail
                toggleFavorite={toggleFavorite}
                favorites={favorites}
              />
            }
          />

          {/* LOGIN */}

          <Route
            path="/login"
            element={
              <Auth
                setUsuario={setUsuario}
              />
            }
          />

          {/* CHECKOUT */}

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          {/* COLECCIONES */}

          <Route
            path="/colecciones"
            element={
              <Collections
                toggleFavorite={toggleFavorite}
                favorites={favorites}
              />
            }
          />

          {/* ADMIN */}

          <Route
            path="/admin"
            element={
              usuario
                ? usuario.rol === 'ADMIN_ROLE'
                  ? <Admin />
                  : <Navigate to="/" replace />
                : <Auth setUsuario={setUsuario} />
            }
          />

          {/* CONTACTO */}

          <Route
            path="/contacto"
            element={<Contacto />}
          />

          {/* HISTORIA */}

          <Route
            path="/historia"
            element={<Historia />}
          />

        </Routes>

        {/* CARRITO */}

        <CartSidebar />

        {/* CHATBOT */}

        <Chatbot
          isOpen={isChatOpen}
          onClose={() =>
            setIsChatOpen(false)
          }
        />

        {/* BOTON CHAT */}

        {!isChatOpen && (

          <button
            className="chat-btn"
            onClick={() =>
              setIsChatOpen(true)
            }
            style={{
              animation:
                'chatButtonPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.25s backwards'
            }}
          >

            <MessageCircle
              size={28}
              strokeWidth={1.5}
            />

          </button>

        )}

        {/* FOOTER */}

        <Footer />

      </Router>

    </CartProvider>

  );

}

export default App;