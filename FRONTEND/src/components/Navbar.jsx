import React from 'react';
import { Heart, ShoppingCart, User } from 'lucide-react';
import { Link } from 'react-router-dom';

function Navbar({ onOpenCart }) {
  return (
    <nav className="navbar container">
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

        <span onClick={onOpenCart} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ShoppingCart size={20} strokeWidth={1.5} />
        </span>

        <User size={20} strokeWidth={1.5} style={{ cursor: 'pointer' }} />
      </div>
    </nav>
  );
}

export default Navbar;