const express = require('express');
const router = express.Router();
const Product = require('../models/Products'); // Importamos el modelo que hiciste arriba

// 1. OBTENER todos los productos (Para que el Front los muestre)
router.get('/', async (req, res) => {
    try {
        const productos = await Product.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// 2. CREAR un producto nuevo (Para cuando vos cargues una pulsera)
router.post('/', async (req, res) => {
    const nuevoProducto = new Product(req.body);
    try {
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
    } catch (error) {
        res.status(400).json({ message: "Error al guardar el producto" });
    }
});

module.exports = router;