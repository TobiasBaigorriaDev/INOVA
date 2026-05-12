const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Crear un pago
router.post('/', async (req, res) => {
    try {
        const { orderId, amount, method } = req.body;
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
        const payment = await Payment.create({ orderId, amount, method });
        await order.update({ status: 'pagado' });
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los pagos
router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll({ include: Order });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener pago por ID
router.get('/:id', async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id, { include: Order });
        if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;