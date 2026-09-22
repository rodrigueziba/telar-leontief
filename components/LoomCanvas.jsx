'use client';

import { useCallback, useEffect, useRef } from 'react';

/*
 * El telar.
 *
 * Cada sector es a la vez urdimbre y trama — aparece como columna cuando
 * consume y como fila cuando provee, que es exactamente lo que es un
 * sector en una tabla insumo-producto.
 *
 *   · grosor del hilo   → producción acumulada del sector (x^0,6, para que
 *                          un sector chico siga siendo visible)
 *   · anillos del hilo  → una capa por pasada; el núcleo es la demanda
 *                          final y cada capa más clara es una vuelta más
 *   · bulto de un cruce → z_ij = a_ij · x_j, el insumo que i le entrega a j
 *   · cruce tachado     → coeficiente negativo: ese hilo empujaría en vez
 *                          de tirar, y una tela así no se puede tejer
 */

const LIMITE_ANILLO = 1.5; // px: por debajo de esto dos capas no se distinguen

function hexARgb(h) {
  const s = h.replace('#', '').trim();
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [
    parseInt(f.slice(0, 2), 16),
    parseInt(f.slice(2, 4), 16),
    parseInt(f.slice(4, 6), 16),
  ];
}

function mezcla(a, b, t) {
  const A = hexARgb(a);
  const B = hexARgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function leerPaleta() {
  const cs = getComputedStyle(document.documentElement);
  const g = (k) => cs.getPropertyValue(k).trim() || '#000000';
  return {
    panel: g('--panel'),
    ruleSoft: g('--rule-soft'),
    shuttle: g('--shuttle'),
    warn: g('--warn'),
    mixer: g('--mixer'),
    dyes: [g('--dye-1'), g('--dye-2'), g('--dye-3'), g('--dye-4'), g('--dye-5')],
  };
}

export default function LoomCanvas({
  modelo,
  acum,
  paso,
  x,
  tejiendo,
  pasoMs,
  onDemanda,
  rangoY,
}) {
  const cvRef = useRef(null);
  const ladoRef = useRef(0);
  const suaveRef = useRef(null);
  const paletaRef = useRef(null);
  const arrastreRef = useRef(-1);
  const inicioRef = useRef(0); // cuándo empezó la pasada que se está mostrando

  // Los props que el bucle de dibujo necesita, sin volver a suscribirlo.
  const datos = useRef({});
  datos.current = { modelo, acum, paso, x, tejiendo, pasoMs, inicioRef };

  /* ---------------- geometría ---------------- */

  const geom = useCallback((S, n) => {
    const pad = S * 0.12;
    const inner = S - 2 * pad;
    const step = inner / n;
    return { pad, inner, step, pos: (k) => pad + (k + 0.5) * step };
  }, []);

  const grosor = (v, maxV, step) => {
    const r = maxV > 0 ? Math.max(0, v) / maxV : 0;
    const maxT = Math.min(step * 0.27, 19);
    return 1 + (maxT - 1) * Math.pow(r, 0.6);
  };

  const flojedad = (v, maxV, step) => {
    const r = maxV > 0 ? Math.max(0, v) / maxV : 0;
    return (1 - Math.pow(r, 0.6)) * step * 0.2;
  };

  /*
   * El punto de control de la curva está en el medio del eje largo, así que
   * el parámetro de Bézier coincide con la posición normalizada y el desvío
   * lateral vale 2·t·(1−t)·sag. Cruces y nudos usan la misma cuenta, si no
   * quedan corridos del hilo.
   */
  const desvio = (t, sag) => 2 * t * (1 - t) * sag;

  /* ---------------- dibujo ---------------- */

  const dibujar = useCallback(() => {
    const cv = cvRef.current;
    const S = ladoRef.current;
    const P = paletaRef.current;
    const d = suaveRef.current;
    const { modelo: m, acum: ac, paso: p, x: xf, tejiendo: tj, pasoMs, inicioRef: ini } =
      datos.current;
    if (!cv || !S || !P || !d || !ac) return;

    const ctx = cv.getContext('2d');
    const n = m.n;
    const { pad, step, pos } = geom(S, n);
    const maxV = Math.max(...xf, 1e-9);
    const tinte = (i) => P.dyes[i % P.dyes.length];

    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = P.panel;
    ctx.fillRect(0, 0, S, S);

    ctx.strokeStyle = P.ruleSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad * 0.45, pad * 0.45, S - pad * 0.9, S - pad * 0.9);

    const y0 = pad * 0.66;
    const y1 = S - pad * 0.66;
    const x0 = pad * 0.66;
    const x1 = S - pad * 0.66;

    // Las capas visibles de un hilo, de afuera hacia adentro.
    const capas = (j) => {
      const out = [];
      let anterior = Infinity;
      for (let k = p; k >= 0; k--) {
        const w = grosor(ac[k][j], maxV, step);
        if (anterior - w < LIMITE_ANILLO && k !== p && k !== 0) continue;
        out.push(w);
        anterior = w;
      }
      return out;
    };

    // La capa externa es la más clara; el núcleo queda en tinte puro.
    const aclarado = (idx, largo) => (largo < 2 ? 0 : 0.4 * (1 - idx / (largo - 1)));

    const curvaVertical = (X, sag) => {
      ctx.beginPath();
      ctx.moveTo(X, y0);
      ctx.quadraticCurveTo(X + sag, (y0 + y1) / 2, X, y1);
    };

    const curvaHorizontal = (Y, sag) => {
      ctx.beginPath();
      ctx.moveTo(x0, Y);
      ctx.quadraticCurveTo((x0 + x1) / 2, Y - sag, x1, Y);
    };

    ctx.lineCap = 'round';

    // urdimbre: el sector como consumidor (columna de A)
    for (let j = 0; j < n; j++) {
      const X = pos(j);
      const sag = flojedad(d[j], maxV, step);
      const cs = capas(j);
      cs.forEach((w, idx) => {
        ctx.strokeStyle = mezcla(tinte(j), P.mixer, aclarado(idx, cs.length));
        ctx.lineWidth = idx === 0 ? grosor(d[j], maxV, step) : w;
        curvaVertical(X, sag);
        ctx.stroke();
      });
    }

    // trama: el mismo sector como proveedor (fila de A)
    for (let i = 0; i < n; i++) {
      const Y = pos(i);
      const sag = flojedad(d[i], maxV, step);
      const cs = capas(i);
      cs.forEach((w, idx) => {
        ctx.strokeStyle = mezcla(tinte(i), P.mixer, aclarado(idx, cs.length));
        ctx.lineWidth = idx === 0 ? grosor(d[i], maxV, step) : w;
        curvaHorizontal(Y, sag);
        ctx.stroke();
      });
    }

    const cruce = (i, j) => {
      const tv = (pos(i) - y0) / (y1 - y0);
      const th = (pos(j) - x0) / (x1 - x0);
      return {
        x: pos(j) + desvio(tv, flojedad(d[j], maxV, step)),
        y: pos(i) - desvio(th, flojedad(d[i], maxV, step)),
      };
    };

    // entrelazado: en los cruces pares la urdimbre vuelve arriba
    ctx.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if ((i + j) % 2 !== 0) continue;
        const c = cruce(i, j);
        const ancho = grosor(d[j], maxV, step);
        const medio = Math.max(grosor(d[i], maxV, step) * 0.85, 3);
        const cs = capas(j);
        cs.forEach((w, idx) => {
          ctx.strokeStyle = mezcla(tinte(j), P.mixer, aclarado(idx, cs.length));
          ctx.lineWidth = idx === 0 ? ancho : w;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y - medio);
          ctx.lineTo(c.x, c.y + medio);
          ctx.stroke();
        });
      }
    }

    // nudos: z = a·x
    let maxZ = 1e-9;
    const Z = m.A.map((fila, i) =>
      fila.map((a, j) => {
        const z = a * Math.max(0, d[j]);
        if (Math.abs(z) > maxZ) maxZ = Math.abs(z);
        return z;
      })
    );
    void Z[0];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const z = Z[i][j];
        if (Math.abs(z) < 1e-9) continue;
        const c = cruce(i, j);
        const r = Math.pow(Math.abs(z) / maxZ, 0.5) * step * 0.17;

        if (z > 0) {
          if (r < 1.2) continue;
          ctx.fillStyle = tinte(i);
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, r, r * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = P.panel;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        } else {
          const rr = Math.max(r, 4.2);
          ctx.strokeStyle = P.warn;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, rr, rr * 0.8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(c.x - rr * 0.6, c.y - rr * 0.6);
          ctx.lineTo(c.x + rr * 0.6, c.y + rr * 0.6);
          ctx.stroke();
        }
      }
    }

    // cabezas de hilo: la zona para agarrar y tirar
    for (let j = 0; j < n; j++) {
      const X = pos(j);
      const bw = Math.min(step * 0.6, 52);
      const bh = 20;
      const by = Math.max(2, pad * 0.45 - bh - 5);
      ctx.fillStyle = tinte(j);
      ctx.fillRect(X - bw / 2, by, bw, bh);
      ctx.fillStyle = P.panel;
      ctx.font = '600 10.5px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.nombres[j].slice(0, 3).toUpperCase(), X, by + bh / 2 + 0.5);
    }

    // la lanzadera cruzando
    if (tj) {
      const avance = Math.min(1, (performance.now() - ini.current) / pasoMs);
      const sx = x0 + avance * (x1 - x0);
      const sy = S - pad * 0.3;
      ctx.fillStyle = P.shuttle;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy);
      ctx.lineTo(sx, sy - 4.5);
      ctx.lineTo(sx + 12, sy);
      ctx.lineTo(sx, sy + 4.5);
      ctx.closePath();
      ctx.fill();
    }
  }, [geom]);

  /* ---------------- tamaño ---------------- */

  const dimensionar = useCallback(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const caja = cv.parentElement;
    const ancho = caja.clientWidth;
    if (!ancho) return;
    const S = Math.min(ancho, caja.clientHeight || ancho);
    ladoRef.current = S;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(S * dpr);
    cv.height = Math.round(S * dpr);
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujar();
  }, [dibujar]);

  useEffect(() => {
    paletaRef.current = leerPaleta();
    dimensionar();

    const ro = new ResizeObserver(dimensionar);
    if (cvRef.current?.parentElement) ro.observe(cvRef.current.parentElement);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const refrescar = () => {
      paletaRef.current = leerPaleta();
      dibujar();
    };
    mq.addEventListener('change', refrescar);

    return () => {
      ro.disconnect();
      mq.removeEventListener('change', refrescar);
    };
  }, [dimensionar, dibujar]);

  /* ---------------- suavizado propio, fuera de React ---------------- */

  useEffect(() => {
    let raf = 0;

    const bucle = () => {
      raf = requestAnimationFrame(bucle);
      const { acum: ac, paso: p, tejiendo: tj } = datos.current;
      if (!ac) return;

      const objetivo = ac[Math.min(p, ac.length - 1)];
      if (!suaveRef.current || suaveRef.current.length !== objetivo.length) {
        suaveRef.current = objetivo.slice();
        dibujar();
        return;
      }

      let movio = false;
      for (let i = 0; i < objetivo.length; i++) {
        const dif = objetivo[i] - suaveRef.current[i];
        if (Math.abs(dif) > 1e-3) {
          suaveRef.current[i] += dif * 0.3;
          movio = true;
        } else {
          suaveRef.current[i] = objetivo[i];
        }
      }
      if (movio || tj) dibujar();
    };

    raf = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(raf);
  }, [dibujar]);

  // Un cambio de ejercicio reinicia el suavizado y redibuja de una.
  useEffect(() => {
    suaveRef.current = null;
    dibujar();
  }, [modelo, dibujar]);

  // Cada pasada nueva reinicia el recorrido de la lanzadera.
  useEffect(() => {
    inicioRef.current = performance.now();
    dibujar();
  }, [paso, acum, dibujar]);

  /* ---------------- arrastrar un hilo ---------------- */

  const hiloEn = (px, py) => {
    const S = ladoRef.current;
    const { pad, step, pos } = geom(S, modelo.n);
    if (py > pad * 0.45 + step * 0.4) return -1;
    for (let j = 0; j < modelo.n; j++) {
      if (Math.abs(px - pos(j)) < step * 0.45) return j;
    }
    return -1;
  };

  const aLienzo = (e) => {
    const cv = cvRef.current;
    const r = cv.getBoundingClientRect();
    const S = ladoRef.current;
    return {
      px: ((e.clientX - r.left) / r.width) * S,
      py: ((e.clientY - r.top) / r.height) * S,
    };
  };

  const onPointerDown = (e) => {
    const { px, py } = aLienzo(e);
    const j = hiloEn(px, py);
    if (j < 0) return;
    arrastreRef.current = j;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (arrastreRef.current < 0) return;
    const { py } = aLienzo(e);
    const S = ladoRef.current;
    const { pad, inner } = geom(S, modelo.n);
    const t = Math.min(1, Math.max(0, (py - pad * 0.5) / inner));
    onDemanda(arrastreRef.current, Math.round(t * rangoY));
    e.preventDefault();
  };

  const soltar = (e) => {
    if (arrastreRef.current < 0) return;
    arrastreRef.current = -1;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
  };

  return (
    <div className="canvas-box">
      <canvas
        ref={cvRef}
        aria-label="Telar: un hilo por sector, con un anillo por pasada"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      />
    </div>
  );
}
