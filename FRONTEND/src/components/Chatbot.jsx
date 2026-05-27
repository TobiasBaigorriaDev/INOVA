import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  CreditCard,
  MapPin,
  MessageCircle,
  Gem,
  AtSign,
  Phone,
  ShoppingBag
} from 'lucide-react';
import './Chatbot.css';

const initialMessages = [
  {
    type: 'bot',
    text: '¡Hola! Somos INOVA ¿En qué podemos ayudarte hoy?'
  }
];

const optionButtons = [
  {
    key: 'pagos',
    label: 'Pagos',
    icon: CreditCard,
    userText: 'Medios de pago'
  },
  {
    key: 'encuentro',
    label: 'Encuentro',
    icon: MapPin,
    userText: 'Puntos de encuentro'
  },
  {
    key: 'asesor',
    label: 'Asesor',
    icon: MessageCircle,
    userText: 'Hablar con asesor'
  },
  {
    key: 'personalizado',
    label: 'Personalizado',
    icon: Gem,
    userText: 'Crear algo personalizado'
  },
  {
    key: 'colecciones',
    label: 'Colecciones',
    icon: ShoppingBag,
    userText: 'Ver colecciones'
  }
];

function Chatbot({ isOpen, onClose }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
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

  const addBotResponse = (responseData) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, responseData]);
    }, 1200);
  };

  const handleOption = (option, userText) => {
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        text: userText
      }
    ]);

    switch (option) {
      case 'pagos':
        addBotResponse({
          type: 'bot',
          text: `Queremos que tu experiencia sea cómoda, segura y simple.\nPor eso trabajamos con múltiples medios de pago:\n• Efectivo\n• Mercado Pago\n• Tarjetas débito/crédito\n• Criptomonedas`
        });
        break;
      case 'encuentro':
        addBotResponse({
          type: 'map',
          text: `Coordinamos puntos de encuentro dentro de Gran Mendoza.\nPodés elegir ubicación, fecha y horario según disponibilidad.`
        });
        break;
      case 'asesor':
        addBotResponse({
          type: 'advisor',
          text: `Para brindarte una atención exclusiva y ayudarte a encontrar piezas únicas.\nPodés comunicarte directamente con nosotros por Instagram o WhatsApp.`
        });
        break;
      case 'personalizado':
        addBotResponse({
          type: 'personalizado',
          text: `Nos encanta crear piezas únicas para cada persona.\nContanos tu idea y creemos algo totalmente personalizado para vos.`
        });
        break;
      case 'colecciones':
        addBotResponse({
          type: 'collections',
          text: `Descubrí nuestras colecciones exclusivas.\nEncontrá piezas minimalistas, elegantes y personalizadas.`
        });
        break;
      default:
        break;
    }
  };

  const renderAction = (msg) => {
    if (msg.type === 'map') {
      return (
        <a
          href="https://www.google.com/maps/place/Gran+Mendoza"
          target="_blank"
          rel="noopener noreferrer"
          className="chatbot-action-link map"
        >
          Ver mapa
        </a>
      );
    }

    if (msg.type === 'advisor') {
      return (
        <div className="chatbot-action-group">
          <a
            href="https://instagram.com/inova.accesorios"
            target="_blank"
            rel="noopener noreferrer"
            className="chatbot-action-link instagram"
          >
            <AtSign size={16} />
            Instagram
          </a>
          <a
            href="https://wa.me/542615166802"
            target="_blank"
            rel="noopener noreferrer"
            className="chatbot-action-link whatsapp"
          >
            <Phone size={16} />
            WhatsApp
          </a>
        </div>
      );
    }

    if (msg.type === 'personalizado') {
      return (
        <div className="chatbot-action-group">
          <a
            href="https://instagram.com/inova.accesorios"
            target="_blank"
            rel="noopener noreferrer"
            className="chatbot-action-link instagram"
          >
            <AtSign size={16} />
            Crear diseño
          </a>
        </div>
      );
    }

    if (msg.type === 'collections') {
      return (
        <a href="/colecciones" className="chatbot-action-link collections">
          <ShoppingBag size={16} />
          Ver colecciones
        </a>
      );
    }

    return null;
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
              {renderAction(msg)}
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

      <div className="chatbot-buttons">
        {optionButtons.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              className="chat-option-btn"
              onClick={() => handleOption(option.key, option.userText)}
              type="button"
            >
              <Icon size={16} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Chatbot;
