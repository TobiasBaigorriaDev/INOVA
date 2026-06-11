import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Lock, MapPin } from 'lucide-react';
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
    clearCart,
    setIsCartOpen
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

  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoTxId, setCryptoTxId] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('Red Dogecoin (Nativa)');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchMpConfig = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/mp/config');
        const data = await res.json();
        if (data.cryptoWalletAddress) {
          setCryptoWalletAddress(data.cryptoWalletAddress);
        }
      } catch (err) {
        console.error('Error al cargar config de Mercado Pago / Cripto:', err);
      }
    };
    fetchMpConfig();
  }, []);

  useEffect(() => {

    if (usuarioGuardado) {

      const usuario =
        JSON.parse(usuarioGuardado);

      setEmail(usuario.email || '');
      setNombre(usuario.nombre || '');
      setApellidos(usuario.apellido || '');
      if (usuario.rol === 'ADMIN_ROLE') {
        setIsAdmin(true);
      }

    }

  }, []);

  // Verificar si viene una respuesta de pago de Mercado Pago en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpStatus = params.get('status') || params.get('collection_status');

    if (mpStatus === 'approved') {
      setSuccessMsg('¡Pago realizado con éxito! Tu pedido ha sido confirmado.');
      clearCart();
      // Limpiamos los parámetros de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        navigate('/');
      }, 3500);
    } else if (mpStatus && mpStatus !== 'approved') {
      setErrorMsg('El pago de Mercado Pago no pudo ser procesado o fue cancelado. Tu carrito sigue guardado.');
      // Limpiamos los parámetros de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
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

  // Función para obtener los próximos Lunes, Martes y Miércoles
  const getNextAvailableDays = () => {
    const availableDates = [];
    const today = new Date();
    
    // Revisamos los próximos 7 días buscando Lunes(1), Martes(2) y Miércoles(3)
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dayOfWeek = nextDate.getDay();
      
      if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3) {
        const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
        let formatted = nextDate.toLocaleDateString('es-AR', opciones);
        // Capitalizar y quitar coma si existe
        formatted = formatted.replace(',', '');
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        availableDates.push(formatted);
      }
    }
    return availableDates;
  };

  const availableDays = getNextAvailableDays();

  const [selectedDay, setSelectedDay] =
    useState(availableDays[0]);

  const [selectedTime, setSelectedTime] =
    useState('13:00');

  const [paymentMethod, setPaymentMethod] =
    useState('');

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

    if (!paymentMethod) {

      setErrorMsg(
        'Por favor selecciona un método de pago.'
      );

      return;

    }

    if (cartItems.length === 0) {

      setErrorMsg(
        'Tu carrito está vacío.'
      );

      return;

    }


    if (paymentMethod === 'cripto') {
      if (!cryptoTxId.trim()) {
        setErrorMsg('Por favor ingresa el Hash de la transacción (TXID).');
        return;
      }
    }

    setLoading(true);

    // NUEVA VALIDACIÓN: Verificar el stock en tiempo real antes de crear el pedido
    try {
      const stockRes = await fetch('http://localhost:3000/api/products');
      if (!stockRes.ok) throw new Error('No se pudo verificar el stock de los productos.');
      
      const dbData = await stockRes.json();
      const dbProducts = Array.isArray(dbData) ? dbData : (dbData.productos || []);

      const unavailableItems = [];

      for (const item of cartItems) {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        // Si el producto no existe en la DB o el stock disponible es menor a la cantidad solicitada
        if (!dbProduct || dbProduct.stock < item.qty) {
          unavailableItems.push(item);
        }
      }

      if (unavailableItems.length > 0) {
        // Eliminar los productos del carrito que no tienen stock suficiente
        for (const item of unavailableItems) {
          removeFromCart(item.id);
        }

        const names = unavailableItems.map(item => `"${item.name}"`).join(', ');
        setErrorMsg(`⚠️ Uno o más productos ya no cuentan con stock suficiente y fueron retirados de tu carrito: ${names}.`);
        setIsCartOpen(true); // Abrir el panel del carrito automáticamente
        setLoading(false);
        return; // Detener el proceso de pago
      }
    } catch (stockError) {
      console.error('Error al validar stock en checkout:', stockError);
      setErrorMsg('Ocurrió un error al validar el stock de tu carrito. Intenta de nuevo.');
      setLoading(false);
      return;
    }

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
            cartItems,
            cryptoTxId: paymentMethod === 'cripto' ? cryptoTxId.trim() : null,
            cryptoNetwork: paymentMethod === 'cripto' ? cryptoNetwork : null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al procesar el pedido');
      }

      // ==========================================
      // INTEGRACIÓN CON MERCADO PAGO / TARJETA
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
          const detailedError = mpData.error ? `${mpData.mensaje || 'Error'}: ${mpData.error}` : (mpData.mensaje || 'Error al conectar con Mercado Pago');
          throw new Error(detailedError);
        }
        
        // Redirigir al usuario a la pantalla de Mercado Pago
        window.location.href = mpData.init_point;
        return; 
      }


      // SI EL PAGO FUE APROBADO O ES EN EFECTIVO:
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

          <div className="meeting-point-banner" style={{
            background: 'linear-gradient(135deg, #fbf8fc 0%, #f3eef7 100%)',
            border: '1px solid rgba(90, 64, 107, 0.12)',
            borderRadius: '16px',
            padding: '20px',
            marginTop: '30px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 4px 15px rgba(90, 64, 107, 0.04)'
          }}>
            <div style={{
              background: '#5A406B',
              color: 'white',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(90, 64, 107, 0.15)'
            }}>
              <MapPin size={24} />
            </div>
            <div>
              <h4 style={{
                margin: 0,
                color: '#8e7a9e',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.2px',
                textTransform: 'uppercase'
              }}>Punto de Encuentro</h4>
              <p style={{
                margin: '4px 0 0 0',
                color: '#333333',
                fontSize: '18px',
                fontWeight: '700'
              }}>Plaza Independencia (Mendoza)</p>
            </div>
          </div>

          <div className="appointment-card">

            <div className="appointment-subtitle">
              DÍA DISPONIBLE
            </div>

            <div className="days-grid" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>

              {availableDays.map(day => (

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
                  style={{ width: '100%', textAlign: 'left', padding: '12px 20px' }}
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

            <div className="map-container" style={{ marginTop: '20px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3350.187123908953!2d-68.84674398481489!3d-32.887890680938634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x967e09062319c5c7%3A0xc3c51f496156e5f3!2sPlaza%20Independencia!5e0!3m2!1sen!2sar!4v1689088806283!5m2!1sen!2sar" 
                width="100%" 
                height="250" 
                style={{ border: 0, display: 'block' }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>

          </div>

        </section>

        {/* METODOS DE PAGO */}

        <section>

          <h2 className="checkout-section-title font-serif">
            Método de Pago
          </h2>

          <div className="payment-methods">

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



            {/* CRIPTO */}

            <div
              className={`payment-method ${
                paymentMethod === 'cripto'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setPaymentMethod('cripto')
              }
            >

              <div className="payment-method-header">

                <div
                  className={`radio-circle ${
                    paymentMethod === 'cripto'
                      ? 'active'
                      : ''
                  }`}
                ></div>

                <span className="payment-method-name">
                  CRIPTOMONEDAS (DOGE - Dogecoin)
                </span>

                <span className="payment-method-icon" style={{ fontSize: '18px', fontWeight: 'bold' }}>🪙</span>

              </div>

            </div>

          </div>

          {paymentMethod === 'cripto' && (
            <div className="crypto-payment-container" style={{
              padding: '30px 25px',
              background: '#fcfaff',
              borderRadius: '20px',
              border: '2px solid #e8dff0',
              marginTop: '25px',
              boxShadow: '0 8px 30px rgba(90, 64, 107, 0.04)'
            }}>
              <h3 className="font-serif" style={{ fontSize: '20px', marginBottom: '15px', color: '#3b0a45', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🪙</span> Pago Seguro con Dogecoin (DOGE)
              </h3>
              
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555', marginBottom: '25px' }}>
                Sigue estos sencillos pasos para completar tu pago de forma manual. Tu pedido se procesará tan pronto verifiquemos la transacción en la red.
              </p>

              {/* PASO 1 */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: '#5A406B',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>1</span>
                  <strong style={{ fontSize: '14px', color: '#3b0a45', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Envía el pago desde tu Billetera
                  </strong>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid #e2d8eb',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>Red de Envío</span>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#009688', marginTop: '3px' }}>Dogecoin (Nativa)</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>Total a Transferir</span>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#3b0a45', marginTop: '3px' }}>
                        ${Number(total).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>Dirección de Wallet Destino</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '8px',
                      backgroundColor: '#fdfbfe',
                      padding: '12px 15px',
                      borderRadius: '10px',
                      border: '1px dashed #cbb0df'
                    }}>
                      <code style={{ flex: 1, fontSize: '13px', color: '#333', wordBreak: 'break-all', fontWeight: '600', fontFamily: 'monospace' }}>
                        {cryptoWalletAddress}
                      </code>
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText(cryptoWalletAddress);
                          alert('¡Dirección de wallet copiada!');
                        }}
                        style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          background: '#5A406B',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'background 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Copiar Dirección
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 2 */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: '#5A406B',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>2</span>
                  <strong style={{ fontSize: '14px', color: '#3b0a45', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pega el comprobante de transferencia aquí
                  </strong>
                </div>

                <div style={{
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '2px solid #5A406B',
                  boxShadow: '0 4px 20px rgba(90, 64, 107, 0.08)'
                }}>
                  <label className="checkout-label" style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#5A406B', marginBottom: '8px', letterSpacing: '1px' }}>
                    CÓDIGO HASH DE TRANSACCIÓN (TXID) *
                  </label>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '15px', fontSize: '16px', color: '#888' }}>🔗</span>
                    <input
                      type="text"
                      className="checkout-input"
                      placeholder="Pega aquí el TXID (ej: d1e7046e18540d167d357b729f3d4...)"
                      value={cryptoTxId}
                      onChange={(e) => setCryptoTxId(e.target.value)}
                      style={{
                        textTransform: 'none',
                        paddingLeft: '40px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        width: '100%',
                        height: '45px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    backgroundColor: '#fff8eb',
                    border: '1px solid #ffe3b3',
                    padding: '10px 12px',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#825a17', lineHeight: '1.4' }}>
                      <strong>Importante:</strong> El TXID o Hash es el identificador único de tu envío de cripto. Si pegas un código incorrecto o vacío, no podremos validar tu pago y tu pedido se demorará.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

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