import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Auth.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');
  const [successMensaje, setSuccessMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMensaje('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMensaje('Las contraseñas no coinciden.');
      return;
    }

    try {
      setErrorMensaje('');
      setSuccessMensaje('');
      
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMensaje(data.mensaje || 'Error al restablecer la contraseña');
        return;
      }
      
      setSuccessMensaje('Contraseña restablecida con éxito. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.log(error);
      setErrorMensaje('Error conectando con el servidor');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-overlay"></div>
      <div className="auth-content">
        <div className="auth-header">
          <h1 className="font-serif">INOVA</h1>
          <p>EXQUISITE CRAFTSMANSHIP</p>
        </div>

        <div className="auth-card">
          <h2 className="font-serif">Nueva Contraseña</h2>
          <p>Ingresa tu nueva contraseña para continuar</p>

          {errorMensaje && (
            <div style={{
              background: 'rgba(255,0,0,0.1)',
              border: '1px solid rgba(255,0,0,0.4)',
              color: '#ffb3b3',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              borderRadius: '4px'
            }}>
              {errorMensaje}
            </div>
          )}

          {successMensaje && (
            <div style={{
              background: 'rgba(0,255,0,0.1)',
              border: '1px solid rgba(0,255,0,0.4)',
              color: '#b3ffb3',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              borderRadius: '4px'
            }}>
              {successMensaje}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <div className="auth-labels">
                <label>NUEVA CONTRASEÑA</label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="auth-form-group">
              <div className="auth-labels">
                <label>CONFIRMAR CONTRASEÑA</label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="auth-btn-primary">
              GUARDAR CONTRASEÑA →
            </button>
          </form>
        </div>
      </div>
      <div className="auth-page-footer">
        © 2024 INOVA. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}

export default ResetPassword;
