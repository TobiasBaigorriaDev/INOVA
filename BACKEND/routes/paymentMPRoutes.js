const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

// POST /api/mp/create-preference
router.post('/create-preference', async (req, res) => {
    try {
        const { items } = req.body;

        const preference = new Preference(client);

        const response = await preference.create({
            body: {
                items: items.map(item => ({
                    title: item.nombre,
                    quantity: item.cantidad,
                    unit_price: Number(item.precio),
                    currency_id: 'ARS'
                })),
                back_urls: {
                    success: 'http://localhost:5173/checkout/success',
                    failure: 'http://localhost:5173/checkout/failure',
                    pending: 'http://localhost:5173/checkout/pending'
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

module.exports = router;