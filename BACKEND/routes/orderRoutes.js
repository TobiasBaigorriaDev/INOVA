const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Products');
const { sequelize } = require('../config/dbSQL');
const validarJWT = require('../middlewares/authMiddleware');
const esAdmin = require('../middlewares/adminMiddleware');

// Webhook de n8n para enviar mail automático cuando se registra una compra
const N8N_ORDER_WEBHOOK_URL = process.env.N8N_ORDER_WEBHOOK_URL || 'http://localhost:5678/webhook/inova-compra';

// ==========================================
// CREAR UN PEDIDO (POST /api/orders)
// Protegido con JWT
// ==========================================
router.post('/', validarJWT, async (req, res) => {
    // Iniciamos una transacción para asegurar que la base de datos se mantenga consistente
    const t = await sequelize.transaction();

    try {
        const { email, nombreCliente, apellidoCliente, diaEncuentro, horaEncuentro, metodoPago, cartItems, cryptoTxId, cryptoNetwork } = req.body;
        const userId = req.usuario.id; // Extraemos el ID seguro del token de sesión

        // Validación para método cripto
        if (metodoPago === 'cripto' && (!cryptoTxId || !cryptoTxId.trim())) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El Hash de la transacción (TXID) es obligatorio para el pago con criptomonedas' });
        }

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
            metodoPago,
            cryptoTxId: metodoPago === 'cripto' ? cryptoTxId.trim() : null,
            cryptoNetwork: metodoPago === 'cripto' ? cryptoNetwork : null
        }, { transaction: t });

        // 4. Crear los detalles de productos (OrderItem) y restar el stock (si no es Mercado Pago)
        for (const item of itemsToCreate) {
            // Guardamos el detalle
            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            }, { transaction: t });

            // Descontamos stock del producto inmediatamente SOLO si no es Mercado Pago (mercadolibre)
            if (metodoPago !== 'mercadolibre') {
                await item.dbProduct.update({
                    stock: item.dbProduct.stock - item.cantidad
                }, { transaction: t });
            }
        }

        // Si todo anduvo perfecto, confirmamos los cambios en PostgreSQL
        await t.commit();

        // Enviamos los datos de la compra a n8n para disparar el mail automático.
        // Importante: si n8n falla, NO rompemos la compra.
        try {
            await fetch(N8N_ORDER_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id,
                    email,
                    nombreCliente,
                    apellidoCliente,
                    diaEncuentro,
                    horaEncuentro,
                    metodoPago,
                    cryptoTxId: order.cryptoTxId,
                    cryptoNetwork: order.cryptoNetwork,
                    subtotal,
                    costoEnvio,
                    total: totalFinal,
                    status: order.status,
                    productos: itemsToCreate.map(item => ({
                        productId: item.productId,
                        nombre: item.dbProduct.nombre,
                        cantidad: item.cantidad,
                        precioUnitario: item.precioUnitario
                    }))
                })
            });

            console.log(`[n8n] Webhook de compra enviado correctamente para la orden ${order.id}`);
        } catch (webhookError) {
            console.error('[n8n] Error al enviar webhook de compra:', webhookError.message);
        }

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
router.get('/', validarJWT, esAdmin, async (req, res) => {
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
router.get('/:id', validarJWT, esAdmin, async (req, res) => {
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
router.put('/:id', validarJWT, esAdmin, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { status } = req.body;
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'items' }],
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        // Si pasa a 'pagado' y estaba en 'pendiente', descontamos stock si es MP
        if (status === 'pagado' && order.status === 'pendiente') {
            for (const item of order.items) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                    // Solo descontamos si es mercadolibre (ya que los demás ya descontaron stock al crearse)
                    if (order.metodoPago === 'mercadolibre') {
                        const newStock = Math.max(0, product.stock - item.cantidad);
                        await product.update({ stock: newStock }, { transaction: t });
                        console.log(`[Admin PUT] Descontado stock para producto ${product.nombre}. Nuevo stock: ${newStock}`);
                    }
                }
            }
        }

        // Si pasa de 'pendiente' a 'cancelado' y era de un método que SÍ descontó stock al inicio (efectivo, etc.), devolvemos el stock
        if (status === 'cancelado' && order.status === 'pendiente') {
            for (const item of order.items) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                    if (order.metodoPago !== 'mercadolibre') {
                        const newStock = product.stock + item.cantidad;
                        await product.update({ stock: newStock }, { transaction: t });
                        console.log(`[Admin PUT] Devuelto stock para producto ${product.nombre} por cancelación. Nuevo stock: ${newStock}`);
                    }
                }
            }
        }

        await order.update({ status }, { transaction: t });
        await t.commit();
        res.json(order);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// SEED DEMO DATA (POST /api/orders/seed-demo)
