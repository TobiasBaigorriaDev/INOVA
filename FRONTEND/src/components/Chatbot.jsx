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
  const [products, setProducts] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/products?limit=100')
      .then(res => res.json())
      .then(data => {
        const prods = data.productos || data || [];
        const mapped = prods.map(p => ({ id: p.id, name: p.nombre }));
        console.log('Productos cargados:', mapped);
        setProducts(mapped);
      })
      .catch(err => console.error('Error al cargar productos:', err));
}, []);

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
    setInputMessage('');

    setMessages((prev) => [...prev, { type: 'user', text: userText }]);
    setTyping(true);

    try {
     const response = await fetch('http://localhost:3000/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        message: userText, 
        history: messages,
        token: localStorage.getItem('token') || null
    }),
    });
      if (!response.ok) throw new Error('Error de comunicación con el servidor');

      const data = await response.json();
      setMessages((prev) => [...prev, { type: 'bot', text: data.text }]);
    } catch (error) {
      console.error('Error al conectar con la IA:', error);
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: 'Lo siento, en este momento estoy experimentando problemas de conexión. Por favor, intenta de nuevo más tarde.' }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const addProductLinks = (text, products) => {
    let result = text;
    if (products && products.length > 0) {
        products.forEach(product => {
            const escapedName = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Busca tanto **nombre** como *nombre*
            const regexDouble = new RegExp(`\\*\\*(${escapedName})\\*\\*`, 'gi');
            const regexSingle = new RegExp(`\\*(${escapedName})\\*`, 'gi');
            result = result.replace(regexDouble, `**<a href="/producto/${product.id}" style="color: inherit; text-decoration: underline; font-weight: bold;">$1</a>**`);
            result = result.replace(regexSingle, `*<a href="/producto/${product.id}" style="color: inherit; text-decoration: underline;">$1</a>*`);
        });
    }
    return result;
};
  if (!shouldRender) return null;

  return (
    <div
      className={`chatbot-container ${isOpen ? 'open' : 'closing'}`}
      onAnimationEnd={() => { if (!isOpen) setShouldRender(false); }}
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
              {msg.type === 'bot' ? (
                <span dangerouslySetInnerHTML={{
                  __html: addProductLinks(msg.text, products)
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br/>')
                }} />
              ) : msg.text}
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