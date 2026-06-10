import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, User, Search } from 'lucide-react'; // <-- AGREGAMOS Search
import { Link, useNavigate } from 'react-router-dom'; // <-- AGREGAMOS useNavigate
import { useCart } from '../context/CartContext';

function Navbar({ usuario, logout, favorites = [] }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFavAnimating, setIsFavAnimating] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const totalFavs = favorites.length;

  // Estados para la animación de la barra de búsqueda global
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    if (totalItems > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  useEffect(() => {
    if (totalFavs > 0) {
      setIsFavAnimating(true);
      const timer = setTimeout(() => {
        setIsFavAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [totalFavs]);
  // Función para ejecutar la búsqueda global
  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (globalSearch.trim() !== '') {
      // Navegamos a colecciones y le pasamos la palabra en la URL
      navigate(`/colecciones?search=${encodeURIComponent(globalSearch)}`);
      setIsSearchOpen(false); // Cerramos la barrita
      setGlobalSearch(''); // Limpiamos el input
    }
  };

  return (
    <nav className="navbar" style={{ width: '100%', borderBottom: '1px solid var(--border-color)' }}>
      <Link to="/" className="navbar-brand">
        <div className="logo-circle">I</div>
        <div className="logo-text">INOVA</div>
      </Link>
      <ul className="nav-links">
        <li><Link to="/">INICIO</Link></li>
        <li><Link to="/colecciones">COLECCIONES</Link></li>
        <li><Link to="/historia">HISTORIA</Link></li>
        <li><Link to="/contacto">CONTACTO</Link></li>
      </ul>
      <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

        {/* --- NUEVO: CONTENEDOR DE BÚSQUEDA GLOBAL ANIMADO --- */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Search
            size={20}
            strokeWidth={1.5}
            style={{ cursor: 'pointer', zIndex: 2 }}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          />
          <form
            onSubmit={handleGlobalSearch}
            style={{
              width: isSearchOpen ? '180px' : '0px',
              opacity: isSearchOpen ? 1 : 0,
              visibility: isSearchOpen ? 'visible' : 'hidden',
              transition: 'all 0.3s ease-in-out',
              marginLeft: isSearchOpen ? '10px' : '0px',
              overflow: 'hidden'
            }}
          >
            <input
              type="text"
              placeholder="Buscar..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid var(--text-muted)',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                padding: '2px 0',
                color: 'inherit'
              }}
            />
          </form>
        </div>
        {/* ---------------------------------------------------- */}
        <Link to="/favoritos" className={`${isFavAnimating ? 'cart-animating' : ''}`} style={{ color: 'inherit', display: 'flex', alignItems: 'center', position: 'relative' }}>          <Heart size={20} strokeWidth={1.5} style={{ cursor: 'pointer' }} />
          {totalFavs > 0 && <span className="cart-badge" style={{ backgroundColor: '#e74c3c' }}>{totalFavs}</span>}
        </Link>

        <span onClick={() => setIsCartOpen(true)} className={`cart-icon-container ${isAnimating ? 'cart-animating' : ''}`}>
          <ShoppingCart size={20} strokeWidth={1.5} />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </span>

        <Link to="/login" style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <User size={20} strokeWidth={1.5} style={{ cursor: 'pointer' }} />
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;