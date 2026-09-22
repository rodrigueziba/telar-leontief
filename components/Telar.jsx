'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODELOS, nf, suma, sumaAbs, tejer } from '@/lib/leontief';
import { TelarAudio } from '@/lib/audio';
import { CLAVE_GUARDADO, PALETA_DEFECTO, PALETAS, aplicarPaleta } from '@/lib/paletas';
import LoomCanvas from './LoomCanvas';
import Tela from './Tela';
import Inspector from './Inspector';
import Panel from './Panel';
import Planilla from './Planilla';
import Paleta from './Paleta';
import Intro from './Intro';

const PASO_MS = 460;
const INICIAL = 2; // el ejercicio 3: cuatro sectores, la tela más legible

export default function Telar() {
  const [idx, setIdx] = useState(INICIAL);
  const [y, setY] = useState(() => MODELOS[INICIAL].yBase.slice());
  const [paso, setPaso] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [planilla, setPlanilla] = useState(false);
  const [paleta, setPaleta] = useState(PALETA_DEFECTO);
  const [esOscuro, setEsOscuro] = useState(false);

  const audioRef = useRef(null);
  const reducido = useRef(false);

  const modelo = MODELOS[idx];

  const { terminos, acum } = useMemo(() => tejer(modelo.A, y), [modelo, y]);
  const x = acum[acum.length - 1];
  const total = suma(x);
  const referencia = sumaAbs(terminos[0]);
  const ultimo = terminos.length - 1;
  const rangoY = Math.max(...modelo.yBase, 50) * 2;

  /* ---------------- arranque ---------------- */

  useEffect(() => {
    reducido.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    audioRef.current = new TelarAudio();
    const motor = audioRef.current;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sincronizar = () => setEsOscuro(mq.matches);
    sincronizar();
    mq.addEventListener('change', sincronizar);

    let guardada = null;
    try {
      guardada = window.localStorage.getItem(CLAVE_GUARDADO);
    } catch {
      /* sin almacenamiento: se usa la de defecto */
    }
    if (guardada && PALETAS.some((p) => p.id === guardada)) setPaleta(guardada);

    return () => {
      mq.removeEventListener('change', sincronizar);
      motor.apagar();
    };
  }, []);

  // La paleta se escribe en las variables CSS del documento.
  useEffect(() => {
    aplicarPaleta(paleta, esOscuro);
  }, [paleta, esOscuro]);

  const cambiarPaleta = (id) => {
    setPaleta(id);
    try {
      window.localStorage.setItem(CLAVE_GUARDADO, id);
    } catch {
      /* no se pudo guardar la preferencia; no es grave */
    }
  };

  /* ---------------- sonido ---------------- */

  // Un golpe del peine por pasada: el volumen es lo que esa pasada aportó.
  const sonar = useCallback(
    (p) => {
      if (!audio || !audioRef.current) return;
      const t = terminos[Math.min(p, ultimo)];
      if (t) audioRef.current.golpe(t, referencia);
    },
    [audio, terminos, ultimo, referencia]
  );

  const alternarAudio = async () => {
    const motor = audioRef.current;
    if (!motor) return;
    if (audio) {
      await motor.apagar();
      audioRef.current = new TelarAudio();
      setAudio(false);
      return;
    }
    const ok = await motor.encender();
    setAudio(ok);
    if (ok) motor.golpe(terminos[Math.min(paso, ultimo)], referencia);
  };

  /* ---------------- navegación ---------------- */

  const irA = useCallback(
    (p) => {
      const destino = Math.max(0, Math.min(p, ultimo));
      setReproduciendo(false);
      setPaso(destino);
      sonar(destino);
    },
    [ultimo, sonar]
  );

  const tejerDesdeCero = () => {
    setPaso(0);
    sonar(0);
    if (!reducido.current) setReproduciendo(true);
  };

  const restaurar = () => {
    setY(modelo.yBase.slice());
    setPaso(0);
    sonar(0);
    if (!reducido.current) setReproduciendo(true);
  };

  const cambiarEjercicio = (i) => {
    setIdx(i);
    setY(MODELOS[i].yBase.slice());
    setPaso(0);
    if (!reducido.current) setReproduciendo(true);
  };

  const cambiarDemanda = useCallback((j, valor) => {
    setReproduciendo(false);
    setY((prev) => {
      if (prev[j] === valor) return prev;
      const siguiente = prev.slice();
      siguiente[j] = valor;
      return siguiente;
    });
  }, []);

  // Si al cambiar la demanda la serie se acorta, el paso puede quedar afuera.
  useEffect(() => {
    setPaso((p) => Math.min(p, terminos.length - 1));
  }, [terminos]);

  /* ---------------- la lanzadera avanzando ---------------- */

  useEffect(() => {
    if (!reproduciendo) return undefined;

    const id = setInterval(() => {
      setPaso((p) => {
        if (p >= ultimo) {
          setReproduciendo(false);
          if (audio && audioRef.current) audioRef.current.acorde(x);
          return p;
        }
        const siguiente = p + 1;
        if (audio && audioRef.current) {
          audioRef.current.golpe(terminos[siguiente], referencia);
        }
        return siguiente;
      });
    }, PASO_MS);

    return () => clearInterval(id);
  }, [reproduciendo, ultimo, audio, terminos, referencia, x]);

  /* ---------------- teclado ---------------- */

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        irA(paso + 1);
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') {
        irA(paso - 1);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [irA, paso]);

  return (
    <div className="wrap">
      <header className="cab">
        <p className="eyebrow">Modelos y Simulación · UNTDF · Trabajo Práctico 4</p>
        <h1>Telar de Leontief</h1>
        <p className="sub">
          Una economía tejida hilo por hilo. Cada sector es un hilo, y la tela se arma en pasadas
          sucesivas hasta que deja de moverse: ahí está la respuesta del modelo. Relajar esta tela{' '}
          <b>no se parece</b> a resolver el sistema — es la misma cuenta.
        </p>
      </header>

      <hr className="rule" />

      <Intro />

      <nav className="tabs" role="tablist" aria-label="Ejercicios del trabajo práctico">
        {MODELOS.map((m, i) => (
          <button
            key={m.ej.id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={i === idx}
            onClick={() => cambiarEjercicio(i)}
          >
            <b>Ejercicio {m.ej.id}</b>
            {m.ej.tab} · {m.ej.titulo}
          </button>
        ))}
      </nav>

      <main className="stage">
        <section className="zona-telar">
          <div className="loom-area">
            <LoomCanvas
              modelo={modelo}
              acum={acum}
              paso={paso}
              x={x}
              y={y}
              tejiendo={reproduciendo}
              pasoMs={PASO_MS}
              paletaId={`${paleta}-${esOscuro}`}
              onDemanda={cambiarDemanda}
              rangoY={rangoY}
            />
            <Tela
              terminos={terminos}
              total={total}
              paso={paso}
              nombres={modelo.nombres}
              onIr={irA}
            />
          </div>

          <div className="controls">
            <button type="button" className="act primary" onClick={tejerDesdeCero}>
              Tejer desde cero
            </button>
            <button type="button" className="act" onClick={restaurar}>
              Demanda del enunciado
            </button>
            <button
              type="button"
              className={audio ? 'act on' : 'act'}
              onClick={alternarAudio}
              aria-pressed={audio}
            >
              {audio ? 'Silenciar el telar' : 'Escuchar el telar'}
            </button>
            <button type="button" className="act" onClick={() => setPlanilla((v) => !v)}>
              {planilla ? 'Ocultar planilla' : 'Ver planilla'}
            </button>
            <Paleta actual={paleta} esOscuro={esOscuro} onCambiar={cambiarPaleta} />
          </div>

          <p className="hint just">
            <b>Agarrá cualquier punto de un hilo</b> y tiralo hacia arriba para pedirle más
            producción, o hacia abajo para pedirle menos; el hilo se ilumina cuando está tomado.
            Tocá una banda de la tela para saltar a esa pasada, o movete con las flechas ← →.
            {audio && (
              <>
                {' '}
                Con el sonido activo, el volumen de cada golpe es lo que esa pasada aportó: la
                serie se apaga y se escucha apagarse.
              </>
            )}
          </p>
        </section>

        <div className="zona-insp">
          <Inspector
            modelo={modelo}
            terminos={terminos}
            acum={acum}
            paso={paso}
            total={total}
            onIr={irA}
          />
        </div>

        <aside className="zona-panel">
          <Panel modelo={modelo} terminos={terminos} acum={acum} paso={paso} x={x} y={y} />
        </aside>
      </main>

      {planilla && <Planilla modelo={modelo} x={x} y={y} />}

      <footer>
        <p className="just">
          El grosor del hilo va como <span className="formula">x^0,6</span> para que un sector
          chico siga siendo visible al lado de uno grande; los números del panel y de la planilla
          son exactos, sin escalar. Cada <b>anillo</b> dentro de un hilo es una pasada: el núcleo
          es la demanda final y cada capa más clara es una vuelta más por la cadena de insumos.
        </p>
        <p className="just">
          El bulto de cada cruce es <span className="formula">z(i,j) = a(i,j) · x(j)</span>, el
          insumo que el sector <em>i</em> le entrega al <em>j</em>. La suma de todos los bultos da
          el consumo intermedio total, que en este ejercicio es {nf(total - suma(y))}. En los
          ejercicios 2 y 4 el enunciado da <span className="formula">(I−A)⁻¹</span> ya invertida,
          así que la matriz técnica se recupera como{' '}
          <span className="formula">A = I − L⁻¹</span> para poder tejerla.
        </p>
      </footer>
    </div>
  );
}
