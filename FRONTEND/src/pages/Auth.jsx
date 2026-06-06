import React, { useState } from 'react';
import './Auth.css';

import {
  signInWithPopup
} from 'firebase/auth';

import {
  auth,
  provider
} from '../firebase';

function Auth({ setUsuario }) {

  // =========================
  // STATES
  // =========================

  const [isLogin, setIsLogin] = useState(true);

  const [nombre, setNombre] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [errorMensaje, setErrorMensaje] =
    useState('');

  // =========================
  // FUNCION REDIRECT
  // =========================

  const redirigirDespuesLogin = () => {

    const redirectPath =
      localStorage.getItem(
        'redirectAfterLogin'
      );

    if (redirectPath) {

      localStorage.removeItem(
        'redirectAfterLogin'
      );

      window.location.href =
        redirectPath;

    } else {

      window.location.href = '/';

    }

  };

  // =========================
  // USUARIO YA LOGUEADO
  // =========================

  const usuarioGuardado =
    JSON.parse(localStorage.getItem('usuario'));

  if (usuarioGuardado) {

    return (

      <div className="auth-container">

        <div className="auth-overlay"></div>

        <div className="auth-content">

          <div className="auth-card auth-card-logged-in">

            <h2
              className="font-serif"
              style={{
                textAlign: 'center',
                marginBottom: '10px'
              }}
            >
              Bienvenido nuevamente
            </h2>

            <p
              style={{
                textAlign: 'center',
                marginBottom: '30px',
                opacity: 0.8
              }}
            >
              Su sesión permanece activa
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '25px'
              }}
            >

              {usuarioGuardado.foto && (

                <img
                  src={usuarioGuardado.foto}
                  alt="perfil"
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                />

              )}

              <h3
                style={{
                  fontWeight: '300',
                  letterSpacing: '1px'
                }}
              >
                {usuarioGuardado.nombre}
              </h3>

              <p
                style={{
                  opacity: 0.7,
                  fontSize: '14px'
                }}
              >
                {usuarioGuardado.email}
              </p>

              {/* BOTON IR A LA TIENDA */}

              <button
                className="auth-btn-primary"
                onClick={() => {

                  redirigirDespuesLogin();

                }}
              >
                IR A LA TIENDA →
              </button>

              {/* BOTON CERRAR SESION */}

              <button
                className="auth-btn-primary"
                onClick={() => {

                  localStorage.removeItem('usuario');

                  localStorage.removeItem('token');

                  localStorage.removeItem('favoritos');

                  localStorage.removeItem(
                    'redirectAfterLogin'
                  );

                  window.location.reload();

                }}
                style={{
                  background: '#7a5c3e',
                  border: 'none'
                }}
              >
                CERRAR SESIÓN
              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }

  // =========================
  // TOGGLE LOGIN / REGISTER
  // =========================

  const toggleAuthMode = () => {

    setErrorMensaje('');

    setIsLogin(!isLogin);

  };

  // =========================
  // LOGIN GOOGLE
  // =========================

  const loginGoogle = async () => {
    try {
      setErrorMensaje('');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Enviar los datos de Google al backend para que nos devuelva un JWT válido
      const response = await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: user.displayName,
          email: user.email,
          foto: user.photoURL
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error en el servidor al autenticar con Google');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);

      redirigirDespuesLogin();

    } catch (error) {
      console.log(error);
      setErrorMensaje('Error al iniciar sesión con Google');
    }
  };

  // =========================
  // HANDLE SUBMIT
  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMensaje('El formato del email no es válido.');
      return;
    }

    if (password.length < 8) {
      setErrorMensaje('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {

      setErrorMensaje('');

      // LOGIN

      if (isLogin) {

        const response = await fetch(
          'http://localhost:3000/api/auth/login',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {

          setErrorMensaje(data.mensaje);

          return;

        }

        localStorage.setItem(
          'token',
          data.token
        );

        localStorage.setItem(
          'usuario',
          JSON.stringify(data.usuario)
        );

        setUsuario(data.usuario);

        redirigirDespuesLogin();

      }

      // REGISTER

      else {

        const response = await fetch(
          'http://localhost:3000/api/auth/register',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              nombre,
              email,
              password
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {

          setErrorMensaje(data.mensaje);

          return;

        }

        setNombre('');
        setEmail('');
        setPassword('');

        setErrorMensaje(
          'Usuario registrado con éxito. Ahora inicia sesión.'
        );

        setIsLogin(true);

      }

    } catch (error) {

      console.log(error);

      setErrorMensaje(
        'Error conectando con el servidor'
      );

    }

  };

  return (

    <div className="auth-container">

      <div className="auth-overlay"></div>

      <div className="auth-content">

        <div className="auth-header">

          <h1 className="font-serif">
            INOVA
          </h1>

          <p>
            EXQUISITE CRAFTSMANSHIP
          </p>

        </div>

        <div className="auth-card">

          <h2 className="font-serif">

            {isLogin
              ? 'Bienvenido'
              : 'Crear Cuenta'}

          </h2>

          <p>

            {isLogin
              ? 'Acceda a su cuenta exclusiva'
              : 'Únase a INOVA'}

          </p>

          {errorMensaje && (

            <div
              style={{
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid rgba(255,0,0,0.4)',
                color: '#ffb3b3',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'center',
                fontSize: '14px',
                borderRadius: '4px'
              }}
            >
              {errorMensaje}
            </div>

          )}

          <form onSubmit={handleSubmit}>

            {!isLogin && (

              <div className="auth-form-group">

                <div className="auth-labels">

                  <label>
                    NOMBRE COMPLETO
                  </label>

                </div>

                <input
                  type="text"
                  placeholder="Su nombre"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                />

              </div>

            )}

            <div className="auth-form-group">

              <div className="auth-labels">

                <label>
                  EMAIL
                </label>

              </div>

              <input
                type="email"
                placeholder="usuario@inova.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>

            <div className="auth-form-group">

              <div className="auth-labels">

                <label>
                  PASSWORD
                </label>

              </div>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

            </div>

            <button
              type="submit"
              className="auth-btn-primary"
            >

              {isLogin
                ? 'INICIAR SESIÓN →'
                : 'CREAR CUENTA →'}

            </button>

          </form>

          <div className="auth-divider">
            O
          </div>

          <button
            type="button"
            className="auth-btn-google"
            onClick={loginGoogle}
          >

            CONTINUAR CON GOOGLE

          </button>

          <div className="auth-footer-text">

            {isLogin
              ? '¿No tiene una cuenta?'
              : '¿Ya tiene una cuenta?'}

            <span onClick={toggleAuthMode}>

              {isLogin
                ? 'CREAR UNA CUENTA'
                : 'INICIAR SESIÓN'}

            </span>

          </div>

        </div>

      </div>

      <div className="auth-page-footer">

        © 2024 INOVA.
        ALL RIGHTS RESERVED.

      </div>

    </div>

  );

}

export default Auth;