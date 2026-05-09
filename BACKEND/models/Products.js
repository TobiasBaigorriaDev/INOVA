const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: [true, 'El nombre del producto es obligatorio'] 
    },
    descripcion: { 
        type: String, 
        required: [true, 'La descripción es obligatoria'] 
    },
    precio: { 
        type: Number, 
        required: [true, 'El precio es obligatorio'] 
    },
    categoria: { 
        type: String, 
        enum: ['pulsera', 'collar'], 
        required: [true, 'Debe elegir una categoría: pulsera o collar'] 
    },
    imagenUrl: { 
        type: String,
        default: '' // Base lista para cuando subamos las fotos
    },
    stock: { 
        type: Number, 
        default: 0 
    }
}, { 
    timestamps: true // Crea createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Product', productSchema);