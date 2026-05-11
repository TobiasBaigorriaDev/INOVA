import React from 'react';
import { Heart, ShoppingCart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';

function Home({ addToCart, toggleFavorite, favorites }) {

  // Función para limpiar el precio
  const cleanProductPrice = (product) => {
    const numericPrice = typeof product.price === 'string'
      ? parseFloat(product.price.replace('$', ''))
      : product.price;
    return { ...product, price: numericPrice };
  };

  return (
    <>
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title font-serif">INOVA</h1>
          <p className="hero-subtitle">
            Piezas de autor creadas para quienes encuentran la belleza en los detalles más sutiles y la expresión sin fronteras.
          </p>
        </div>
      </section>

      <section className="products-section container">
        <div className="products-header">
          <h2 className="products-title font-serif">Selección Artesanal</h2>
          <div className="products-filters">
            {/* Este botón ahora lleva a tu nueva página de colecciones */}
            <Link to="/colecciones"><span className="active" style={{ cursor: 'pointer' }}>Ver Todas las Colecciones</span></Link>
          </div>
        </div>

        <div className="products-grid">
          {products.map((product) => {
            const isFavorite = favorites.some(fav => fav.id === product.id);

            return (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  <button
                    className="wishlist-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      // Limpiamos el producto antes de guardarlo en favoritos
                      toggleFavorite(cleanProductPrice(product));
                    }}
                    style={{
                      color: isFavorite ? '#e74c3c' : 'inherit',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Heart
                      size={18}
                      strokeWidth={2}
                      fill={isFavorite ? '#e74c3c' : 'none'}
                    />
                  </button>

                  <Link to={`/producto/${product.id}`} style={{ display: 'block' }}>
                    <img src={product.image} alt={product.name} />
                  </Link>
                </div>

                <h3 className="product-title font-serif">{product.name}</h3>
                <p className="product-price">{product.price}</p>

                <button className="add-to-cart-btn" onClick={() => addToCart(cleanProductPrice(product))}>
                  <ShoppingCart size={14} strokeWidth={2} />
                  AGREGAR AL CARRITO
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <button className="chat-btn">
        <MessageCircle size={28} strokeWidth={1.5} />
      </button>
    </>
  );
}

export default Home;