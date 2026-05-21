const express = require('express');
const router = express.Router();
const Product = require('../models/Products');

// OBTENER TODOS LOS PRODUCTOS (GET)
// Ruta: GET /api/products
router.get('/', async (req, res) => {
    try {
        // En Sequelize usamos findAll
        const productos = await Product.findAll();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los productos', error: error.message });
    }
});

// CREAR UN NUEVO PRODUCTO (POST)
// Ruta: POST /api/products
router.post('/', async (req, res) => {
    try {
        // En Sequelize usamos create
        const productoGuardado = await Product.create(req.body);
        res.status(201).json(productoGuardado);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear el producto', error: error.message });
    }
});

// ELIMINAR UN PRODUCTO (DELETE)
// Ruta: DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        // En Sequelize usamos destroy con un where
        const rowsDeleted = await Product.destroy({ where: { id: req.params.id } });
        if (rowsDeleted === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.status(200).json({ mensaje: 'Producto eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el producto', error: error.message });
    }
});

module.exports = router;