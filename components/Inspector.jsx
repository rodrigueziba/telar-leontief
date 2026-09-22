'use client';

import { nf, suma, sumaAbs } from '@/lib/leontief';

/*
 * El inspector: una pasada, desarmada.
 *
 * La pasada 1 es la demanda final. Cada pasada siguiente es A por la
 * anterior, y acá se muestra ese producto término por término, con los
 * números reales. Los coeficientes en cero quedan atenuados: ahí hay un
 * camino de propagación que no existe.
 */

export default function Inspector({ modelo, terminos, acum, paso, total, onIr }) {
  const termino = terminos[paso];
  const previo = paso > 0 ? terminos[paso - 1] : null;
  const aporte = sumaAbs(termino);
  const acumulado = suma(acum[paso]);
  const pct = total > 0 ? (acumulado / total) * 100 : 0;
  const ultimo = terminos.length - 1;

  return (
    <section className="inspector" aria-label="Inspector de pasadas">
      <div className="insp-head">
        <div className="insp-title">
          Pasada {paso + 1}
          <em>{paso === 0 ? 'el pedido original' : `A × pasada ${paso}`}</em>
        </div>

        <div className="stepper">
          <button
            type="button"
            className="step-btn"
            onClick={() => onIr(paso - 1)}
            disabled={paso === 0}
            aria-label="Pasada anterior"
          >
            ◀
          </button>
          <div className="step-now">
            <b>{paso + 1}</b> de {terminos.length}
          </div>
          <button
            type="button"
            className="step-btn"
            onClick={() => onIr(paso + 1)}
            disabled={paso >= ultimo}
            aria-label="Pasada siguiente"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="insp-body">
        <p className="insp-lead just">
          {paso === 0 ? (
            <>
              La primera pasada es la <b>demanda final</b>: lo que se le pide a cada sector desde
              afuera. Todavía nadie pidió insumos. {modelo.ej.consigna}
            </>
          ) : (
            <>
              Para producir lo de la pasada {paso}, cada sector necesita insumos. Esta pasada es{' '}
              <b>cada fila de A multiplicada por la pasada anterior</b>. Fijate que los números son
              más chicos: por eso la serie se apaga.
            </>
          )}
        </p>

        <div className="cuentas">
          <table className="cuenta">
            <tbody>
              {modelo.nombres.map((nm, i) => (
                <tr key={nm}>
                  <td className="c-nm">
                    <i style={{ background: `var(--dye-${(i % 5) + 1})` }} />
                    {nm}
                  </td>
                  <td className="c-eq">
                    {previo === null ? (
                      <span className="op">demanda final y</span>
                    ) : (
                      modelo.A[i].map((a, j) => {
                        // Un coeficiente negativo se imprime como una resta, no
                        // como "+ −0,01": son los cruces imposibles del ej. 4.
                        const negativo = a < -1e-9;
                        const op = j === 0 ? (negativo ? '−' : '') : negativo ? '−' : '+';
                        return (
                          <span key={j}>
                            {op && <span className="op">{op}</span>}
                            <span className={Math.abs(a) < 1e-9 ? 'z' : undefined}>
                              {nf(Math.abs(a))}×{nf(previo[j])}
                            </span>
                          </span>
                        );
                      })
                    )}
                  </td>
                  <td className="c-res">
                    {previo === null ? '' : '= '}
                    {nf(termino[i])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="insp-foot">
          <span>
            esta pasada aporta <b>{nf(aporte)}</b>
          </span>
          <span>
            acumulado <b>{nf(acumulado)}</b> de <b>{nf(total)}</b>
          </span>
          <span className="meter">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </span>
          <span>
            <b>{nf(pct, 1)}%</b> de la tela
          </span>
        </div>
      </div>
    </section>
  );
}
