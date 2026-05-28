import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Checkout.css';

function Checkout() {

  const navigate = useNavigate();

  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    envio,
    total,
    clearCart
  } = useCart();

  // =========================
  // USUARIO LOGUEADO
  // =========================

  const usuarioGuardado =
    localStorage.getItem('usuario');

  const token =
    localStorage.getItem('token');

  // =========================
  // DATOS AUTOCOMPLETADOS
  // =========================

  const [email, setEmail] =
    useState('');

  const [nombre, setNombre] =
    useState('');

  const [apellidos, setApellidos] =
    useState('');

  useEffect(() => {

    if (usuarioGuardado) {

      const usuario =
        JSON.parse(usuarioGuardado);

      setEmail(usuario.email || '');
      setNombre(usuario.nombre || '');
      setApellidos(usuario.apellido || '');

    }

  }, []);

  // =========================
  // ESTADOS
  // =========================

  const [loading, setLoading] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState('');

  const [successMsg, setSuccessMsg] =
    useState('');

  const [selectedDay, setSelectedDay] =
    useState('Lunes');

  const [selectedTime, setSelectedTime] =
    useState('13:00');

  const [paymentMethod, setPaymentMethod] =
    useState('tarjeta');

  // =========================
  // REALIZAR PEDIDO
  // =========================

  const handlePlaceOrder = async () => {

    setErrorMsg('');
    setSuccessMsg('');

    // SOLO pedir login al finalizar compra

    if (!token) {

  localStorage.setItem(
    'redirectAfterLogin',
    '/checkout'
  );

  setErrorMsg(
    'Debes iniciar sesión en tu cuenta para poder realizar un pedido.'
  );

  setTimeout(() => {

    navigate('/login');

  }, 1500);

  return;
}

    // Validaciones

    if (!email || !nombre || !apellidos) {

      setErrorMsg(
        'Por favor completa todos los campos.'
      );

      return;

    }

    if (cartItems.length === 0) {

      setErrorMsg(
        'Tu carrito está vacío.'
      );

      return;

    }

    setLoading(true);

    try {

      const response = await fetch(
        'http://localhost:3000/api/orders',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            email,
            nombreCliente: nombre,
            apellidoCliente: apellidos,
            diaEncuentro: selectedDay,
            horaEncuentro: selectedTime,
            metodoPago: paymentMethod,
            cartItems
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al procesar el pedido');
      }

      // ==========================================
      // INTEGRACIÓN CON MERCADO PAGO
      // ==========================================
      if (paymentMethod === 'mercadolibre') {
        setSuccessMsg('Generando enlace de pago...');

        const itemsParaMP = cartItems.map(item => ({
          nombre: item.name,
          cantidad: item.qty,
          precio: item.price
        }));

        const mpResponse = await fetch('http://localhost:3000/api/mp/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: itemsParaMP,
            orderId: data.orderId
          })
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
          throw new Error('Error al conectar con Mercado Pago');
        }

        // Limpiamos el carrito antes de redirigir
        clearCart();
        
        // Redirigir al usuario a la pantalla de Mercado Pago
        window.location.href = mpData.init_point;
        return; 
      }

      // SI EL PAGO ES EN EFECTIVO O TARJETA (MANUAL):
      setSuccessMsg('¡Pedido realizado con éxito!');

      clearCart();

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

      {/* IZQUIERDA */}

      <div className="checkout-left">

        <section>

          <h2 className="checkout-section-title font-serif">
            Punto de Encuentro
          </h2>

          {/* ALERTAS */}

          {errorMsg && (

            <div
              style={{
                padding: '12px',
                backgroundColor: '#fde8e8',
                color: '#e53e3e',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              ⚠️ {errorMsg}
            </div>

          )}

          {successMsg && (

            <div
              style={{
                padding: '12px',
                backgroundColor: '#def7ec',
                color: '#03543f',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              ✅ {successMsg}
            </div>

          )}

          {/* EMAIL */}

          <div className="checkout-form-group">

            <label className="checkout-label">
              CORREO
            </label>

            <input
              type="email"
              className="checkout-input"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>

          {/* NOMBRE Y APELLIDO */}

          <div className="checkout-row">

            <div className="checkout-form-group">

              <label className="checkout-label">
                NOMBRE
              </label>

              <input
                type="text"
                className="checkout-input"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
              />

            </div>

            <div className="checkout-form-group">

              <label className="checkout-label">
                APELLIDOS
              </label>

              <input
                type="text"
                className="checkout-input"
                value={apellidos}
                onChange={(e) =>
                  setApellidos(e.target.value)
                }
              />

            </div>

          </div>

          {/* DIAS */}

          <p
            className="checkout-label"
            style={{ marginTop: '30px' }}
          >
            PUNTO DE ENCUENTRO DEFINIDO
          </p>

          <div className="appointment-card">

            <div className="appointment-subtitle">
              DÍA DISPONIBLE
            </div>

            <div className="days-grid">

              {['Lunes', 'Martes', 'Miércoles']
                .map(day => (

                <button
                  key={day}
                  className={`time-btn ${
                    selectedDay === day
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedDay(day)
                  }
                >
                  {day}
                </button>

              ))}

            </div>

            {/* HORARIOS */}

            <div className="appointment-subtitle">
              HORARIO
            </div>

            <div className="hours-grid">

              {[
                '10:00',
                '11:00',
                '12:00',
                '13:00',
                '14:00',
                '15:00',
                '16:00',
                '17:00',
                '18:00'
              ].map(time => (

                <button
                  key={time}
                  className={`time-btn ${
                    selectedTime === time
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedTime(time)
                  }
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

        {/* METODOS DE PAGO */}

        <section>

          <h2 className="checkout-section-title font-serif">
            Método de Pago
          </h2>

          <div className="payment-methods">

            {/* TARJETA */}

            <div
              className={`payment-method ${
                paymentMethod === 'tarjeta'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setPaymentMethod('tarjeta')
              }
            >

              <div className="payment-method-header">

                <div
                  className={`radio-circle ${
                    paymentMethod === 'tarjeta'
                      ? 'active'
                      : ''
                  }`}
                ></div>

                <span className="payment-method-name">
                  TARJETA DE CRÉDITO
                </span>

                <CreditCard
                  size={18}
                  className="payment-method-icon"
                />

              </div>

            </div>

            {/* MERCADO PAGO */}

            <div
              className={`payment-method ${
                paymentMethod === 'mercadolibre'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setPaymentMethod('mercadolibre')
              }
            >

              <div className="payment-method-header">

                <div
                  className={`radio-circle ${
                    paymentMethod === 'mercadolibre'
                      ? 'active'
                      : ''
                  }`}
                ></div>

                <span className="payment-method-name">
                  MERCADO PAGO
                </span>

                <Wallet
                  size={18}
                  className="payment-method-icon"
                />

              </div>

            </div>

            {/* EFECTIVO */}

            <div
              className={`payment-method ${
                paymentMethod === 'efectivo'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setPaymentMethod('efectivo')
              }
            >

              <div className="payment-method-header">

                <div
                  className={`radio-circle ${
                    paymentMethod === 'efectivo'
                      ? 'active'
                      : ''
                  }`}
                ></div>

                <span className="payment-method-name">
                  EFECTIVO
                </span>

                <Wallet
                  size={18}
                  className="payment-method-icon"
                />

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* DERECHA */}

      <div className="checkout-right font-serif">

        <h3 className="summary-title">
          Resumen del Pedido
        </h3>

        <div className="summary-items">

          {cartItems.length === 0 ? (

            <p
              style={{
                fontSize: '12px',
                color: '#888'
              }}
            >
              Tu carrito está vacío.
            </p>

          ) : (

            cartItems.map((item, idx) => (

              <div
                className="summary-item"
                key={idx}
              >

                <img
                  src={item.image}
                  alt={item.name}
                  className="summary-item-img"
                />

                <div className="summary-item-details">

                  <div className="summary-item-name">
                    {item.name}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '8px'
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >

                      <button
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                        onClick={() =>
                          updateQuantity(item.id, -1)
                        }
                      >
                        -
                      </button>

                      <span
                        style={{
                          padding: '0 8px'
                        }}
                      >
                        {item.qty}
                      </span>

                      <button
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                        onClick={() =>
                          updateQuantity(item.id, 1)
                        }
                      >
                        +
                      </button>

                    </div>

                    <button
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#d9534f',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      Remover
                    </button>

                  </div>

                </div>

                <div className="summary-item-price">
                  $
                  {(item.price * item.qty)
                    .toFixed(2)}
                </div>

              </div>

            ))

          )}

        </div>

        {/* TOTAL */}

        <div className="summary-totals">

          <div className="summary-row">

            <span>Subtotal</span>

            <span>
              ${subtotal.toFixed(2)}
            </span>

          </div>

          <div className="summary-total-row">

            <span>TOTAL</span>

            <span className="summary-total-price">
              ${total.toFixed(2)}
            </span>

          </div>

          {/* BOTON */}

          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={
              loading ||
              cartItems.length === 0
            }
          >

            {loading
              ? 'PROCESANDO...'
              : 'REALIZAR PEDIDO'}

          </button>

          <div className="secure-payment">

            <Lock size={12} />

            Pago seguro y encriptado

          </div>

        </div>

      </div>

    </div>

  );

}

export default Checkout;