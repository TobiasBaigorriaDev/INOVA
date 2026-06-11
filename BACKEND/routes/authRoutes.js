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
                mensaje: 'Nombre, email y contraseña son obligatorios'
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

        // Verificar si el email está en la lista de ADMIN_EMAILS del .env
        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
        const esEmailAdmin = adminEmails.includes(email.trim().toLowerCase());
        const rol = esEmailAdmin ? 'ADMIN_ROLE' : 'USER_ROLE';

        // Crear usuario
        const nuevoUsuario = await User.create({
            nombre,
            email,
            password: passwordHasheado,
            rol
        });

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
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
                mensaje: 'Email y contraseña son obligatorios'
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

        // Auto-upgrade a admin si el email está en ADMIN_EMAILS y era USER_ROLE
        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
        if (adminEmails.includes(usuario.email.trim().toLowerCase()) && usuario.rol !== 'ADMIN_ROLE') {
            await usuario.update({ rol: 'ADMIN_ROLE' });
            console.log(`[Auto-Upgrade] Rol de usuario ${usuario.email} actualizado a ADMIN_ROLE`);
        }

        // Comparar password
        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordCorrecta) {

            return res.status(400).json({
                mensaje: 'Contraseña incorrecta'
            });

        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET || 'inova_secure_fallback_secret_key_2026',
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
console.log(error);

    res.status(500).json({
        mensaje: 'Error al iniciar sesión',
        error: error.message
    });

    }

});

// ============================
// LOGIN CON GOOGLE
// ============================

router.post('/google', async (req, res) => {
    try {
        const { nombre, email, foto } = req.body;

        // Buscar si el usuario ya existe
        let usuario = await User.findOne({ where: { email } });

        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());

        if (!usuario) {
            // Si no existe, lo creamos con una contraseña aleatoria
            const randomPassword = Math.random().toString(36).slice(-10);
            const salt = await bcrypt.genSalt(10);
            const passwordHasheado = await bcrypt.hash(randomPassword, salt);

            const esEmailAdmin = adminEmails.includes(email.trim().toLowerCase());
            const rol = esEmailAdmin ? 'ADMIN_ROLE' : 'USER_ROLE';

            usuario = await User.create({
                nombre,
                email,
                password: passwordHasheado,
                rol
            });
        } else {
            // Auto-upgrade a admin si el email está en ADMIN_EMAILS y era USER_ROLE
            if (adminEmails.includes(usuario.email.trim().toLowerCase()) && usuario.rol !== 'ADMIN_ROLE') {
                await usuario.update({ rol: 'ADMIN_ROLE' });
                console.log(`[Google Auto-Upgrade] Rol de usuario ${usuario.email} actualizado a ADMIN_ROLE`);
            }
        }

        // Generar JWT válido
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET || 'inova_secure_fallback_secret_key_2026',
            {
                expiresIn: '2h'
            }
        );

        res.status(200).json({
            mensaje: 'Login con Google exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                foto
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: 'Error al iniciar sesión con Google',
            error: error.message
        });
    }
});

// ============================
// VERIFY / REFRESH SESSION
// ============================
const validarJWT = require('../middlewares/authMiddleware');
router.get('/verify', validarJWT, async (req, res) => {
    try {
        const usuario = await User.findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        // Auto-upgrade a admin si el email está en ADMIN_EMAILS y era USER_ROLE
        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
        if (adminEmails.includes(usuario.email.trim().toLowerCase()) && usuario.rol !== 'ADMIN_ROLE') {
            await usuario.update({ rol: 'ADMIN_ROLE' });
            console.log(`[Verify Auto-Upgrade] Rol de usuario ${usuario.email} actualizado a ADMIN_ROLE`);
        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET || 'inova_secure_fallback_secret_key_2026',
            {
                expiresIn: '2h'
            }
        );

        res.status(200).json({
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al verificar sesión',
            error: error.message
        });
    }
});

module.exports = router;