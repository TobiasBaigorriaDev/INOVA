import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft } from 'lucide-react';

// Esta es una PÁGINA nueva que solo se mostrará cuando la URL sea /producto/1 o /producto/2, etc.
function ProductDetail() {
  // useParams() lee la URL para saber qué ID de producto estamos mirando.
  // Si la URL es /producto/3, entonces id será "3".
  const { id } = useParams();

  // (En el futuro, aquí le pedirás al backend la info del producto "id". Por ahora, ponemos datos fijos)

  return (
    <div className="container" style={{ padding: '80px 40px', minHeight: '60vh' }}>

      {/* Botón para volver atrás */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '40px', fontSize: '12px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>
        <ArrowLeft size={16} /> VOLVER AL INICIO
      </Link>

      <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>

        {/* Lado izquierdo: Foto falsa gigante */}
        <div style={{ flex: 1, borderRadius: '30px', overflow: 'hidden', backgroundColor: '#f5f5f5', aspectRatio: '4/5' }}>
          <img
            src="https://images.unsplash.com/photo-1599643478524-fb66f70d00f8?auto=format&fit=crop&w=1000&q=80"
            alt="Producto"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Lado derecho: Detalles */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1 className="font-serif" style={{ fontSize: '48px', fontStyle: 'italic', margin: 0 }}>
            Joya Exclusiva #{id}
          </h1>
          <p style={{ fontSize: '24px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
            $150.00
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontWeight: '300' }}>
            Esta es la vista de detalle. Aquí iría la descripción larga del producto que traigamos de la base de datos de MongoDB. Una pieza artesanal única para tu colección.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <button className="add-to-cart-btn" style={{ flex: 2, padding: '20px', fontSize: '12px' }}>
              <ShoppingCart size={16} strokeWidth={2} />
              AÑADIR A MI BOLSA
            </button>
            <button className="wishlist-btn" style={{ position: 'relative', top: 'auto', right: 'auto', width: '60px', height: '60px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
              <Heart size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetail;
