const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Payment = require('../models/Payment');

router.post('/', async (req, res) => {
    try {
        const { userId, total } = req.body;
        const order = await Order.create({ userId, total });
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const orders = await Order.findAll({ include: Payment });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, { include: Payment });
        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
        await order.update({ status: req.body.status });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;