'use client';

import { useEffect, useRef, useState } from 'react';
import { nf, sumaAbs } from '@/lib/leontief';

/*
 * La tela acumulada: una banda por pasada, con el largo proporcional a lo
 * que esa pasada aportó a la producción total. La banda 1 es enorme, la 2
 * es aproximadamente ρ(A) de la 1, y así. Las últimas son tan finas que se
 * resumen en una cola rayada — y esa cola es, exactamente, la convergencia
 * de la serie.
 *
 * Dentro de cada banda, los tramos de color son la composición de esa
 * pasada por sector.
 */

const PISO = 3;   // px mínimos para que una banda siga siendo tocable
const GAP = 3;    // px de aire entre bandas: es lo que las hace legibles
const UMBRAL = 0.004; // por debajo de esto una pasada va a la cola

export default function Tela({ terminos, total, paso, nombres, onIr }) {
  const cajaRef = useRef(null);
  const [largo, setLargo] = useState(340);
  const [horizontal, setHorizontal] = useState(false);

  useEffect(() => {
    const medir = () => {
      const caja = cajaRef.current;
      if (!caja) return;
      const h = window.matchMedia('(max-width: 900px)').matches;
      setHorizontal(h);
      setLargo(h ? caja.clientWidth || 300 : caja.clientHeight || 340);
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (cajaRef.current) ro.observe(cajaRef.current);
    return () => ro.disconnect();
  }, []);

  let visibles = terminos.length;
  for (let k = 0; k < terminos.length; k++) {
    if (sumaAbs(terminos[k]) < UMBRAL * total) {
      visibles = k;
      break;
    }
  }
  visibles = Math.max(visibles, 1);

  const disponible = Math.max(40, largo - GAP * (visibles + 1) - 10);
  const resto = terminos.length - visibles;

  const seisPrimeras = terminos.slice(0, 6).reduce((s, t) => s + sumaAbs(t), 0);

  return (
    <div className="strip-box">
      <div className="strip-head">La tela</div>

      <div className="strip" ref={cajaRef}>
        {terminos.slice(0, visibles).map((t, k) => {
          const aporte = sumaAbs(t);
          const px = Math.max(PISO, (aporte / total) * disponible);
          const estilo = horizontal
            ? { width: `${px}px`, flex: '0 0 auto' }
            : { height: `${px}px`, flex: '0 0 auto' };

          return (
            <button
              key={k}
              type="button"
              className={`band${k === paso ? ' sel' : ''}`}
              style={estilo}
              title={`Pasada ${k + 1} · aporta ${nf(aporte)}`}
              aria-label={`Ir a la pasada ${k + 1}`}
              onClick={() => onIr(k)}
            >
              {nombres.map((nm, i) => {
                const parte = aporte > 0 ? (Math.abs(t[i]) / aporte) * 100 : 0;
                const s = horizontal
                  ? { height: `${parte}%`, width: '100%' }
                  : { width: `${parte}%` };
                return (
                  <span
                    key={nm}
                    style={{ ...s, background: `var(--dye-${(i % 5) + 1})` }}
                    title={`${nm} +${nf(t[i])}`}
                  />
                );
              })}
              {px >= 13 && <b>{k + 1}</b>}
            </button>
          );
        })}

        {resto > 0 && (
          <div
            className="band cola"
            style={horizontal ? { width: '6px' } : { height: '6px' }}
            title={`${resto} pasadas más, demasiado finas para verse`}
          />
        )}
      </div>

      <div className="strip-foot">
        <b>{terminos.length}</b> pasadas
        <br />
        las 6 primeras
        <br />
        son el {nf((seisPrimeras / total) * 100, 1)}%
      </div>
    </div>
  );
}
