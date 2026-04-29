const mongoose = require('mongoose');

// Definimos la "forma" que van a tener nuestros usuarios en la base de datos
const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true // No deja que dos personas se registren con el mismo mail
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    rol: {
        type: String,
        enum: ['ADMIN_ROLE', 'USER_ROLE'], // Solo permitimos estos dos valores
        default: 'USER_ROLE'
    },
    estado: {
        type: Boolean,
        default: true // Para poder "borrar" un usuario sin sacarlo de la DB
    }
}, {
    timestamps: true // Esto nos crea automáticamente la fecha de creación y actualización
});

module.exports = mongoose.model('User', UserSchema);