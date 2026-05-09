import React from 'react'
import { Heart, ShoppingCart, User, MessageCircle } from 'lucide-react'
import './index.css'

const products = [
  {
    id: 1,
    name: 'Collar Minimalista Oro',
    price: '$89.00',
    image: 'https://images.unsplash.com/photo-1599643478524-fb66f70d00f8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Pulsera Elegante',
    price: '$65.00',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Anillo Aurora',
    price: '$120.00',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b4545e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    name: 'Pendientes Gota',
    price: '$75.00',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Pulsera Ethereal',
    price: '$95.00',
    image: 'https://images.unsplash.com/photo-1515562141207-7a8efbc88a53?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Collar Luna',
    price: '$110.00',
    image: 'https://images.unsplash.com/photo-1535632787350-4e68e0fc253b?auto=format&fit=crop&w=600&q=80'
  }
]

function App() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar container">
        <div className="navbar-brand">
          <div className="logo-circle">I</div>
          <div className="logo-text">INOVA</div>
        </div>
        <ul className="nav-links">
          <li><a href="#">INICIO</a></li>
          <li><a href="#">COLECCIONES</a></li>
          <li><a href="#">HISTORIA</a></li>
          <li><a href="#">CONTACTO</a></li>
        </ul>
        <div className="nav-icons">
          <Heart size={20} strokeWidth={1.5} />
          <ShoppingCart size={20} strokeWidth={1.5} />
          <User size={20} strokeWidth={1.5} />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title font-serif">INOVA</h1>
          <p className="hero-subtitle">
            Piezas de autor creadas para quienes encuentran la belleza en los detalles más sutiles y la expresión sin fronteras.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section container">
        <div className="products-header">
          <h2 className="products-title font-serif">Selección Artesanal</h2>
          <div className="products-filters">
            <span className="active">Todos</span>
            <span>Aros</span>
            <span>Anillos</span>
          </div>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <button className="wishlist-btn">
                  <Heart size={18} strokeWidth={2} />
                </button>
                <img src={product.image} alt={product.name} />
              </div>
              <h3 className="product-title font-serif">{product.name}</h3>
              <p className="product-price">{product.price}</p>
              <button className="add-to-cart-btn">
                <ShoppingCart size={14} strokeWidth={2} />
                AGREGAR AL CARRITO
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Button */}
      <button className="chat-btn">
        <MessageCircle size={28} strokeWidth={1.5} />
      </button>

      {/* Footer */}
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
    </>
  )
}

export default App
