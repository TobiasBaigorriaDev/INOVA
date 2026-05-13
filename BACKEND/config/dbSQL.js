const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.PG_DATABASE || 'inova_sql',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'luli1234',
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
        dialect: 'postgres',
        logging: false
    }
);

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