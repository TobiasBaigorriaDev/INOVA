import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, Trash2, Eye, EyeOff, LayoutDashboard, Image as ImageIcon, Package, AlertCircle, CheckCircle, DollarSign, TrendingUp, ShoppingBag, Calendar, ChevronDown, ChevronUp, Clock, CreditCard, Wallet, Coins, MapPin, ExternalLink } from 'lucide-react';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();

  // Referencia a los productos originales para detectar cambios sin guardar y restaurar
  const originalProductosRef = useRef([]);

  // IDs de productos con cambios pendientes de guardar
  const [unsavedProductIds, setUnsavedProductIds] = useState(new Set());
  const hasUnsavedChanges = unsavedProductIds.size > 0;

  // Estado para el modal de cambios sin guardar
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Snapshot de IDs congelados de stock crítico para estabilidad visual
  const [criticalProductIds, setCriticalProductIds] = useState(new Set());

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Estados para las métricas de ventas
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Estado para expandir el detalle de una orden
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Estado para filtro del historial de ventas ('todos', 'efectivo', 'mercadolibre', 'cripto')
  const [orderFilter, setOrderFilter] = useState('todos');

  // Estado para mostrar/ocultar el panel de estadísticas y métricas
  const [showMetrics, setShowMetrics] = useState(true);

  // Estado para mostrar/ocultar los productos más vendidos
  const [showMostSold, setShowMostSold] = useState(false);

  // Estado para mostrar/ocultar el desglose de ventas diarias del mes actual
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);

  // Estado para expandir/contraer el inventario de productos
  const [showInventory, setShowInventory] = useState(true);

  // Estado para filtro del inventario ('todos' | 'critico')
  const [inventoryFilter, setInventoryFilter] = useState('todos');

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
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
  // Ventas válidas: compras confirmadas/pagadas (efectivo, cripto o pagadas con MP) que no hayan sido canceladas.
  // Se excluyen únicamente pedidos cancelados y carritos de Mercado Pago abandonados que quedaron pendientes.
  const validOrders = orders.filter(order => {
    if (order.status === 'cancelado') return false;
    if (order.metodoPago === 'mercadolibre' && order.status === 'pendiente') return false;
    return true;
  });

  const totalSalesVal = validOrders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Obtener año y mes a partir de selectedMonthYear (YYYY-MM)
  const [selYear, selMonth] = selectedMonthYear.split('-').map(Number);

  const monthlyOrders = validOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === (selMonth - 1) && orderDate.getFullYear() === selYear;
  });
  const monthlySalesVal = monthlyOrders.reduce((sum, order) => sum + Number(order.total), 0);

  const totalOrdersCount = validOrders.length;
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

  // Productos a mostrar en la tabla: en vista 'critico' se congela con los IDs de criticalProductIds
  const displayedProductos = inventoryFilter === 'critico' 
    ? productos.filter(p => criticalProductIds.has(p.id)) 
    : productos;

  const handleFilterClick = (newFilter) => {
    if (newFilter === inventoryFilter) return;
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'filter', target: newFilter });
      setShowUnsavedModal(true);
      return;
    }
    if (newFilter === 'critico') {
      const ids = new Set(productos.filter(p => p.stock !== undefined && Number(p.stock) <= 3).map(p => p.id));
      setCriticalProductIds(ids);
    }
    setInventoryFilter(newFilter);
  };

  const handleGoToCriticalStock = () => {
    if (hasUnsavedChanges && inventoryFilter !== 'critico') {
      setPendingNavigation({ type: 'filter', target: 'critico' });
      setShowUnsavedModal(true);
      return;
    }
    if (!hasUnsavedChanges) {
      const ids = new Set(productos.filter(p => p.stock !== undefined && Number(p.stock) <= 3).map(p => p.id));
      setCriticalProductIds(ids);
    }
    setInventoryFilter('critico');
    setShowInventory(true);
    setTimeout(() => {
      const inventoryEl = document.getElementById('admin-inventory-section') || document.querySelector('.admin-list-section');
      if (inventoryEl) {
        const navHeight = 110;
        const topPos = inventoryEl.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Interceptor de navegación interna de React Router cuando hay cambios sin guardar
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLinkClick = (e) => {
      if (e.target.closest('.inova-modal-container')) return;

      const anchor = e.target.closest('a');
      if (anchor && anchor.href) {
        const url = new URL(anchor.href, window.location.origin);
        if (url.origin === window.location.origin && (url.pathname !== window.location.pathname || url.search !== window.location.search)) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation({ type: 'route', target: url.pathname + url.search + url.hash });
          setShowUnsavedModal(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setPendingNavigation({ type: 'back' });
      setShowUnsavedModal(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  const handleModalSaveAndProceed = async () => {
    try {
      setIsSavingModal(true);
      const token = localStorage.getItem('token');
      const modifiedProds = productos.filter(p => unsavedProductIds.has(p.id));

      for (const prod of modifiedProds) {
        const payload = {
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio: Number(prod.precio),
          categoria: prod.categoria,
          imagenUrl: prod.imagenUrl,
          stock: Number(prod.stock)
        };
        await fetch(`${apiUrl}/${prod.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      showToast('¡Cambios de stock guardados con éxito!');
      setUnsavedProductIds(new Set());
      setShowUnsavedModal(false);

      if (pendingNavigation) {
        if (pendingNavigation.type === 'route') {
          navigate(pendingNavigation.target);
        } else if (pendingNavigation.type === 'filter') {
          setInventoryFilter(pendingNavigation.target);
        } else if (pendingNavigation.type === 'back') {
          navigate(-1);
        }
        setPendingNavigation(null);
      }
      fetchProductos();
    } catch (err) {
      console.error('Error al guardar cambios de stock:', err);
      showToast('Error al guardar los cambios', 'error');
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleModalDiscardAndProceed = () => {
    if (originalProductosRef.current && originalProductosRef.current.length > 0) {
      setProductos(JSON.parse(JSON.stringify(originalProductosRef.current)));
    }
    setUnsavedProductIds(new Set());
    setShowUnsavedModal(false);

    if (pendingNavigation) {
      if (pendingNavigation.type === 'route') {
        navigate(pendingNavigation.target);
      } else if (pendingNavigation.type === 'filter') {
        setInventoryFilter(pendingNavigation.target);
      } else if (pendingNavigation.type === 'back') {
        navigate(-1);
      }
      setPendingNavigation(null);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // --- CÁLCULO DE PRODUCTOS MÁS VENDIDOS ---
  const getMostSoldProducts = () => {
    const productSales = {};

    validOrders.forEach(order => {
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

  // Contadores y filtro de órdenes para el historial
  const countTodos = orders.length;
  const countEfectivo = orders.filter(o => !o.metodoPago || o.metodoPago === 'efectivo').length;
  const countMP = orders.filter(o => o.metodoPago === 'mercadolibre').length;
  const countCripto = orders.filter(o => o.metodoPago === 'cripto').length;

  const displayedOrders = orders
    .filter(order => {
      if (orderFilter === 'todos') return true;
      if (orderFilter === 'efectivo') return !order.metodoPago || order.metodoPago === 'efectivo';
      if (orderFilter === 'mercadolibre') return order.metodoPago === 'mercadolibre';
      if (orderFilter === 'cripto') return order.metodoPago === 'cripto';
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}?limit=100&includeHidden=true`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Error al obtener productos');
      const data = await res.json();
      const prodsList = data.productos || data || [];
      setProductos(prodsList);
      originalProductosRef.current = JSON.parse(JSON.stringify(prodsList));
      setUnsavedProductIds(new Set());
      // Congelar IDs que tienen stock crítico al cargar datos
      const criticalIds = new Set(prodsList.filter(p => p.stock !== undefined && Number(p.stock) <= 3).map(p => p.id));
      setCriticalProductIds(criticalIds);
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
      setProductos(prev => {
        const next = prev.map(p => {
          if (p.id === id) {
            return { ...p, [field]: value };
          }
          return p;
        });

        const orig = (originalProductosRef.current || []).find(item => item.id === id);
        const currentProd = next.find(item => item.id === id);
        
        setUnsavedProductIds(prevIds => {
          const newSet = new Set(prevIds);
          if (orig && currentProd && (
            String(orig.nombre || '') !== String(currentProd.nombre || '') ||
            String(orig.descripcion || '') !== String(currentProd.descripcion || '') ||
            Number(orig.precio) !== Number(currentProd.precio) ||
            Number(orig.stock) !== Number(currentProd.stock)
          )) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });

        return next;
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/${producto.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al actualizar el producto');

      showToast('¡Inventario actualizado con éxito!');

      if (originalProductosRef.current) {
        originalProductosRef.current = originalProductosRef.current.map(item => 
          item.id === producto.id ? JSON.parse(JSON.stringify(producto)) : item
        );
      }
      setUnsavedProductIds(prevIds => {
        const newSet = new Set(prevIds);
        newSet.delete(producto.id);
        return newSet;
      });

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

      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  const handleToggleOcultar = async (producto) => {
    const confirmMsg = producto.oculto
      ? `¿Deseas volver a mostrar "${producto.nombre}" en la tienda? Volverá a estar visible para todos los clientes.`
      : `¿Deseas ocultar "${producto.nombre}" de la tienda? Los clientes ya no podrán verlo ni comprarlo, pero no se borrará de tu base de datos ni de tus historiales.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/${producto.id}/toggle-oculto`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Error al cambiar la visibilidad del producto');

      showToast(producto.oculto ? '¡Producto ahora visible en la tienda!' : '¡Producto ocultado con éxito!');
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al modificar la visibilidad del producto', 'error');
    }
  };

  const handleSeedDemoData = async (isRegen = false) => {
    const msg = isRegen 
      ? '¿Quieres resetear las ventas simuladas actuales y generar otro conjunto aleatorio de ventas de prueba?' 
      : '¿Quieres insertar datos de ventas de demostración aleatorias para ver cómo se comportan las estadísticas y el historial?';
    if (!window.confirm(msg)) return;

    try {
      showToast('Generando ventas simuladas...', 'info');
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/orders/seed-demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/orders/seed-demo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        <div className="admin-header-actions">
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
                <span
                  key={p.id}
                  className="alert-badge"
                  role="button"
                  tabIndex={0}
                  onClick={handleGoToCriticalStock}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleGoToCriticalStock();
                    }
                  }}
                  title="Ver en vista de Stock Crítico"
                >
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

            <div className="form-row-2col">
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

        <div className="admin-list-section" id="admin-inventory-section">
          <div className="inventory-sticky-header">
            <button
              type="button"
              className="inventory-toggle-btn"
              onClick={() => setShowInventory(prev => !prev)}
              title={showInventory ? "Haz clic para contraer el inventario" : "Haz clic para expandir el inventario"}
            >
              <div className="inventory-header-left">
                <LayoutDashboard size={24} className="inventory-title-icon" />
                <h2 className="admin-form-title font-serif" style={{ margin: 0 }}>
                  Inventario
                </h2>
                <span className="inventory-count-badge">
                  {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              <div className="inventory-header-right">
                <span className="inventory-toggle-hint">
                  {showInventory ? 'Contraer' : 'Expandir'}
                </span>
                <div className="inventory-chevron-circle">
                  {showInventory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </button>
          </div>

          <div className={`inventory-content-wrapper ${showInventory ? 'expanded' : 'collapsed'}`}>
            {/* Barra de Filtros de Inventario: Todos / Stock Crítico */}
            <div className="inventory-filters-bar">
              <button
                type="button"
                className={`inventory-filter-chip ${inventoryFilter === 'todos' ? 'active' : ''}`}
                onClick={() => handleFilterClick('todos')}
              >
                <Package size={14} />
                <span>Todos los productos</span>
                <span className="chip-count">{productos.length}</span>
              </button>
              <button
                type="button"
                className={`inventory-filter-chip critical-chip ${inventoryFilter === 'critico' ? 'active' : ''}`}
                onClick={() => handleFilterClick('critico')}
              >
                <AlertCircle size={14} />
                <span>Stock Crítico</span>
                <span className="chip-count critical-count">{criticalProductIds.size}</span>
              </button>
            </div>

            {inventoryFilter === 'critico' && (
              <div className="inventory-critical-banner">
                <div className="banner-left">
                  <AlertCircle size={16} />
                  <span>Mostrando productos con <strong>Stock Crítico (3 unidades o menos)</strong></span>
                </div>
                <button
                  type="button"
                  className="btn-reset-filter"
                  onClick={() => handleFilterClick('todos')}
                >
                  Ver todos los productos
                </button>
              </div>
            )}

            <div className="products-table-container">
            {loading ? (
              <div className="empty-state"><p>Cargando productos...</p></div>
            ) : displayedProductos.length === 0 ? (
              <div className="empty-state">
                {inventoryFilter === 'critico' ? (
                  <>
                    <CheckCircle size={48} strokeWidth={1} color="#52c41a" />
                    <p>No hay productos con stock crítico en este momento.</p>
                    <button 
                      type="button" 
                      className="btn-reset-filter"
                      style={{ marginTop: '10px' }}
                      onClick={() => handleFilterClick('todos')}
                    >
                      Volver al inventario completo
                    </button>
                  </>
                ) : (
                  <>
                    <Package size={48} strokeWidth={1} />
                    <p>No hay productos en la base de datos.</p>
                  </>
                )}
              </div>
            ) : (
              <table className="products-table products-inventory">
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
                  {displayedProductos.map((producto) => (
                    <tr key={producto.id} id={`product-row-${producto.id}`} className={producto.oculto ? 'row-oculto' : ''}>
                      <td data-label="Imagen" className="td-image">
                        <div className="table-img-container">
                          {producto.imagenUrl ? <img src={producto.imagenUrl} alt={producto.nombre} /> : <ImageIcon size={24} color="#ccc" />}
                        </div>
                        {/* Badges redundantes para encabezado visual en tarjeta móvil */}
                        <div className="mobile-only-badges">
                          <span className={`badge badge-${producto.categoria}`}>{producto.categoria}</span>
                          {producto.oculto && (
                            <span className="badge badge-oculto" title="Este producto está oculto para los usuarios">Oculto</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Nombre y Categoría" className="td-name">
                        <div className="table-name-wrapper">
                          <input 
                            type="text" 
                            className="table-input-name"
                            value={producto.nombre || ''} 
                            onChange={(e) => handleTableFieldChange(producto.id, 'nombre', e.target.value)} 
                            placeholder="Nombre del producto"
                          />
                          <div className="table-badges-wrapper desktop-only-badges">
                            <span className={`badge badge-${producto.categoria}`}>{producto.categoria}</span>
                            {producto.oculto && (
                              <span className="badge badge-oculto" title="Este producto está oculto para los usuarios">Oculto</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Descripción" className="td-desc">
                        <div className="table-desc-wrapper">
                          <textarea 
                            className="table-textarea-desc"
                            value={producto.descripcion || ''} 
                            onChange={(e) => handleTableFieldChange(producto.id, 'descripcion', e.target.value)} 
                            placeholder="Descripción..."
                          />
                        </div>
                      </td>
                      <td data-label="Precio" className="td-price">
                        <div className="table-price-wrapper">
                          <span className="currency-symbol">$</span>
                          <input 
                            type="number" 
                            className="table-input-price"
                            value={producto.precio !== undefined ? producto.precio : ''} 
                            onChange={(e) => handleTableFieldChange(producto.id, 'precio', e.target.value)} 
                            step="0.01" 
                            min="0" 
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td data-label="Stock" className="td-stock">
                        <div className="table-stock-wrapper">
                          <input 
                            type="number" 
                            className={`table-input-stock ${Number(producto.stock) <= 3 ? 'stock-low' : ''}`}
                            value={producto.stock !== undefined ? producto.stock : ''} 
                            onChange={(e) => handleTableFieldChange(producto.id, 'stock', e.target.value)} 
                            min="0" 
                            placeholder="0"
                          />
                          <span className="stock-unit">uds.</span>
                          {Number(producto.stock) <= 3 && (
                            <AlertCircle 
                              size={18} 
                              color="#ff4d4f" 
                              title="Poco stock - ¡Necesita reponer!" 
                              className="stock-alert-icon"
                            />
                          )}
                        </div>
                      </td>
                      <td data-label="Acciones" className="td-actions">
                        <div className="table-actions-wrapper">
                          <button 
                            type="button"
                            onClick={() => handleTableSave(producto)} 
                            className="table-save-btn"
                          >
                            Guardar
                          </button>
                          <button 
                            type="button"
                            className={`visibility-btn ${producto.oculto ? 'show-btn' : 'hide-btn'}`} 
                            onClick={() => handleToggleOcultar(producto)} 
                            title={producto.oculto ? 'Hacer visible en la tienda para los usuarios' : 'Ocultar producto de la tienda para los usuarios'}
                          >
                            {producto.oculto ? (
                              <>
                                <Eye size={16} />
                                <span>Mostrar</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={16} />
                                <span>Ocultar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* SECCIÓN DE HISTORIAL DE VENTAS */}
      <div className="admin-history-section">
        <div className="history-header-top">
          <div className="history-title-wrapper">
            <h2 className="admin-form-title font-serif" style={{ margin: 0 }}>
              <ShoppingBag size={24} />
              Historial de Ventas y Pedidos
            </h2>
            <span className="history-count-badge">
              {orders.length} {orders.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
            </span>
          </div>
          <p className="history-subtitle">
            Gestión y seguimiento de entregas. Podés marcar los pedidos como <strong>No entregado</strong>, <strong>Entregado</strong> o <strong>Cancelado</strong> según el avance de cada compra.
          </p>
        </div>

        {/* Barra de filtros por método de pago */}
        <div className="history-filters-bar">
          <button 
            type="button" 
            className={`history-filter-chip ${orderFilter === 'todos' ? 'active' : ''}`}
            onClick={() => setOrderFilter('todos')}
          >
            Todos <span className="chip-count">{countTodos}</span>
          </button>
          <button 
            type="button" 
            className={`history-filter-chip ${orderFilter === 'efectivo' ? 'active' : ''}`}
            onClick={() => setOrderFilter('efectivo')}
          >
            <Wallet size={13} /> Efectivo <span className="chip-count">{countEfectivo}</span>
          </button>
          <button 
            type="button" 
            className={`history-filter-chip ${orderFilter === 'mercadolibre' ? 'active' : ''}`}
            onClick={() => setOrderFilter('mercadolibre')}
          >
            <CreditCard size={13} /> Mercado Pago <span className="chip-count">{countMP}</span>
          </button>
          <button 
            type="button" 
            className={`history-filter-chip ${orderFilter === 'cripto' ? 'active' : ''}`}
            onClick={() => setOrderFilter('cripto')}
          >
            <Coins size={13} /> Cripto <span className="chip-count">{countCripto}</span>
          </button>
        </div>

        <div className="orders-table-wrapper">
          {loadingOrders ? (
            <div className="empty-state"><p>Cargando historial de ventas...</p></div>
          ) : displayedOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>{orderFilter === 'todos' ? 'No se registran pedidos en el historial aún.' : `No hay pedidos registrados con el filtro "${orderFilter}".`}</p>
            </div>
          ) : (
            <table className="products-table orders-table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Método de Pago</th>
                  <th>Monto Total</th>
                  <th>Estado de Entrega</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      onClick={() => toggleOrderExpand(order.id)}
                      style={{ cursor: 'pointer' }}
                      className={expandedOrderId === order.id ? 'row-expanded' : ''}
                    >
                      <td data-label="Nº Pedido" className="td-order-id">
                        <span className="order-code">#{order.id}</span>
                      </td>
                      <td data-label="Fecha y Hora" className="td-order-date">
                        <div className="order-datetime-cell">
                          <span className="order-date-str">
                            {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="order-time-str">
                            <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </span>
                        </div>
                      </td>
                      <td data-label="Cliente" className="td-order-client">
                        <div className="order-client-cell">
                          <div className="client-avatar">
                            {order.nombreCliente ? order.nombreCliente.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="client-info">
                            <strong className="client-name">{order.nombreCliente} {order.apellidoCliente}</strong>
                            <span className="client-email">{order.email}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Método de Pago" className="td-order-payment">
                        <span className={`badge-payment-pill badge-payment-${order.metodoPago || 'efectivo'}`}>
                          {order.metodoPago === 'mercadolibre' && <CreditCard size={13} />}
                          {order.metodoPago === 'tarjeta' && <CreditCard size={13} />}
                          {order.metodoPago === 'cripto' && <Coins size={13} />}
                          {(!order.metodoPago || order.metodoPago === 'efectivo') && <Wallet size={13} />}
                          <span>
                            {order.metodoPago === 'mercadolibre' ? 'Mercado Pago' : order.metodoPago === 'tarjeta' ? 'Tarjeta' : order.metodoPago === 'cripto' ? 'Cripto' : 'Efectivo'}
                          </span>
                        </span>
                      </td>
                      <td data-label="Monto Total" className="td-order-total">
                        <span className="order-total-amount">
                          ${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td data-label="Estado de Entrega" className="td-order-status" onClick={(e) => e.stopPropagation()}>
                        <div className="order-status-edit-wrapper">
                          <select 
                            value={order.status === 'pagado' ? 'entregado' : order.status} 
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className={`status-select status-${order.status === 'pagado' ? 'entregado' : order.status}`}
                            title="Cambiar estado de entrega del pedido"
                          >
                            <option value="pendiente">⏳ No entregado</option>
                            <option value="entregado">✓ Entregado</option>
                            <option value="cancelado">✗ Cancelado</option>
                          </select>
                        </div>
                      </td>
                      <td data-label="Detalles" className="td-order-details" onClick={(e) => e.stopPropagation()}>
                        <div className="order-actions-group">
                          <button 
                            type="button"
                            onClick={() => toggleOrderExpand(order.id)}
                            className={`order-view-detail-btn ${expandedOrderId === order.id ? 'active' : ''}`}
                            title={expandedOrderId === order.id ? 'Ocultar detalles' : 'Ver productos y punto de retiro'}
                          >
                            <Eye size={13} />
                            <span>{expandedOrderId === order.id ? 'Ocultar' : 'Ver detalle'}</span>
                            {expandedOrderId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila Detalle del Pedido Expandible */}
                    {expandedOrderId === order.id && (
                      <tr className="expanded-detail-row">
                        <td colSpan={7}>
                          <div className="order-expanded-card">
                            <div className="order-expanded-header">
                              <div className="expanded-header-left">
                                <span className="expanded-tag">Resumen del Pedido #{order.id}</span>
                                <span className="expanded-items-count">
                                  {order.items ? order.items.reduce((acc, it) => acc + Number(it.cantidad || 0), 0) : 0} artículos
                                </span>
                              </div>
                              <div className="expanded-header-right">
                                <span className="expanded-payment-note">
                                  {(!order.metodoPago || order.metodoPago === 'efectivo') && '💵 Pago presencial contra entrega'}
                                  {order.metodoPago === 'mercadolibre' && '💳 Procesado vía Mercado Pago'}
                                  {order.metodoPago === 'cripto' && '🪙 Pago en criptomonedas'}
                                  {order.metodoPago === 'tarjeta' && '💳 Pago procesado con tarjeta'}
                                </span>
                              </div>
                            </div>

                            <div className="order-expanded-grid">
                              {/* Card Punto de Encuentro */}
                              <div className="order-info-card meeting-card">
                                <div className="info-card-header">
                                  <MapPin size={16} className="info-card-icon" />
                                  <h4>Punto de Retiro Pactado</h4>
                                </div>
                                <p className="meeting-location">📍 Plaza Independencia (Mendoza)</p>
                                <div className="meeting-schedule">
                                  <div className="schedule-item">
                                    <span className="schedule-label">Día:</span>
                                    <strong className="schedule-val">{order.diaEncuentro || 'No especificado'}</strong>
                                  </div>
                                  <div className="schedule-item">
                                    <span className="schedule-label">Horario:</span>
                                    <strong className="schedule-val">{order.horaEncuentro || 'No especificada'} hs</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Card Cripto (si aplica) */}
                              {order.metodoPago === 'cripto' && (
                                <div className="order-info-card crypto-card">
                                  <div className="info-card-header">
                                    <Coins size={16} className="info-card-icon" />
                                    <h4>Transacción Cripto</h4>
                                  </div>
                                  <div className="crypto-details">
                                    <div className="crypto-field">
                                      <span>Red:</span>
                                      <strong>{order.cryptoNetwork || 'No especificada'}</strong>
                                    </div>
                                    <div className="crypto-field">
                                      <span>TXID:</span>
                                      <code className="crypto-hash">{order.cryptoTxId || 'No proporcionado'}</code>
                                    </div>
                                    {order.cryptoTxId && (
                                      <a 
                                        href={order.cryptoNetwork?.includes('Dogecoin') || order.cryptoNetwork?.includes('DOGE')
                                          ? `https://dogechain.info/tx/${order.cryptoTxId}`
                                          : order.cryptoNetwork === 'USDS - Red Polygon' || order.cryptoNetwork?.includes('Polygon')
                                            ? `https://polygonscan.com/tx/${order.cryptoTxId}` 
                                            : order.cryptoNetwork === 'TRON (TRC20)' 
                                              ? `https://tronscan.org/#/transaction/${order.cryptoTxId}` 
                                              : `https://etherscan.io/tx/${order.cryptoTxId}`
                                        } 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="crypto-explorer-link"
                                      >
                                        Ver en Explorer <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Lista de productos comprados */}
                            <div className="order-products-section">
                              <h4 className="products-section-title">Productos en este pedido</h4>
                              <div className="order-products-list">
                                {order.items && order.items.map((item) => (
                                  <div key={item.id} className="order-product-card">
                                    <div className="product-card-img">
                                      <img src={item.producto?.imagenUrl || 'https://via.placeholder.com/60'} alt={item.producto?.nombre} />
                                    </div>
                                    <div className="product-card-info">
                                      <span className="product-card-name">{item.producto?.nombre || 'Producto eliminado'}</span>
                                      <span className="product-card-unit-price">${Number(item.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u</span>
                                    </div>
                                    <div className="product-card-qty-badge">
                                      {item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'}
                                    </div>
                                    <div className="product-card-subtotal">
                                      ${(item.cantidad * Number(item.precioUnitario)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Barra de total */}
                            <div className="order-summary-footer">
                              <div className="footer-notes">
                                <span>* Entrega presencial en punto de encuentro sin costo de envío.</span>
                              </div>
                              <div className="footer-total-box">
                                <span className="footer-total-label">Total del Pedido:</span>
                                <span className="footer-total-amount">
                                  ${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
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

      {/* MODAL DE CAMBIOS SIN GUARDAR (INTERCEPTOR DE NAVEGACIÓN) */}
      {showUnsavedModal && (
        <div className="inova-modal-overlay" role="dialog" aria-modal="true">
          <div className="inova-modal-container">
            <div className="inova-modal-header">
              <div className="inova-modal-icon-circle">
                <AlertCircle size={26} color="#cf1322" />
              </div>
              <h3 className="inova-modal-title font-serif">Tienes cambios de stock sin guardar</h3>
              <p className="inova-modal-description">
                Has modificado valores de stock en el inventario que aún no han sido guardados.
              </p>
            </div>
            <div className="inova-modal-actions">
              <button
                type="button"
                className="inova-modal-btn btn-save"
                onClick={handleModalSaveAndProceed}
                disabled={isSavingModal}
              >
                {isSavingModal ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="inova-modal-btn btn-discard"
                onClick={handleModalDiscardAndProceed}
                disabled={isSavingModal}
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;