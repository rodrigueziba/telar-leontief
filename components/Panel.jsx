'use client';

import { nf, suma } from '@/lib/leontief';

/* El panel de lectura: los números exactos, sin ninguna escala de por medio. */

export default function Panel({ modelo, terminos, acum, paso, x, y }) {
  const acumulado = acum[paso];
  const termino = terminos[paso];
  const total = suma(x);
  const yTotal = suma(y);

  const lecturas = [
    ['Producción total', nf(total)],
    ['Consumo intermedio', nf(total - yTotal)],
    ['Demanda final', nf(yTotal)],
    ['Multiplicador global', yTotal > 0 ? nf(total / yTotal, 4) : '—'],
    ['ρ(A) · cuánto queda por pasada', nf(modelo.rho, 4)],
    ['Pasadas hasta apagarse', String(terminos.length)],
  ];

  const peor = modelo.negativos.length
    ? modelo.negativos.reduce((a, b) => (b.valor < a.valor ? b : a))
    : null;

  return (
    <>
      <div className="card">
        <h2>
          Producción tras {paso + 1} pasada{paso ? 's' : ''}
        </h2>
        <ul className="sectors">
          {modelo.nombres.map((nm, i) => (
            <li key={nm}>
              <span className="sw" style={{ background: `var(--dye-${(i % 5) + 1})` }} />
              <span className="nm">{nm}</span>
              <span className="val">{nf(acumulado[i])}</span>
              <span className="subv">
                +{nf(termino[i])} en esta pasada · final {nf(x[i])}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Lectura del tejido</h2>
        <dl className="stats">
          {lecturas.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {peor && (
          <p className="note just">
            <b>{modelo.negativos.length} cruces tachados en rojo.</b> La (I−A)⁻¹ del enunciado
            devuelve coeficientes negativos (el menor, {nf(peor.valor, 4)}). Un insumo negativo no
            existe: ese hilo empujaría en vez de tirar. La matriz está redondeada, no construida
            desde una A real.
          </p>
        )}
      </div>
    </>
  );
}
