import { Link } from 'react-router-dom';

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
            <a href="https://www.instagram.com/inova.accesorios/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <Link to="/contacto">Contacto</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 INOVA.</p>
      </div>
    </footer>
  );
}

export default Footer;
