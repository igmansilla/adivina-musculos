# Adiviná qué músculo — contexto del proyecto

Los nueve grupos musculares que aparecen en las notas de Ignacio: dónde está
cada uno, qué movimiento controla, cómo se elonga, y a qué tren pertenece. Un
juego en vivo sobre una silueta, para jugarlo con los acampantes del CAS.

Es el tercero de la familia: `adivina-nubes` (el original, JS vanilla) y
`toponimia` (el mismo motor ya ordenado, de donde sale este). La mecánica es la
misma a propósito: el que jugó a uno entiende el otro sin explicación.

## La regla que manda sobre todo lo demás

**Qué hace cada grupo muscular sale únicamente de lo que pasa Ignacio.**

Las notas vienen de una clase a la que fue él. Lo que se enseña acá no es
anatomía de manual: es cómo se elonga y cómo se controla el cuerpo, y eso tiene
criterio de quien enseña. Rellenar un hueco con anatomía general y presentarlo
como lo que dijo el profe es peor que dejar el hueco.

**Una ficha con huecos es un resultado correcto.** Lo que no se sabe va en
`## Sin confirmar`, explícito. Nunca se rellena.

Qué sí se puede resolver solo: decisiones técnicas, y **dónde queda un músculo
en el cuerpo**. Que el cuádriceps esté en la parte de adelante del muslo no está
en disputa; es el equivalente de las coordenadas de un refugio en `toponimia`.
Por eso `vista` y `region` los puede completar Claude, y `## Qué mueve` no.

Cuando algo se deriva de una regla que Ignacio escribió —el `## Cómo se elonga`
de los cuatro grupos de abajo sale de aplicar su "pensar en el movimiento
contrario al que hace el músculo"— se deja dicho en una cita `>` dentro de la
sección. El parser saca las citas, así que no llegan al juego, pero quedan a la
vista de Ignacio hasta que confirme y pase la ficha a `revisado`.

## Cómo se trabaja

```
Ignacio cuenta  →  vault/<slug>.md (estado: borrador)
                →  Ignacio confirma  →  estado: revisado
```

`vault/_conceptos.md` es un archivo aparte, con las preguntas de principio
(postura, control, calidad sobre cantidad). Su `estado` es del archivo entero:
mientras diga `borrador`, ninguna de esas preguntas entra al juego. Está así
porque las respuestas correctas son de Ignacio pero los distractores los redactó
Claude, y un distractor mal elegido enseña algo falso igual que una respuesta
mal puesta.

## El vault

Una ficha por grupo en `vault/<slug>.md`. Frontmatter:

| Campo     | Valores                                                    |
|-----------|------------------------------------------------------------|
| `nombre`  | como se lo nombra                                          |
| `tren`    | superior \| inferior \| vacío *(lo pone Ignacio)*           |
| `cadena`  | anterior \| posterior \| ninguna \| vacío *(íd.)*           |
| `funcion` | impulso \| estabilidad \| vacío *(íd.)*                     |
| `vista`   | frente \| espalda — en qué silueta se dibuja               |
| `region`  | el id del path en `src/cuerpo/silueta.ts`                  |
| `cuantos` | músculos del grupo, o vacío                                |
| `estado`  | borrador \| revisado                                        |

Cuerpo: el texto libre, después `## Qué mueve`, `## Cómo se elonga`,
`## Para el juego` (el dato que se lee al revelar) y `## Sin confirmar`.

`vault/INDICE.md` es **generado**: no editarlo a mano.

## Comandos

```
npm run build-vault   vault/*.md → src/data/musculos.json + vault/INDICE.md
npm run dev           levanta la app
npm run build         tsc + vite build
```

`build-vault` **valida** y falla si una ficha tiene un `tren`/`cadena`/`funcion`
fuera de lista, una `region` que la silueta no sabe dibujar, una `region` que no
corresponde a la `vista` declarada, o está en `revisado` sin `## Qué mueve`.
Correrlo después de tocar el vault.

- `http://localhost:5173/?ensayo` recorre las preguntas sin Firebase ni
  jugadores: sirve para revisar el cuestionario.
- `http://localhost:5173/?silueta` es el taller: dibuja las dos vistas con todas
  las regiones y sus chapas. Es para trabajar el dibujo sin tener que jugar una
  partida entera hasta que salga la pregunta de la región que tocás.

## La app

- `src/cuerpo/` — la silueta. Es SVG inline, no canvas: las regiones son
  elementos con `id`, así que encenderlas es una clase, y la figura escala sola
  al proyector sin escuchar `resize` (a diferencia del mapa de `toponimia`).
  El cuerpo se dibuja dos veces —`.contorno` grueso, `.relleno` fino encima—
  para que se lea como un dibujo a lapicera.
- `src/juego/preguntas.ts` — arma el cuestionario desde el vault. Cinco clases:
  ubicación, movimiento, elongación, tren y concepto. Los distractores son
  siempre datos reales de otro grupo, nunca explicaciones inventadas.
- `src/juego/sala.ts` — todo lo que toca Firebase. Nada más lo importa.
- `src/juego/host.ts` — la pantalla que se proyecta. `jugador.ts` — el celu.

Mecánica: la silueta con cuatro chapas (A/B/C/D) va en el proyector; el celular
es sólo cuatro botones. Es la misma chapa en los dos lados, a propósito.

En las preguntas que ya nombran el grupo (movimiento, elongación, tren) la
región va encendida de entrada: saber dónde está el cuádriceps no adelanta qué
movimiento hace, y ayuda a seguir la explicación.

## Estado

El andamiaje está entero y el juego anda. Faltan **los huecos del vault**: hoy
sólo los cuatro grupos del tren inferior (cuádriceps, isquiotibiales, glúteos,
gemelos) tienen `## Qué mueve` escrito, así que sólo esos generan preguntas de
movimiento y de elongación. Los cinco de arriba y el psoas están cargados con lo
que dicen las notas y el resto marcado en `## Sin confirmar`. Las preguntas
aparecen solas a medida que Ignacio complete.

Falta también pegar la config de Firebase en `src/juego/config.ts`.
