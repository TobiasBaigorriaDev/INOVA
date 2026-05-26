import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // <-- IMPORTAMOS EL HOOK DEL CONTEXTO

function Navbar() {
  const [isAnimating, setIsAnimating] = useState(false);
  const { totalItems, setIsCartOpen } = useCart(); // <-- OBTENEMOS LOS DATOS DIRECTAMENTE DEL CONTEXTO

  useEffect(() => {
    if (totalItems > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

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
      <div className="nav-icons">
        {/* <-- AHORA EL CORAZÓN ES UN LINK A /favoritos --> */}
        <Link to="/favoritos" style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <Heart size={20} strokeWidth={1.5} style={{ cursor: 'pointer' }} />
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