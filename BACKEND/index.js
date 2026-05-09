// 1. Traemos las herramientas que instalamos
require('dotenv').config(); // Lee el archivo .env
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Traemos la función que creamos en el Paso 2

// 2. Levantamos la persiana del negocio (inicializamos Express)
const app = express();

// 3. Ejecutamos la conexión a la base de datos
connectDB();

// 4. Middlewares (los "patovicas" de la entrada)
app.use(cors()); // Deja que tu frontend se comunique con este backend sin que el navegador lo bloquee
app.use(express.json()); // Le enseña a Express a leer datos en formato JSON (lo que manda el frontend)

// 5. Creamos una ruta de prueba para ver que todo ande
app.get('/', (req, res) => {
    res.send('¡El servidor de Inova está arriba y corriendo!');
});

// 6. Ponemos el servidor a escuchar peticiones
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

// Arriba con los otros require:
const productRoutes = require('./routes/productRoutes');

// Abajo, después de conectar la DB:
app.use('/api/products', productRoutes);
