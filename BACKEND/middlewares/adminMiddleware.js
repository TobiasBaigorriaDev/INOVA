const esAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(500).json({
            mensaje: 'Se requiere validar el token antes de verificar el rol de administrador'
        });
    }

    if (req.usuario.rol !== 'ADMIN_ROLE') {
        return res.status(403).json({
            mensaje: 'Acceso denegado: se requieren permisos de administrador'
        });
    }

    next();
};

module.exports = esAdmin;
