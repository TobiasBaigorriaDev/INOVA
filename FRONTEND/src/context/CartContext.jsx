import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. CREAMOS EL CONTEXTO
const CartContext = createContext();

// 2. CREAMOS EL PROVEEDOR (PROVIDER)
export const CartProvider = ({ children }) => {
  // Lógica de persistencia: Intentar cargar el carrito guardado del localStorage al iniciar
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('inova_cart');
    return localData ? JSON.parse(localData) : [];
  });

  // Estado para controlar si el sidebar del carrito está abierto o cerrado
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Guardar automáticamente en localStorage cada vez que cambien los artículos del carrito
  useEffect(() => {
    localStorage.setItem('inova_cart', JSON.stringify(cartItems));
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
            const dbProduct = productsArray.find((p) => p.id === item.id);
            
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

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const availableStock = product.stock !== undefined ? Number(product.stock) : 99;
      const qtyNumber = Number(quantity);
      
      if (existingItem) {
        // Si ya existe, incrementamos su cantidad asegurando no superar el stock, o la sobreescribimos si forceSetQty es true
        return prevItems.map((item) => {
          if (item.id === product.id) {
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
  };

  // Actualizar la cantidad de un artículo (+1 o -1)
  const updateQuantity = (id, amount) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + amount;
          const maxStock = item.stock !== undefined ? item.stock : 99;
          
          if (newQty < 1) return { ...item, qty: 1 };
          if (newQty > maxStock) return { ...item, qty: maxStock }; // No dejar superar el stock disponible
          
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  // Eliminar un producto del carrito
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
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
      totalItems
    }}>
      {children}
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
