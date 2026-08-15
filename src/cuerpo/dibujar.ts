import type { Chapa, Region, Vista } from '../tipos';
import { LETRAS } from '../ui/dom';
import { centroDe, siluetaSvg } from './silueta';

/**
 * Pinta la silueta en un contenedor. El equivalente de dibujarMapa() de
 * toponimia, pero en SVG en vez de canvas: acá las regiones son elementos con
 * id, así que encender una es ponerle una clase —no hay que recalcular ninguna
 * proyección— y la figura escala sola al proyector sin escuchar `resize`.
 */

const NS = 'http://www.w3.org/2000/svg';

export interface OpcionesCuerpo {
  vista: Vista;
  /** Las cuatro opciones apoyadas sobre la silueta. Solo en las de ubicación. */
  chapas?: Chapa[];
  /** Índice de la opción correcta: enciende esa región y su chapa. */
  revelar?: number;
  /** Una región encendida desde el arranque, sin chapas: el grupo del que se habla. */
  resaltar?: Region;
}

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  atributos: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, String(v));
  return n;
}

/** El lado de la chapa, en unidades del viewBox. */
const LADO = 28;

function chapa(region: Region, opcion: number, acertada: boolean): SVGGElement {
  const [x, y] = centroDe(region);
  const g = svg('g', { class: `chapa chapa--${opcion}${acertada ? ' is-correcta' : ''}` });
  // Cuadrado redondeado, no círculo: es la misma chapa que el jugador tiene en
  // el pulgar. Que sean el mismo objeto en los dos lados es el punto.
  g.append(svg('rect', { x: x - LADO / 2, y: y - LADO / 2, width: LADO, height: LADO, rx: 9 }));
  const t = svg('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  t.textContent = LETRAS[opcion] ?? '?';
  g.append(t);
  return g;
}

export function dibujarCuerpo(contenedor: HTMLElement, opciones: OpcionesCuerpo): void {
  const { vista, chapas = [], revelar, resaltar } = opciones;

  // El markup de la silueta es una constante nuestra, sin nada que venga del
  // vault ni del jugador. Las letras de las chapas sí van por textContent.
  contenedor.innerHTML = siluetaSvg(vista);

  const raiz = contenedor.querySelector('svg');
  if (!raiz) return;

  // Antes de revelar, el grupo del que habla la pregunta va en azul: "es de este
  // que estamos hablando". Al revelar pasa a amarillo, como todo lo que estuvo
  // bien —en las de identificar, la región *es* la respuesta—.
  if (resaltar) {
    raiz.querySelector(`#reg-${resaltar}`)
      ?.classList.add(revelar === undefined ? 'is-sujeto' : 'is-correcta');
  }

  const cajaChapas = raiz.querySelector('.chapas');
  for (const c of chapas) {
    const acertada = revelar === c.opcion;
    cajaChapas?.append(chapa(c.region, c.opcion, acertada));
    if (acertada) raiz.querySelector(`#reg-${c.region}`)?.classList.add('is-correcta');
  }
}
