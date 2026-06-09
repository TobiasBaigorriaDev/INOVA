import React, { useState, useEffect } from 'react';
import { PackagePlus, Trash2, LayoutDashboard, Image as ImageIcon, Package, AlertCircle, CheckCircle, DollarSign, TrendingUp, ShoppingBag, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import './Admin.css';

function Admin() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Estados para las métricas de ventas
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Estado para expandir el detalle de una orden
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Estado para mostrar/ocultar el panel de estadísticas y métricas
  const [showMetrics, setShowMetrics] = useState(true);

  // Estado para mostrar/ocultar los productos más vendidos
  const [showMostSold, setShowMostSold] = useState(false);

  // Estado para mostrar/ocultar el desglose de ventas diarias del mes actual
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);

  // Estado para el mes y año seleccionado (formato YYYY-MM)
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${month}`;
  });

  // Funciones auxiliares para el carrusel de navegación del mes
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    const [year, month] = selectedMonthYear.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth === 0) {
      newMonth = 12;
      newYear = year - 1;
    }
    setSelectedMonthYear(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    const today = new Date();
    const currentM = today.getMonth() + 1;
    const currentY = today.getFullYear();
    const [year, month] = selectedMonthYear.split('-').map(Number);
    
    // Si ya estamos en el mes actual o posterior, no avanzamos
    if (year > currentY || (year === currentY && month >= currentM)) {
      return;
    }
    
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth === 13) {
      newMonth = 1;
      newYear = year + 1;
    }
    setSelectedMonthYear(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const isCurrentMonth = () => {
    const today = new Date();
    const currentM = today.getMonth() + 1;
    const currentY = today.getFullYear();
    const [year, month] = selectedMonthYear.split('-').map(Number);
    return year > currentY || (year === currentY && month >= currentM);
  };

  const formatSelectedMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const date = new Date(year, month - 1);
    const monthName = date.toLocaleString('es-AR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'pulsera',
    imagenUrl: '',
    stock: ''
  });

  const apiUrl = 'http://localhost:3000/api/products';

  useEffect(() => {
    fetchProductos();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch('http://localhost:3000/api/orders');
      if (!res.ok) throw new Error('Error al obtener órdenes');
      const data = await res.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error al cargar las órdenes:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // --- CÁLCULO DE MÉTRICAS ---
  const paidOrders = orders.filter(order => order.status === 'pagado');
  const totalSalesVal = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Obtener año y mes a partir de selectedMonthYear (YYYY-MM)
  const [selYear, selMonth] = selectedMonthYear.split('-').map(Number);

  const monthlyOrders = paidOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === (selMonth - 1) && orderDate.getFullYear() === selYear;
  });
  const monthlySalesVal = monthlyOrders.reduce((sum, order) => sum + Number(order.total), 0);

  const totalOrdersCount = paidOrders.length;
  const monthlyOrdersCount = monthlyOrders.length;

  // --- CÁLCULO DE VENTAS DIARIAS ---
  const getDailySalesBreakdown = () => {
    const daysInMonth = {};
    
    monthlyOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const day = date.getDate(); // 1 - 31
      
      if (!daysInMonth[day]) {
        daysInMonth[day] = {
          day: day,
          count: 0,
          revenue: 0
        };
      }
      daysInMonth[day].count += 1;
      daysInMonth[day].revenue += Number(order.total);
    });
    
    return Object.values(daysInMonth).sort((a, b) => a.day - b.day);
  };

  const dailySales = getDailySalesBreakdown();

  // Productos con bajo stock (3 unidades o menos)
  const lowStockProducts = productos.filter(p => p.stock !== undefined && Number(p.stock) <= 3);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // --- CÁLCULO DE PRODUCTOS MÁS VENDIDOS ---
  const getMostSoldProducts = () => {
    const productSales = {};

    paidOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const productId = item.productId;
          const qty = Number(item.cantidad);
          
          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              nombre: item.producto?.nombre || 'Producto eliminado',
              imagenUrl: item.producto?.imagenUrl || 'https://via.placeholder.com/50',
              precio: Number(item.precioUnitario),
              cantidadVendida: 0,
              recaudado: 0
            };
          }
          
          productSales[productId].cantidadVendida += qty;
          productSales[productId].recaudado += qty * Number(item.precioUnitario);
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5); // Tomar los 5 más vendidos
  };

  const mostSoldProducts = getMostSoldProducts();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}?limit=100`);
      if (!res.ok) throw new Error('Error al obtener productos');
      const data = await res.json();
      setProductos(data.productos || data || []);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar los productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTableFieldChange = (id, field, value, isOrder = false) => {
    if (isOrder) {
      setOrders(prev => prev.map(o => {
        if (o.id === id) {
          return { ...o, [field]: value };
        }
        return o;
      }));
    } else {
      setProductos(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      }));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Error al actualizar el estado del pedido');

      showToast('¡Estado del pedido actualizado!');
      fetchOrders(); // Recargar órdenes para actualizar métricas e historial
      fetchProductos(); // Recargar productos porque el stock puede haber cambiado
    } catch (error) {
      console.error(error);
      showToast('Error al actualizar el estado', 'error');
    }
  };

  const handleTableSave = async (producto) => {
    try {
      const payload = {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        categoria: producto.categoria,
        imagenUrl: producto.imagenUrl,
        stock: Number(producto.stock)
      };

      const res = await fetch(`${apiUrl}/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al actualizar el producto');

      showToast('¡Inventario actualizado con éxito!');
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al actualizar el inventario', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        precio: Number(formData.precio),
        stock: Number(formData.stock)
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al crear el producto');

      showToast('Producto creado exitosamente');
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'pulsera',
        imagenUrl: '',
        stock: ''
      });
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al crear producto', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const res = await fetch(`${apiUrl}/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar el producto');

      showToast('Producto eliminado');
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar producto', 'error');
    }
  };

  const handleSeedDemoData = async (isRegen = false) => {
    const msg = isRegen 
      ? '¿Quieres resetear las ventas simuladas actuales y generar otro conjunto aleatorio de ventas de prueba?' 
      : '¿Quieres insertar datos de ventas de demostración aleatorias para ver cómo se comportan las estadísticas y el historial?';
    if (!window.confirm(msg)) return;

    try {
      showToast('Generando ventas simuladas...', 'info');
      const res = await fetch('http://localhost:3000/api/orders/seed-demo', {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Error al generar datos de prueba');
      const data = await res.json();
      showToast(data.mensaje || '¡Datos simulados cargados!');
      
      // Recargar datos
      fetchOrders();
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al simular ventas', 'error');
    }
  };

  const handleClearDemoData = async () => {
    if (!window.confirm('¿Quieres apagar el modo simulación? Se eliminarán todas las ventas demo y volverás a tus datos reales.')) return;

    try {
      showToast('Apagando simulación...', 'info');
      const res = await fetch('http://localhost:3000/api/orders/seed-demo', {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al limpiar datos demo');
      const data = await res.json();
      showToast(data.mensaje || '¡Modo simulación desactivado!');
      
      // Recargar datos
      fetchOrders();
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al desactivar simulación', 'error');
    }
  };

  const isDemoActive = orders.some(o => o.email?.endsWith('@demo.inova.com'));

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title font-serif">Panel de Administración</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isDemoActive ? (
            <>
              <button 
                onClick={() => handleSeedDemoData(true)}
                className="seed-demo-btn seed-regen-btn"
              >
                <TrendingUp size={16} />
                Regenerar Demo Aleatoria
              </button>
              <button 
                onClick={handleClearDemoData}
                className="clear-demo-btn"
              >
                <Trash2 size={16} />
                Apagar Demo
              </button>
            </>
          ) : (
            <button 
              onClick={() => handleSeedDemoData(false)}
              className="seed-demo-btn"
            >
              <TrendingUp size={16} />
              Simular Ventas Demo
            </button>
          )}
          <button 
            onClick={() => setShowMetrics(prev => !prev)}
            className="toggle-metrics-btn"
          >
            <TrendingUp size={16} />
            {showMetrics ? 'Ocultar Estadísticas' : 'Ver Estadísticas de Ventas'}
            {showMetrics ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ALERTA DE STOCK BAJO (SIEMPRE VISIBLE SI HAY POCO STOCK) */}
      {lowStockProducts.length > 0 && (
        <div className="admin-stock-alert">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Los siguientes productos están con poco stock (3 unidades o menos):</strong>
            <div className="alert-badges">
              {lowStockProducts.map(p => (
                <span key={p.id} className="alert-badge">
                  {p.nombre} ({p.stock === 0 ? 'Sin stock' : `${p.stock} uds.`})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PANEL DE ESTADÍSTICAS Y MÉTRICAS COLAPSABLE */}
      <div className={`admin-metrics-wrapper ${showMetrics ? 'expanded' : 'collapsed'}`}>
        {/* SECCIÓN DE MÉTRICAS DENTRO DEL PANEL */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper sales-total">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Ventas Totales</span>
              <h3 className="stat-value">
                ${totalSalesVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="stat-subtext">{totalOrdersCount} pedidos confirmados</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper sales-month">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info" style={{ flex: 1 }}>
              <span className="stat-label">Ventas del Mes</span>
              
              {/* Carrusel del Mes (Navegación con flechas) */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  marginBottom: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{
                    background: '#f3eef7',
                    border: '1px solid rgba(90, 64, 107, 0.15)',
                    color: '#5A406B',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  title="Mes anterior"
                >
                  ◀
                </button>
                <span 
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#333',
                    minWidth: '95px',
                    textAlign: 'center',
                    userSelect: 'none'
                  }}
                >
                  {formatSelectedMonth()}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth()}
                  style={{
                    background: isCurrentMonth() ? '#f5f5f5' : '#f3eef7',
                    border: '1px solid rgba(90, 64, 107, 0.15)',
                    color: isCurrentMonth() ? '#cccccc' : '#5A406B',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isCurrentMonth() ? 'default' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    outline: 'none',
                    opacity: isCurrentMonth() ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  title="Mes siguiente"
                >
                  ▶
                </button>
              </div>

              <h3 className="stat-value">
                ${monthlySalesVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="stat-subtext">{monthlyOrdersCount} pedidos confirmados</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper orders-count">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pedidos del Mes</span>
              <h3 className="stat-value">{monthlyOrdersCount}</h3>
              <span className="stat-subtext">Confirmados y pagados</span>
            </div>
          </div>

          <div 
            className={`stat-card ${showDailyBreakdown ? 'active' : ''}`}
            onClick={() => setShowDailyBreakdown(prev => !prev)}
            style={{ 
              cursor: 'pointer', 
              flexDirection: 'column', 
              alignItems: 'stretch',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="stat-icon-wrapper average-ticket">
                <Calendar size={24} />
              </div>
              <div className="stat-info" style={{ flex: 1 }}>
                <span className="stat-label">Desglose Diario</span>
                <h3 className="stat-value" style={{ textTransform: 'capitalize' }}>
                  {new Date(selYear, selMonth - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                </h3>
                <span className="stat-subtext" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{showDailyBreakdown ? 'Ocultar detalle' : 'Ver detalle diario'}</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#5A406B' }}>
                    {showDailyBreakdown ? '▲' : '▼'}
                  </span>
                </span>
              </div>
            </div>

            {/* Desglose diario colapsable */}
            {showDailyBreakdown && (
              <div 
                className="daily-sales-breakdown"
                onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer scroll o clic en el listado
                style={{
                  marginTop: '15px',
                  borderTop: '1px solid #f0f0f0',
                  paddingTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {dailySales.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '10px 0' }}>
                    No hay ventas registradas este mes.
                  </span>
                ) : (
                  dailySales.map(ds => (
                    <div 
                      key={ds.day} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '12px', 
                        color: '#444',
                        padding: '6px 4px',
                        borderBottom: '1px dashed #f5f5f5'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>Día {ds.day}</span>
                      <span style={{ color: '#5A406B' }}>
                        <strong>{ds.count} {ds.count === 1 ? 'venta' : 'ventas'}</strong> (${ds.revenue.toFixed(2)})
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN ANALÍTICA: PRODUCTOS MÁS VENDIDOS (COLAPSABLE) */}
        <div className="analytics-card most-sold-card">
          <button 
            type="button"
            className="most-sold-toggle-header"
            onClick={() => setShowMostSold(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              padding: '0 0 15px 0',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              outline: 'none',
              color: 'inherit',
              textAlign: 'left'
            }}
          >
            <h2 className="admin-form-title font-serif" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={24} />
              Productos Más Vendidos
            </h2>
            {showMostSold ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <div className={`most-sold-content-wrapper ${showMostSold ? 'expanded' : 'collapsed'}`}>
            {loadingOrders ? (
              <div className="empty-state" style={{ marginTop: '15px' }}><p>Cargando estadísticas de productos...</p></div>
            ) : mostSoldProducts.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '15px' }}>
                <Package size={48} strokeWidth={1} />
                <p>No se registran ventas para clasificar productos aún.</p>
              </div>
            ) : (
              <div className="most-sold-list" style={{ marginTop: '15px' }}>
                {mostSoldProducts.map((prod, index) => {
                  const maxQty = mostSoldProducts[0].cantidadVendida;
                  const percentage = (prod.cantidadVendida / maxQty) * 100;

                  return (
                    <div key={prod.id} className="most-sold-item">
                      <div className="ranking-number">#{index + 1}</div>
                      <div className="most-sold-img-container">
                        <img src={prod.imagenUrl} alt={prod.nombre} />
                      </div>
                      <div className="most-sold-info">
                        <div className="most-sold-header">
                          <span className="most-sold-name">{prod.nombre}</span>
                          <span className="most-sold-qty">{prod.cantidadVendida} uds.</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="most-sold-revenue">
                          Recaudado total: <strong>${prod.recaudado.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-form-section">
          <h2 className="admin-form-title font-serif">
            <PackagePlus size={24} />
            Agregar Producto
          </h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Pulsera Ónix" />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required placeholder="Detalles sobre el diseño y materiales..." />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Precio ($)</label>
                <input type="number" name="precio" value={formData.precio} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" placeholder="0" />
              </div>
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} required>
                <option value="pulsera">Pulsera</option>
                <option value="collar">Collar</option>
                <option value="aro">Aros</option>
                <option value="anillo">Anillo</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>

            <div className="form-group">
              <label>URL de la Imagen</label>
              <input
                type="url"
                name="imagenUrl"
                value={formData.imagenUrl}
                onChange={handleChange}
                placeholder="https://res.cloudinary.com/..."
                style={{ padding: '14px 18px', border: '1px solid #e0e0e0', borderRadius: '12px', fontSize: '15px', backgroundColor: '#fcfcfc' }}
              />
              {formData.imagenUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eeeeee' }}>
                    <img src={formData.imagenUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#27ae60', fontWeight: 'bold' }}>✓ Imagen lista</span>
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn">Guardar Producto</button>
          </form>
        </div>

        <div className="admin-list-section">
          <h2 className="admin-form-title font-serif" style={{ marginBottom: '30px' }}>
            <LayoutDashboard size={24} />
            Inventario
          </h2>

          <div className="products-table-container">
            {loading ? (
              <div className="empty-state"><p>Cargando productos...</p></div>
            ) : productos.length === 0 ? (
              <div className="empty-state">
                <Package size={48} strokeWidth={1} />
                <p>No hay productos en la base de datos.</p>
              </div>
            ) : (
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre y Categoría</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <div className="table-img-container">
                          {producto.imagenUrl ? <img src={producto.imagenUrl} alt={producto.nombre} /> : <ImageIcon size={24} color="#ccc" />}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input type="text" value={producto.nombre || ''} onChange={(e) => handleTableFieldChange(producto.id, 'nombre', e.target.value)} style={{ width: '145px', padding: '8px', border: '1px solid #dddddd', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }} />
                          <span className={`badge badge-${producto.categoria}`} style={{ alignSelf: 'flex-start' }}>{producto.categoria}</span>
                        </div>
                      </td>
                      <td>
                        <textarea value={producto.descripcion || ''} onChange={(e) => handleTableFieldChange(producto.id, 'descripcion', e.target.value)} style={{ width: '190px', height: '55px', padding: '8px', border: '1px solid #dddddd', borderRadius: '8px', fontSize: '13px', resize: 'none' }} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>$</span>
                          <input type="number" value={producto.precio !== undefined ? producto.precio : ''} onChange={(e) => handleTableFieldChange(producto.id, 'precio', e.target.value)} style={{ width: '85px', padding: '8px', border: '1px solid #dddddd', borderRadius: '8px', fontSize: '14px' }} step="0.01" min="0" />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            value={producto.stock !== undefined ? producto.stock : ''} 
                            onChange={(e) => handleTableFieldChange(producto.id, 'stock', e.target.value)} 
                            style={{ 
                              width: '70px', 
                              padding: '8px', 
                              border: Number(producto.stock) <= 3 ? '1px solid #ff4d4f' : '1px solid #dddddd', 
                              borderRadius: '8px', 
                              fontSize: '14px', 
                              textAlign: 'center',
                              backgroundColor: Number(producto.stock) <= 3 ? '#fff2f0' : 'white',
                              fontWeight: Number(producto.stock) <= 3 ? '600' : 'normal',
                              color: Number(producto.stock) <= 3 ? '#ff4d4f' : 'inherit'
                            }} 
                            min="0" 
                          />
                          <span style={{ fontSize: '13px', color: '#888' }}>uds.</span>
                          {Number(producto.stock) <= 3 && (
                            <AlertCircle 
                              size={18} 
                              color="#ff4d4f" 
                              title="Poco stock - ¡Necesita reponer!" 
                              style={{ flexShrink: 0, animation: 'pulseRed 1.5s infinite' }} 
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <button onClick={() => handleTableSave(producto)} style={{ marginRight: '16px', backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Guardar</button>
                        <button className="delete-btn" onClick={() => handleDelete(producto.id)} title="Eliminar"><Trash2 size={16} /> Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE HISTORIAL DE VENTAS */}
      <div className="admin-history-section">
        <h2 className="admin-form-title font-serif" style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          <ShoppingBag size={24} />
          Historial de Ventas y Pedidos
        </h2>

        <div className="products-table-container">
          {loadingOrders ? (
            <div className="empty-state"><p>Cargando historial de ventas...</p></div>
          ) : orders.filter(o => o.status !== 'pendiente').length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>No se registran ventas confirmadas en el historial aún.</p>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Método de Pago</th>
                  <th>Monto Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {[...orders]
                  .reverse()
                  .filter((order) => order.status !== 'pendiente')
                  .map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => toggleOrderExpand(order.id)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      className={expandedOrderId === order.id ? 'row-expanded' : ''}
                    >
                      <td style={{ fontWeight: '700', color: '#5A406B' }}>#{order.id}</td>
                      <td style={{ fontSize: '13px', color: '#555' }}>
                        {new Date(order.createdAt).toLocaleDateString('es-AR')} - {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: '#333' }}>{order.nombreCliente} {order.apellidoCliente}</span>
                          <span style={{ fontSize: '12px', color: '#888' }}>{order.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-payment-${order.metodoPago || 'efectivo'}`}>
                          {order.metodoPago === 'mercadolibre' ? 'Mercado Pago' : order.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: '#5A406B' }}>${Number(order.total).toFixed(2)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={order.status} 
                          onChange={(e) => handleTableFieldChange(order.id, 'status', e.target.value, true)}
                          className={`status-select status-${order.status}`}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                          style={{
                            backgroundColor: '#5A406B',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          Actualizar
                        </button>
                      </td>
                    </tr>

                    {/* Fila Detalle del Pedido Expandible */}
                    {expandedOrderId === order.id && (
                      <tr className="expanded-detail-row">
                        <td colSpan={7}>
                          <div className="order-items-detail-container">
                            <h4 className="detail-title">Productos Comprados (Pedido #{order.id})</h4>
                            <div className="detail-items-list">
                              {order.items && order.items.map((item) => (
                                <div key={item.id} className="detail-item-card">
                                  <div className="detail-item-img-container">
                                    <img src={item.producto?.imagenUrl || 'https://via.placeholder.com/60'} alt={item.producto?.nombre} />
                                  </div>
                                  <div className="detail-item-info">
                                    <span className="item-name">{item.producto?.nombre || 'Producto eliminado'}</span>
                                    <span className="item-price">${Number(item.precioUnitario).toFixed(2)} c/u</span>
                                  </div>
                                  <div className="detail-item-qty">
                                    <span>{item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'}</span>
                                  </div>
                                  <div className="detail-item-total">
                                    <span>Subtotal: ${(item.cantidad * Number(item.precioUnitario)).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Admin;