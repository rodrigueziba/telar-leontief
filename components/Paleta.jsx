'use client';

import { PALETAS, muestrasDe } from '@/lib/paletas';

/* Selector de paleta: cada botón muestra sus cinco colores tal como se van
   a ver, así que la elección se hace mirando, no leyendo. */

export default function Paleta({ actual, esOscuro, onCambiar }) {
  return (
    <div className="paletas" role="group" aria-label="Paleta de colores">
      <span>Paleta</span>
      {PALETAS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="pal"
          aria-pressed={p.id === actual}
          title={`${p.nombre} — ${p.pie}`}
          onClick={() => onCambiar(p.id)}
        >
          {muestrasDe(p, esOscuro).map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
          <span className="sr">{p.nombre}</span>
        </button>
      ))}
    </div>
  );
}