// ==========================================
router.post('/seed-demo', validarJWT, esAdmin, async (req, res) => {
    try {
        const User = require('../models/User');

        // 1. Asegurar usuario de prueba
        let defaultUser = await User.findOne({ where: { email: 'admin@inova.com' } });
        if (!defaultUser) {
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedAdminPassword = await bcrypt.hash('demo-password-1234', salt);
            defaultUser = await User.create({
                nombre: 'Administrador INOVA',
                email: 'admin@inova.com',
                password: hashedAdminPassword,
                rol: 'ADMIN_ROLE',
                estado: true
            });
        }

        // 2. Asegurar productos iniciales
        let dbProducts = await Product.findAll();
        if (dbProducts.length === 0) {
            const initialProducts = [
                { nombre: 'Corbatero mega argolla', descripcion: 'Collar corbatero de gamuza, color personalizable, con un mega dije de argolla y detalles plateados en los cierres.', precio: 5000, stock: 4, categoria: 'collar', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779838561/WhatsApp_Image_2026-05-24_at_10.34.53_PM_gyp8is.jpg' },
                { nombre: 'Pulsera medallita de la Virgen', descripcion: 'Pulsera de cristales rosas, perlas blancas y una medallita de la Virgen. Elástica.', precio: 2000, stock: 10, categoria: 'pulsera', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_2_knzxor.jpg' },
                { nombre: 'Gargantilla corazones', descripcion: 'Cadena o gargantilla de corazones en dorado.', precio: 3000, stock: 3, categoria: 'collar', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_1_tcrtmj.jpg' },
                { nombre: 'Pulsera de hilo con iniciales', descripcion: 'Pulseras de hilo encerado, con iniciales a elección y corazón rojo. Regulables.', precio: 2000, stock: 50, categoria: 'pulsera', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_3_nlcert.jpg' },
                { nombre: 'Collar Ángel', descripcion: 'Collar o gargantilla doble de perlas y cadena, con doble dije de Hello Kitty y ángel.', precio: 5000, stock: 3, categoria: 'collar', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-02_at_2.17.35_PM_c0fzyt.jpg' },
                { nombre: 'Pulsera estrella', descripcion: 'Pulsera con perlas negras, blancas y grises, con cierre mosquetón y dije de estrella pequeña.', precio: 1800, stock: 8, categoria: 'pulsera', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840640/WhatsApp_Image_2026-05-02_at_2.17.45_PM_dv2zcn.jpg' },
                { nombre: 'Gargantilla cadena multidije', descripcion: 'Collar o gargantilla de cadena ancha de niquel, con dijes de estrellas y colgantes de cadena fina de niquel.', precio: 3500, stock: 10, categoria: 'collar', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840640/WhatsApp_Image_2026-05-24_at_10.34.56_PM_zemjkc.jpg' },
                { nombre: 'Aros Gota', descripcion: 'Aros colgantes, con dije argolla y dije gota plateada, con base de acero quirúrgico.', precio: 2200, stock: 1, categoria: 'aro', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.35_PM_ernkwe.jpg' },
                { nombre: 'Aros flor perladas', descripcion: 'Aros pasantes con micro perlas en forma de flor.', precio: 1800, stock: 20, categoria: 'aro', imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_eeoce7.jpg' }
            ];
            dbProducts = await Product.bulkCreate(initialProducts);
        }

        // Mapear productos
        const productMap = {};
        dbProducts.forEach(p => {
            productMap[p.nombre.toLowerCase().trim()] = p;
        });

        // 3. Eliminar órdenes de demo previas si existen (para resetear limpiamente)
        const { Op } = require('sequelize');
        const oldDemoOrders = await Order.findAll({
            where: {
                email: {
                    [Op.like]: '%@demo.inova.com'
                }
            }
        });

        if (oldDemoOrders.length > 0) {
            const oldDemoIds = oldDemoOrders.map(o => o.id);
            await OrderItem.destroy({ where: { orderId: oldDemoIds } });
            await Order.destroy({ where: { id: oldDemoIds } });
        }

        // 4. Generar datos de órdenes completamente aleatorios
        const nombres = ['Sofía', 'Mateo', 'Valentina', 'Nicolás', 'Camila', 'Lucas', 'Martina', 'Diego', 'Emma', 'Santiago', 'Zoe', 'Bautista', 'Catalina', 'Felipe', 'Delfina'];
        const apellidos = ['Rodríguez', 'Pérez', 'Fernández', 'Gómez', 'Díaz', 'Torres', 'Romero', 'Silva', 'Castro', 'Benítez', 'Soler', 'Peralta', 'Martínez', 'Álvarez', 'Ruiz'];
        const metodos = ['mercadolibre', 'cripto', 'efectivo'];
        const estados = ['pagado', 'pagado', 'pagado', 'pagado', 'pendiente', 'cancelado'];
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const horas = ['10:00', '11:30', '13:00', '14:30', '15:00', '16:30', '17:00', '18:30', '19:00', '20:15'];

        const numOrders = Math.floor(Math.random() * 6) + 8; // Genera entre 8 y 13 órdenes aleatorias

        for (let i = 0; i < numOrders; i++) {
            const nombre = nombres[Math.floor(Math.random() * nombres.length)];
            const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
            const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}@demo.inova.com`;
            const metodoPago = metodos[Math.floor(Math.random() * metodos.length)];
            const status = estados[Math.floor(Math.random() * estados.length)];
            const diaEncuentro = dias[Math.floor(Math.random() * dias.length)];
            const horaEncuentro = horas[Math.floor(Math.random() * horas.length)];

            // Generar fecha aleatoria en los últimos 45 días
            const dateOffset = Math.floor(Math.random() * 45);
            const date = new Date();
            date.setDate(date.getDate() - dateOffset);

            // Elegir entre 1 y 3 productos aleatorios del catálogo
            const numProducts = Math.floor(Math.random() * 3) + 1;
            const selectedItems = [];
            let totalOrder = 0;

            const shuffledProducts = [...dbProducts].sort(() => 0.5 - Math.random());
            for (let j = 0; j < Math.min(numProducts, shuffledProducts.length); j++) {
                const product = shuffledProducts[j];
                const qty = Math.floor(Math.random() * 2) + 1; // 1 o 2 unidades
                selectedItems.push({
                    productId: product.id,
                    qty,
                    precioUnitario: product.precio
                });
                totalOrder += product.precio * qty;
            }

            const order = await Order.create({
                userId: defaultUser.id,
                total: totalOrder,
                status,
                email,
                nombreCliente: nombre,
                apellidoCliente: apellido,
                diaEncuentro,
                horaEncuentro,
                metodoPago,
                createdAt: date
            });

            for (const item of selectedItems) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: item.productId,
                    cantidad: item.qty,
                    precioUnitario: item.precioUnitario
                });
            }
        }

        res.status(201).json({ mensaje: `✅ ¡Base de datos cargada con ${numOrders} ventas aleatorias simuladas!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al seedear datos de prueba aleatorios', detalle: error.message });
    }
});

// ==========================================
// APAGAR DEMO DATA (DELETE /api/orders/seed-demo)
// ==========================================
router.delete('/seed-demo', validarJWT, esAdmin, async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // Buscar todas las órdenes de demo
        const demoOrders = await Order.findAll({
            where: {
                email: {
                    [Op.like]: '%@demo.inova.com'
                }
            }
        });

        if (demoOrders.length > 0) {
            const demoIds = demoOrders.map(o => o.id);
            // Eliminar detalles
            await OrderItem.destroy({ where: { orderId: demoIds } });
            // Eliminar órdenes principales
            await Order.destroy({ where: { id: demoIds } });
        }

        res.json({ mensaje: '✅ ¡Modo simulación desactivado! Los datos demo fueron eliminados.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al desactivar el modo simulación', detalle: error.message });
    }
});

module.exports = router;