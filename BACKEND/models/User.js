const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbSQL');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('ADMIN_ROLE', 'USER_ROLE'),
        defaultValue: 'USER_ROLE'
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetTokenExpira: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = User;