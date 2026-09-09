const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment: MPPayment } = require('mercadopago');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Products');
const { sequelize } = require('../config/dbSQL');

const N8N_ORDER_WEBHOOK_URL = process.env.N8N_ORDER_WEBHOOK_URL || 'http://localhost:5678/webhook/inova-compra';

const accessToken = process.env.MP_ACCESS_TOKEN || '';

if (!accessToken || accessToken.includes('TEST-aqui')) {
    console.warn('⚠️ MP_ACCESS_TOKEN no configurado o contiene el valor por defecto. Revise BACKEND/.env');
}

const client = new MercadoPagoConfig({
    accessToken
});

// GET /api/mp/success
// Ruta puente para saltar la restricción de localhost en Mercado Pago
router.get('/success', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const queryString = new URLSearchParams(req.query).toString();
    res.redirect(`${frontendUrl}/checkout?${queryString}`);
});

router.post('/create-preference', async (req, res) => {
    try {
        if (!accessToken || accessToken.includes('TEST-aqui')) {
            return res.status(500).json({ mensaje: 'MP_ACCESS_TOKEN no configurado en el servidor' });
        }
        const { items, orderId } = req.body;

        const preference = new Preference(client);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const webhookUrl = process.env.WEBHOOK_URL || 'https://TU_DOMINIO.ngrok.app/api/mp/webhook';
        // Extraemos la base de la URL (ej: https://xxx.trycloudflare.com)
        const baseUrl = webhookUrl.replace('/api/mp/webhook', '');

        const response = await preference.create({
            body: {
                // external_reference nos sirve para identificar la orden cuando MP nos mande el webhook
                external_reference: orderId ? orderId.toString() : '0',
                // notification_url es donde Mercado Pago enviará los avisos por POST
                notification_url: webhookUrl,
                items: items.map(item => ({
                    title: item.nombre,
                    quantity: item.cantidad,
                    unit_price: Number(item.precio),
                    currency_id: 'ARS'
                })),
                back_urls: {
                    success: `${baseUrl}/api/mp/success`,
                    failure: `${baseUrl}/api/mp/success`,
                    pending: `${baseUrl}/api/mp/success`
                },
                auto_return: 'approved'
            }
        });

        res.status(200).json({
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear preferencia de pago', error: error.message });
    }
});

// POST /api/mp/webhook
// Esta ruta recibe las notificaciones de Mercado Pago y actualiza el estado de la Orden
router.post('/webhook', async (req, res) => {
    try {
        const paymentId = req.query['data.id'] || req.body?.data?.id;
        const type = req.query.type || req.body?.type;

        if (type === 'payment' && paymentId) {
            // Buscamos la info del pago en Mercado Pago
            const paymentClient = new MPPayment(client);
            const paymentInfo = await paymentClient.get({ id: paymentId });

            const status = paymentInfo.status; // 'approved', 'rejected', etc.
            const orderId = paymentInfo.external_reference;

            // Si el pago está aprobado, descontamos stock y actualizamos el estado de la Orden
            if (status === 'approved' && orderId && orderId !== '0') {
                const t = await sequelize.transaction();
                try {
                    // Buscamos la orden con sus detalles (items)
                    const order = await Order.findByPk(orderId, {
                        include: [{ model: OrderItem, as: 'items' }],
                        transaction: t
                    });

                    if (order && order.status === 'pendiente') {
                        const orderProducts = [];
                        // Descontamos stock para cada producto de la orden
                        for (const item of order.items) {
                            const product = await Product.findByPk(item.productId, { transaction: t });
                            if (product) {
                                const newStock = Math.max(0, product.stock - item.cantidad);
                                await product.update({ stock: newStock }, { transaction: t });
                                console.log(`[Webhook] Descontado stock para producto ${product.nombre}. Nuevo stock: ${newStock}`);
                                orderProducts.push({
                                    productId: item.productId,
                                    nombre: product.nombre,
                                    cantidad: item.cantidad,
                                    precioUnitario: item.precioUnitario
                                });
                            }
                        }

                        // Actualizamos el estado de la Orden a 'pagado'
                        await order.update({ status: 'pagado' }, { transaction: t });
                        console.log(`[Webhook] Orden ${orderId} marcada como PAGADA con éxito.`);

                        // Mandamos mail luego de confirmar
                        try {
                            await fetch(N8N_ORDER_WEBHOOK_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderId: order.id,
                                    email: order.email,
                                    nombreCliente: order.nombreCliente,
                                    apellidoCliente: order.apellidoCliente,
                                    diaEncuentro: order.diaEncuentro,
                                    horaEncuentro: order.horaEncuentro,
                                    metodoPago: order.metodoPago,
                                    cryptoTxId: order.cryptoTxId,
                                    cryptoNetwork: order.cryptoNetwork,
                                    subtotal: order.total,
                                    costoEnvio: 0,
                                    total: order.total,
                                    status: 'pagado',
                                    productos: orderProducts
                                })
                            });
                            console.log(`[n8n] Correo de compra MP enviado correctamente para orden ${order.id}`);
                        } catch (err) {
                            console.error('[n8n] Error correo MP:', err);
                        }
                    } else if (order && order.status === 'pagado') {
                        console.log(`[Webhook] La orden ${orderId} ya se encontraba pagada.`);
                    }

                    await t.commit();
                } catch (webhookErr) {
                    await t.rollback();
                    console.error('[Webhook] Error crítico procesando la transacción de pago y stock:', webhookErr);
                    throw webhookErr;
                }
            }
        }

        // Siempre responder 200 OK para que MP no reintente enviar la notificación
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en el Webhook:', error);
        res.status(500).send('Error interno en webhook');
    }
});

// GET /api/mp/config
router.get('/config', (req, res) => {
    res.json({
        publicKey: process.env.MP_PUBLIC_KEY || '',
        cryptoWalletAddress: process.env.CRYPTO_WALLET_ADDRESS || 'PEGAR_DIRECCION_USDT_TRC20_LEMON_AQUI'
    });
});

// POST /api/mp/confirm-payment
// Permite confirmar el pago cuando MP redirige al usuario con status=approved en localhost o producción
router.post('/confirm-payment', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId || orderId === '0') {
            return res.status(400).json({ error: 'orderId requerido' });
        }

        const t = await sequelize.transaction();
        try {
            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: 'items' }],
                transaction: t
            });

            if (order && order.status === 'pendiente') {
                for (const item of order.items) {
                    const product = await Product.findByPk(item.productId, { transaction: t });
                    if (product) {
                        const newStock = Math.max(0, product.stock - item.cantidad);
                        await product.update({ stock: newStock }, { transaction: t });
                        console.log(`[MP Confirm] Descontado stock para producto ${product.nombre}. Nuevo stock: ${newStock}`);
                    }
                }
                await order.update({ status: 'pagado' }, { transaction: t });
                console.log(`[MP Confirm] Orden ${orderId} marcada como PAGADA con éxito.`);
            }

            await t.commit();
            res.json({ ok: true, status: order ? order.status : 'no_encontrada' });
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (error) {
        console.error('[MP Confirm] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;