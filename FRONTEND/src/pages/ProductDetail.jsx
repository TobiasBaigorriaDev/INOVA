import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import { products as staticProducts } from '../data/products';
import { useCart } from '../context/CartContext';

const cleanProductPrice = (product) => {
  const numericPrice =
    typeof product.price === 'string'
      ? parseFloat(product.price.replace('$', ''))
      : product.price;

  return {
    ...product,
    price: numericPrice
  };
};

function ProductDetail({
  toggleFavorite,
  favorites = []
}) {

  const {
    addToCart,
    cartItems,
    showToast
  } = useCart();

  const { id } = useParams();

  const navigate = useNavigate();

  const [quantity, setQuantity] =
    useState(1);

  const [productInfo, setProductInfo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [similarProducts, setSimilarProducts] = 
    useState([]);

  const [mainItemAdded, setMainItemAdded] = useState(false);
  const [addedSimilarItem, setAddedSimilarItem] = useState(null);

  // =========================
  // SCROLL TOP AL CAMBIAR ID
  // =========================

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // =========================
  // PRODUCTOS SIMILARES
  // =========================

  useEffect(() => {
    if (!productInfo) return;

    const fetchSimilar = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          const productsArray = Array.isArray(data) ? data : data.productos || [];
          
          if (productsArray && productsArray.length > 0) {
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
            
            const filtered = mappedProducts
              .filter(p => p.category === productInfo.category && p.id !== productInfo.id)
              .slice(0, 4);
              
            setSimilarProducts(filtered);
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching similar products', e);
      }
      
      const filteredStatic = staticProducts
        .filter(p => p.category === productInfo.category && p.id !== productInfo.id)
        .slice(0, 4);
      setSimilarProducts(filteredStatic);
    };

    fetchSimilar();
  }, [productInfo]);

  // =========================
  // SINCRONIZAR CANTIDAD
  // =========================

  useEffect(() => {

    if (productInfo) {

      const existingItem =
        cartItems.find(
          item => item.id === productInfo.id
        );

      const stockNum =
        Number(productInfo.stock);

      if (stockNum === 0) {

        setQuantity(0);

      } else if (existingItem) {

        setQuantity(
          Number(existingItem.qty)
        );

      } else {

        setQuantity(1);

      }

    }

  }, [productInfo?.id, cartItems]);

  // =========================
  // TRAER PRODUCTO
  // =========================

  useEffect(() => {

    const fetchProduct = async () => {

      try {

        setLoading(true);

        const response =
          await fetch(
            `http://localhost:3000/api/products/${id}`
          );

        if (!response.ok) {

          throw new Error(
            'Producto no encontrado'
          );

        }

        const p = await response.json();

        if (p) {

          const mapped = {

            id: p.id,

            name: p.nombre,

            description: p.descripcion,

            price:
              typeof p.precio === 'number'
                ? `$${p.precio.toFixed(2)}`
                : p.precio,

            image:
              p.imagenUrl ||
              'https://via.placeholder.com/300',

            category:
              p.categoria === 'pulsera'
                ? 'pulseras'
                : p.categoria === 'collar'
                ? 'collares'
                : p.categoria === 'anillo'
                ? 'anillos'
                : p.categoria === 'pendiente'
                ? 'pendientes'
                : p.categoria,

            stock:
              p.stock !== undefined
                ? Number(p.stock)
                : 0

          };

          setProductInfo(mapped);

          setLoading(false);

          return;

        }

      } catch (error) {

        console.error(error);

      }

      // fallback productos locales

      const staticProduct =
        staticProducts.find(
          item => item.id === parseInt(id)
        );

      if (staticProduct) {

        setProductInfo({

          ...staticProduct,

          stock:
            staticProduct.stock !== undefined
              ? Number(staticProduct.stock)
              : 10

        });

      }

      setLoading(false);

    };

    fetchProduct();

  }, [id]);

  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (

      <div
        className="container"
        style={{
          padding: '80px 40px',
          minHeight: '60vh',
          textAlign: 'center'
        }}
      >

        <h1 className="font-serif">
          Cargando producto...
        </h1>

      </div>

    );

  }

  // =========================
  // ERROR PRODUCTO
  // =========================

  if (!productInfo) {

    return (

      <div
        className="container"
        style={{
          padding: '80px 40px',
          minHeight: '60vh',
          textAlign: 'center'
        }}
      >

        <h1 className="font-serif">
          Producto no encontrado
        </h1>

        <Link
          to="/"
          style={{
            color: 'var(--primary)',
            textDecoration: 'underline'
          }}
        >
          Volver al inicio
        </Link>

      </div>

    );

  }

  // =========================
  // FAVORITOS
  // =========================

  const isFavorite =
    favorites.some(
      fav => fav.id === productInfo.id
    );

  // =========================
  // AGREGAR AL CARRITO
  // =========================

  const handleAddToCart = () => {

    addToCart(
      cleanProductPrice(productInfo),
      quantity,
      true
    );

    setMainItemAdded(true);
    setTimeout(() => setMainItemAdded(false), 1500);

  };

  const handleSimilarAddToCartClick = (product) => {
    addToCart(cleanProductPrice(product));
    setAddedSimilarItem(product.id);
    setTimeout(() => setAddedSimilarItem(null), 1500);
  };

  // =========================
  // COMPRAR AHORA
  // =========================

  const handleBuyNow = () => {

    addToCart(
      cleanProductPrice(productInfo),
      quantity,
      true
    );

    navigate('/checkout');

  };

  // =========================
  // CAMBIAR CANTIDAD
  // =========================

  const updateQty = (amount) => {

    setQuantity(prev => {

      const maxStock =
        productInfo.stock !== undefined
          ? Number(productInfo.stock)
          : 99;

      if (maxStock === 0) {
        showToast('Límite de stock alcanzado', 'error');
        return 0;

      }

      const newQty =
        prev + amount;

      if (newQty < 1) {

        return 1;

      }

      if (newQty > maxStock) {
        showToast('Límite de stock alcanzado', 'error');
        return maxStock;

      }

      return newQty;

    });

  };

  // =========================
  // FAVORITOS
  // =========================

  const handleToggleFavorite = () => {

    toggleFavorite(
      cleanProductPrice(productInfo)
    );

  };

  return (

    <div className="container product-detail-container">

      {/* VOLVER */}

      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--text-muted)',
          marginBottom: '40px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >

        <ArrowLeft size={16} />

        VOLVER ATRÁS

      </button>

      <div className="product-detail-layout">

        {/* IMAGEN */}

        <div
          style={{
            flex: 1,
            borderRadius: '30px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            aspectRatio: '4/5'
          }}
        >

          <img
            src={productInfo.image}
            alt={productInfo.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

        </div>

        {/* INFO */}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >

          <h1
            className="font-serif"
            style={{
              fontSize: '48px',
              fontStyle: 'italic',
              margin: 0
            }}
          >
            {productInfo.name}
          </h1>

          <p
            style={{
              fontSize: '24px',
              color: 'var(--text-muted)',
              letterSpacing: '1px'
            }}
          >

            {
              typeof productInfo.price === 'number'
                ? `$${productInfo.price.toFixed(2)}`
                : productInfo.price
            }

          </p>

          <p
            style={{
              color: 'var(--text-muted)',
              lineHeight: '1.8',
              fontWeight: '300'
            }}
          >

            {
              productInfo.description ||
              'Una pieza artesanal unica para tu coleccion.'
            }

          </p>

          <p
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color:
                Number(productInfo.stock) > 0
                  ? 'var(--text-muted)'
                  : '#e74c3c',
              marginTop: '10px'
            }}
          >

            {
              Number(productInfo.stock) > 0
                ? `Stock disponible: ${productInfo.stock} unidades`
                : 'Producto sin stock disponible'
            }

          </p>

          {/* BOTONES */}

          <div
            style={{
              display: 'flex',
              gap: '15px',
              marginTop: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >

            {/* CANTIDAD */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border:
                  '1px solid var(--border-color)',
                borderRadius: '30px',
                padding: '0 10px',
                height: '60px'
              }}
            >

              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor:
                    quantity <= 1 ||
                    Number(productInfo.stock) === 0
                      ? 'not-allowed'
                      : 'pointer',
                  padding: '10px',
                  color:
                    quantity <= 1 ||
                    Number(productInfo.stock) === 0
                      ? '#ccc'
                      : 'var(--primary)'
                }}
                onClick={() => updateQty(-1)}
                disabled={
                  quantity <= 1 ||
                  Number(productInfo.stock) === 0
                }
              >
                -
              </button>

              <span
                style={{
                  width: '30px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {quantity}
              </span>

              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '10px',
                  color:
                    quantity >= Number(productInfo.stock)
                      ? '#ccc'
                      : 'var(--primary)'
                }}
                onClick={() => {
                  if (quantity >= Number(productInfo.stock)) {
                    showToast('Límite de stock alcanzado', 'error');
                  } else {
                    updateQty(1);
                  }
                }}
              >
                +
              </button>

            </div>

            {/* AGREGAR */}

            <button
              className={`add-to-cart-btn ${mainItemAdded ? 'item-added' : ''}`}
              style={{
                flex: 1,
                minWidth: '180px',
                height: '60px',
                padding: '0',
                fontSize: '11px',
                opacity:
                  Number(productInfo.stock) === 0
                    ? 0.5
                    : 1,
                cursor:
                  Number(productInfo.stock) === 0
                    ? 'not-allowed'
                    : 'pointer'
              }}
              onClick={handleAddToCart}
              disabled={
                Number(productInfo.stock) === 0
              }
            >
              {mainItemAdded ? (
                '¡AGREGADO! ✓'
              ) : (
                <>
                  <ShoppingCart
                    size={16}
                    strokeWidth={2}
                  />

                  {
                    Number(productInfo.stock) === 0
                      ? 'SIN STOCK'
                      : 'AÑADIR A MI BOLSA'
                  }
                </>
              )}
            </button>

            {/* COMPRAR */}

            <button
              className="add-to-cart-btn"
              style={{
                flex: 1,
                minWidth: '180px',
                height: '60px',
                padding: '0',
                fontSize: '11px',
                background:
                  Number(productInfo.stock) === 0
                    ? '#e0e0e0'
                    : 'var(--primary)',
                color:
                  Number(productInfo.stock) === 0
                    ? '#999'
                    : 'white',
                opacity:
                  Number(productInfo.stock) === 0
                    ? 0.5
                    : 1,
                cursor:
                  Number(productInfo.stock) === 0
                    ? 'not-allowed'
                    : 'pointer'
              }}
              onClick={handleBuyNow}
              disabled={
                Number(productInfo.stock) === 0
              }
            >

              {
                Number(productInfo.stock) === 0
                  ? 'SIN STOCK'
                  : 'COMPRAR AHORA'
              }

            </button>

            {/* FAVORITO */}

            <button
              className="wishlist-btn"
              style={{
                position: 'relative',
                top: 'auto',
                right: 'auto',
                width: '60px',
                height: '60px',
                flexShrink: 0,
                border:
                  '1px solid var(--border-color)',
                color:
                  isFavorite
                    ? '#e74c3c'
                    : 'inherit',
                transition: 'all 0.3s'
              }}
              onClick={handleToggleFavorite}
            >

              <Heart
                size={20}
                strokeWidth={1.5}
                fill={
                  isFavorite
                    ? '#e74c3c'
                    : 'none'
                }
              />

            </button>

          </div>

        </div>

      </div>

      {/* =========================
          PRODUCTOS SIMILARES
          ========================= */}
      
      {similarProducts.length > 0 && (
        <section className="products-section" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--border-color)', paddingBottom: '40px' }}>
          <div className="products-header" style={{ marginBottom: '40px', borderBottom: 'none', paddingBottom: '0' }}>
            <h2 className="products-title font-serif" style={{ fontSize: '28px' }}>También te podría gustar</h2>
          </div>

          <div className="products-grid">
            {similarProducts.map((product) => {
              const isFav = favorites.some(fav => fav.id === product.id);

              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <button
                      className="wishlist-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(cleanProductPrice(product));
                      }}
                      style={{
                        color: isFav ? '#e74c3c' : 'inherit',
                        transition: 'all 0.3s'
                      }}
                    >
                      <Heart size={18} strokeWidth={2} fill={isFav ? '#e74c3c' : 'none'} />
                    </button>

                    <Link 
                      to={`/producto/${product.id}`} 
                      style={{ display: 'block' }}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      <img src={product.image} alt={product.name} />
                    </Link>
                  </div>

                  <h3 className="product-title font-serif">{product.name}</h3>
                  <p className="product-price">{product.price}</p>

                  <button 
                    className={`add-to-cart-btn ${addedSimilarItem === product.id ? 'item-added' : ''}`}
                    onClick={() => handleSimilarAddToCartClick(product)}
                  >
                    {addedSimilarItem === product.id ? (
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
        </section>
      )}

    </div>

  );

}

export default ProductDetail;