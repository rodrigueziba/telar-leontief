/**
 * Modelo de Leontief — TP4 de Modelos y Simulación (UNTDF, 2026).
 *
 * El modelo resuelve  x = A·x + y , cuya solución es  x = (I − A)⁻¹ y.
 * Pero (I − A)⁻¹ no es una caja negra: vale la serie de Neumann
 *
 *     (I − A)⁻¹ = I + A + A² + A³ + …
 *
 * así que la producción también se puede escribir como
 *
 *     x = y + A·y + A²·y + A³·y + …
 *
 * donde cada término es una vuelta más de la demanda por la cadena de
 * insumos. Ese es el hilo conductor de toda la pieza: relajar una tela
 * iterativamente es exactamente sumar esa serie.
 */

/* ------------------------------------------------------------------ *
 *  Álgebra
 * ------------------------------------------------------------------ */

export const eye = (n) =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

/** Inversa por Gauss-Jordan con pivoteo parcial. */
export function inv(M) {
  const n = M.length;
  const I = eye(n);
  const a = M.map((row, i) => row.concat(I[i]));

  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    }
    const tmp = a[c];
    a[c] = a[p];
    a[p] = tmp;

    const pivote = a[c][c];
    if (Math.abs(pivote) < 1e-14) throw new Error('La matriz no es invertible.');
    for (let k = 0; k < 2 * n; k++) a[c][k] /= pivote;

    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = a[r][c];
      if (!f) continue;
      for (let k = 0; k < 2 * n; k++) a[r][k] -= f * a[c][k];
    }
  }
  return a.map((row) => row.slice(n));
}

export const sub = (X, Y) => X.map((row, i) => row.map((v, j) => v - Y[i][j]));
export const mulV = (M, v) => M.map((row) => row.reduce((s, m, j) => s + m * v[j], 0));
export const suma = (v) => v.reduce((s, x) => s + x, 0);
export const sumaAbs = (v) => v.reduce((s, x) => s + Math.abs(x), 0);

/** Determinante por eliminación gaussiana (sólo para mostrarlo en la planilla). */
export function det(M) {
  const n = M.length;
  const a = M.map((r) => r.slice());
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    }
    if (Math.abs(a[p][c]) < 1e-14) return 0;
    if (p !== c) {
      const tmp = a[c];
      a[c] = a[p];
      a[p] = tmp;
      d = -d;
    }
    d *= a[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = a[r][c] / a[c][c];
      for (let k = c; k < n; k++) a[r][k] -= f * a[c][k];
    }
  }
  return d;
}

/**
 * Radio espectral por iteración de potencia sobre |A|.
 * Gobierna la convergencia: cada pasada vale aproximadamente ρ(A) de la
 * anterior, y la serie converge si y sólo si ρ(A) < 1.
 */
export function radioEspectral(A) {
  const n = A.length;
  let v = new Array(n).fill(1 / Math.sqrt(n));
  let lambda = 0;

  for (let k = 0; k < 400; k++) {
    const w = mulV(A, v).map(Math.abs);
    const norma = Math.sqrt(suma(w.map((x) => x * x)));
    if (norma < 1e-14) return 0;
    const siguiente = w.map((x) => x / norma);
    lambda = norma;

    let dif = 0;
    for (let i = 0; i < n; i++) dif = Math.max(dif, Math.abs(siguiente[i] - v[i]));
    v = siguiente;
    if (dif < 1e-13) break;
  }
  return lambda;
}

/**
 * Los términos de la serie.
 *
 *   terminos[m] = Aᵐ · y     → lo que deposita la pasada número m+1
 *   acum[m]     = Σ Aᵏ · y   → la tela acumulada tras m+1 pasadas
 *
 * Corta cuando el término cae por debajo de una millonésima del pedido
 * original, que es muy por debajo de lo que se muestra en pantalla.
 */
export function tejer(A, y, tope = 240) {
  const terminos = [y.slice()];
  const acum = [y.slice()];
  const escala = Math.max(sumaAbs(y), 1e-9);

  for (let m = 1; m < tope; m++) {
    const t = mulV(A, terminos[m - 1]);
    terminos.push(t);
    acum.push(acum[m - 1].map((v, i) => v + t[i]));
    if (sumaAbs(t) < 1e-9 * escala) break;
  }
  return { terminos, acum };
}

