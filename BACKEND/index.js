// 1. Traemos las herramientas que instalamos
require('dotenv').config({ override: true }); // Lee el archivo .env y fuerza su uso
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 
const { connectSQL } = require('./config/dbSQL');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// 2. Importamos las Rutas (Controllers)
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

// 3. Levantamos la persiana del negocio (inicializamos Express)
const app = express();

// 4. Ejecutamos la conexión a la base de datos
connectDB();
connectSQL();

// 5. Middlewares (los "patovicas" de la entrada)
app.use(cors()); // Permite la comunicación con el frontend
app.use(express.json()); // Permite leer datos en formato JSON

// 6. Rutas de la Aplicación
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡El servidor de Inova está arriba y corriendo!');
});

// Enchufamos las rutas de Usuarios (Registro y Login)
app.use('/api/users', userRoutes);

// Enchufamos las rutas de Productos (Pulseras y Collares)
app.use('/api/products', productRoutes);

app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// 7. Ponemos el servidor a escuchar peticiones
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`✨ Las rutas de Usuarios y Productos están listas`);
});