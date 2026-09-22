/**
 * La capa sonora del telar.
 *
 * La idea es una sola y es la misma que sostiene la parte visual: cada
 * pasada de la lanzadera deposita un término de la serie de Neumann. Acá
 * ese término se escucha.
 *
 *   · El VOLUMEN del golpe es lo que esa pasada aportó a la producción.
 *     Como cada término vale aproximadamente ρ(A) del anterior, el ritmo
 *     se apaga geométricamente: la convergencia de la serie es audible.
 *
 *   · El ACORDE del golpe es la composición de esa pasada por sector.
 *     Cada sector tiene su altura en una pentatónica menor y suena con la
 *     amplitud de su propia contribución, así que se oye qué sectores
 *     empujaron en cada vuelta.
 *
 * El timbre es de madera golpeada, no de sintetizador: un transitorio de
 * ruido filtrado (el peine contra la trama) más resonancias cortas. Un
 * telar es una máquina percusiva.
 */

// Pentatónica menor sobre A3 — baja y con cuerpo, una altura por sector.
const ALTURAS = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];

export class TelarAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ruido = null;
  }

  get activo() {
    return Boolean(this.ctx) && this.ctx.state === 'running';
  }

  /** Requiere un gesto del usuario: los navegadores no permiten otra cosa. */
  async encender() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return true;
    }
    const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return false;

    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.85;

    // Un compresor suave evita que los primeros golpes saturen cuando hay
    // cinco sectores sonando a la vez.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 14;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.16;

    master.connect(comp);
    comp.connect(ctx.destination);

    this.ctx = ctx;
    this.master = master;
    this.ruido = this.#bufferDeRuido(ctx);

    if (ctx.state === 'suspended') await ctx.resume();
    return true;
  }

  async apagar() {
    if (!this.ctx) return;
    try {
      await this.ctx.close();
    } catch {
      /* ya estaba cerrado */
    }
    this.ctx = null;
    this.master = null;
    this.ruido = null;
  }

  #bufferDeRuido(ctx) {
    const largo = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, largo, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** El transitorio de madera: el peine ajustando la trama. */
  #peine(t0, intensidad) {
    const { ctx, master, ruido } = this;
    const src = ctx.createBufferSource();
    src.buffer = ruido;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500 + Math.random() * 700;
    bp.Q.value = 1.1;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.5 * intensidad, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);

    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + 0.12);
  }

  /** La resonancia de un sector: una barra de madera con su propia altura. */
  #barra(t0, freq, amp) {
    const { ctx, master } = this;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * 7, t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.4, 120), t0 + 0.3);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);

    osc.connect(lp);
    lp.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.45);
  }

  /**
   * Un golpe = una pasada.
   *
   * @param {number[]} termino    contribución de esta pasada, por sector
   * @param {number}   referencia la contribución de la primera pasada
   */
  golpe(termino, referencia) {
    if (!this.activo) return;
    const total = termino.reduce((s, v) => s + Math.abs(v), 0);
    const ref = Math.max(referencia, 1e-9);

    // Mapeo lineal a propósito: es lo que hace audible el decaimiento.
    // El piso apenas mantiene perceptibles las últimas pasadas antes del
    // silencio, que es como termina de verdad una tela.
    const intensidad = Math.min(1, 0.03 + (total / ref) * 0.97);
    if (intensidad < 0.035) return;

    const t0 = this.ctx.currentTime + 0.01;
    this.#peine(t0, intensidad);

    termino.forEach((v, i) => {
      const parte = total > 0 ? Math.abs(v) / total : 0;
      const amp = 0.3 * intensidad * parte;
      if (amp < 0.0025) return;
      // un desfase mínimo por sector: el golpe suena a madera, no a órgano
      this.#barra(t0 + i * 0.006, ALTURAS[i % ALTURAS.length], amp);
    });
  }

  /** La tela terminada: el acorde de x, una vez, suave. */
  acorde(x) {
    if (!this.activo) return;
    const total = x.reduce((s, v) => s + Math.abs(v), 0);
    if (total <= 0) return;
    const t0 = this.ctx.currentTime + 0.04;
    x.forEach((v, i) => {
      const parte = Math.abs(v) / total;
      this.#barra(t0 + i * 0.05, ALTURAS[i % ALTURAS.length] / 2, 0.16 * parte);
    });
  }
}
