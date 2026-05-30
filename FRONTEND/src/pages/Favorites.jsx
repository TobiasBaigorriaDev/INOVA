import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext'; // <-- IMPORTAMOS EL HOOK DEL CONTEXTO

function Favorites({ favorites, toggleFavorite }) {
    const { addToCart, cartItems } = useCart(); // <-- CONSUMIMOS EL CARRITO DIRECTAMENTE
    const [addedItem, setAddedItem] = useState(null);
    const [errorItem, setErrorItem] = useState(null);

    const handleAddToCartClick = (product) => {
        const existingItem = cartItems.find(item => item.id === product.id);
        const cartQuantity = existingItem ? Number(existingItem.qty) : 0;

        if (cartQuantity + 1 > Number(product.stock)) {
            setErrorItem(product.id);
            setTimeout(() => setErrorItem(null), 1500);
            return;
        }

        addToCart(product);
        setAddedItem(product.id);
        setTimeout(() => setAddedItem(null), 1500);
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: '60vh' }}>

            <h1 className="font-serif" style={{ fontSize: '3rem', color: '#2b0e2b', marginBottom: '10px' }}>
                Mis Favoritos
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '40px' }}>
                Una curaduría personal de sus piezas más deseadas. Guardadas para su próxima visita a INOVA.
            </p>

            {favorites.length === 0 ? (
                <div style={{ backgroundColor: '#f9f9f9', padding: '60px 20px', textAlign: 'center', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2rem', color: '#2b0e2b', marginBottom: '15px' }}>✨</div>
                    <p style={{ letterSpacing: '1px', fontSize: '0.9rem', color: '#2b0e2b', marginBottom: '20px' }}>
                        DESCUBRA MÁS TESOROS EN NUESTRA COLECCIÓN
                    </p>
                    <Link to="/" style={{ textDecoration: 'none', border: '1px solid #2b0e2b', padding: '10px 20px', color: '#2b0e2b', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        VOLVER AL INICIO
                    </Link>
                </div>
            ) : (
                <div className="products-grid">
                    {favorites.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image-container">
                                <img src={product.image} alt={product.name} />
                            </div>

                            <h3 className="product-title font-serif">{product.name}</h3>

                            {/* Protección para el precio: si es número usa toFixed, si no, lo muestra directo */}
                            <p className="product-price">
                                ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                            </p>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button
                                    className={`${addedItem === product.id ? 'item-added' : ''} ${errorItem === product.id ? 'item-error shake' : ''}`}
                                    onClick={() => handleAddToCartClick(product)}
                                    style={{ flex: 1, backgroundColor: errorItem === product.id ? '#e74c3c' : (addedItem === product.id ? '#2ecc71' : '#2b0e2b'), color: 'white', border: 'none', padding: '10px', cursor: errorItem === product.id ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', transition: 'all 0.3s' }}
                                >
                                    {errorItem === product.id ? (
                                        <span style={{ fontSize: '10px' }}>¡Stock Máximo Alcanzado! ❌</span>
                                    ) : addedItem === product.id ? (
                                        '¡AGREGADO! ✓'
                                    ) : (
                                        <><ShoppingCart size={14} /> AL CARRITO</>
                                    )}
                                </button>
                                <button
                                    onClick={() => toggleFavorite(product)}
                                    style={{ flex: 1, backgroundColor: 'transparent', color: '#2b0e2b', border: '1px solid #2b0e2b', padding: '10px', cursor: 'pointer' }}
                                >
                                    QUITAR
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Favorites;