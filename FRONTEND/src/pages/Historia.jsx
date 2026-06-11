import React from 'react';
import './Historia.css';

function Historia() {
  return (
    <div className="historia-container">
      <div className="historia-hero">
        <div className="historia-hero-overlay"></div>
        <div className="historia-hero-content container">
          <h1 className="font-serif">Nuestra Historia</h1>
        </div>
      </div>

      <div className="historia-content container">
        <div className="historia-text-box">
          <h2 className="font-serif historia-title">Los comienzos de INOVA</h2>

          <div className="historia-placeholder">
            <p>
              INOVA nació hace más de 6 años, de la mano de Abril, una amante de los accesorios,
              los detalles y las historias que puede contar cada pieza.
            </p>

            <p>
              Lo que empezó como una pasión, con el tiempo se convirtió en un proyecto lleno de
              esfuerzo, aprendizaje y amor. Como todo camino emprendedor, no siempre fue fácil:
              hubo momentos de incertidumbre, cansancio y dudas. Pero incluso en esos días,
              Abril eligió seguir adelante.
            </p>

            <p>
              INOVA representa mucho más que un emprendimiento. Es una marca construida con
              dedicación, compromiso y sensibilidad por los pequeños detalles. Cada colección
              nace de una idea, una emoción o un recuerdo: series, películas, libros, personajes
              y momentos que marcaron distintas etapas.
            </p>

            <p>
              Creemos que los accesorios no son solo complementos. Son una forma de expresión,
              una manera de llevar cerca algo que nos identifica, nos inspira o nos hace sentir
              especiales.
            </p>

            <p>
              Cada pieza de INOVA está pensada para acompañarte, para sumar belleza a lo cotidiano
              y para convertirse en parte de tu propia historia.
            </p>

            <p>
              Gracias por acompañarnos en este camino. Cada compra, mensaje y recomendación ayuda
              a que este sueño siga creciendo.
            </p>

            <p className="historia-frase-final">
              <strong>INOVA Accesorios</strong><br />
              Detalles que cuentan historias.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Historia;