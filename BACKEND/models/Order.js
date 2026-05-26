const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbSQL');
const User = require('./User'); // Importamos el modelo de Usuario SQL

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER, // Ahora el ID es un INTEGER en PostgreSQL
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pendiente', 'pagado', 'enviado', 'entregado'),
        defaultValue: 'pendiente'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombreCliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apellidoCliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    diaEncuentro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    horaEncuentro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    metodoPago: {
        type: DataTypes.ENUM('tarjeta', 'efectivo', 'mercadolibre', 'cripto'),
        allowNull: false
    }
});

// Relacionar Ordenes con Usuarios
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = Order;