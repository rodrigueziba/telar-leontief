/**
 * Paletas.
 *
 * Una paleta no es sólo cinco colores de sector: es un sistema completo.
 * Cinco colores saturados sobre el neutro equivocado se ven a la vez
 * chillones y sin contraste, así que cada paleta trae además sus propios
 * neutros, afinados para modo claro y para modo oscuro.
 *
 * El neutro de cada paleta lleva un sesgo de matiz hacia sus acentos — un
 * gris puro al lado de colores vivos se lee como gris sin decidir.
 */

const TOKENS_NEUTROS = [
  'ground',
  'panel',
  'panel-2',
  'sunk',
  'ink',
  'ink-soft',
  'ink-faint',
  'rule',
  'rule-soft',
  'shuttle',
  'warn',
  'mixer',
];

export const PALETAS = [
  {
    id: 'viva',
    nombre: 'Viva',
    pie: 'Acentos saturados sobre grafito frío',
    dyes: ['#FF5A5F', '#FFB400', '#3DDC84', '#00A6ED', '#8B5CF6'],
    claro: {
      ground: '#e9ecf2',
      panel: '#f6f8fb',
      'panel-2': '#e4e8f0',
      sunk: '#d8dde7',
      ink: '#161a21',
      'ink-soft': '#545b6b',
      'ink-faint': '#868e9f',
      rule: '#c7cedb',
      'rule-soft': '#dde2ec',
      shuttle: '#161a21',
      warn: '#d1004b',
      mixer: '#ffffff',
    },
    oscuro: {
      ground: '#0e1116',
      panel: '#171b22',
      'panel-2': '#1e242d',
      sunk: '#090b0f',
      ink: '#e9ecf2',
      'ink-soft': '#98a1b2',
      'ink-faint': '#6a7384',
      rule: '#2c323d',
      'rule-soft': '#222730',
      shuttle: '#e9ecf2',
      warn: '#ff2d6f',
      mixer: '#ffffff',
    },
  },
  {
    id: 'natural',
    nombre: 'Tintes naturales',
    pie: 'Añil, rubia, gualda, cardenillo y nogal sobre lino crudo',
    dyes: ['#2d4a7c', '#a33b2a', '#97681a', '#3f6659', '#6b5238'],
    dyesOscuro: ['#7099d8', '#e0705a', '#dca544', '#74a892', '#b39273'],
    claro: {
      ground: '#e4ded0',
      panel: '#efeae1',
      'panel-2': '#e7e0d3',
      sunk: '#d9d1c0',
      ink: '#221d17',
      'ink-soft': '#6b5f52',
      'ink-faint': '#958878',
      rule: '#c6bca6',
      'rule-soft': '#d6cebb',
      shuttle: '#221d17',
      warn: '#a33b2a',
      mixer: '#ffffff',
    },
    oscuro: {
      ground: '#191512',
      panel: '#241f19',
      'panel-2': '#2c251e',
      sunk: '#15120f',
      ink: '#ece4d6',
      'ink-soft': '#a3957f',
      'ink-faint': '#7a6e5d',
      rule: '#413830',
      'rule-soft': '#322b24',
      shuttle: '#ece4d6',
      warn: '#e0705a',
      mixer: '#ffffff',
    },
  },
  {
    id: 'okabe',
    nombre: 'Sin barreras',
    pie: 'Okabe–Ito: distinguible con cualquier tipo de daltonismo',
    dyes: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00'],
    dyesOscuro: ['#56B4E9', '#E8833A', '#00C48F', '#E4A0C4', '#F0C04A'],
    claro: {
      ground: '#eceae6',
      panel: '#f6f5f2',
      'panel-2': '#e6e4df',
      sunk: '#dcd9d3',
      ink: '#1b1a18',
      'ink-soft': '#5c5a55',
      'ink-faint': '#8d8a84',
      rule: '#cac7c0',
      'rule-soft': '#dedbd5',
      shuttle: '#1b1a18',
      warn: '#c00000',
      mixer: '#ffffff',
    },
    oscuro: {
      ground: '#14140f',
      panel: '#1e1e18',
      'panel-2': '#26261f',
      sunk: '#0e0e0a',
      ink: '#ecebe5',
      'ink-soft': '#9d9b93',
      'ink-faint': '#706e67',
      rule: '#35342c',
      'rule-soft': '#292821',
      shuttle: '#ecebe5',
      warn: '#ff6b6b',
      mixer: '#ffffff',
    },
  },
];

export const PALETA_DEFECTO = 'viva';
export const CLAVE_GUARDADO = 'telar-paleta';

/**
 * Escribe la paleta en las variables CSS del documento.
 *
 * La paleta por defecto vive en la hoja de estilos, así que aplicarla es
 * borrar las variables en línea y dejar que mande el CSS — eso evita el
 * parpadeo del primer pintado.
 */
export function aplicarPaleta(id, esOscuro) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  const paleta = PALETAS.find((p) => p.id === id) || PALETAS[0];

  const limpiar = () => {
    TOKENS_NEUTROS.forEach((t) => raiz.style.removeProperty(`--${t}`));
    for (let i = 1; i <= 5; i++) raiz.style.removeProperty(`--dye-${i}`);
  };

  if (paleta.id === PALETA_DEFECTO) {
    limpiar();
    return;
  }

  const neutros = esOscuro ? paleta.oscuro : paleta.claro;
  TOKENS_NEUTROS.forEach((t) => raiz.style.setProperty(`--${t}`, neutros[t]));

  const dyes = esOscuro && paleta.dyesOscuro ? paleta.dyesOscuro : paleta.dyes;
  dyes.forEach((c, i) => raiz.style.setProperty(`--dye-${i + 1}`, c));
}

/** Los cinco colores tal como se van a ver, para pintar el propio selector. */
export function muestrasDe(paleta, esOscuro) {
  return esOscuro && paleta.dyesOscuro ? paleta.dyesOscuro : paleta.dyes;
}
