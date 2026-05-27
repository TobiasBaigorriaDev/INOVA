const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Products');
const { sequelize } = require('../config/dbSQL');
const validarJWT = require('../middlewares/authMiddleware');

// ==========================================
// CREAR UN PEDIDO (POST /api/orders)
// Protegido con JWT
// ==========================================
router.post('/', validarJWT, async (req, res) => {
    // Iniciamos una transacción para asegurar que la base de datos se mantenga consistente
    const t = await sequelize.transaction();

    try {
        const { email, nombreCliente, apellidoCliente, diaEncuentro, horaEncuentro, metodoPago, cartItems } = req.body;
        const userId = req.usuario.id; // Extraemos el ID seguro del token de sesión

        // 1. Validación básica de carrito
        if (!cartItems || cartItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El carrito no puede estar vacío' });
        }

        let subtotal = 0;
        const itemsToCreate = [];

        // 2. Verificar disponibilidad de stock y recalcular precios en backend
        for (const item of cartItems) {
            const dbProduct = await Product.findByPk(item.id, { transaction: t });
            
            if (!dbProduct) {
                await t.rollback();
                return res.status(404).json({ mensaje: `El producto ${item.name || 'desconocido'} no existe en la tienda` });
            }

            if (dbProduct.stock < item.qty) {
                await t.rollback();
                return res.status(400).json({ 
                    mensaje: `Stock insuficiente para "${dbProduct.nombre}". Stock disponible: ${dbProduct.stock}` 
                });
            }

            subtotal += dbProduct.precio * item.qty;
            
            itemsToCreate.push({
                productId: item.id,
                cantidad: item.qty,
                precioUnitario: dbProduct.precio,
                dbProduct // nos guardamos la referencia para actualizar stock luego
            });
        }

        // Definimos costo de envío (deshabilitado: entregas en puntos de encuentro sin costo)
        const costoEnvio = 0.00;
        const totalFinal = subtotal + costoEnvio;

        // 3. Crear el registro de la Orden principal
        const order = await Order.create({
            userId,
            total: totalFinal,
            status: 'pendiente',
            email,
            nombreCliente,
            apellidoCliente,
            diaEncuentro,
            horaEncuentro,
            metodoPago
        }, { transaction: t });

        // 4. Crear los detalles de productos (OrderItem) y restar el stock
        for (const item of itemsToCreate) {
            // Guardamos el detalle
            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            }, { transaction: t });

            // Descontamos stock del producto
            await item.dbProduct.update({
                stock: item.dbProduct.stock - item.cantidad
            }, { transaction: t });
        }

        // Si todo anduvo perfecto, confirmamos los cambios en PostgreSQL
        await t.commit();

        res.status(201).json({
            mensaje: '¡Pedido registrado con éxito! El stock ha sido actualizado.',
            orderId: order.id,
            total: order.total
        });

    } catch (error) {
        // Si hubo algún error insospechado, revertimos todo
        await t.rollback();
        res.status(500).json({ 
            mensaje: 'Error grave al procesar tu pedido', 
            error: error.message 
        });
    }
});

// ==========================================
// OBTENER TODAS LAS ÓRDENES (GET /api/orders)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const orders = await Order.findAll({ 
            include: [
                { model: Payment },
                { 
                    model: OrderItem, 
                    as: 'items',
                    include: [{ model: Product, as: 'producto' }] 
                }
            ]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// OBTENER DETALLE DE UNA ORDEN (GET /api/orders/:id)
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, { 
            include: [
                { model: Payment },
                { 
                    model: OrderItem, 
                    as: 'items',
                    include: [{ model: Product, as: 'producto' }] 
                }
            ]
        });
        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// ACTUALIZAR ESTADO DE UNA ORDEN (PUT /api/orders/:id)
// ==========================================
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