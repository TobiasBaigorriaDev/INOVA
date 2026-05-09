import React from 'react';

// Pie de página reutilizable
function Footer() {
  return (
    <footer className="footer container">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo-row">
            <div className="logo-circle" style={{ width: '50px', height: '50px', fontSize: '20px' }}>I</div>
            <div className="logo-text" style={{ fontSize: '28px' }}>INOVA</div>
          </div>
          <p className="footer-tagline">PIEZAS DE AUTOR</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <a href="#">Envios</a>
            <a href="#">Taller</a>
          </div>
          <div className="footer-col">
            <a href="#">Instagram</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 INOVA. GENDERLESS JEWELRY.</p>
      </div>
    </footer>
  );
}

export default Footer;
