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
              (informacion de la historia del emprendimiento de la abril escrita por la abril)
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Historia;
