const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Op } = require('sequelize'); // Importamos los operadores de Sequelize
const validarJWT = require('../middlewares/authMiddleware');
const esAdmin = require('../middlewares/adminMiddleware');

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

// GET /api/products (MODIFICADO: Búsqueda, Filtros, Paginación, Ordenamiento y Visibilidad)
router.get('/', async (req, res) => {
    try {
        // 1. Extraemos los parámetros de la URL
        const { search, categoria, precioMin, precioMax, page = 1, limit = 10, sortPrice, includeHidden } = req.query;

        // 2. Armamos el objeto de filtros dinámicamente
        let whereClause = {};

        // Por defecto, excluimos los productos ocultos para clientes normales
        if (includeHidden !== 'true') {
            whereClause.oculto = { [Op.not]: true };
        }

        if (search) {
            const searchTerm = search.trim();
            const searchConditions = [
                { nombre: { [Op.iLike]: `%${searchTerm}%` } }
            ];

            // Si el término termina en 's', buscamos también la versión en singular
            if (searchTerm.toLowerCase().endsWith('s')) {
                const singular1 = searchTerm.slice(0, -1);
                searchConditions.push({ nombre: { [Op.iLike]: `%${singular1}%` } });
                
                if (searchTerm.toLowerCase().endsWith('es')) {
                    const singular2 = searchTerm.slice(0, -2);
                    searchConditions.push({ nombre: { [Op.iLike]: `%${singular2}%` } });
                }
            }

            whereClause[Op.or] = searchConditions;
        }

        if (categoria) {
            whereClause.categoria = categoria;
        }

        if (precioMin || precioMax) {
            whereClause.precio = {};
            if (precioMin) whereClause.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) whereClause.precio[Op.lte] = parseFloat(precioMax);
        }

        // 3. Calculamos la paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 4. Lógica de ordenamiento dinámico
        let orderClause = [['createdAt', 'DESC']]; // Orden por defecto (más nuevos)
        if (sortPrice === 'asc') {
            orderClause = [['precio', 'ASC']]; // Menor a mayor
        } else if (sortPrice === 'desc') {
            orderClause = [['precio', 'DESC']]; // Mayor a menor
        }

        // 5. Consulta a la base de datos
        const { count, rows } = await Product.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: orderClause
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            productos: rows
        });

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

        // Si el producto está oculto, permitimos verlo solo a administradores autenticados
        if (producto.oculto) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            let esAdminUser = false;
            if (token) {
                try {
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                    if (decoded && decoded.rol === 'ADMIN_ROLE') {
                        esAdminUser = true;
                    }
                } catch (e) {
                    // Token inválido o expirado
                }
            }
            if (!esAdminUser) {
                return res.status(404).json({ mensaje: 'Producto no disponible' });
            }
        }

        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
    }
});

// POST /api/products
router.post('/', validarJWT, esAdmin, async (req, res) => {
    try {
        const productoGuardado = await Product.create(req.body);
        res.status(201).json(productoGuardado);
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al crear el producto', error: error.message });
    }
});

// POST /api/products/upload
router.post('/upload', validarJWT, esAdmin, upload.single('imagen'), (req, res) => {
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

const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/image/upload/');
        if (parts.length < 2) return null;

        let publicIdWithFormat = parts[1];
        if (publicIdWithFormat.startsWith('v')) {
            const index = publicIdWithFormat.indexOf('/');
            publicIdWithFormat = publicIdWithFormat.slice(index + 1);
        }

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

// SOFT DELETE / OCULTAR PRODUCTO (DELETE /api/products/:id)
// No elimina de la base de datos ni de Cloudinary para no romper historiales ni ventas
router.delete('/:id', validarJWT, esAdmin, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        await product.update({ oculto: true });
        res.status(200).json({ mensaje: 'Producto ocultado con éxito de la tienda', product });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al ocultar el producto', error: error.message });
    }
});

// ALTERNAR VISIBILIDAD (PATCH /api/products/:id/toggle-oculto)
router.patch('/:id/toggle-oculto', validarJWT, esAdmin, async (req, res) => {
    try {
        const producto = await Product.findByPk(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const nuevoEstado = !producto.oculto;
        await producto.update({ oculto: nuevoEstado });

        res.status(200).json({
            mensaje: nuevoEstado ? 'Producto ocultado con éxito' : 'Producto visible en la tienda',
            producto
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar visibilidad del producto', error: error.message });
    }
});

// ACTUALIZAR UN PRODUCTO (PUT)
router.put('/:id', validarJWT, esAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, imagenUrl, stock, oculto } = req.body;
        const producto = await Product.findByPk(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (precio !== undefined) updateData.precio = precio;
        if (categoria !== undefined) updateData.categoria = categoria;
        if (imagenUrl !== undefined) updateData.imagenUrl = imagenUrl;
        if (stock !== undefined) updateData.stock = stock;
        if (oculto !== undefined) updateData.oculto = Boolean(oculto);

        await producto.update(updateData);

        res.status(200).json({ mensaje: 'Producto actualizado con éxito', producto });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al actualizar el producto', error: error.message });
    }
});

module.exports = router;