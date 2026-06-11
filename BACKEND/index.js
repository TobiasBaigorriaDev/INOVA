// 1. Traemos las herramientas que instalamos
const validarJWT = require('./middlewares/authMiddleware');
require('dotenv').config({ override: true }); // Lee el archivo .env y fuerza su uso
const express = require('express');
const cors = require('cors');
const { connectSQL } = require('./config/dbSQL');
// Importamos todos los modelos para que Sequelize los registre
require('./models/User');
require('./models/Products');
require('./models/Order');
require('./models/OrderItem');
require('./models/Payment');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentMPRoutes = require('./routes/paymentMPRoutes');
const chatbotRoutes = require('./routes/chatbot');

// 2. Importamos las Rutas (Controllers)
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

// 3. Levantamos la persiana del negocio (inicializamos Express)
const app = express();

// 4. Ejecutamos la conexión a la base de datos
connectSQL().then(async () => {
    try {
        const User = require('./models/User');
        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
        if (adminEmails.length > 0 && adminEmails[0] !== '') {
            const users = await User.findAll();
            for (const u of users) {
                if (adminEmails.includes(u.email.trim().toLowerCase()) && u.rol !== 'ADMIN_ROLE') {
                    u.rol = 'ADMIN_ROLE';
                    await u.save();
                    console.log(`[Startup Admin Sync] Rol de ${u.email} actualizado a ADMIN_ROLE`);
                }
            }
        }
    } catch (err) {
        console.error('Error al sincronizar administradores en el inicio:', err);
    }
});

// 5. Middlewares 
app.use(cors()); // Permite la comunicación con el frontend
app.use(express.json()); // Permite leer datos en formato JSON
app.use('/api/auth', authRoutes); // Enchufamos las rutas de autenticación (registro y login)

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
app.use('/api/mp', paymentMPRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/private', validarJWT, (req, res) => {

    res.json({
        mensaje: 'Ruta privada funcionando',
        usuario: req.usuario
    });

});

// 7. Ponemos el servidor a escuchar peticiones
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`✨ Las rutas de Usuarios y Productos están listas`);
});