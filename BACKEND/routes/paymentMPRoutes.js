const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment: MPPayment } = require('mercadopago');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Products');
const { sequelize } = require('../config/dbSQL');

const accessToken = process.env.MP_ACCESS_TOKEN || '';

if (!accessToken || accessToken.includes('TEST-aqui')) {
    console.warn('⚠️ MP_ACCESS_TOKEN no configurado o contiene el valor por defecto. Revise BACKEND/.env');
}

const client = new MercadoPagoConfig({
    accessToken
});

// POST /api/mp/create-preference
router.post('/create-preference', async (req, res) => {
    try {
        if (!accessToken || accessToken.includes('TEST-aqui')) {
            return res.status(500).json({ mensaje: 'MP_ACCESS_TOKEN no configurado en el servidor' });
        }
        const { items, orderId } = req.body;

        const preference = new Preference(client);

        const response = await preference.create({
            body: {
                // external_reference nos sirve para identificar la orden cuando MP nos mande el webhook
                external_reference: orderId ? orderId.toString() : '0',
                // notification_url es donde Mercado Pago enviará los avisos por POST
                // TODO: Reemplazar por tu dominio público o ngrok en desarrollo
                notification_url: 'https://TU_DOMINIO.ngrok.app/api/mp/webhook',
                items: items.map(item => ({
                    title: item.nombre,
                    quantity: item.cantidad,
                    unit_price: Number(item.precio),
                    currency_id: 'ARS'
                })),
                back_urls: {
                    success: 'http://localhost:5173/checkout',
                    failure: 'http://localhost:5173/checkout',
                    pending: 'http://localhost:5173/checkout'
                }
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
                        // Descontamos stock para cada producto de la orden
                        for (const item of order.items) {
                            const product = await Product.findByPk(item.productId, { transaction: t });
                            if (product) {
                                const newStock = Math.max(0, product.stock - item.cantidad);
                                await product.update({ stock: newStock }, { transaction: t });
                                console.log(`[Webhook] Descontado stock para producto ${product.nombre}. Nuevo stock: ${newStock}`);
                            }
                        }

                        // Actualizamos el estado de la Orden a 'pagado'
                        await order.update({ status: 'pagado' }, { transaction: t });
                        console.log(`[Webhook] Orden ${orderId} marcada como PAGADA con éxito.`);
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

module.exports = router;