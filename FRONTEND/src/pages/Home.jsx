import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'; // Quitamos MessageCircle de aquí
import { Link } from 'react-router-dom';
import { products } from '../data/products';

function Home({ addToCart, toggleFavorite, favorites }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Mostrar máximo 9 productos por página (solo paginará de ser necesario)
  
  // Curated products for the hero carousel (first 4 products)
  const carouselProducts = products.slice(0, 4);

  // Pagination calculations
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, carouselProducts.length]);

  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
  };

  const prevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + carouselProducts.length) % carouselProducts.length);
  };

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
        <div className="hero-container container">
          <div className="hero-info">
            <h1 className="hero-title font-serif">INOVA</h1>
            <p className="hero-subtitle">
              Piezas de autor creadas para quienes encuentran la belleza en los detalles más sutiles y la expresión sin fronteras.
            </p>
            <Link to="/colecciones" className="hero-cta font-serif">
              Explorar Colecciones
            </Link>
          </div>
          
          <div 
            className="hero-carousel-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button 
              className="carousel-arrow prev" 
              onClick={prevSlide}
              aria-label="Anterior producto"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            
            <div className="hero-carousel-track">
              {carouselProducts.map((product, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <Link 
                    key={product.id}
                    to={`/producto/${product.id}`}
                    className={`hero-carousel-card ${isActive ? 'active' : ''}`}
                  >
                    <div className="hero-card-image-container">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="hero-card-info">
                      <h3 className="hero-card-title font-serif">{product.name}</h3>
                      <p className="hero-card-price">{product.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <button 
              className="carousel-arrow next" 
              onClick={nextSlide}
              aria-label="Siguiente producto"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>

            <div className="carousel-dots">
              {carouselProducts.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSlide(idx);
                  }}
                  aria-label={`Ir al producto ${idx + 1}`}
                />
              ))}
            </div>
          </div>
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
          {currentProducts.map((product) => {
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

        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-arrow"
              onClick={() => {
                setCurrentPage(prev => Math.max(prev - 1, 1));
                window.scrollTo({ top: document.querySelector('.products-section').offsetTop - 100, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(number);
                    window.scrollTo({ top: document.querySelector('.products-section').offsetTop - 100, behavior: 'smooth' });
                  }}
                >
                  {number}
                </button>
              ))}
            </div>
            <button 
              className="pagination-arrow"
              onClick={() => {
                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: document.querySelector('.products-section').offsetTop - 100, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </>
  );
}

export default Home;