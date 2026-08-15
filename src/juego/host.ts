import type { Pregunta } from '../tipos';
import { dibujarCuerpo } from '../cuerpo/dibujar';
import { crear, el, mostrarPantalla, pantallaActiva, pastilla, vaciar } from '../ui/dom';
import { cuentaRegresiva, SEGUNDOS } from './puntaje';
import {
  crearSala,
  empezarPregunta,
  escucharJugadores,
  ranking,
  revelar,
  terminar,
  type Jugador,
  type Puesto,
} from './sala';

/**
 * Pinta la silueta de una pregunta en el contenedor que se le pase. Las de
 * concepto no tienen vista: ahí la caja se esconde y el enunciado se queda con
 * todo el ancho.
 */
export function pintarCuerpo(idCaja: string, p: Pregunta, conRespuesta = false): void {
  const caja = el(idCaja);
  caja.hidden = !p.vista;
  if (!p.vista) {
    vaciar(caja);
    return;
  }
  dibujarCuerpo(caja, {
    vista: p.vista,
    ...(p.chapas ? { chapas: p.chapas } : {}),
    ...(p.resaltar ? { resaltar: p.resaltar } : {}),
    ...(conRespuesta ? { revelar: p.correcta } : {}),
  });
}

/** La pantalla grande: la que se proyecta. */
export async function iniciarHost(quiz: Pregunta[]): Promise<void> {
  const pin = await crearSala(quiz);

  let jugadores: Record<string, Jugador> = {};
  let indice = -1;
  let cancelarTimer: (() => void) | null = null;

  el('pinSala').textContent = pin;
  el('urlSala').textContent = location.host || 'tu-sitio.web.app';
  mostrarPantalla('host-lobby');

  escucharJugadores(pin, (js) => {
    jugadores = js;
    repintar();
  });

  el<HTMLButtonElement>('btnEmpezar').onclick = () => arrancar(0);
  el<HTMLButtonElement>('btnRevelar').onclick = () => mostrarRespuesta();
  el<HTMLButtonElement>('btnSiguiente').onclick = () =>
    indice + 1 >= quiz.length ? podio() : arrancar(indice + 1);

  // Sin listener de resize, al revés que en toponimia: la silueta es un SVG con
  // viewBox, así que escala sola cuando se enchufa el proyector.

  function repintar(): void {
    const activa = pantallaActiva();
    if (activa === 'host-lobby') pintarLobby();
    else if (activa === 'host-pregunta') el('hRespondieron').textContent = String(respondieron());
    else if (activa === 'host-revelacion') {
      pintarBarras();
      pintarRanking();
    }
  }

  function pintarLobby(): void {
    const lista = ranking(jugadores);
    el('cuentaJugadores').textContent = String(lista.length);
    const ul = el('listaJugadores');
    vaciar(ul);
    for (const p of lista) ul.append(crear('li', undefined, p.nombre));
    el<HTMLButtonElement>('btnEmpezar').disabled = lista.length === 0;
    el('pistaLobby').textContent =
      lista.length === 0 ? 'Esperando que se unan…' : '¡Cuando estén todos, arrancá!';
  }

  const respondieron = (): number =>
    Object.values(jugadores).filter((p) => p.answers?.[indice]).length;

  async function arrancar(i: number): Promise<void> {
    indice = i;
    cancelarTimer?.();
    await empezarPregunta(pin, i);

    const p = quiz[i]!;
    el('hNumero').textContent = `${i + 1} / ${quiz.length}`;
    el('hEnunciado').textContent = p.enunciado;

    const opts = el('hOpciones');
    vaciar(opts);
    // En las de ubicación las opciones son las chapas sobre la silueta: en la
    // pantalla grande sólo se muestra la letra, sin texto que repetir.
    opts.classList.toggle('options--letras', p.clase === 'ubicacion');
    p.opciones.forEach((texto, j) => {
      const d = crear('div', 'opt');
      d.append(pastilla(j));
      if (p.clase !== 'ubicacion') d.append(crear('span', undefined, texto));
      opts.append(d);
    });

    el('hRespondieron').textContent = '0';
    el<HTMLButtonElement>('btnRevelar').disabled = false;
    mostrarPantalla('host-pregunta');
    pintarCuerpo('cuerpo', p);

    cancelarTimer = cuentaRegresiva(
      SEGUNDOS,
      (quedan) => {
        el('hTimer').textContent = String(quedan);
      },
      () => void mostrarRespuesta(),
    );
  }

  async function mostrarRespuesta(): Promise<void> {
    cancelarTimer?.();
    cancelarTimer = null;
    await revelar(pin);

    const p = quiz[indice]!;
    el('rNumero').textContent = `${indice + 1} / ${quiz.length}`;
    el('rCorrecta').textContent = p.sujeto || (p.opciones[p.correcta] ?? '');
    el('rDato').textContent = p.dato;

    mostrarPantalla('host-revelacion');
    pintarCuerpo('cuerpoRevelado', p, true);
    pintarBarras();
    pintarRanking();
  }

  function pintarBarras(): void {
    const p = quiz[indice]!;
    const cuenta = [0, 0, 0, 0];
    for (const j of Object.values(jugadores)) {
      const r = j.answers?.[indice];
      if (r && typeof r.option === 'number' && cuenta[r.option] !== undefined) cuenta[r.option]!++;
    }
    const tope = Math.max(1, ...cuenta);

    const caja = el('rBarras');
    vaciar(caja);
    p.opciones.forEach((_, i) => {
      const fila = crear('div', 'bar' + (i === p.correcta ? ' correct' : ''));
      fila.append(pastilla(i));
      const riel = crear('div', 'bar-track');
      const relleno = crear('div', 'bar-fill');
      riel.append(relleno);
      fila.append(riel, crear('span', 'bar-n', String(cuenta[i])));
      caja.append(fila);
      requestAnimationFrame(() => {
        relleno.style.width = `${(cuenta[i]! / tope) * 100}%`;
      });
    });
  }

  function filaRanking(p: Puesto): HTMLLIElement {
    const li = crear('li');
    li.append(crear('span', 'r-name', p.nombre), crear('span', 'r-score', String(p.puntos)));
    return li;
  }

  function pintarRanking(): void {
    const ol = el('rRanking');
    vaciar(ol);
    const lista = ranking(jugadores).slice(0, 5);
    if (lista.length === 0) ol.append(crear('li', undefined, 'Sin jugadores todavía'));
    else for (const p of lista) ol.append(filaRanking(p));
  }

  async function podio(): Promise<void> {
    await terminar(pin);
    const lista = ranking(jugadores);
    const medallas = ['🥇', '🥈', '🥉'];

    const top = el('podioTop');
    vaciar(top);
    lista.slice(0, 3).forEach((p, i) => {
      const li = crear('li');
      li.append(
        crear('span', 'p-place', medallas[i]),
        crear('span', 'p-name', p.nombre),
        crear('span', 'p-score', `${p.puntos} pts`),
      );
      top.append(li);
    });

    const resto = el('podioResto');
    vaciar(resto);
    for (const p of lista.slice(3)) resto.append(filaRanking(p));

    mostrarPantalla('host-podio');
  }
}
