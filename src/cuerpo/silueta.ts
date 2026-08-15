import type { Region, Vista } from '../tipos';

/**
 * Las dos siluetas, de frente y de espalda, como SVG.
 *
 * Es un pictograma, no una lámina de anatomía: lo único que tiene que lograr es
 * que desde el fondo de un salón, proyectado, se distinga *cuál* región está
 * encendida. Por eso las formas son grandes y separadas, y por eso no hay
 * detalle de fibras ni de inserciones. Un dibujo más "correcto" se leería peor.
 *
 * Cada grupo es un <g id="reg-<region>"> que puede tener una forma (las que van
 * al medio: pectorales, psoas, glúteos, trapecios) o dos (las que vienen de a
 * pares: deltoides, cuádriceps, dorsal, isquiotibiales, gemelos). Encender un
 * grupo es ponerle una clase al <g>, así que el par se enciende junto.
 *
 * Sistema de coordenadas: viewBox 0 0 220 460, con la figura centrada en x=110.
 */

export const ANCHO = 220;
export const ALTO = 460;

/**
 * Las partes del cuerpo, en orden de atrás hacia adelante: los pies debajo de
 * las piernas, y el tronco encima de brazos y piernas para que la línea de
 * afuera del brazo no le cruce el pecho por el medio.
 */
const PARTES = [
  '<ellipse class="f-solido" cx="88" cy="416" rx="17" ry="10" />',
  '<ellipse class="f-solido" cx="132" cy="416" rx="17" ry="10" />',
  '<path class="f-brazo" d="M62 100 46 172l-6 66" />',
  '<path class="f-brazo" d="M158 100l16 72 6 66" />',
  '<path class="f-pierna" d="M92 222l-4 88 2 90" />',
  '<path class="f-pierna" d="M128 222l4 88-2 90" />',
  '<path class="f-solido" d="M56 104q0-18 20-20h68q20 2 20 20l-8 56q-4 12-4 24 0 14 2 38H66q2-24 2-38 0-12-4-24z" />',
  '<rect class="f-solido" x="100" y="62" width="20" height="24" rx="7" />',
  '<ellipse class="f-solido" cx="110" cy="40" rx="25" ry="28" />',
];

/**
 * Cada parte se dibuja dos veces: una gruesa en el color del trazo y otra más
 * fina encima en el color del relleno. Es el truco de siempre para que una
 * figura hecha de líneas tenga contorno, y es lo que hace que el cuerpo se lea
 * como un dibujo a lapicera y no como un pictograma de señalética.
 *
 * Van intercaladas parte por parte, no todos los contornos primero: así el
 * relleno del tronco tapa el contorno del brazo donde se juntan, que es
 * exactamente donde no va ninguna línea.
 */
const CUERPO = PARTES.map(
  (p) => `<g class="contorno">${p}</g><g class="relleno">${p}</g>`,
).join('');

/** Las regiones de cada vista. */
const REGIONES: Record<Vista, Partial<Record<Region, string>>> = {
  frente: {
    deltoides:
      '<ellipse cx="62" cy="104" rx="17" ry="19" /><ellipse cx="158" cy="104" rx="17" ry="19" />',
    pectorales:
      '<rect x="76" y="108" width="32" height="40" rx="14" /><rect x="112" y="108" width="32" height="40" rx="14" />',
    psoas:
      '<path d="M80 168l18 54 14-4-18-52z" /><path d="M140 168l-18 54-14-4 18-52z" />',
    cuadriceps:
      '<path d="M80 236q12-6 24 0l-3 64q-9 5-18 0z" /><path d="M140 236q-12-6-24 0l3 64q9 5 18 0z" />',
  },
  espalda: {
    trapecios: '<path d="M110 86l28 20-10 28H92l-10-28z" />',
    dorsal:
      '<path d="M72 134c22 12 34 36 36 70l-20-4c-14-18-22-42-16-66z" />' +
      '<path d="M148 134c-22 12-34 36-36 70l20-4c14-18 22-42 16-66z" />',
    gluteos: '<ellipse cx="96" cy="206" rx="18" ry="16" /><ellipse cx="124" cy="206" rx="18" ry="16" />',
    isquiotibiales:
      '<path d="M80 236q12-6 24 0l-3 64q-9 5-18 0z" /><path d="M140 236q-12-6-24 0l3 64q9 5 18 0z" />',
    gemelos:
      '<path d="M78 326q11-5 22 0l-3 50q-8 4-16 0z" /><path d="M142 326q-11-5-22 0l3 50q8 4 16 0z" />',
  },
};

/**
 * Dónde se apoya la chapa A/B/C/D de cada grupo. Van a mano y no calculadas del
 * bounding box, por dos razones: en los grupos de a pares el centro geométrico
 * cae en el aire, entre las dos formas; y una chapa justo en el medio del grupo
 * lo tapa entero, así que al revelar no se vería encenderse nada.
 *
 * Por eso van corridas sobre la forma izquierda del par: la chapa señala una y
 * la de la derecha queda limpia para verse encender.
 */
const CHAPAS: Record<Region, [number, number]> = {
  deltoides: [60, 96],
  pectorales: [92, 132],
  psoas: [93, 200],
  cuadriceps: [91, 266],
  trapecios: [110, 96],
  dorsal: [86, 166],
  gluteos: [96, 204],
  isquiotibiales: [91, 266],
  gemelos: [88, 350],
};

export const regionesDe = (vista: Vista): Region[] => Object.keys(REGIONES[vista]) as Region[];

export const vistaDe = (region: Region): Vista =>
  region in REGIONES.frente ? 'frente' : 'espalda';

export const centroDe = (region: Region): [number, number] => CHAPAS[region];

/** El SVG de una vista, sin chapas. Markup literal nuestro: no entra nada de afuera. */
export function siluetaSvg(vista: Vista): string {
  const regiones = Object.entries(REGIONES[vista])
    .map(([id, formas]) => `<g class="reg" id="reg-${id}">${formas}</g>`)
    .join('');
  return (
    `<svg class="silueta" viewBox="0 0 ${ANCHO} ${ALTO}" role="img" ` +
    `aria-label="Silueta de ${vista === 'frente' ? 'frente' : 'espalda'}">` +
    `<g class="cuerpo">${CUERPO}</g>` +
    `<g class="regiones">${regiones}</g>` +
    `<g class="chapas"></g>` +
    `</svg>`
  );
}
