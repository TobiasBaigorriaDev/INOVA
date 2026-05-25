const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// ============================
// REGISTER
// ============================

router.post('/register', async (req, res) => {

    try {

        const { nombre, email, password } = req.body;

        // Validar campos
        if (!nombre || !email || !password) {

            return res.status(400).json({
                mensaje: 'Nombre, email y password son obligatorios'
            });

        }

        // Verificar email existente
        const userExists = await User.findOne({
            where: { email }
        });

        if (userExists) {

            return res.status(400).json({
                mensaje: 'El email ya está registrado'
            });

        }

        // Hash password
        const salt = await bcrypt.genSalt(10);

        const passwordHasheado = await bcrypt.hash(
            password,
            salt
        );

        // Crear usuario
        const nuevoUsuario = await User.create({
            nombre,
            email,
            password: passwordHasheado
        });

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email
            }
        });

    } catch (error) {

        res.status(500).json({
            mensaje: 'Error al registrar',
            error: error.message
        });

    }

});


// ============================
// LOGIN
// ============================

router.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {

            return res.status(400).json({
                mensaje: 'Email y password son obligatorios'
            });

        }

        // Buscar usuario
        const usuario = await User.findOne({
            where: { email }
        });

        if (!usuario) {

            return res.status(400).json({
                mensaje: 'Usuario no encontrado'
            });

        }

        // Comparar password
        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordCorrecta) {

            return res.status(400).json({
                mensaje: 'Password incorrecta'
            });

        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        res.status(200).json({

            mensaje: 'Login exitoso',

            token,

            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }

        });

    } catch (error) {

        res.status(500).json({
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });

    }

});

module.exports = router;