import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

function Collections({ addToCart, toggleFavorite, favorites }) {
    const [filter, setFilter] = useState('todos');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error al cargar productos:', err);
                setLoading(false);
            });
    }, []);

    const filteredProducts = filter === 'todos'
        ? products
        : products.filter(p => p.categoria === filter);

   const categories = [
    { id: 'todos', name: 'Todos' },
    { id: 'collar', name: 'Collares' },
    { id: 'pulsera', name: 'Pulseras' },
    { id: 'aro', name: 'Aros' },
];

    if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Cargando productos...</div>;

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', minHeight: '80vh' }}>
            <div className="products-header" style={{ textAlign: 'center', marginBottom: '50px', display: 'block' }}>
                <h1 className="font-serif collections-title">Colecciones</h1>
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
                                        toggleFavorite(product);
                                    }}
                                    style={{ color: isFavorite ? '#e74c3c' : 'inherit', transition: 'all 0.3s' }}
                                >
                                    <Heart size={18} fill={isFavorite ? '#e74c3c' : 'none'} strokeWidth={2} />
                                </button>
                                <Link to={`/producto/${product.id}`} style={{ display: 'block' }}>
                                    <img src={product.imagenUrl} alt={product.nombre} />
                                </Link>
                            </div>
                            <h3 className="product-title font-serif">{product.nombre}</h3>
                            <p className="product-price">${product.precio.toFixed(2)}</p>
                            <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
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