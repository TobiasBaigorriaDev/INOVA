// main.jsx es el "Punto de Entrada" (Entry Point) de tu aplicación.
// Cuando Vite inicia, este es el primer archivo de JavaScript que ejecuta.

// 1. IMPORTACIONES
// Importamos las herramientas principales de React.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// En Vite y React, ¡podemos importar archivos CSS directamente dentro de JavaScript!
// Esto le dice a Vite que inyecte este CSS en la página.
import './index.css'

// Importamos nuestro componente principal "App" (que armamos en App.jsx)
import App from './App.jsx'

// 2. CONEXIÓN CON HTML
// Buscamos el <div> vacío que tiene id="root" en nuestro archivo index.html.
// (Exactamente igual que en JavaScript tradicional: document.getElementById)
// Luego, le decimos a React que cree una "raíz" ahí y que "renderice" (dibuje) nuestra <App />.
createRoot(document.getElementById('root')).render(
  // StrictMode es un ayudante de React que revisa si hay errores ocultos en tu código (solo funciona en desarrollo).
  <StrictMode>
    {/* Aquí estamos llamando a nuestro componente App como si fuera una etiqueta HTML personalizada */}
    <App />
  </StrictMode>,
)
