const jwt = require('jsonwebtoken');

const validarJWT = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                mensaje: 'No hay token'
            });

        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'inova_secure_fallback_secret_key_2026'
        );

        req.usuario = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            mensaje: 'Token inválido'
        });

    }

};

module.exports = validarJWT;