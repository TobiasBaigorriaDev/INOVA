import React from 'react';
// Importamos el Enrutador que instalamos.
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Importamos los pedazos fijos de la página (Componentes)
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Importamos las Páginas intercambiables
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    // <Router> envuelve toda tu app para activar la navegación sin recargas
    <Router>

      {/* El Navbar siempre está visible arriba, sin importar en qué página estemos */}
      <Navbar />

      {/* <Routes> es el "policía de tráfico". Mira la URL actual y decide qué página mostrar. */}
      <Routes>

        {/* Si la URL es la raíz (/), mostramos la página de Home */}
        <Route path="/" element={<Home />} />

        {/* Si la URL tiene /producto/ y luego un número (:id), mostramos la página del Producto */}
        <Route path="/producto/:id" element={<ProductDetail />} />

      </Routes>

      {/* El Footer siempre está visible abajo, sin importar en qué página estemos */}
      <Footer />

    </Router>
  );
}

export default App;
