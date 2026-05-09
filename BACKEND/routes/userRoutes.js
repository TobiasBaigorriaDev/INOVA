const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt'); // Importamos la librería de seguridad

// RUTA DE REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // 1. Encriptar la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const passwordHasheado = await bcrypt.hash(password, salt);

        // 2. Crear el usuario con la contraseña protegida
        const nuevoUsuario = new User({
            nombre,
            email,
            password: passwordHasheado
        });

        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario registrado con seguridad' });
    } catch (error) {
        res.status(400).json({ mensaje: 'Error al registrar', error });
    }
});

// RUTA DE LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar si el usuario existe
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // 2. Comparar la contraseña escrita con la que está en la base de datos
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        res.status(200).json({ mensaje: 'Bienvenida a Inova', usuario });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
});

module.exports = router;