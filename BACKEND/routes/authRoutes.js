const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');


router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        //si no tiene alguno tira error 
        if (!email || !password || !nombre) {
            return res.status(400).json({ mensaje: 'Nombre, email y password son obligatorios' });
        }

        // si existe el mail
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHasheado = await bcrypt.hash(password, salt);

        await User.create({ nombre, email, password: passwordHasheado });

        res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar', error: error.message });
    }
});

module.exports = router;