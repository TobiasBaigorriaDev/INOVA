const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbSQL');

// Definimos el modelo de productos en PostgreSQL usando Sequelize
const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: { 
        type: DataTypes.STRING, 
        allowNull: false
    },
    descripcion: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    precio: { 
        type: DataTypes.FLOAT, 
        allowNull: false 
    },
    categoria: { 
        type: DataTypes.ENUM('pulsera', 'collar', 'aro', 'anillo', 'pendiente'), 
        allowNull: false,
        set(value) {
            this.setDataValue('categoria', value.toLowerCase());
        }
    },
    imagenUrl: { 
        type: DataTypes.STRING,
        defaultValue: '' 
    },
    stock: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    }
}, { 
    timestamps: true
});

module.exports = Product;