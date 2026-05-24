const express = require('express');
const router = express.Router();
const Product = require('../models/Products');

const multer = require('multer');
const path = require('path');

//multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'), false);
    }
};

const upload = multer({ storage, fileFilter });
// Ruta: GET /api/products
router.get('/', async (req, res) => {
    try {
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