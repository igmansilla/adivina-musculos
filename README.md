# Adiviná qué músculo 💪

Un juego de preguntas en vivo, estilo Kahoot, sobre los grupos musculares y la
elongación, para jugar con los acampantes del CAS. La pantalla grande muestra
una silueta y cada uno se une desde el celular con un código.

Es hermano de [`adivina-nubes`](../adivina-nubes) y de
[`toponimia`](../toponimia): misma mecánica, mismo puntaje, mismas chapas
A/B/C/D. El que jugó a uno entiende el otro sin explicación.

## Cómo se juega

1. En el proyector: abrí la app → **Crear juego** → aparece un código.
2. Los acampantes: misma URL en el celu → **Unirme** → código + nombre.
3. **Empezar juego**. En "Mostrar respuesta" contás lo que hay que contar.

## Qué pregunta

Ocho clases de pregunta, todas armadas desde el vault. Cuatro van de a pares,
la misma cosa de ida y de vuelta:

| Clase | Ejemplo |
|---|---|
| Ubicación | *Cuádriceps: ¿en cuál de las cuatro chapas?* |
| Identificar | *El grupo marcado en la silueta, ¿cuál es?* |
| Movimiento | *Cuádriceps: ¿qué movimiento controla este grupo?* |
| Quién | *«Extiende la rodilla.» ¿De qué grupo es ese movimiento?* |
| Elongación | *Cuádriceps: ¿qué movimiento elonga este grupo?* |
| Tren | *Dorsal: ¿de qué tren es este grupo y para qué sirve?* |
| Cuántos | *Cuádriceps: ¿cuántos músculos son?* |
| Concepto | *Al elongar, ¿qué se hace con el cuerpo?* |

El cuestionario se arma repartiendo entre clases, no sorteando del montón: si no,
la clase con más candidatas se lleva media ronda. Ningún grupo sale más de dos
veces, y no caen dos seguidas de la misma clase.

## El contenido

Sale de las notas de Ignacio y nada más. Las fichas que están incompletas
generan menos preguntas, y eso es correcto: ver `CLAUDE.md`.

Estado del vault: `vault/INDICE.md` (generado).

## Estructura

```
vault/               una ficha por grupo muscular + _conceptos.md
scripts/build-vault.mjs   vault/*.md → src/data/musculos.json + INDICE.md
src/cuerpo/          la silueta en SVG (silueta, dibujar, taller)
src/juego/           preguntas, sala (Firebase), host, jugador, puntaje, ensayo
src/ui/dom.ts        helpers de DOM
index.html           las nueve pantallas
```

## Correrlo

```
npm install
npm run build-vault
npm run dev
```

- `?ensayo` recorre las preguntas sin Firebase ni jugadores.
- `?silueta` dibuja las dos vistas con todas las regiones.

Para el juego en vivo hace falta un proyecto de Firebase con Realtime Database
y pegar su config en `src/juego/config.ts`. Sin eso la app avisa y el resto
funciona igual.

## Subirlo

Seguí **[DEPLOY.md](DEPLOY.md)**. `firebase deploy` corre el `build-vault` y el
`build` solo, así que nunca sube un `dist/` desactualizado.
