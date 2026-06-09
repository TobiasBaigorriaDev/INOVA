require('dotenv').config();
const { connectSQL } = require('./config/dbSQL');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

const run = async () => {
  try {
    await connectSQL();
    console.log('🧹 Limpiando detalles de órdenes (OrderItem)...');
    await OrderItem.destroy({ where: {} });
    
    console.log('🧹 Limpiando órdenes principales (Order)...');
    await Order.destroy({ where: {} });
    
    console.log('✅ Base de datos de pedidos vaciada con éxito. Estadísticas en $0.');
  } catch (error) {
    console.error('❌ Error al vaciar las órdenes:', error);
  } finally {
    process.exit(0);
  }
};

run();
