const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('inova_sql', 'postgres', 'Jamesita013', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

const connectSQL = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('🐘 Base de datos PostgreSQL conectada con éxito');
    } catch (error) {
        console.error('Error conectando a PostgreSQL:', error);
    }
};

module.exports = { sequelize, connectSQL };