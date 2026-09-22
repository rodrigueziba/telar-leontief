'use client';

/*
 * Para alguien que entra sin saber nada de economía ni de matrices.
 *
 * Tres tarjetas, en el orden en que uno mira la pantalla: qué está viendo,
 * por qué se teje de a pasadas, y qué puede tocar.
 */

export default function Intro() {
  return (
    <section className="intro" aria-label="Cómo se lee esta página">
      <article className="paso" style={{ '--acento': 'var(--dye-4)' }}>
        <h3>
          <span>01</span>Qué estás mirando
        </h3>
        <p className="just">
          Una economía donde los sectores se compran cosas entre sí. Para producir alimentos hace
          falta combustible, y para producir combustible hacen falta alimentos.{' '}
          <b>Cada hilo del telar es un sector</b>, y su grosor es cuánto tiene que producir.
        </p>
        <p className="just">
          Un mismo sector aparece dos veces: como hilo vertical cuando compra y como hilo
          horizontal cuando vende. Los bultos de los cruces son las compras entre ellos.
        </p>
      </article>

      <article className="paso" style={{ '--acento': 'var(--dye-2)' }}>
        <h3>
          <span>02</span>Por qué se teje de a pasadas
        </h3>
        <p className="just">
          Si el mercado pide 100 de alimentos, no alcanza con producir 100: hay que producir
          además el combustible que eso consume, y los alimentos que consume ese combustible, y
          así. <b>Cada vuelta es una pasada</b> y se teje encima de la anterior.
        </p>
        <p className="just">
          Cada pasada es más chica que la anterior, así que en algún momento se apaga. Ese es el
          motivo por el que una suma infinita termina dando un número concreto.
        </p>
      </article>

      <article className="paso" style={{ '--acento': 'var(--dye-3)' }}>
        <h3>
          <span>03</span>Qué podés tocar
        </h3>
        <p className="just">
          Apretá <b>Tejer desde cero</b> y mirá cómo se arma la tela pasada por pasada.{' '}
          <b>Agarrá cualquier hilo y tiralo hacia arriba</b> para pedirle más producción, o hacia
          abajo para pedirle menos: toda la tela se reacomoda.
        </p>
        <p className="just">
          A la derecha, cada banda de «la tela» es una pasada y su alto es cuánto aportó. Tocá una
          para saltar a ella y ver la cuenta exacta abajo.
        </p>
      </article>
    </section>
  );
}
