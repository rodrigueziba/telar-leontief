'use client';

import { nf, suma } from '@/lib/leontief';

/*
 * Modo planilla: los mismos datos sin la tela.
 *
 * Existe por una razón concreta — un profesor tiene que poder leer 366,67
 * en pantalla. Si la pieza fuera sólo la experiencia, dejaría de ser un
 * trabajo práctico de Modelos y Simulación.
 */

function Matriz({ M, nombres, caption, extra }) {
  return (
    <div className="tbl-box">
      <table className="mat">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th />
            {nombres.map((nm) => (
              <th key={nm}>{nm.slice(0, 4)}</th>
            ))}
            {extra && <th>{extra.rotulo}</th>}
          </tr>
        </thead>
        <tbody>
          {M.map((fila, i) => (
            <tr key={nombres[i]}>
              <th className="rh">{nombres[i].slice(0, 4)}</th>
              {fila.map((v, j) => (
                <td
                  key={j}
                  className={v < -1e-9 ? 'neg' : i === j ? 'diag' : undefined}
                >
                  {nf(v, 4)}
                </td>
              ))}
              {extra && <td>{nf(extra.valores[i], extra.dec)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Planilla({ modelo, x, y }) {
  const Z = modelo.A.map((fila) => fila.map((a, j) => a * x[j]));

  return (
    <section className="sheet">
      <h2>Planilla — los mismos datos, sin tela</h2>

      <div className="grid-2">
        <Matriz
          M={modelo.A}
          nombres={modelo.nombres}
          caption={
            modelo.recuperada ? 'A = I − L⁻¹ (recuperada)' : 'A — coeficientes técnicos'
          }
          extra={{ rotulo: 'y', valores: y, dec: 0 }}
        />
        <Matriz
          M={modelo.L}
          nombres={modelo.nombres}
          caption="L = (I − A)⁻¹ — inversa de Leontief"
          extra={{ rotulo: 'x', valores: x, dec: 4 }}
        />
        <Matriz
          M={Z}
          nombres={modelo.nombres}
          caption="z = a·x — insumos entre sectores"
          extra={{ rotulo: 'Σ fila', valores: Z.map(suma), dec: 4 }}
        />

        <div className="tbl-box">
          <table className="mat">
            <caption>Multiplicadores — suma de cada columna de L</caption>
            <tbody>
              {modelo.nombres.map((nm, j) => (
                <tr key={nm}>
                  <th className="rh">{nm}</th>
                  <td>{nf(modelo.mult[j], 4)}</td>
                </tr>
              ))}
              {!modelo.recuperada && (
                <tr>
                  <th className="rh">det(I − A)</th>
                  <td>{nf(modelo.detIA, 4)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
