import React, { useState } from 'react';
import { CreditCard, Wallet, Lock, MapPin } from 'lucide-react';
import './Checkout.css';

function Checkout({ cartItems = [], updateQuantity, removeFromCart }) {
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedTime, setSelectedTime] = useState('13:00');
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
  const envio = cartItems.length > 0 ? 10.00 : 0;
  const total = subtotal + envio;

  return (
    <div className="checkout-container container">
      <div className="checkout-left">
        
        {/* Punto de Encuentro Section */}
        <section>
          <h2 className="checkout-section-title font-serif">Punto de Encuentro</h2>
          
          <div className="checkout-form-group">
            <label className="checkout-label">CORREO</label>
            <input type="email" className="checkout-input" placeholder="ejemplo@correo.com" />
          </div>

          <div className="checkout-row">
            <div className="checkout-form-group">
              <label className="checkout-label">NOMBRE</label>
              <input type="text" className="checkout-input" />
            </div>
            <div className="checkout-form-group">
              <label className="checkout-label">APELLIDOS</label>
              <input type="text" className="checkout-input" />
            </div>
          </div>

          <p className="checkout-label" style={{ marginTop: '30px' }}>PUNTO DE ENCUENTRO DEFINIDO</p>
          <div className="appointment-card">
            <div className="appointment-subtitle">DÍA DISPONIBLE</div>
            <div className="days-grid">
              {['Lunes', 'Martes', 'Miércoles'].map(day => (
                <button 
                  key={day}
                  className={`time-btn ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="appointment-subtitle">HORARIO</div>
            <div className="hours-grid">
              {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                <button 
                  key={time}
                  className={`time-btn ${selectedTime === time ? 'active' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="map-placeholder">
              <div className="map-pin"></div>
            </div>
          </div>
        </section>

        {/* Método de Pago Section */}
        <section>
          <h2 className="checkout-section-title font-serif">Método de Pago</h2>
          
          <div className="payment-methods">
            {/* Tarjeta de Crédito */}
            <div className={`payment-method ${paymentMethod === 'tarjeta' ? 'active' : ''}`} onClick={() => setPaymentMethod('tarjeta')}>
              <div className="payment-method-header">
                <div className={`radio-circle ${paymentMethod === 'tarjeta' ? 'active' : ''}`}></div>
                <span className="payment-method-name">TARJETA DE CRÉDITO</span>
                <CreditCard size={18} className="payment-method-icon" />
              </div>
              
              {paymentMethod === 'tarjeta' && (
                <div className="credit-card-form" onClick={(e) => e.stopPropagation()}>
                  <div className="checkout-form-group">
                    <label className="checkout-label">NÚMERO</label>
                    <input type="text" className="checkout-input" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="checkout-row">
                    <div className="checkout-form-group">
                      <label className="checkout-label">EXPIRACIÓN</label>
                      <input type="text" className="checkout-input" placeholder="MM/AA" />
                    </div>
                    <div className="checkout-form-group">
                      <label className="checkout-label">CVV</label>
                      <input type="text" className="checkout-input" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mercado Libre */}
            <div className={`payment-method ${paymentMethod === 'mercadolibre' ? 'active' : ''}`} onClick={() => setPaymentMethod('mercadolibre')}>
              <div className="payment-method-header">
                <div className={`radio-circle ${paymentMethod === 'mercadolibre' ? 'active' : ''}`}></div>
                <span className="payment-method-name">MERCADO LIBRE</span>
                <Wallet size={18} className="payment-method-icon" />
              </div>
            </div>

            {/* Efectivo */}
            <div className={`payment-method ${paymentMethod === 'efectivo' ? 'active' : ''}`} onClick={() => setPaymentMethod('efectivo')}>
              <div className="payment-method-header">
                <div className={`radio-circle ${paymentMethod === 'efectivo' ? 'active' : ''}`}></div>
                <span className="payment-method-name">EFECTIVO</span>
                <Wallet size={18} className="payment-method-icon" />
              </div>
            </div>

            {/* Cripto */}
            <div className={`payment-method ${paymentMethod === 'cripto' ? 'active' : ''}`} onClick={() => setPaymentMethod('cripto')}>
              <div className="payment-method-header">
                <div className={`radio-circle ${paymentMethod === 'cripto' ? 'active' : ''}`}></div>
                <span className="payment-method-name">CRIPTO</span>
                <Wallet size={18} className="payment-method-icon" />
              </div>
            </div>
          </div>
        </section>

      </div>

      <div className="checkout-right font-serif">
        <h3 className="summary-title">Resumen del Pedido</h3>
        
        <div className="summary-items">
          {cartItems.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#888', fontFamily: 'var(--font-sans)' }}>Su carrito está vacío.</p>
          ) : (
            cartItems.map((item, idx) => (
              <div className="summary-item" key={idx}>
                <img src={item.image} alt={item.name} className="summary-item-img" />
                <div className="summary-item-details font-sans">
                  <div className="summary-item-name">{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <button 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: '14px', color: '#555' }}
                        onClick={() => updateQuantity(item.id, -1)}
                      >-</button>
                      <span className="summary-item-qty" style={{ padding: '0 8px', margin: 0 }}>{item.qty}</span>
                      <button 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: '14px', color: '#555' }}
                        onClick={() => updateQuantity(item.id, 1)}
                      >+</button>
                    </div>
                    <button 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d9534f', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <div className="summary-item-price font-sans">${(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="summary-totals font-sans">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span>${envio.toFixed(2)}</span>
          </div>
          
          <div className="summary-total-row">
            <span>TOTAL</span>
            <span className="summary-total-price">${total.toFixed(2)}</span>
          </div>

          <button className="place-order-btn">
            REALIZAR PEDIDO
          </button>
          
          <div className="secure-payment">
            <Lock size={12} /> Pago seguro y encriptado
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
