import React, { useState, useEffect } from 'react';
import { PackagePlus, Trash2, LayoutDashboard, Image as ImageIcon, Package, AlertCircle, CheckCircle } from 'lucide-react';
import './Admin.css';

function Admin() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'pulsera',
    imagenUrl: '',
    stock: ''
  });

  const [uploading, setUploading] = useState(false);
  const apiUrl = 'http://localhost:3000/api/products'; // Asumiendo que este es el puerto del backend

  // Cargar productos al montar
  useEffect(() => {
    fetchProductos();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Error al obtener productos');
      const data = await res.json();
      setProductos(data);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('imagen', file);

    try {
      setUploading(true);
      showToast('Subiendo imagen a Cloudinary...');
      const res = await fetch('http://localhost:3000/api/products/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Error al subir la imagen');

      const data = await res.json();
      setFormData(prev => ({ ...prev, imagenUrl: data.url }));
      showToast('¡Imagen subida a Cloudinary con éxito!');
    } catch (error) {
      console.error(error);
      showToast('Error al subir la imagen', 'error');
    } finally {
      setUploading(false);
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
      fetchProductos(); // Recargar la lista
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
      fetchProductos(); // Recargar la lista
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar producto', 'error');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title font-serif">Panel de Administración</h1>
      </div>

      <div className="admin-content">
        {/* Lado Izquierdo: Formulario */}
        <div className="admin-form-section">
          <h2 className="admin-form-title font-serif">
            <PackagePlus size={24} />
            Agregar Producto
          </h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Pulsera Ónix"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                placeholder="Detalles sobre el diseño y materiales..."
              />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Precio ($)</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} required>
                <option value="pulsera">Pulsera</option>
                <option value="collar">Collar</option>
              </select>
            </div>

            <div className="form-group">
              <label>Imagen del Producto</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{
                    padding: '12px',
                    border: '1px dashed #cccccc',
                    borderRadius: '12px',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                />
                
                {uploading && (
                  <span style={{ fontSize: '13px', color: '#888888', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Subiendo a Cloudinary... ☁️
                  </span>
                )}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="url"
                    name="imagenUrl"
                    value={formData.imagenUrl}
                    onChange={handleChange}
                    placeholder="O pega una URL de imagen directa aquí"
                    style={{ flex: 1 }}
                  />
                  {formData.imagenUrl && (
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eeeeee', flexShrink: 0 }}>
                      <img src={formData.imagenUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Guardar Producto
            </button>
          </form>
        </div>

        {/* Lado Derecho: Lista de Productos */}
        <div className="admin-list-section">
          <h2 className="admin-form-title font-serif" style={{ marginBottom: '30px' }}>
            <LayoutDashboard size={24} />
            Inventario
          </h2>

          <div className="products-table-container">
            {loading ? (
              <div className="empty-state">
                <p>Cargando productos...</p>
              </div>
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
                    <th>Detalles</th>
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
                          {producto.imagenUrl ? (
                            <img src={producto.imagenUrl} alt={producto.nombre} />
                          ) : (
                            <ImageIcon size={24} color="#ccc" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <strong style={{ fontSize: '15px' }}>{producto.nombre}</strong>
                          <span className={`badge badge-${producto.categoria}`}>
                            {producto.categoria}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        ${producto.precio?.toFixed(2)}
                      </td>
                      <td>{producto.stock} uds.</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(producto.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
