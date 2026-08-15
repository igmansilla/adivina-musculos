import type { Chapa, Region, Vista } from '../tipos';
import { crear, el, mostrarPantalla, vaciar } from '../ui/dom';
import { dibujarCuerpo } from './dibujar';
import { regionesDe } from './silueta';

/**
 * Taller de la silueta (`?silueta`): dibuja las dos vistas, cada región con su
 * chapa y su nombre, para trabajar el dibujo sin tener que jugar una partida
 * entera hasta que salga la pregunta que toca esa región.
 *
 * No entra al bundle del juego: main.ts lo importa dinámicamente.
 */
export function abrirTaller(): void {
  const caja = el('cuerpo');
  const pantalla = caja.closest<HTMLElement>('.screen');
  if (!pantalla) return;

  mostrarPantalla('host-pregunta');
  vaciar(pantalla);
  pantalla.classList.add('taller');

  for (const vista of ['frente', 'espalda'] as Vista[]) {
    const regiones = regionesDe(vista);
    const columna = crear('div', 'taller-vista');
    columna.append(crear('p', 'eyebrow', `${vista} · ${regiones.length} grupos`));

    // Las chapas sólo llegan hasta la D, así que en la espalda —que tiene cinco
    // grupos— la quinta queda sin chapa. Acá da igual: el nombre está al lado.
    const lienzo = crear('div', 'cuerpo-caja');
    columna.append(lienzo);
    pantalla.append(columna);

    const chapas: Chapa[] = regiones
      .slice(0, 4)
      .map((region, opcion) => ({ region, opcion }));
    dibujarCuerpo(lienzo, { vista, chapas });

    const lista = crear('ul', 'taller-lista');
    regiones.forEach((r: Region, i) => {
      lista.append(crear('li', undefined, `${i < 4 ? 'ABCD'[i] : '·'} — ${r}`));
    });
    columna.append(lista);
  }
}
