import React from 'react';
import './CartSidebar.css';

const CartSidebar = ({ isOpen, onClose, cartItems, updateQuantity, removeFromCart }) => {

  // Calculamos el subtotal multiplicando precio por cantidad de cada producto
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
  const envio = cartItems.length > 0 ? 10.00 : 0; // Si no hay items, el envío es 0
  const total = subtotal + envio;

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>

        <div className="cart-header">
          <h2>Carrito ({cartItems.length})</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
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
                    {/* Botón de Sumar */}
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
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
          <div className="summary-row">
            <span>ENVÍO</span>
            <span>${envio.toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="checkout-btn" disabled={cartItems.length === 0}>
            FINALIZAR COMPRA
          </button>
          <p className="taxes-note">IMPUESTOS CALCULADOS AL MOMENTO DEL PAGO</p>
        </div>

      </div>
    </>
  );
};

export default CartSidebar;