/* ------------------------------------------------------------------ *
 *  Los cuatro ejercicios, tal cual el enunciado
 * ------------------------------------------------------------------ */

export const EJERCICIOS = [
  {
    id: 1,
    tab: '2 sectores',
    titulo: 'Agricultura e Industria',
    nombres: ['Agricultura', 'Industria'],
    A: [
      [0.2, 0.3],
      [0.1, 0.4],
    ],
    y: [200, 150],
    consigna: 'Calcular el vector de producción x.',
  },
  {
    id: 2,
    tab: '3 sectores',
    titulo: 'Energía, Transporte y Manufactura',
    nombres: ['Energía', 'Transporte', 'Manufactura'],
    L: [
      [1.25, 0.10, 0.05],
      [0.20, 1.40, 0.10],
      [0.15, 0.20, 1.30],
    ],
    y: [0, 50, 0],
    consigna: 'Analizar el efecto de un aumento de 50 unidades de demanda final en Transporte.',
  },
  {
    id: 3,
    tab: '4 sectores',
    titulo: 'Agricultura, Industria, Transporte y Servicios',
    nombres: ['Agricultura', 'Industria', 'Transporte', 'Servicios'],
    A: [
      [0.1, 0.2, 0.1, 0.0],
      [0.1, 0.3, 0.2, 0.1],
      [0.0, 0.2, 0.2, 0.1],
      [0.1, 0.1, 0.1, 0.2],
    ],
    y: [100, 150, 80, 120],
    consigna: 'Calcular el vector de producción total x.',
  },
  {
    id: 4,
    tab: '5 sectores',
    titulo: 'Agricultura, Industria, Energía, Transporte y Servicios',
    nombres: ['Agricultura', 'Industria', 'Energía', 'Transporte', 'Servicios'],
    L: [
      [1.20, 0.10, 0.05, 0.00, 0.02],
      [0.15, 1.30, 0.10, 0.05, 0.00],
      [0.05, 0.10, 1.25, 0.10, 0.05],
      [0.10, 0.15, 0.10, 1.40, 0.10],
      [0.05, 0.05, 0.05, 0.10, 1.20],
    ],
    y: [0, 0, 100, 0, 0],
    consigna: 'Analizar el efecto de un aumento de 100 unidades de demanda final en Energía.',
  },
];

/**
 * Deriva todo lo que la pieza necesita de un ejercicio.
 *
 * Los ejercicios 1 y 3 dan A, así que L se calcula. Los ejercicios 2 y 4
 * dan L ya invertida, así que A se recupera como A = I − L⁻¹ — y ahí
 * aparece el hallazgo del ejercicio 4: dos coeficientes negativos, que
 * económicamente no pueden existir.
 */
export function preparar(ej) {
  const n = ej.nombres.length;
  const I = eye(n);

  let A;
  let L;
  let recuperada;

  if (ej.A) {
    A = ej.A.map((r) => r.slice());
    L = inv(sub(I, A));
    recuperada = false;
  } else {
    L = ej.L.map((r) => r.slice());
    A = sub(I, inv(L));
    recuperada = true;
  }

  const negativos = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (A[i][j] < -1e-9) negativos.push({ i, j, valor: A[i][j] });
    }
  }

  // Multiplicador del sector j = suma de la columna j de L: cuánto produce
  // toda la economía por cada unidad de demanda final dirigida a j.
  const mult = [];
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += L[i][j];
    mult.push(s);
  }

  return {
    ej,
    n,
    nombres: ej.nombres,
    A,
    L,
    recuperada,
    negativos,
    mult,
    rho: radioEspectral(A),
    detIA: det(sub(I, A)),
    yBase: ej.y.slice(),
  };
}

export const MODELOS = EJERCICIOS.map(preparar);

/* ------------------------------------------------------------------ *
 *  Formato
 * ------------------------------------------------------------------ */

export const nf = (v, d = 2) =>
  Number(v).toLocaleString('es-AR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
