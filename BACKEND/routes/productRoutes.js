const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//multer con Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'inova_productos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValid = allowedTypes.test(file.mimetype);
    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'), false);
    }
};

const upload = multer({ storage, fileFilter });

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const productos = await Product.findAll();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los productos', error: error.message });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const producto = await Product.findByPk(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    try {
        const productoGuardado = await Product.create(req.body);
        res.status(201).json(productoGuardado);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear el producto', error: error.message });
    }
});

// POST /api/products/upload
router.post('/upload', upload.single('imagen'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se subió ninguna imagen o el formato es inválido' });
        }
        res.status(200).json({
            mensaje: 'Imagen subida con éxito',
            url: req.file.path
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al subir la imagen', error: error.message });
    }
});

// Función para extraer el public_id de una URL de Cloudinary
const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/image/upload/');
        if (parts.length < 2) return null;
        
        let publicIdWithFormat = parts[1];
        // Quitar la versión si existe (ej. v1716584283/)
        if (publicIdWithFormat.startsWith('v')) {
            const index = publicIdWithFormat.indexOf('/');
            publicIdWithFormat = publicIdWithFormat.slice(index + 1);
        }
        
        // Quitar la extensión del archivo (.jpg, .png, etc.)
        const dotIndex = publicIdWithFormat.lastIndexOf('.');
        if (dotIndex !== -1) {
            return publicIdWithFormat.slice(0, dotIndex);
        }
        return publicIdWithFormat;
    } catch (error) {
        console.error('Error al extraer public_id de la URL de Cloudinary:', error);
        return null;
    }
};

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        // Si el producto tiene una imagen de Cloudinary, la eliminamos de la nube
        if (product.imagenUrl) {
            const publicId = getPublicIdFromUrl(product.imagenUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`🧹 Imagen eliminada de Cloudinary: ${publicId}`);
                } catch (cloudinaryError) {
                    console.error('Error al eliminar imagen de Cloudinary:', cloudinaryError);
                    // No bloqueamos la eliminación de la base de datos si falla Cloudinary
                }
            }
        }

        // Eliminamos el producto de la base de datos
        await product.destroy();
        res.status(200).json({ mensaje: 'Producto eliminado con éxito de la base de datos y Cloudinary' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el producto', error: error.message });
    }
});

// ACTUALIZAR UN PRODUCTO (PUT)
// Ruta: PUT /api/products/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, imagenUrl, stock } = req.body;
        const producto = await Product.findByPk(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        await producto.update({
            nombre,
            descripcion,
            precio,
            categoria,
            imagenUrl,
            stock
        });

        res.status(200).json({ mensaje: 'Producto actualizado con éxito', producto });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar el producto', error: error.message });
    }
});

module.exports = router;