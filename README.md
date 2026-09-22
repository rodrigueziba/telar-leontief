# Telar de Leontief

Los cuatro ejercicios del **TP4 de Modelos y Simulación** (UNTDF, 2026) resueltos como un
telar: cada sector es un hilo, y la tela se teje pasada por pasada.

La idea que sostiene la pieza es que **relajar una tela no se parece a invertir (I − A) —
es la misma cuenta**. No es una analogía decorativa: es una equivalencia exacta, verificada
contra la inversa con un error de 10⁻¹⁰.

Stack: **Next.js 15 (App Router) + React 19 + Web Audio API**. Sin dependencias externas.

---

## Correrlo

```bash
npm install
npm run dev      # http://localhost:3000
```

## Subirlo a Vercel

```bash
git remote add origin git@github.com:rodrigueziba/telar-leontief.git
git push -u origin main
```

Después, en vercel.com: *Add New → Project → Import*. Vercel detecta Next.js solo. No hay
variables de entorno ni configuración adicional.

Desde la terminal, alternativamente:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # producción
```

---

## La equivalencia

El modelo de Leontief plantea que la producción se reparte entre insumos y mercado:

```
x = A·x + y
```

y su solución es `x = (I − A)⁻¹ y`. Pero esa inversa no es una caja negra: vale la serie de
Neumann, igual que `1/(1−r) = 1 + r + r² + …` vale para números.

```
(I − A)⁻¹ = I + A + A² + A³ + …

x = y + A·y + A²·y + A³·y + …
```

Cada término es **una vuelta más de la demanda por la cadena de insumos**.

Ahora la regla física del telar. Un hilo se desplaza por su propia demanda más lo que lo
arrastran los hilos que lo cruzan:

```
d = y + A·d
```

En equilibrio, `d = (I − A)⁻¹ y = x`. Y como una tela se relaja **iterativamente**, cuadro a
cuadro, esa relajación es literalmente `d ← y + A·d`, que es la serie de Neumann corriendo a
60 cuadros por segundo. La tela no ilustra el cálculo: lo ejecuta.

De ahí sale el vocabulario, que cierra solo: cada término de la serie es **una pasada de la
lanzadera**.

## Cómo se lee la pieza

| Elemento | Qué codifica |
| --- | --- |
| Grosor del hilo | producción acumulada del sector (`x^0,6`, para que un sector chico siga siendo visible) |
| Anillos del hilo | una capa por pasada; el núcleo es la demanda final y cada capa más clara es una vuelta más |
| Urdimbre y trama | el mismo sector aparece como columna (cuando consume) y como fila (cuando provee) |
| Bulto de un cruce | `z_ij = a_ij · x_j`, el insumo que el sector *i* le entrega al *j* |
| Cruce tachado en rojo | coeficiente negativo: ese hilo empujaría en vez de tirar, y una tela así no se puede tejer |
| Bandas de «la tela» | una por pasada, con el largo proporcional a lo que esa pasada aportó |
| Cola rayada | las pasadas restantes, demasiado finas para dibujarse: eso es la convergencia |

La suma de todos los bultos da exactamente el consumo intermedio total, y los números del
panel y de la planilla son los exactos, sin ninguna escala de por medio.

## La capa sonora

Con «Escuchar el telar», cada pasada suena como un golpe del peine ajustando la trama.

- El **volumen** del golpe es lo que esa pasada aportó a la producción. Como cada término vale
  aproximadamente ρ(A) del anterior, el ritmo se apaga geométricamente: **la convergencia de
  la serie se escucha**.
- El **acorde** del golpe es la composición de esa pasada por sector. Cada sector tiene su
  altura en una pentatónica menor y suena con la amplitud de su propia contribución.
- Al terminar la tela suena una vez el acorde de `x`.

El timbre es de madera golpeada, no de sintetizador: un transitorio de ruido filtrado más
resonancias cortas. Un telar es una máquina percusiva.

El audio requiere un gesto del usuario para arrancar — los navegadores no permiten otra cosa.

## Resultados

| | Resultado | Multiplicador | ρ(A) |
| --- | --- | --- | --- |
| **Ej 1** | x = (366,67 ; 311,11) | Industria 2,44 | 0,5000 |
| **Ej 2** | Δx = (5 ; 70 ; 10), total 85 | Transporte 1,70 | 0,3682 |
| **Ej 3** | x = (210,97 ; 341,31 ; 216,08 ; 246,05) | Industria 2,86 | 0,5654 |
| **Ej 4** | Δx = (5 ; 10 ; 125 ; 10 ; 5), total 155 | Energía 1,55 | 0,3697 |

Los cuatro verificados contra `numpy`. En los que dan A se comprueba además que `x = Ax + y`
cierra fila por fila.

### El hallazgo del ejercicio 4

Los ejercicios 2 y 4 dan `(I − A)⁻¹` ya invertida, así que la matriz técnica se recupera como
`A = I − L⁻¹`. En el ejercicio 4 eso devuelve **dos coeficientes negativos** (−0,0052 y
−0,0060).

Un coeficiente técnico negativo no puede existir: significaría consumir insumo negativo. La
matriz del enunciado está redondeada, no derivada de una A real. No se corrigió: esos dos
cruces se dibujan tachados en rojo y quedan a la vista como dos agujeros en la tela. El
efecto sobre `x` es menor al 0,06%, y los resultados que se muestran usan la `L` del
enunciado, así que dan exactos.

## Controles

| | |
| --- | --- |
| Arrastrar la cabeza de un hilo | cambiar su demanda final |
| Tocar una banda de la tela | saltar a esa pasada |
| `←` `→` | pasada anterior / siguiente |
| Tejer desde cero | reproducir la serie completa |
| Ver planilla | las cuatro matrices con todos los decimales |

El **modo planilla** existe por una razón concreta: un profesor tiene que poder leer 366,67 en
pantalla. Si la pieza fuera sólo la experiencia, dejaría de ser un trabajo práctico.

## Estructura

```
app/
  layout.js         tipografías y metadatos
  page.js           punto de entrada
  globals.css       el sistema visual completo
  icon.svg          favicon
components/
  Telar.jsx         estado, navegación entre pasadas, disparo del sonido
  LoomCanvas.jsx    el telar: hilos, anillos, entrelazado, nudos, arrastre
  Tela.jsx          la tela acumulada, una banda por pasada
  Inspector.jsx     una pasada desarmada: A × la pasada anterior, término por término
  Panel.jsx         los números exactos
  Planilla.jsx      A, L, la matriz de transacciones y los multiplicadores
lib/
  leontief.js       álgebra (inversa, determinante, radio espectral, la serie) y los datos del TP
  audio.js          el telar sonoro
```

`lib/leontief.js` no toca el DOM y `lib/audio.js` no sabe nada de React, así que la matemática
y el sonido se pueden probar por separado del render.

## Diseño

Tintes naturales sobre lino crudo: añil, rubia, gualda, cardenillo y nogal, un tinte por
sector. Claro y oscuro según la preferencia del sistema. Tipografía Bricolage Grotesque para
los títulos e IBM Plex Mono para todo dato numérico, porque un patrón de tejido es una grilla
monoespaciada.

Sin glassmorphism: el vidrio esmerilado pelea materialmente con la lana y el lino, y resta
contraste justo donde hay que leer números. La profundidad se consigue con material — el
entrelazado pasando por arriba y por abajo, y los anillos apilándose — en vez de con un motor
3D.

Responsive hasta ancho de teléfono: en vertical la tela pasa a ser horizontal debajo del
telar. Respeta `prefers-reduced-motion` (no reproduce la serie sola) y el foco de teclado es
visible.
