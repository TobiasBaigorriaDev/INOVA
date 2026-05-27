import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTAMOS NAVEGACIÓN
import { CreditCard, Wallet, Lock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext'; // <-- IMPORTAMOS EL HOOK DEL CONTEXTO
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  
  // Consumimos todo del contexto del carrito
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    envio, 
    total,
    clearCart 
  } = useCart();

  // Estados locales para los inputs del Punto de Encuentro
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');

  // Estados para gestionar la respuesta de la compra
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedTime, setSelectedTime] = useState('13:00');
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');

  // Función para enviar la compra al Backend
  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Verificar si el usuario inició sesión
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Debes iniciar sesión en tu cuenta para poder realizar un pedido.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // 2. Validar campos obligatorios
    if (!email || !nombre || !apellidos) {
      setErrorMsg('Por favor completa todos los campos del Punto de Encuentro.');
      return;
    }

    // 3. Validar que haya productos
    if (cartItems.length === 0) {
      setErrorMsg('Tu carrito está vacío.');
      return;
    }

    setLoading(true);

    try {
      // Enviamos el pedido a nuestro nuevo endpoint del backend
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token seguro
        },
        body: JSON.stringify({
          email,
          nombreCliente: nombre,
          apellidoCliente: apellidos,
          diaEncuentro: selectedDay,
          horaEncuentro: selectedTime,
          metodoPago: paymentMethod,
          cartItems // Pasamos el carrito con IDs y cantidades
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al procesar el pedido');
      }

      // Si todo anduvo bien en PostgreSQL:
      setSuccessMsg('¡Pedido realizado con éxito! Tu reserva y stock han sido guardados.');
      clearCart(); // Vaciamos el carrito de React y localStorage

      // Redirigir al Inicio después de 2.5 segundos
      setTimeout(() => {
        navigate('/');
      }, 2500);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container container">
      <div className="checkout-left">
        
        {/* Punto de Encuentro Section */}
        <section>
          <h2 className="checkout-section-title font-serif">Punto de Encuentro</h2>
          
          {/* Mensajes de Alerta */}
          {errorMsg && <div className="alert-error" style={{ padding: '12px', backgroundColor: '#fde8e8', color: '#e53e3e', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>⚠️ {errorMsg}</div>}
          {successMsg && <div className="alert-success" style={{ padding: '12px', backgroundColor: '#def7ec', color: '#03543f', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>✅ {successMsg}</div>}

          <div className="checkout-form-group">
            <label className="checkout-label">CORREO</label>
            <input 
              type="email" 
              className="checkout-input" 
              placeholder="ejemplo@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="checkout-row">
            <div className="checkout-form-group">
              <label className="checkout-label">NOMBRE</label>
              <input 
                type="text" 
                className="checkout-input" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="checkout-form-group">
              <label className="checkout-label">APELLIDOS</label>
              <input 
                type="text" 
                className="checkout-input" 
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
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
                <span className="payment-method-name">MERCADO PAGO</span>
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
                        style={{ 
                          border: 'none', 
                          background: 'none', 
                          cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer', 
                          padding: '2px 8px', 
                          fontSize: '14px', 
                          color: item.qty >= item.stock ? '#ccc' : '#555' 
                        }}
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.qty >= item.stock}
                        title={item.qty >= item.stock ? "Llegaste al límite de stock disponible" : ""}
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
          
          <div className="summary-total-row">
            <span>TOTAL</span>
            <span className="summary-total-price">${total.toFixed(2)}</span>
          </div>

          <button 
            className="place-order-btn" 
            onClick={handlePlaceOrder}
            disabled={loading || cartItems.length === 0}
          >
            {loading ? 'PROCESANDO...' : 'REALIZAR PEDIDO'}
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
