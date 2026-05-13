const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Le pedimos a mongoose que se conecte usando la URL que guardamos en el .env
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔥 Base de datos MongoDB conectada con éxito');
    } catch (error) {
        console.warn('⚠️  MongoDB no disponible. El backend funciona sin MongoDB.');
        console.warn('   Usa: docker run --name inova-mongo -p 27017:27017 -d mongo');
        console.warn('   O instala MongoDB localmente.');
    }
};

module.exports = connectDB;