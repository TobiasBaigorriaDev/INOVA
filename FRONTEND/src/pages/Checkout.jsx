import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Lock, MapPin } from 'lucide-react';
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

  // =========================
  // ESTADOS TARJETA DE CRÉDITO
  // =========================
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [vencimientoTarjeta, setVencimientoTarjeta] = useState('');
  const [cvvTarjeta, setCvvTarjeta] = useState('');
  const [tarjetaGirada, setTarjetaGirada] = useState(false);
  const [marcaTarjeta, setMarcaTarjeta] = useState('default'); // 'visa', 'mastercard', etc.
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchMpConfig = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/mp/config');
        const data = await res.json();
        if (data.publicKey) {
          setMpPublicKey(data.publicKey);
        }
      } catch (err) {
        console.error('Error al cargar config de Mercado Pago:', err);
      }
    };
    fetchMpConfig();
  }, []);

  // Formatear número de tarjeta y detectar marca
  const handleNumeroTarjetaChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Eliminar no numéricos
    val = val.substring(0, 16); // Max 16 dígitos
    
    // Detectar marca
    if (val.startsWith('4')) {
      setMarcaTarjeta('visa');
    } else if (/^5[1-5]/.test(val) || /^2[2-7]/.test(val)) {
      setMarcaTarjeta('mastercard');
    } else if (val.startsWith('34') || val.startsWith('37')) {
      setMarcaTarjeta('amex');
    } else {
      setMarcaTarjeta('default');
    }

    // Poner espacios
    const matches = val.match(/\d{1,4}/g);
    const formatted = matches ? matches.join(' ') : '';
    setNumeroTarjeta(formatted);
  };

  // Formatear fecha de vencimiento (MM/AA)
  const handleVencimientoTarjetaChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Eliminar no numéricos
    val = val.substring(0, 4); // Max 4 dígitos (MMYY)
    
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2, 4)}`;
    }
    setVencimientoTarjeta(val);
  };

  // Validar y limitar CVV
  const handleCvvTarjetaChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Eliminar no numéricos
    val = val.substring(0, 3); // Max 3 dígitos
    setCvvTarjeta(val);
  };

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

    // Validar tarjeta si es el método de pago seleccionado
    if (paymentMethod === 'tarjeta') {
      const limpioTarjeta = numeroTarjeta.replace(/\s/g, '');
      const expectedLength = (marcaTarjeta === 'amex') ? 15 : 16;
      if (limpioTarjeta.length !== expectedLength) {
        setErrorMsg(`El número de tarjeta de crédito debe tener ${expectedLength} dígitos.`);
        return;
      }
      if (!nombreTarjeta.trim()) {
        setErrorMsg('Por favor ingresa el nombre impreso en la tarjeta.');
        return;
      }
      if (vencimientoTarjeta.length < 5) {
        setErrorMsg('La fecha de vencimiento debe tener formato MM/AA.');
        return;
      }
      const [mes, anio] = vencimientoTarjeta.split('/').map(Number);
      if (!mes || mes < 1 || mes > 12) {
        setErrorMsg('El mes de vencimiento no es válido.');
        return;
      }
      if (cvvTarjeta.length < 3) {
        setErrorMsg('El código CVV debe tener 3 dígitos.');
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
          const detailedError = mpData.error ? `${mpData.mensaje || 'Error'}: ${mpData.error}` : (mpData.mensaje || 'Error al conectar con Mercado Pago');
          throw new Error(detailedError);
        }
        
        // Redirigir al usuario a la pantalla de Mercado Pago
        window.location.href = mpData.init_point;
        return; 
      }

      // SI EL PAGO ES CON TARJETA DE CRÉDITO:
      if (paymentMethod === 'tarjeta') {
        setSuccessMsg('Procesando cobro seguro con tarjeta...');
        
        if (!window.MercadoPago) {
          throw new Error('El procesador de pagos de Mercado Pago no está disponible. Recarga la página.');
        }

        if (!mpPublicKey) {
          throw new Error('La clave de configuración de cobros no está disponible temporalmente.');
        }

        // Inicializar Mercado Pago
        const mp = new window.MercadoPago(mpPublicKey);

        // Separar fecha de vencimiento
        const [mes, anio] = vencimientoTarjeta.split('/');
        const limpioTarjeta = numeroTarjeta.replace(/\s/g, '');

        // Tokenizar los datos de la tarjeta con Mercado Pago
        let tokenResponse;
        try {
          tokenResponse = await mp.createCardToken({
            cardNumber: limpioTarjeta,
            cardholderName: nombreTarjeta,
            cardExpirationMonth: mes,
            cardExpirationYear: '20' + anio,
            securityCode: cvvTarjeta
          });
        } catch (tokenErr) {
          console.error('Error tokenizando tarjeta:', tokenErr);
          let detail = '';
          if (tokenErr) {
            if (typeof tokenErr === 'string') {
              detail = tokenErr;
            } else {
              const parts = [];
              if (tokenErr.message) parts.push(tokenErr.message);
              if (tokenErr.description) parts.push(tokenErr.description);
              if (tokenErr.error) parts.push(tokenErr.error);
              if (tokenErr.status) parts.push(`Status: ${tokenErr.status}`);
              
              if (tokenErr.cause) {
                if (Array.isArray(tokenErr.cause)) {
                  tokenErr.cause.forEach(c => {
                    if (c.description) parts.push(c.description);
                    else if (c.code) parts.push(`Code: ${c.code}`);
                    else parts.push(JSON.stringify(c));
                  });
                } else if (typeof tokenErr.cause === 'string') {
                  parts.push(tokenErr.cause);
                } else if (tokenErr.cause.description) {
                  parts.push(tokenErr.cause.description);
                } else {
                  parts.push(JSON.stringify(tokenErr.cause));
                }
              }
              
              if (parts.length === 0) {
                try {
                  const keys = Object.getOwnPropertyNames(tokenErr);
                  const obj = {};
                  keys.forEach(k => {
                    obj[k] = tokenErr[k];
                  });
                  parts.push(JSON.stringify(obj));
                } catch (e) {
                  parts.push(String(tokenErr));
                }
              }
              detail = parts.join(' | ');
            }
          }
          throw new Error('No se pudo validar la tarjeta: ' + (detail || 'Revisa los datos ingresados.'));
        }

        if (!tokenResponse || !tokenResponse.id) {
          throw new Error('Los datos de la tarjeta no son válidos para generar un token seguro.');
        }

        // Procesar el pago en el backend
        const payResponse = await fetch('http://localhost:3000/api/mp/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: tokenResponse.id,
            paymentMethodId: marcaTarjeta === 'default' ? 'visa' : marcaTarjeta, // ID compatible con Mercado Pago
            email: email,
            amount: total,
            orderId: data.orderId
          })
        });

        const payData = await payResponse.json();

        if (!payResponse.ok) {
          throw new Error(payData.mensaje || 'Error al procesar el cargo con tarjeta.');
        }

        if (payData.status !== 'approved') {
          const motivo = payData.status_detail === 'cc_rejected_insufficient_amount' 
            ? 'Fondos insuficientes.' 
            : 'Tarjeta rechazada por el banco emisor.';
          throw new Error(`El pago fue rechazado. Motivo: ${motivo}`);
        }
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

          </div>

          {paymentMethod === 'tarjeta' && (
            <div className="credit-card-form-container">

              {/* ACCESORIO AUTOCOMPLETAR PARA PRUEBAS (SOLO ADMIN) */}
              {isAdmin && (
                <div className="admin-simulator-panel">
                  <div className="simulator-header">
                    <span className="simulator-badge">Modo Admin</span>
                    <h3 className="simulator-title">Simulador de Tarjetas de Prueba</h3>
                  </div>
                  <p className="simulator-subtitle">
                    Como administrador, puedes hacer clic en cualquiera de las siguientes tarjetas de prueba para rellenar el formulario de Mercado Pago y probar distintas respuestas del sistema de cobros.
                  </p>
                  
                  <div className="simulator-categories">
                    <div>
                      <h4 className="simulator-category-title">Transacciones Exitosas</h4>
                      <div className="simulator-grid">
                        <button
                          type="button"
                          className="simulator-card-btn"
                          onClick={() => {
                            setNumeroTarjeta('4012 8888 8888 8888');
                            setMarcaTarjeta('visa');
                            setNombreTarjeta('JUAN PEREZ');
                            setVencimientoTarjeta('12/30');
                            setCvvTarjeta('123');
                          }}
                        >
                          <div className="sim-card-header">
                            <span className="sim-card-name">Visa Aprobada</span>
                            <span className="sim-card-brand visa">Visa</span>
                          </div>
                          <div className="sim-card-number">4012 •••• •••• 8888</div>
                          <div className="sim-card-desc">Transacción exitosa directa (Aprobada).</div>
                          <span className="sim-card-badge success">Aprobada</span>
                        </button>

                        <button
                          type="button"
                          className="simulator-card-btn"
                          onClick={() => {
                            setNumeroTarjeta('5031 7500 0000 0027');
                            setMarcaTarjeta('mastercard');
                            setNombreTarjeta('MARIA GOMEZ');
                            setVencimientoTarjeta('11/29');
                            setCvvTarjeta('456');
                          }}
                        >
                          <div className="sim-card-header">
                            <span className="sim-card-name">Mastercard Aprobada</span>
                            <span className="sim-card-brand mastercard">Mastercard</span>
                          </div>
                          <div className="sim-card-number">5031 •••• •••• 0027</div>
                          <div className="sim-card-desc">Transacción exitosa directa (Aprobada).</div>
                          <span className="sim-card-badge success">Aprobada</span>
                        </button>

                        <button
                          type="button"
                          className="simulator-card-btn"
                          onClick={() => {
                            setNumeroTarjeta('3759 888888 88887');
                            setMarcaTarjeta('amex');
                            setNombreTarjeta('CARLOS RUIZ');
                            setVencimientoTarjeta('08/28');
                            setCvvTarjeta('789');
                          }}
                        >
                          <div className="sim-card-header">
                            <span className="sim-card-name">Amex Aprobada</span>
                            <span className="sim-card-brand amex">Amex</span>
                          </div>
                          <div className="sim-card-number">3759 •••••• •8887</div>
                          <div className="sim-card-desc">Transacción exitosa directa (Aprobada).</div>
                          <span className="sim-card-badge success">Aprobada</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="simulator-category-title">Transacciones Rechazadas (Simulaciones de Error)</h4>
                      <div className="simulator-grid">
                        <button
                          type="button"
                          className="simulator-card-btn"
                          onClick={() => {
                            setNumeroTarjeta('4012 8888 8888 8881');
                            setMarcaTarjeta('visa');
                            setNombreTarjeta('MARCOS LOPEZ');
                            setVencimientoTarjeta('12/30');
                            setCvvTarjeta('123');
                          }}
                        >
                          <div className="sim-card-header">
                            <span className="sim-card-name">Fondos Insuficientes</span>
                            <span className="sim-card-brand visa">Visa</span>
                          </div>
                          <div className="sim-card-number">4012 •••• •••• 8881</div>
                          <div className="sim-card-desc">Simula falta de límite o saldo suficiente.</div>
                          <span className="sim-card-badge error">Rechazada</span>
                        </button>

                        <button
                          type="button"
                          className="simulator-card-btn"
                          onClick={() => {
                            setNumeroTarjeta('4012 8888 8888 8882');
                            setMarcaTarjeta('visa');
                            setNombreTarjeta('ANA RUIZ');
                            setVencimientoTarjeta('12/30');
                            setCvvTarjeta('123');
                          }}
                        >
                          <div className="sim-card-header">
                            <span className="sim-card-name">CVV Incorrecto</span>
                            <span className="sim-card-brand visa">Visa</span>
                          </div>
                          <div className="sim-card-number">4012 •••• •••• 8882</div>
                          <div className="sim-card-desc">Simula código de seguridad incorrecto.</div>
                          <span className="sim-card-badge error">Rechazada</span>
                        </button>

                        <button
                          type="button"
                          className="simulator-card-btn"
                          onClick={() => {
                            setNumeroTarjeta('4012 8888 8888 8883');
                            setMarcaTarjeta('visa');
                            setNombreTarjeta('PEDRO PAEZ');
                            setVencimientoTarjeta('12/30');
                            setCvvTarjeta('123');
                          }}
                        >
                          <div className="sim-card-header">
                            <span className="sim-card-name">Tarjeta Inactiva</span>
                            <span className="sim-card-brand visa">Visa</span>
                          </div>
                          <div className="sim-card-number">4012 •••• •••• 8883</div>
                          <div className="sim-card-desc">Simula tarjeta deshabilitada o suspendida.</div>
                          <span className="sim-card-badge error">Rechazada</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* VISTA PREVIA TARJETA 3D */}
              <div className="card-container-3d">
                <div className={`card-inner-3d ${tarjetaGirada ? 'flipped' : ''}`}>
                  
                  {/* FRENTE */}
                  <div className={`card-front-3d ${marcaTarjeta}`}>
                    <div className="card-logo-3d">
                      {marcaTarjeta === 'visa' && <span className="logo-visa">Visa</span>}
                      {marcaTarjeta === 'mastercard' && <span className="logo-mastercard">Mastercard</span>}
                      {marcaTarjeta === 'amex' && <span className="logo-amex">Amex</span>}
                      {marcaTarjeta === 'default' && <span className="logo-generic">Credit Card</span>}
                    </div>
                    <div className="card-chip-3d"></div>
                    <div className="card-number-display-3d">
                      {numeroTarjeta || '•••• •••• •••• ••••'}
                    </div>
                    <div className="card-details-display-3d">
                      <div className="card-holder-display-3d">
                        <span className="card-label-3d">Titular</span>
                        <div className="card-value-3d">{nombreTarjeta.toUpperCase() || 'NOMBRE APELLIDO'}</div>
                      </div>
                      <div className="card-expiry-display-3d">
                        <span className="card-label-3d">Vence</span>
                        <div className="card-value-3d">{vencimientoTarjeta || 'MM/AA'}</div>
                      </div>
                    </div>
                  </div>

                  {/* DORSO */}
                  <div className="card-back-3d">
                    <div className="card-magnetic-strip-3d"></div>
                    <div className="card-signature-3d">
                      <div className="signature-area-3d"></div>
                      <div className="cvv-display-3d">{cvvTarjeta || '•••'}</div>
                    </div>
                    <div className="card-back-info-3d">
                      Procesado con encriptación SSL de 256 bits.
                    </div>
                  </div>

                </div>
              </div>

              {/* INPUTS DEL FORMULARIO */}
              <div className="card-inputs-grid">
                <div className="checkout-form-group">
                  <label className="checkout-label">NÚMERO DE TARJETA</label>
                  <input
                    type="text"
                    className="checkout-input"
                    placeholder="4000 1234 5678 9010"
                    value={numeroTarjeta}
                    onChange={handleNumeroTarjetaChange}
                  />
                </div>

                <div className="checkout-form-group">
                  <label className="checkout-label">NOMBRE DEL TITULAR (como figura en la tarjeta)</label>
                  <input
                    type="text"
                    className="checkout-input"
                    placeholder="JUAN PEREZ"
                    value={nombreTarjeta}
                    onChange={(e) => setNombreTarjeta(e.target.value)}
                  />
                </div>

                <div className="checkout-row">
                  <div className="checkout-form-group" style={{ flex: 1 }}>
                    <label className="checkout-label">VENCIMIENTO</label>
                    <input
                      type="text"
                      className="checkout-input"
                      placeholder="MM/AA"
                      value={vencimientoTarjeta}
                      onChange={handleVencimientoTarjetaChange}
                    />
                  </div>
                  <div className="checkout-form-group" style={{ flex: 1 }}>
                    <label className="checkout-label">CÓDIGO CVV</label>
                    <input
                      type="text"
                      className="checkout-input"
                      placeholder="123"
                      value={cvvTarjeta}
                      onChange={handleCvvTarjetaChange}
                      onFocus={() => setTarjetaGirada(true)}
                      onBlur={() => setTarjetaGirada(false)}
                    />
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