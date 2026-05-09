import React from 'react';
import { Heart, ShoppingCart, User } from 'lucide-react';
import { Link } from 'react-router-dom';

// Un "Componente" es una pieza de Lego reutilizable.
// Sacamos la barra de navegación aquí para no tener que escribirla en todas las páginas.
function Navbar() {
  return (
    <nav className="navbar container">
      {/* En vez de <a href="..."> usamos <Link to="..."> para que React cambie de página SIN recargar */}
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
        <Heart size={20} strokeWidth={1.5} />
        <ShoppingCart size={20} strokeWidth={1.5} />
        <User size={20} strokeWidth={1.5} />
      </div>
    </nav>
  );
}

export default Navbar;
