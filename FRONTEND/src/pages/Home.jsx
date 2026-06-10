import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'; // Quitamos MessageCircle de aquí
import { Link } from 'react-router-dom';
import { products as staticProducts } from '../data/products';
import { useCart } from '../context/CartContext'; // <-- IMPORTAMOS EL HOOK DEL CONTEXTO

function Home({ toggleFavorite, favorites }) {
  const { addToCart, cartItems } = useCart(); // <-- CONSUMIMOS EL CARRITO DIRECTAMENTE
  const [dbProducts, setDbProducts] = useState(staticProducts);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Mostrar máximo 9 productos por página (solo paginará de ser necesario)

  const [addedItem, setAddedItem] = useState(null);
  const [errorItem, setErrorItem] = useState(null);

  const handleAddToCartClick = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    const cartQuantity = existingItem ? Number(existingItem.qty) : 0;

    if (cartQuantity + 1 > Number(product.stock)) {
      setErrorItem(product.id);
      setTimeout(() => setErrorItem(null), 1500);
      return;
    }

    addToCart(cleanProductPrice(product));
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  // Fetch de productos desde la base de datos PostgreSQL
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products?limit=100');
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();

        const productsArray = Array.isArray(data)
          ? data
          : data.productos || [];

        if (productsArray && productsArray.length > 0) {
          // Mapeamos los productos de PostgreSQL al formato del frontend
          const mappedProducts = productsArray.map(p => ({
            id: p.id,
            name: p.nombre,
            description: p.descripcion,
            price: typeof p.precio === 'number' ? `$${p.precio.toFixed(2)}` : p.precio,
            image: p.imagenUrl || 'https://via.placeholder.com/300',
            category:
              p.categoria === 'pulsera' ? 'pulseras' :
                p.categoria === 'collar' ? 'collares' :
                  p.categoria === 'anillo' ? 'anillos' :
                    p.categoria === 'pendiente' ? 'pendientes' :
                      p.categoria,
            stock: p.stock
          }));
          setDbProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Error al conectar con PostgreSQL, usando datos estáticos:', error);
      }
    };
    fetchProducts();
  }, []);

  // All products for the hero carousel (dynamic length)
  const carouselProducts = dbProducts;

  // Pagination calculations
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = dbProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(dbProducts.length / itemsPerPage);

  useEffect(() => {
    if (isHovered || carouselProducts.length === 0) return;

    // Al añadir currentSlide a las dependencias, cualquier cambio manual 
    // reinicia el temporizador de 5000ms automáticamente.
    const timeout = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isHovered, carouselProducts.length, currentSlide]);

  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (carouselProducts.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
  };

  const prevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (carouselProducts.length === 0) return;
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
      <section className="hero hero-redesigned">
        <div className="hero-overlay"></div>
        <div className="hero-container container" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', position: 'relative', zIndex: 10 }}>
          <div className="hero-info" style={{ alignItems: 'center', textAlign: 'center' }}>
            <h1 className="hero-title font-serif">INOVA</h1>
            <p className="hero-subtitle">
              Piezas de autor creadas para quienes encuentran la belleza en los detalles más sutiles y la expresión sin fronteras.
            </p>
            <Link to="/colecciones" className="hero-cta font-serif">
              Explorar Colecciones
            </Link>
          </div>
        </div>

        <div className="hero-carousel-wrapper">
          <button
            className="carousel-arrow prev"
            onClick={prevSlide}
            aria-label="Anterior producto"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>

          <div
            className="hero-carousel-track"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {carouselProducts.map((product, idx) => {
              let positionClass = 'hidden';
              if (idx === currentSlide) {
                positionClass = 'active';
              } else if (idx === (currentSlide - 1 + carouselProducts.length) % carouselProducts.length) {
                positionClass = 'prev-slide';
              } else if (idx === (currentSlide + 1) % carouselProducts.length) {
                positionClass = 'next-slide';
              }

              // Optimization: Eager load only the 3 initially visible images, lazy load the rest
              const isInitialVisible = idx === 0 || idx === 1 || idx === carouselProducts.length - 1;

              return (
                <Link
                  key={product.id}
                  to={`/producto/${product.id}`}
                  className={`hero-carousel-card ${positionClass}`}
                >
                  <div className="hero-card-image-container">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading={isInitialVisible ? "eager" : "lazy"}
                    />
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
            {carouselProducts.map((_, idx) => {
              // Si hay muchos productos, limitamos los dots a una ventana de 5 alrededor del currentSlide
              if (carouselProducts.length > 5) {
                // Calcular distancia considerando el comportamiento circular
                const dist1 = Math.abs(currentSlide - idx);
                const dist2 = Math.abs(currentSlide + carouselProducts.length - idx);
                const dist3 = Math.abs(currentSlide - carouselProducts.length - idx);
                const minDistance = Math.min(dist1, dist2, dist3);

                if (minDistance > 2) return null; // Solo renderizar 5 dots en pantalla
              }

              return (
                <button
                  key={idx}
                  className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSlide(idx);
                  }}
                  aria-label={`Ir al producto ${idx + 1}`}
                />
              );
            })}
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
            
            const cartItem = cartItems.find(item => item.id === product.id);
            const currentCartQty = cartItem ? Number(cartItem.qty) : 0;
            const isMaxStock = currentCartQty >= Number(product.stock);

            return (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  <button
                    className={`wishlist-btn ${isFavorite ? 'heart-pop' : ''}`}
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

                <button
                  disabled={isMaxStock}
                  className={`add-to-cart-btn ${isMaxStock ? 'max-stock-btn' : ''} ${addedItem === product.id ? 'item-added' : ''} ${errorItem === product.id ? 'item-error shake' : ''}`}
                  onClick={() => !isMaxStock && handleAddToCartClick(product)}
                >
                  {isMaxStock ? (
                    'STOCK MÁXIMO ALCANZADO'
                  ) : errorItem === product.id ? (
                    '¡Stock Máximo Alcanzado! ❌'
                  ) : addedItem === product.id ? (
                    '¡AGREGADO! ✓'
                  ) : (
                    <>
                      <ShoppingCart size={14} strokeWidth={2} />
                      AGREGAR AL CARRITO
                    </>
                  )}
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