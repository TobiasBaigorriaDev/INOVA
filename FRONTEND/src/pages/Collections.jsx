import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';

function Collections({ addToCart, toggleFavorite, favorites }) {
    const [filter, setFilter] = useState('todos');

    const cleanProductPrice = (product) => {
        const numericPrice = typeof product.price === 'string'
            ? parseFloat(product.price.replace('$', ''))
            : product.price;
        return { ...product, price: numericPrice };
    };

    const filteredProducts = filter === 'todos'
        ? products
        : products.filter(p => p.category === filter);

    const categories = [
        { id: 'todos', name: 'Todos' },
        { id: 'collares', name: 'Collares' },
        { id: 'anillos', name: 'Anillos' },
        { id: 'pulseras', name: 'Pulseras' },
        { id: 'pendientes', name: 'Pendientes' }
    ];

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', minHeight: '80vh' }}>
            <div className="products-header" style={{ textAlign: 'center', marginBottom: '50px', display: 'block' }}>
                <h1 className="font-serif" style={{ fontSize: '3.5rem', marginBottom: '30px' }}>Colecciones</h1>
                <div className="products-filters" style={{ justifyContent: 'center', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <span
                            key={cat.id}
                            className={filter === cat.id ? 'active' : ''}
                            onClick={() => setFilter(cat.id)}
                            style={{
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                fontSize: '12px',
                                letterSpacing: '2px',
                                color: filter === cat.id ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: filter === cat.id ? 'bold' : 'normal'
                            }}
                        >
                            {cat.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="products-grid">
                {filteredProducts.map((product) => {
                    const isFavorite = favorites.some(fav => fav.id === product.id);
                    return (
                        <div key={product.id} className="product-card">
                            <div className="product-image-container">
                                <button
                                    className="wishlist-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleFavorite(cleanProductPrice(product));
                                    }}
                                    style={{ color: isFavorite ? '#e74c3c' : 'inherit', transition: 'all 0.3s' }}
                                >
                                    <Heart size={18} fill={isFavorite ? '#e74c3c' : 'none'} strokeWidth={2} />
                                </button>
                                <Link to={`/producto/${product.id}`} style={{ display: 'block' }}>
                                    <img src={product.image} alt={product.name} />
                                </Link>
                            </div>
                            <h3 className="product-title font-serif">{product.name}</h3>
                            <p className="product-price">{typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : product.price}</p>
                            <button className="add-to-cart-btn" onClick={() => addToCart(cleanProductPrice(product))}>
                                <ShoppingCart size={14} strokeWidth={2} /> AGREGAR AL CARRITO
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Collections;