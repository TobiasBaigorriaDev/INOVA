const express = require('express');
const router = express.Router();
const Product = require('../models/Products');

// OBTENER TODOS LOS PRODUCTOS (GET)
// Ruta: GET /api/products
router.get('/', async (req, res) => {
    try {
        const productos = await Product.find();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los productos', error });
    }
});

// CREAR UN NUEVO PRODUCTO (POST)
// Ruta: POST /api/products
router.post('/', async (req, res) => {
    try {
        const nuevoProducto = new Product(req.body);
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear el producto', error });
    }
});

// ELIMINAR UN PRODUCTO (DELETE)
// Ruta: DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const productoEliminado = await Product.findByIdAndDelete(req.params.id);
        if (!productoEliminado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.status(200).json({ mensaje: 'Producto eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el producto', error });
    }
});

module.exports = router;