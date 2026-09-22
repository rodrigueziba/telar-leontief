'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODELOS, nf, suma, sumaAbs, tejer } from '@/lib/leontief';
import { TelarAudio } from '@/lib/audio';
import LoomCanvas from './LoomCanvas';
import Tela from './Tela';
import Inspector from './Inspector';
import Panel from './Panel';
import Planilla from './Planilla';

const PASO_MS = 460;
const INICIAL = 2; // el ejercicio 3: cuatro sectores, la tela más legible

export default function Telar() {
  const [idx, setIdx] = useState(INICIAL);
  const [y, setY] = useState(() => MODELOS[INICIAL].yBase.slice());
  const [paso, setPaso] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [planilla, setPlanilla] = useState(false);

  const audioRef = useRef(null);
  const reducido = useRef(false);

  const modelo = MODELOS[idx];

  const { terminos, acum } = useMemo(() => tejer(modelo.A, y), [modelo, y]);
  const x = acum[acum.length - 1];
  const total = suma(x);
  const referencia = sumaAbs(terminos[0]);
  const ultimo = terminos.length - 1;
  const rangoY = Math.max(...modelo.yBase, 50) * 2;

  useEffect(() => {
    reducido.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    audioRef.current = new TelarAudio();
    const motor = audioRef.current;
    return () => {
      motor.apagar();
    };
  }, []);

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
      <header>
        <p className="eyebrow">Modelos y Simulación · UNTDF · TP4</p>
        <h1>Telar de Leontief</h1>
        <p className="lede">
          Un hilo por sector. Un hilo se mueve por <b>su propia demanda</b> más{' '}
          <b>lo que lo arrastran los hilos que lo cruzan</b>:{' '}
          <span className="eq-inline">d = y + A·d</span>. Relajar la tela hasta que deja de moverse
          no <em>se parece</em> a invertir <span className="eq-inline">(I−A)</span> — es la misma
          cuenta. Cada pasada de la lanzadera agrega un término de{' '}
          <span className="eq-inline">I + A + A² + A³ + …</span>
        </p>
      </header>

      <hr className="rule" />

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
            {m.ej.tab}
          </button>
        ))}
      </nav>

      <main className="stage">
        <section>
          <div className="loom-area">
            <LoomCanvas
              modelo={modelo}
              acum={acum}
              paso={paso}
              x={x}
              tejiendo={reproduciendo}
              pasoMs={PASO_MS}
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
          </div>

          <p className="hint">
            Arrastrá hacia abajo la cabeza de un hilo para cambiarle la demanda final. Tocá una
            banda de la tela para saltar a esa pasada, o usá las flechas ← →.
            {audio && (
              <>
                {' '}
                Con el sonido activo, el volumen de cada golpe es lo que esa pasada aportó: la serie
                se apaga y se escucha apagarse.
              </>
            )}
          </p>
        </section>

        <aside>
          <Panel
            modelo={modelo}
            terminos={terminos}
            acum={acum}
            paso={paso}
            x={x}
            y={y}
          />
        </aside>
      </main>

      <Inspector
        modelo={modelo}
        terminos={terminos}
        acum={acum}
        paso={paso}
        total={total}
        onIr={irA}
      />

      {planilla && <Planilla modelo={modelo} x={x} y={y} />}

      <footer>
        <p>
          El grosor del hilo va como <code>x^0,6</code> para que un sector chico siga siendo visible
          al lado de uno grande; los números del panel y de la planilla son exactos, sin escalar.
          Cada <b>anillo</b> dentro de un hilo es una pasada: el núcleo es la demanda final y cada
          capa más clara es una vuelta más por la cadena de insumos.
        </p>
        <p>
          El bulto de cada cruce es <code>z_ij = a_ij · x_j</code>, el insumo que el sector{' '}
          <em>i</em> le entrega al <em>j</em>. La suma de todos los bultos da el consumo intermedio
          total ({nf(total - suma(y))} en este ejercicio). En los ejercicios 2 y 4 el enunciado da{' '}
          <code>(I−A)⁻¹</code> ya invertida, así que la matriz técnica se recupera como{' '}
          <code>A = I − L⁻¹</code> para poder tejerla.
        </p>
      </footer>
    </div>
  );
}
