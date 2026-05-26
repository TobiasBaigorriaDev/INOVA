import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // <-- IMPORTAMOS EL HOOK DEL CONTEXTO
import './CartSidebar.css';

const CartSidebar = () => {
  const navigate = useNavigate();
  
  // Consumimos todo lo que necesitamos de la nube del carrito
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    envio, 
    total,
    clearCart // <-- Traemos la función de vaciar el carrito
  } = useCart();

  const handleCheckout = () => {
    setIsCartOpen(false); // Cerramos el sidebar al ir al checkout
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay de fondo oscuro */}
      <div 
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>

      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>

        <div className="cart-header">
          <h2>Carrito ({cartItems.length})</h2>
          {/* Botón para vaciar carrito */}
          {cartItems.length > 0 && (
            <button 
              className="clear-cart-btn" 
              onClick={clearCart}
              style={{
                background: 'none',
                border: 'none',
                color: '#e74c3c',
                fontSize: '11px',
                cursor: 'pointer',
                letterSpacing: '1px',
                fontWeight: '600',
                textTransform: 'uppercase',
                marginRight: '15px'
              }}
            >
              Vaciar
            </button>
          )}
          <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>

        <div className="cart-items">
          {/* Si el carrito está vacío, mostramos un mensaje */}
          {cartItems.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
              Tu carrito está vacío.
            </p>
          ) : (
            /* Si hay productos, los mostramos dinámicamente */
            cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="item-details">
                  <div className="item-title-delete">
                    <h4>{item.name}</h4>
                    {/* Botón de Eliminar */}
                    <button className="delete-btn" onClick={() => removeFromCart(item.id)}>🗑️</button>
                  </div>
                  <p className="item-price">${item.price.toFixed(2)}</p>

                  <div className="quantity-control">
                    {/* Botón de Restar */}
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    {/* Botón de Sumar (Deshabilitado si no hay más stock) */}
                    <button 
                      className="qty-btn" 
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.qty >= item.stock}
                      style={{
                        opacity: item.qty >= item.stock ? 0.35 : 1,
                        cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer'
                      }}
                      title={item.qty >= item.stock ? "Llegaste al límite de stock disponible" : ""}
                    >+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="summary-row">
            <span>SUBTOTAL</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="checkout-btn" disabled={cartItems.length === 0} onClick={handleCheckout}>
            FINALIZAR COMPRA
          </button>
          <p className="taxes-note">IMPUESTOS CALCULADOS AL MOMENTO DEL PAGO</p>
        </div>

      </div>
    </>
  );
};

export default CartSidebar;