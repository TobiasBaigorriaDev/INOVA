import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import { products } from '../data/products';

const cleanProductPrice = (product) => {
  const numericPrice = typeof product.price === 'string'
    ? parseFloat(product.price.replace('$', ''))
    : product.price;
  return { ...product, price: numericPrice };
};

function ProductDetail({ addToCart, toggleFavorite, favorites = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  // Busca el producto en el nuevo archivo central
  const productInfo = products.find(p => p.id === parseInt(id));

  // Si alguien pone un ID que no existe, mostramos un error amigable
  if (!productInfo) {
    return (
      <div className="container" style={{ padding: '80px 40px', minHeight: '60vh', textAlign: 'center' }}>
        <h1 className="font-serif">Producto no encontrado</h1>
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Volver al inicio</Link>
      </div>
    );
  }

  const isFavorite = favorites.some(fav => fav.id === productInfo.id);

  const handleAddToCart = () => {
    addToCart(cleanProductPrice(productInfo), quantity);
  };

  const handleBuyNow = () => {
    addToCart(cleanProductPrice(productInfo), quantity);
    navigate('/checkout');
  };

  const updateQty = (amount) => {
    setQuantity(prev => {
      const newQty = prev + amount;
      return newQty > 0 ? newQty : 1;
    });
  };

  const handleToggleFavorite = () => {
    toggleFavorite(cleanProductPrice(productInfo));
  };

  return (
    <div className="container" style={{ padding: '80px 40px', minHeight: '60vh' }}>

      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '40px', fontSize: '12px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>
        <ArrowLeft size={16} /> VOLVER AL INICIO
      </Link>

      <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>

        {/* Lado izquierdo: Foto */}
        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden', backgroundColor: '#f5f5f5', aspectRatio: '4/5' }}>
          <img
            src={productInfo.image}
            alt={productInfo.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Lado derecho: Detalles */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1 className="font-serif" style={{ fontSize: '48px', fontStyle: 'italic', margin: 0 }}>
            {productInfo.name}
          </h1>
          <p style={{ fontSize: '24px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
            {typeof productInfo.price === 'number' ? `$${productInfo.price.toFixed(2)}` : productInfo.price}
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontWeight: '300' }}>
            Esta es la vista de detalle. Aquí iría la descripción larga del producto que traigamos de la base de datos de MongoDB. Una pieza artesanal única para tu colección.
          </p>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', alignItems: 'center' }}>

            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '30px', padding: '0 10px', height: '60px' }}>
              <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '10px', color: 'var(--primary)' }} onClick={() => updateQty(-1)}>-</button>
              <span style={{ width: '30px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>{quantity}</span>
              <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '10px', color: 'var(--primary)' }} onClick={() => updateQty(1)}>+</button>
            </div>

            <button className="add-to-cart-btn" style={{ flex: 1, minWidth: '180px', height: '60px', padding: '0', fontSize: '11px' }} onClick={handleAddToCart}>
              <ShoppingCart size={16} strokeWidth={2} />
              AÑADIR A MI BOLSA
            </button>

            <button className="add-to-cart-btn" style={{ flex: 1, minWidth: '180px', height: '60px', padding: '0', fontSize: '11px', background: 'var(--primary)', color: 'white' }} onClick={handleBuyNow}>
              COMPRAR AHORA
            </button>

            <button
              className="wishlist-btn"
              style={{ position: 'relative', top: 'auto', right: 'auto', width: '60px', height: '60px', flexShrink: 0, border: '1px solid var(--border-color)', color: isFavorite ? '#e74c3c' : 'inherit', transition: 'all 0.3s' }}
              onClick={handleToggleFavorite}
            >
              <Heart size={20} strokeWidth={1.5} fill={isFavorite ? '#e74c3c' : 'none'} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetail;