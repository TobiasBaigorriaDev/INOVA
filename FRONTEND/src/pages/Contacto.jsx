import React, { useState, useEffect } from 'react';
import { Mail, Send, MapPin, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import './Contacto.css';

function Contacto({ usuario: propUsuario }) {
  // Estado de usuario autenticado
  const [user, setUser] = useState(() => {
    if (propUsuario) return propUsuario;
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    asunto: 'consulta',
    mensaje: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Endpoint del backend de INOVA con automatización de IA y correo
  const CONTACTO_API_URL = 'http://localhost:3000/api/contacto';

  useEffect(() => {
    let currentUser = propUsuario;
    if (!currentUser) {
      try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          currentUser = JSON.parse(usuarioGuardado);
        }
      } catch (err) {
        console.error('Error parseando usuario en Contacto:', err);
      }
    }

    if (currentUser) {
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        nombre: currentUser.nombre || '',
        apellido: currentUser.apellido || '',
        email: currentUser.email || prev.email
      }));
    } else {
      setUser(null);
    }
  }, [propUsuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefono') {
      const onlyNumbers = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: onlyNumbers }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determinar nombre y apellido efectivos según estado de autenticación
    const effectiveNombre = (user?.nombre || formData.nombre || (user ? 'Cliente' : '')).trim();
    const effectiveApellido = (user?.apellido || formData.apellido || '').trim();
    const effectiveEmail = (formData.email || user?.email || '').trim();

    // Si es invitado (!user), los campos nombre y apellido son requeridos
    if (!user) {
      if (!formData.nombre.trim() || !formData.apellido.trim()) {
        setError('Por favor, complete su nombre y apellido.');
        return;
      }
    }

    if (
      !effectiveNombre ||
      !effectiveEmail ||
      !formData.mensaje.trim()
    ) {
      setError('Por favor, complete todos los campos requeridos con información válida.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Enviar datos al endpoint de contacto con IA y automatización de correo
      const response = await fetch(CONTACTO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: effectiveNombre,
          apellido: effectiveApellido,
          email: effectiveEmail,
          telefono: formData.telefono ? formData.telefono.trim() : '',
          asunto: formData.asunto,
          mensaje: formData.mensaje.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      setSuccess(true);
      setFormData({
        nombre: user?.nombre || '',
        apellido: user?.apellido || '',
        email: user?.email || '',
        telefono: '',
        asunto: 'consulta',
        mensaje: ''
      });
    } catch (err) {
      console.error(err);
      setError('Hubo un error al enviar el mensaje. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contacto-container">
      <div className="contacto-hero">
        <div className="contacto-hero-overlay"></div>
        <div className="contacto-hero-content container">
          <h1 className="font-serif">Contacto</h1>
          <p>ESTAMOS AQUÍ PARA GUIARLE EN LA BÚSQUEDA DE LA PIEZA PERFECTA</p>
        </div>
      </div>

      <div className="contacto-layout container">
        {/* LADO IZQUIERDO: Información de INOVA */}
        <div className="contacto-info-section">
          <h2 className="font-serif">Contacto INOVA</h2>
          <p className="contacto-subtitle">
            Cada joya e historia es única. Póngase en contacto con nuestro equipo para asesorías personalizadas sobre tallas, pedidos a medida o consultas generales.
          </p>

          <div className="info-cards-grid">
            <div className="info-card">
              <MapPin className="info-icon" size={20} />
              <div>
                <h4>Ubicación & Puntos de Encuentro</h4>
                <p>Plaza Independencia, Mendoza Argentina</p>
                <p className="highlight-text">Entregas coordinadas en puntos estratégicos</p>
              </div>
            </div>

            <div className="info-card">
              <Clock className="info-icon" size={20} />
              <div>
                <h4>Horarios de Atención</h4>
                <p>Lunes a Viernes: 10:00 - 19:00 hs</p>
                <p>Sábados: 10:00 - 14:00 hs</p>
              </div>
            </div>

            <div className="info-card">
              <Mail className="info-icon" size={20} />
              <div>
                <h4>Consultas Generales</h4>
                <p>inova.accesorios0@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="contacto-social-section">
            <h3>Canales Exclusivos</h3>
            <p>Conéctese directamente con nosotros para una atención inmediata en un solo clic.</p>

            <div className="social-buttons">
              <a
                href="https://wa.me/5492615166802"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn whatsapp-btn"
              >
                <MessageSquare size={18} />
                <span>WHATSAPP INOVA</span>
              </a>

              <a
                href="https://www.instagram.com/inova.accesorios/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn instagram-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>INSTAGRAM OFICIAL</span>
              </a>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Formulario de Contacto */}
        <div className="contacto-form-section">
          <div className="contacto-card">
            {success ? (
              <div className="success-state">
                <CheckCircle size={60} className="success-icon" />
                <h3 className="font-serif">¡Solicitud Enviada con Éxito!</h3>
                <p>Tu solicitud ya fue enviada a uno de nuestros administradores. Te hemos enviado un correo de confirmación y en breve nos comunicaremos contigo para responder tu consulta.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="btn-retry"
                >
                  ENVIAR OTRO MENSAJE
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-serif form-title">Formulario de Contacto</h3>
                <p className="form-desc">Complete el formulario a continuación y nos comunicaremos con usted.</p>

                {error && <div className="form-error-msg">{error}</div>}

                <form onSubmit={handleSubmit} className="contacto-form">
                  {!user && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>NOMBRE *</label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                          placeholder="Su nombre"
                        />
                      </div>
                      <div className="form-group">
                        <label>APELLIDO *</label>
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          required
                          placeholder="Su apellido"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>CORREO ELECTRÓNICO *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      readOnly={Boolean(user)}
                      className={user ? 'input-readonly' : ''}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>TELÉFONO DE CONTACTO</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="Ej: +54 9 261 000 0000"
                    />
                  </div>

                  <div className="form-group">
                    <label>TIPO DE CONSULTA</label>
                    <select name="asunto" value={formData.asunto} onChange={handleChange}>
                      <option value="consulta">Consulta General</option>
                      <option value="medida">Diseño Personalizado / A Medida</option>
                      <option value="talla">Dudas de Tallas y Ajustes</option>
                      <option value="pedido">Estado de mi Pedido</option>
                      <option value="mayorista">Venta Mayorista</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>MENSAJE *</label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      required
                      placeholder="Escriba su consulta en detalle..."
                      rows={5}
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-contacto-btn"
                    disabled={loading}
                  >
                    {loading ? 'ENVIANDO...' : (
                      <>
                        <Send size={14} />
                        <span>ENVIAR MENSAJE →</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacto;