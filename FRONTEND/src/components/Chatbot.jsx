import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

function Chatbot({ isOpen, onClose }) {
    const [message, setMessage] = useState('');

    // --- NUEVO: Truco para darle tiempo a la animación ---
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    // Si no está abierto y ya terminó de animarse, no renderizamos nada
    if (!shouldRender) return null;

    return (
        <div
            // Cuando termina cualquier animación, revisa si se estaba cerrando para desaparecer del todo
            onAnimationEnd={() => {
                if (!isOpen) setShouldRender(false);
            }}
            style={{
                position: 'fixed',
                bottom: '40px', // Exactamente la misma altura que tenía el botón original
                right: '40px',
                width: '350px',
                height: '500px',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1000,
                transformOrigin: 'bottom right', // Crece y se achica desde la esquina del botón

                // --- NUEVO: Elegimos la animación según si está abriendo o cerrando ---
                animation: isOpen
                    ? 'chatBubbleAppear 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                    : 'chatBubbleDisappear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            }}
        >

            {/* --- HEADER DEL CHAT --- */}
            <div style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} />
                    <h3 className="font-serif" style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>Asistente Inova</h3>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* --- ÁREA DE MENSAJES --- */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                backgroundColor: '#fafafa'
            }}>
                {/* Mensaje de bienvenida del bot */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ backgroundColor: '#e2e8f0', padding: '8px', borderRadius: '50%' }}>
                        <Sparkles size={14} color="var(--primary)" />
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '0 16px 16px 16px', border: '1px solid #eaeaea', fontSize: '14px', lineHeight: '1.5', color: '#333' }}>
                        ¡Hola! Bienvenido a INOVA. ¿En qué te puedo ayudar hoy? ¿Buscás alguna pieza en particular?
                    </div>
                </div>
                {/* Aquí irán apareciendo los mensajes del usuario */}
            </div>

            {/* --- ÁREA PARA ESCRIBIR --- */}
            <div style={{
                padding: '15px',
                backgroundColor: 'white',
                borderTop: '1px solid #eaeaea',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="Escribe tu mensaje..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '20px',
                        border: '1px solid #eaeaea',
                        outline: 'none',
                        fontSize: '14px',
                        backgroundColor: '#fafafa'
                    }}
                />
                <button style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                }}>
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}

export default Chatbot;