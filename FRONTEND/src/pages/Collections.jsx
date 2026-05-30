import React, { useState, useEffect, useCallback } from 'react';
import { Heart, ShoppingCart, Search, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Collections({ toggleFavorite, favorites, addToCart }) {
    const { cartItems } = useCart();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSearchQuery = searchParams.get('search') || '';

    const [dbProducts, setDbProducts] = useState([]);
    const [filter, setFilter] = useState(searchParams.get('categoria') || 'todos');
    const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
    const [searchInput, setSearchInput] = useState(urlSearchQuery);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState('');
    const [isAnimatingSort, setIsAnimatingSort] = useState(false);
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

    useEffect(() => {
        const currentUrlSearch = searchParams.get('search') || '';
        const currentUrlCategory = searchParams.get('categoria') || 'todos';
        let paramsChanged = false;

        if (currentUrlSearch !== searchQuery) {
            setSearchQuery(currentUrlSearch);
            setSearchInput(currentUrlSearch);
            paramsChanged = true;
        }

        if (currentUrlCategory !== filter) {
            setFilter(currentUrlCategory);
            paramsChanged = true;
        }

        if (paramsChanged) {
            setCurrentPage(1);
        }
    }, [searchParams, searchQuery, filter]);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            let url = `http://localhost:3000/api/products?page=${currentPage}&limit=12`;
            if (filter !== 'todos') url += `&categoria=${filter}`;
            if (searchQuery.trim() !== '') url += `&search=${searchQuery}`;
            if (sortOrder) url += `&sortPrice=${sortOrder}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al obtener productos');
            const data = await response.json();

            if (data && data.productos) {
                setDbProducts(data.productos);
                setTotalPages(data.totalPages || 1);
            } else if (Array.isArray(data)) {
                setDbProducts(data);
                setTotalPages(1);
            } else {
                setDbProducts([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error al conectar con el backend:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filter, searchQuery, currentPage, sortOrder]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setCurrentPage(1);
        const newParams = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
            newParams.set('search', searchInput);
        } else {
            newParams.delete('search');
        }
        setSearchParams(newParams);
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchQuery('');
        setCurrentPage(1);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('search');
        setSearchParams(newParams);
    };

    const toggleSortOrder = () => {
        setIsAnimatingSort(true);
        setTimeout(() => {
            setSortOrder(prev => prev === '' ? 'asc' : prev === 'asc' ? 'desc' : '');
            setCurrentPage(1);
            setTimeout(() => setIsAnimatingSort(false), 50);
        }, 200);
    };

    const handleFilterChange = (categoryId) => {
        setFilter(categoryId);
        setCurrentPage(1);
        const newParams = new URLSearchParams(searchParams);
        if (categoryId === 'todos') {
            newParams.delete('categoria');
        } else {
            newParams.set('categoria', categoryId);
        }
        setSearchParams(newParams);
    };

    const categories = [
        { id: 'todos', name: 'Todos' },
        { id: 'collar', name: 'Collares' },
        { id: 'pulsera', name: 'Pulseras' },
        { id: 'aro', name: 'Aros' },
        { id: 'anillo', name: 'Anillos' },
        { id: 'pendiente', name: 'Pendientes' },
    ];

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', minHeight: '80vh' }}>
            <div className="products-header" style={{ textAlign: 'center', marginBottom: '50px', display: 'block' }}>
                <h1 className="font-serif collections-title">Colecciones</h1>

                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '400px', margin: '0 auto 30px auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                    <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
                    <input type="text" placeholder="Buscar en el catálogo..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', backgroundColor: 'transparent', color: 'inherit' }} />
                    {searchInput && <X size={16} color="var(--text-muted)" style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={clearSearch} />}
                </form>

                <div className="products-filters" style={{ justifyContent: 'center', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {categories.map(cat => (
                        <span key={cat.id} className={filter === cat.id ? 'active' : ''} onClick={() => handleFilterChange(cat.id)} style={{ cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px', color: filter === cat.id ? 'var(--primary)' : 'var(--text-muted)', fontWeight: filter === cat.id ? 'bold' : 'normal' }}>
                            {cat.name}
                        </span>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px', paddingLeft: '20px', borderLeft: '1px solid var(--border-color)' }}>
                        <button onClick={toggleSortOrder} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px', color: sortOrder ? 'var(--primary)' : 'var(--text-muted)', fontWeight: sortOrder ? 'bold' : 'normal', padding: 0 }}>
                            Precio
                            <span style={{ display: 'flex', alignItems: 'center', opacity: isAnimatingSort ? 0 : 1, transform: isAnimatingSort ? 'scale(0.5)' : 'scale(1)', transition: 'all 0.2s ease-in-out' }}>
                                {sortOrder === '' && <ArrowUpDown size={14} />}
                                {sortOrder === 'asc' && <ArrowUp size={14} />}
                                {sortOrder === 'desc' && <ArrowDown size={14} />}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px' }}>Cargando catálogo...</p>
                </div>
            ) : dbProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <Search size={40} style={{ margin: '0 auto 20px auto', opacity: 0.5 }} />
                    <p style={{ letterSpacing: '1px', fontSize: '14px' }}>No encontramos piezas que coincidan con tu búsqueda.</p>
                    <button onClick={clearSearch} style={{ marginTop: '20px', background: 'none', border: '1px solid var(--border-color)', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Ver todo el catálogo</button>
                </div>
            ) : (
                <div className="products-grid">
                    {dbProducts.map((product) => {
                        const isFavorite = favorites.some(fav => fav.id === product.id);
                        return (
                            <div key={product.id} className="product-card">
                                <div className="product-image-container">
                                    <button className="wishlist-btn" onClick={(e) => { e.preventDefault(); toggleFavorite(product); }} style={{ color: isFavorite ? '#e74c3c' : 'inherit', transition: 'all 0.3s' }}>
                                        <Heart size={18} fill={isFavorite ? '#e74c3c' : 'none'} strokeWidth={2} />
                                    </button>
                                    <Link to={`/producto/${product.id}`} style={{ display: 'block' }}>
                                        <img src={product.imagenUrl} alt={product.nombre} />
                                    </Link>
                                </div>
                                <h3 className="product-title font-serif">{product.nombre}</h3>
                                <p className="product-price">${product.precio?.toFixed(2)}</p>
                                <button
                                    className={`add-to-cart-btn ${addedItem === product.id ? 'item-added' : ''} ${errorItem === product.id ? 'item-error shake' : ''}`}
                                    onClick={() => handleAddToCartClick(product)}
                                >
                                    {errorItem === product.id ? (
                                        '¡Stock Máximo Alcanzado! ❌'
                                    ) : addedItem === product.id ? (
                                        '¡AGREGADO! ✓'
                                    ) : (
                                        <>
                                            <ShoppingCart size={14} strokeWidth={2} /> AGREGAR AL CARRITO
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '60px' }}>
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#ccc' : 'inherit', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Anterior</button>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ background: 'none', border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#ccc' : 'inherit', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Siguiente</button>
                </div>
            )}
        </div>
    );
}

export default Collections;