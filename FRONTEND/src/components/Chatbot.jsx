import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import './Chatbot.css';

const initialMessages = [
  {
    type: 'bot',
    text: '¡Hola! Somos INOVA ¿En qué podemos ayudarte hoy?'
  }
];

function Chatbot({ isOpen, onClose }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, typing]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage(''); // Limpiar el input inmediatamente

    // 1. Agregar mensaje del usuario a la pantalla
    setMessages((prev) => [...prev, { type: 'user', text: userText }]);
    
    // 2. Mostrar la animación de "escribiendo" (typing)
    setTyping(true);

    try {
      // 3. Enviar el mensaje actual e historial al backend
      const response = await fetch('http://localhost:3000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Error de comunicación con el servidor');
      }

      const data = await response.json();

      // 4. Mostrar respuesta de la IA
      setMessages((prev) => [...prev, { type: 'bot', text: data.text }]);
    } catch (error) {
      console.error('Error al conectar con la IA:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: 'Lo siento, en este momento estoy experimentando problemas de conexión. Por favor, intenta de nuevo más tarde.'
        }
      ]);
    } finally {
      // 5. Apagar animación de escribiendo
      setTyping(false);
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`chatbot-container ${isOpen ? 'open' : 'closing'}`}
      onAnimationEnd={() => {
        if (!isOpen) {
          setShouldRender(false);
        }
      }}
    >
      <div className="chatbot-header">
        <div className="chatbot-header-title">
          <Sparkles size={20} />
          <span>Asistente Inova</span>
        </div>
        <button className="chatbot-close-btn" onClick={onClose} aria-label="Cerrar chatbot">
          <X size={20} />
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chatbot-message-row ${msg.type === 'user' ? 'user' : 'bot'}`}>
            <div className={`chatbot-message-bubble ${msg.type === 'user' ? 'user' : 'bot'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="chatbot-message-row bot">
            <div className="typing-bubble">Inova está escribiendo...</div>
          </div>
        )}

        <div ref={messagesEndRef} className="chatbot-scroll-anchor" />
      </div>

      <form onSubmit={handleSendMessage} className="chatbot-input-container">
        <input
          type="text"
          placeholder="Escribe tu mensaje..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="chatbot-input"
        />
        <button type="submit" className="chatbot-send-btn" aria-label="Enviar mensaje">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default Chatbot;

