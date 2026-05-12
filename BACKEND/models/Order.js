const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbSQL');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING, // id del usuario de Mongo 
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pendiente', 'pagado', 'enviado', 'entregado'),
        defaultValue: 'pendiente'
    }
});

module.exports = Order;