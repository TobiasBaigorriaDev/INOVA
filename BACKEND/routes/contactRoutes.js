const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/contacto
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, asunto, mensaje } = req.body;

        // 1. Validaciones básicas
        if (!nombre || !email || !mensaje) {
            return res.status(400).json({
                error: 'Nombre, email y mensaje son campos obligatorios.'
            });
        }

        const nombreCompleto = `${nombre.trim()} ${apellido ? apellido.trim() : ''}`.trim();
        const emailCliente = email.trim();
        const telefonoCliente = telefono ? telefono.trim() : 'No especificado';
        const asuntoMensaje = asunto ? asunto.trim() : 'Consulta general';
        const consultaCliente = mensaje.trim();

        // 2. Generar respuesta personalizada con Google Gemini
        let respuestaIA = '';
        try {
            const prompt = `Eres el equipo de atención al cliente y asesores de INOVA, una boutique exclusiva de joyería minimalista y personalizada ubicada en Mendoza, Argentina.
Un cliente nos acaba de escribir a través del formulario de contacto de la web.

Datos del cliente y consulta:
- Nombre: ${nombreCompleto}
- Email: ${emailCliente}
- Teléfono: ${telefonoCliente}
- Asunto: ${asuntoMensaje}
- Mensaje: "${consultaCliente}"

Tu tarea:
Redacta una respuesta cordial, profesional, cálida y resolutiva en español (tono rioplatense sutil, educado y elegante).
Instrucciones específicas:
1. Saluda al cliente por su nombre (${nombreCompleto}).
2. Aborda directamente el motivo de su consulta o duda. Si pregunta por diseños personalizados, confirma que nos especializamos en piezas a medida. Si consulta por entregas, aclara que coordinamos puntos de encuentro estratégicos en el Gran Mendoza. Si pregunta por pagos, aceptamos efectivo, Mercado Pago y Dogecoin (DOGE).
3. Mantén una extensión concisa (2 a 3 párrafos breves), clara y agradable.
4. Cierra cordialmente con la firma:
Atentamente,
Equipo de Atención al Cliente | INOVA Joyería
Mendoza, Argentina
WhatsApp: +54 261 5166802 | Instagram: @inova.accesorios`;

            // Intentos de modelos con fallback
            const modelos = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
            for (const nombreModelo of modelos) {
                try {
                    const model = genAI.getGenerativeModel({ model: nombreModelo });
                    const result = await model.generateContent(prompt);
                    respuestaIA = result.response.text();
                    if (respuestaIA) break;
                } catch (errModel) {
                    console.warn(`[Contacto IA] No se pudo generar con ${nombreModelo}: ${errModel.message}`);
                }
            }
        } catch (aiError) {
            console.error('Error al generar respuesta con Gemini:', aiError);
        }

        // Si fallara la IA por cuotas o conectividad, usamos una plantilla de respaldo cordial
        if (!respuestaIA) {
            respuestaIA = `Estimado/a ${nombreCompleto},\n\nGracias por comunicarte con INOVA. Hemos recibido tu consulta sobre "${asuntoMensaje}" y nuestro equipo ya está revisándola para brindarte la mejor atención.\n\nNos pondremos en contacto contigo a la brevedad.\n\nAtentamente,\nEquipo de Atención al Cliente | INOVA Joyería\nMendoza, Argentina\nWhatsApp: +54 261 5166802 | Instagram: @inova.accesorios`;
        }

        // 3. Enviar correo automatizado al cliente con Nodemailer
        let emailEnviado = false;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const htmlContent = `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #111111; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-family: serif; letter-spacing: 3px; font-size: 26px;">I N O V A</h1>
                        <p style="color: #c5a059; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Joyería Minimalista & Personalizada</p>
                    </div>
                    
                    <div style="padding: 35px 30px; color: #333333; line-height: 1.6;">
                        <p style="font-size: 16px; margin-top: 0;">Hola <strong>${nombreCompleto}</strong>,</p>
                        <p style="font-size: 14px; color: #666666;">Gracias por comunicarte con nosotros a través de nuestra tienda online. Hemos recibido tu mensaje y aquí tienes nuestra respuesta:</p>
                        
                        <div style="background-color: #f9f9f9; border-left: 3px solid #111111; padding: 20px; margin: 25px 0; border-radius: 4px; font-size: 14px; color: #222222; white-space: pre-line;">
${respuestaIA}
                        </div>
                        
                        <div style="border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 30px;">
                            <p style="font-size: 13px; color: #777777; margin: 0 0 8px 0;"><strong>Detalle de tu mensaje original:</strong></p>
                            <p style="font-size: 13px; color: #999999; margin: 0 0 4px 0;"><strong>Asunto:</strong> ${asuntoMensaje}</p>
                            <p style="font-size: 13px; color: #999999; margin: 0;"><strong>Mensaje:</strong> "${consultaCliente}"</p>
                        </div>
                    </div>
                    
                    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888;">
                        <p style="margin: 0 0 6px 0;">Gran Mendoza, Argentina</p>
                        <p style="margin: 0;">Instagram: <a href="https://www.instagram.com/inova.accesorios/" style="color: #111111; text-decoration: underline;">@inova.accesorios</a> | WhatsApp: <a href="https://wa.me/542615166802" style="color: #111111; text-decoration: underline;">+54 261 5166802</a></p>
                    </div>
                </div>
                `;

                // Correo para el cliente
                await transporter.sendMail({
                    from: `"INOVA Joyería" <${process.env.EMAIL_USER}>`,
                    to: emailCliente,
                    subject: `Re: ${asuntoMensaje} - INOVA Joyería`,
                    text: respuestaIA,
                    html: htmlContent
                });

                // Correo de aviso interno para el administrador
                const adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.EMAIL_USER;
                const primerAdmin = adminEmailsEnv.split(',')[0].trim();
                if (primerAdmin) {
                    await transporter.sendMail({
                        from: `"Web INOVA" <${process.env.EMAIL_USER}>`,
                        to: primerAdmin,
                        subject: `[Nuevo Contacto Web] ${asuntoMensaje} de ${nombreCompleto}`,
                        html: `
                            <h3>Nuevo mensaje desde el formulario de contacto</h3>
                            <p><strong>Cliente:</strong> ${nombreCompleto} (${emailCliente})</p>
                            <p><strong>Teléfono:</strong> ${telefonoCliente}</p>
                            <p><strong>Asunto:</strong> ${asuntoMensaje}</p>
                            <p><strong>Consulta:</strong> ${consultaCliente}</p>
                            <hr/>
                            <h4>Respuesta automática enviada por IA:</h4>
                            <div style="background:#f4f4f4; padding:15px; border-radius:6px; white-space:pre-line;">
                                ${respuestaIA}
                            </div>
                        `
                    });
                }

                emailEnviado = true;
                console.log(`[Contacto Email] Correo automático con respuesta de IA enviado con éxito a ${emailCliente}`);
            } catch (mailError) {
                console.error('[Contacto Email Error] No se pudo enviar el correo vía Nodemailer:', mailError);
            }
        } else {
            console.log('\n======================================================');
            console.log(`[Simulación Email Contacto] No hay EMAIL_USER configurado en .env`);
            console.log(`Destinatario: ${emailCliente}`);
            console.log(`Asunto: Re: ${asuntoMensaje} - INOVA Joyería`);
            console.log(`Respuesta IA generada:\n${respuestaIA}`);
            console.log('======================================================\n');
        }

        // 4. Devolvemos respuesta exitosa al frontend
        res.status(200).json({
            mensaje: 'Mensaje recibido con éxito. Te hemos enviado una respuesta a tu correo electrónico.',
            respuestaIA,
            emailEnviado
        });

    } catch (error) {
        console.error('Error general en endpoint de contacto:', error);
        res.status(500).json({
            error: 'Ocurrió un error al procesar tu solicitud de contacto.'
        });
    }
});

module.exports = router;
