const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbSQL');
const Order = require('./Order');
const Product = require('./Products');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'id'
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    precioUnitario: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: true // Esto creará createdAt y updatedAt automáticamente para cada item
});

// Relaciones de base de datos
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'producto' });

module.exports = OrderItem;
