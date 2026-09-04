const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Products');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
  const { message, history, token } = req.body;
  console.log('Token recibido:', token ? 'SÍ' : 'NO');

  if (!message) {
    return res.status(400).json({ error: 'El mensaje es requerido.' });
  }

  try {
    // Buscar historial de compras si el usuario está logueado
    let historialCompras = '';
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const Order = require('../models/Order');
        const OrderItem = require('../models/OrderItem');
        const ordenes = await Order.findAll({
          where: { userId: decoded.id },
          include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'producto' }] }],
          order: [['createdAt', 'DESC']],
          limit: 5
        });
        if (ordenes.length > 0) {
          historialCompras = '\n\n**Historial de compras del cliente actual:**\n' + ordenes.map(o =>
            `- Orden #${o.id} (${o.status}) - Total: $${o.total} - Fecha: ${new Date(o.createdAt).toLocaleDateString('es-AR')} - Productos: ${o.items.map(i => `${i.producto?.nombre || 'Producto'} x${i.cantidad}`).join(', ')}`
          ).join('\n');
        } else {
          historialCompras = '\n\n**Historial de compras del cliente actual:** El cliente no tiene compras anteriores en INOVA.';
        }
      } catch (e) {
        historialCompras = '';
      }
    }

    // Obtener catálogo en tiempo real
    const dbProducts = await Product.findAll();
    const formattedCatalog = dbProducts.map(p =>
      `- **${p.nombre}**: ${p.descripcion}. Categoría: ${p.categoria}. Precio: $${p.precio}. Stock disponible: ${p.stock} unidades.`
    ).join('\n');

    const systemPrompt = `Eres el asistente de IA oficial de INOVA, una tienda exclusiva de joyería minimalista y personalizada ubicada en Mendoza, Argentina.
    Tus respuestas deben ser claras, amables, profesionales y concisas. Puedes usar el voseo de forma sutil y natural (español rioplatense/argentino).

    Reglas de negocio e información clave:
    - **Catálogo de Productos actual en tiempo real:**
    ${formattedCatalog}${historialCompras}
    - **Políticas de Venta sobre Productos:** Usa estrictamente la lista de arriba para responder si un producto existe, su precio, descripción o disponibilidad. Si el stock de un producto es 0, aclara que actualmente no tenemos stock de ese producto, pero podemos hacerlo a pedido.
    - **Productos no listados:** Si te preguntan por un producto que no está en la lista de arriba, explícales con amabilidad que no está en nuestro catálogo de stock inmediato, pero que como nos especializamos en joyería personalizada, podemos diseñarlo a medida si nos contactan por Instagram o WhatsApp.
    - **Medios de Pago:** Aceptamos efectivo, Mercado Pago y criptomonedas (DOGE - Dogecoin).
    - **Entregas / Envíos:** Coordinamos puntos de encuentro estratégicos dentro del Gran Mendoza de mutuo acuerdo. No poseemos tienda física abierta al público general, nos manejamos mediante entregas pactadas y venta online.
    - **Contacto Directo:**
      * Instagram: @inova.accesorios (https://www.instagram.com/inova.accesorios/)
      * WhatsApp: +54 261 5166802 (https://wa.me/542615166802)
    
    Límites de comportamiento:
    - REGLA DE FORMATO OBLIGATORIA: SIEMPRE, sin excepción, que menciones el nombre de un producto del catálogo, debes envolver su nombre exactamente en doble asterisco (por ejemplo: **Nombre del Producto**). Esto es crítico para el enrutamiento de la página y para que el Frontend genere los enlaces.
    - Si el cliente te pregunta sobre temas totalmente ajenos a la joyería, la moda, el estilismo o INOVA, responde con respeto que tu propósito es ayudarlos con consultas relacionadas con la joyería de INOVA.
    - IMPORTANTE: Si en este prompt aparece una sección llamada "Historial de compras del cliente actual", significa que el cliente ESTÁ LOGUEADO y sus datos de compras reales están disponibles arriba. Usá ESA información para responder preguntas sobre sus pedidos. NUNCA digas que no tenés acceso a datos personales si esa sección existe en el prompt.
    - Si no hay sección de historial o dice que no tiene compras, informale amablemente al cliente.`;

    let formattedHistory = (history || [])
      .filter(msg => msg.text && (msg.type === 'user' || msg.type === 'bot'))
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    const firstUserIndex = formattedHistory.findIndex(h => h.role === 'user');
    if (firstUserIndex !== -1) {
      formattedHistory = formattedHistory.slice(firstUserIndex);
    } else {
      formattedHistory = [];
    }

    let text;
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt
      });
      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(message);
      text = result.response.text();
    } catch (primaryError) {
      console.warn('Fallo con gemini-1.5-flash, intentando fallback con gemini-2.5-flash...', primaryError.message);
      try {
        const fallbackModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt
        });
        const chat = fallbackModel.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(message);
        text = result.response.text();
      } catch (fallbackError) {
        console.warn('Fallo con gemini-2.5-flash, intentando fallback con gemini-1.5-flash-latest...', fallbackError.message);
        const legacyModel = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash-latest',
          systemInstruction: systemPrompt
        });
        const chat = legacyModel.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(message);
        text = result.response.text();
      }
    }

    res.json({ text });
  } catch (error) {
    console.error('Error en el chatbot con Gemini:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar tu consulta con la IA.' });
  }
});

module.exports = router;