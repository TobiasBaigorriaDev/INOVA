const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Le pedimos a mongoose que se conecte usando la URL que guardamos en el .env
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔥 Base de datos de Inova conectada con éxito');
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        process.exit(1); // Si hay un error grave, apagamos el servidor
    }
};

module.exports = connectDB;