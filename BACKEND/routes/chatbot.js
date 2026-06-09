const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Products');

// Inicializar el SDK de Gemini con la clave de API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'El mensaje es requerido.' });
  }

  try {
    // 1. Obtener catálogo en tiempo real desde la Base de Datos
    const dbProducts = await Product.findAll();
    const formattedCatalog = dbProducts.map(p => 
      `- **${p.nombre}**: ${p.descripcion}. Categoría: ${p.categoria}. Precio: $${p.precio}. Stock disponible: ${p.stock} unidades.`
    ).join('\n');

    // 2. Definir instrucciones del sistema (System Instructions) para darle contexto inteligente
    const systemPrompt = `Eres el asistente de IA oficial de INOVA, una tienda exclusiva de joyería minimalista y personalizada ubicada en Mendoza, Argentina.
    Tus respuestas deben ser claras, amables, profesionales y concisas. Puedes usar el voseo de forma sutil y natural (español rioplatense/argentino).

    Reglas de negocio e información clave:
    - **Catálogo de Productos actual en tiempo real:**
    ${formattedCatalog}
    - **Políticas de Venta sobre Productos:** Usa estrictamente la lista de arriba para responder si un producto existe, su precio, descripción o disponibilidad. Si el stock de un producto es 0, aclara que actualmente no tenemos stock de ese producto, pero podemos hacerlo a pedido.
    - **Productos no listados:** Si te preguntan por un producto que no está en la lista de arriba, explícales con amabilidad que no está en nuestro catálogo de stock inmediato, pero que como nos especializamos en joyería personalizada, podemos diseñarlo a medida si nos contactan por Instagram o WhatsApp.
    - **Medios de Pago:** Aceptamos efectivo, transferencia bancaria, Mercado Pago (con redirección directa de pago), tarjetas de débito/crédito y criptomonedas.
    - **Entregas / Envíos:** Coordinamos puntos de encuentro estratégicos dentro del Gran Mendoza de mutuo acuerdo. No poseemos tienda física abierta al público general, nos manejamos mediante entregas pactadas y venta online.
    - **Contacto Directo:**
      * Instagram: @inova.accesorios (https://www.instagram.com/inova.accesorios/)
      * WhatsApp: +54 261 5166802 (https://wa.me/542615166802)
    
    Límites de comportamiento:
    - Si el cliente te pregunta sobre temas totalmente ajenos a la joyería, la moda, el estilismo o INOVA, responde con respeto que tu propósito es ayudarlos con consultas relacionadas con la joyería de INOVA.`;

    // 3. Obtener modelo generativo configurado con las instrucciones de sistema y el modelo Gemini 3.5 Flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: systemPrompt
    });

    // 4. Adaptar el historial para que Gemini lo procese correctamente (roles: user / model)
    let formattedHistory = (history || [])
      .filter(msg => msg.text && (msg.type === 'user' || msg.type === 'bot'))
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Gemini requiere que el primer mensaje en el historial sea del rol 'user'
    const firstUserIndex = formattedHistory.findIndex(h => h.role === 'user');
    if (firstUserIndex !== -1) {
      formattedHistory = formattedHistory.slice(firstUserIndex);
    } else {
      formattedHistory = [];
    }

    // 5. Iniciar la sesión de chat con el historial
    const chat = model.startChat({
      history: formattedHistory
    });

    // 6. Enviar mensaje actual y obtener respuesta de la IA
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('Error en el chatbot con Gemini:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar tu consulta con la IA.' });
  }
});

module.exports = router;
