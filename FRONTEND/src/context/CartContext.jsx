import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

// 1. CREAMOS EL CONTEXTO
const CartContext = createContext();

// 2. CREAMOS EL PROVEEDOR (PROVIDER)
export const CartProvider = ({ children }) => {
  // Lógica de persistencia con expiración de 24 horas: Intentar cargar del localStorage
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('inova_cart');
    const timestamp = localStorage.getItem('inova_cart_timestamp');

    if (localData && timestamp) {
      const now = Date.now();
      const expirationTime = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

      if (now - Number(timestamp) > expirationTime) {
        // El carrito ha expirado, lo limpiamos
        localStorage.removeItem('inova_cart');
        localStorage.removeItem('inova_cart_timestamp');
        return [];
      }
      return JSON.parse(localData);
    }
    return [];
  });

  // Estado para controlar si el sidebar del carrito está abierto o cerrado
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estado para las notificaciones (Toasts) globales de stock u otros eventos
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Limpieza del timeout al desmontar
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Guardar automáticamente en localStorage cada vez que cambien los artículos del carrito
  useEffect(() => {
    localStorage.setItem('inova_cart', JSON.stringify(cartItems));

    // Gestionar el timestamp de expiración del carrito
    if (cartItems.length > 0) {
      // Si se agrega el primer elemento, establecemos el timestamp de inicio
      if (!localStorage.getItem('inova_cart_timestamp')) {
        localStorage.setItem('inova_cart_timestamp', Date.now().toString());
      }
    } else {
      // Si el carrito queda vacío, limpiamos el timestamp
      localStorage.removeItem('inova_cart_timestamp');
    }
  }, [cartItems]);

  // Sincronizar automáticamente en segundo plano los precios y nombres con la base de datos PostgreSQL
  useEffect(() => {
    const syncCartWithDatabase = async () => {
      if (cartItems.length === 0) return;
      try {
        const response = await fetch('http://localhost:3000/api/products');
        if (!response.ok) return;
        const dbProducts = await response.json();
        const productsArray = Array.isArray(dbProducts)
          ? dbProducts
          : dbProducts.productos || [];

        setCartItems((prevItems) => {
          let hasChanges = false;

          const updatedItems = prevItems.map((item) => {
            const dbProduct = productsArray.find((p) => String(p.id) === String(item.id));

            if (dbProduct) {
              const dbPrice = dbProduct.precio;
              const dbName = dbProduct.nombre;
              const dbImage = dbProduct.imagenUrl;
              const dbStock = dbProduct.stock !== undefined ? dbProduct.stock : 99;

              // Si el precio, nombre, imagen o stock de la DB no coinciden con los del carrito, los actualizamos
              if (item.price !== dbPrice || item.name !== dbName || item.image !== dbImage || item.stock !== dbStock) {
                hasChanges = true;
                return {
                  ...item,
                  price: dbPrice,
                  name: dbName,
                  image: dbImage,
                  stock: dbStock
                };
              }
            }
            return item;
          });

          return hasChanges ? updatedItems : prevItems;
        });
      } catch (error) {
        console.error('Error al sincronizar el carrito con la base de datos:', error);
      }
    };

    syncCartWithDatabase();
  }, []);

  // --- FUNCIONES DEL CARRITO ---

  // Agregar producto al carrito
  const addToCart = (product, quantity = 1, forceSetQty = false) => {
    // Nos aseguramos de que el precio siempre sea un número limpio
    const rawPrice = product.precio !== undefined ? product.precio : product.price;
    const numericPrice = typeof rawPrice === 'string'
      ? parseFloat(rawPrice.replace('$', ''))
      : Number(rawPrice);

    const availableStock = (product.stock !== undefined && product.stock !== null && !isNaN(product.stock)) ? Number(product.stock) : 99;
    const qtyNumber = Number(quantity);

    // Buscar si el producto ya está en el carrito
    const existingItem = cartItems.find((item) => String(item.id) === String(product.id));
    const currentQtyInCart = existingItem ? Number(existingItem.qty) : 0;

    // Calcular la cantidad final que resultaría de esta operación
    const targetQty = forceSetQty ? qtyNumber : currentQtyInCart + qtyNumber;

    if (availableStock <= 0) {
      showToast('Límite de stock alcanzado', 'error');
      return;
    }

    if (currentQtyInCart >= availableStock) {
      showToast('Límite de stock alcanzado', 'error');
      return;
    }

    if (targetQty > availableStock) {
      showToast('Límite de stock alcanzado', 'error');
      // Si ya está en el carrito al tope del stock, no hacemos nada más
      if (currentQtyInCart >= availableStock) {
        return;
      }
    }

    setCartItems((prevItems) => {
      const existingItemInState = prevItems.find((item) => String(item.id) === String(product.id));

      if (existingItemInState) {
        // Si ya existe, incrementamos su cantidad asegurando no superar el stock, o la sobreescribimos si forceSetQty es true
        return prevItems.map((item) => {
          if (String(item.id) === String(product.id)) {
            const newQty = forceSetQty ? qtyNumber : Number(item.qty) + qtyNumber;
            return { ...item, qty: newQty > availableStock ? availableStock : newQty };
          }
          return item;
        });
      } else {
        // Si es nuevo, lo agregamos con sus campos, cantidad especificada y stock disponible
        const initialQty = qtyNumber > availableStock ? availableStock : qtyNumber;
        return [...prevItems, {
          id: product.id,
          name: product.nombre || product.name,
          price: numericPrice,
          image: product.imagenUrl || product.image,
          qty: initialQty,
          stock: availableStock
        }];
      }
    });
    setIsCartOpen(true);
  };

  // Actualizar la cantidad de un artículo (+1 o -1)
  const updateQuantity = (id, amount) => {
    const item = cartItems.find((p) => String(p.id) === String(id));
    if (!item) return;

    const newQty = item.qty + amount;
    const maxStock = item.stock !== undefined ? item.stock : 99;

    if (newQty < 1) {
      setCartItems((prev) => prev.map((p) => String(p.id) === String(id) ? { ...p, qty: 1 } : p));
      return;
    }

    if (newQty > maxStock) {
      showToast('Límite de stock alcanzado', 'error');
      setCartItems((prev) => prev.map((p) => String(p.id) === String(id) ? { ...p, qty: maxStock } : p));
      return;
    }

    setCartItems((prev) => prev.map((p) => String(p.id) === String(id) ? { ...p, qty: newQty } : p));
  };

  // Eliminar un producto del carrito
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => String(item.id) !== String(id)));
  };

  // Vaciar por completo el carrito (para después de la compra)
  const clearCart = () => {
    setCartItems([]);
  };

  // --- CÁLCULOS AUTOMÁTICOS (CENTRALIZADOS) ---

  // Subtotal: suma de precio * cantidad de cada artículo
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Envío fijo si hay productos (deshabilitado: entregas en puntos de encuentro sin costo)
  const envio = 0;

  // Total global
  const total = subtotal + envio;

  // Cantidad total de artículos en el carrito (para la burbuja roja del Navbar)
  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      envio,
      total,
      totalItems,
      showToast
    }}>
      {children}

      {/* Toast Notification global de stock */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

// 3. HOOK PERSONALIZADO PARA CONSUMIR EL CONTEXTO FÁCILMENTE
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};
