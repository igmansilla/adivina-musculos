import { crear, el, mostrarPantalla, pastilla, vaciar } from '../ui/dom';
import { puntos } from './puntaje';
import {
  buscarSala,
  escucharSala,
  ranking,
  responder,
  sumarse,
  type Jugador,
  type Sala,
} from './sala';

/** La pantalla chica: el celular del acampante. */
export function iniciarJugador(): void {
  let pin = '';
  let id = '';
  let arranquePregunta = 0;
  let pintada = -1;

  el<HTMLFormElement>('formUnirse').addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = el<HTMLInputElement>('inputPin').value.trim();
    const nombre = el<HTMLInputElement>('inputNombre').value.trim();
    const error = el('errorUnirse');
    error.hidden = true;

    if (!/^\d{4,6}$/.test(codigo)) return fallar(error, 'El código son 4 números.');
    if (!nombre) return fallar(error, 'Escribí tu nombre.');

    const sala = await buscarSala(codigo);
    if (!sala) return fallar(error, 'No existe un juego con ese código.');
    if (sala.status !== 'lobby') return fallar(error, 'Ese juego ya empezó. Pedí uno nuevo.');

    pin = codigo;
    id = await sumarse(codigo, nombre);

    el('jNombre').textContent = nombre;
    mostrarPantalla('jugador-lobby');
    escucharSala(pin, pintar);
  });

  function fallar(nodo: HTMLElement, msg: string): void {
    nodo.textContent = msg;
    nodo.hidden = false;
  }

  function pintar(sala: Sala | null): void {
    if (!sala) {
      // El host cerró la partida y onDisconnect borró la sala.
      mostrarPantalla('unirse');
      fallar(el('errorUnirse'), 'El juego se cerró. ¡Gracias por jugar!');
      return;
    }

    const yo = sala.players?.[id];
    const i = sala.currentQuestion;

    switch (sala.status) {
      case 'lobby':
        mostrarPantalla('jugador-lobby');
        break;
      case 'question':
        arranquePregunta = sala.questionStartTime ?? Date.now();
        pintarPregunta(sala, i, yo);
        break;
      case 'reveal':
        pintarResultado(sala, i, yo);
        break;
      case 'ended':
        pintarPodio(sala, yo);
        break;
    }
  }

  function pintarPregunta(sala: Sala, i: number, yo: Jugador | undefined): void {
    const p = sala.quiz?.[i];
    if (!p) return;

    const caja = el('jOpciones');
    if (pintada !== i) {
      pintada = i;
      vaciar(caja);
      p.opciones.forEach((texto, j) => {
        const b = crear('button', 'popt');
        b.type = 'button';
        b.dataset.i = String(j);
        b.append(pastilla(j));
        // En las de ubicación el texto de la opción es la letra misma: no se
        // repite, el jugador mira la silueta proyectada.
        if (p.clase !== 'ubicacion') b.append(crear('span', undefined, texto));
        b.addEventListener('click', () => void contestar(sala, i, j));
        caja.append(b);
      });
      caja.classList.toggle('poptions--letras', p.clase === 'ubicacion');
    }

    const respondida = yo?.answers?.[i];
    caja.classList.toggle('locked', !!respondida);
    for (const b of caja.querySelectorAll<HTMLButtonElement>('.popt')) {
      b.classList.toggle('chosen', !!respondida && respondida.option === Number(b.dataset.i));
      b.disabled = !!respondida;
    }
    el('jPista').textContent = respondida
      ? '¡Respondiste! Mirá la pantalla grande.'
      : p.clase === 'ubicacion'
        ? 'Mirá la silueta y elegí la chapa'
        : 'Elegí tu respuesta';
    mostrarPantalla('jugador-pregunta');
  }

  async function contestar(sala: Sala, i: number, opcion: number): Promise<void> {
    const p = sala.quiz?.[i];
    if (!p) return;

    const acertó = opcion === p.correcta;
    const ganados = acertó ? puntos(Date.now() - arranquePregunta) : 0;

    // Bloquear en pantalla antes de que vuelva la red: en el campamento el
    // wifi es malo y si no, el acampante toca cuatro veces.
    const caja = el('jOpciones');
    caja.classList.add('locked');
    for (const b of caja.querySelectorAll<HTMLButtonElement>('.popt')) {
      b.disabled = true;
      b.classList.toggle('chosen', Number(b.dataset.i) === opcion);
    }
    el('jPista').textContent = '¡Respondiste! Mirá la pantalla grande.';

    await responder(pin, id, i, { option: opcion, correct: acertó, points: ganados });
  }

  function pintarResultado(sala: Sala, i: number, yo: Jugador | undefined): void {
    const r = yo?.answers?.[i];
    const bien = !!r?.correct;

    const caja = el('jResultado');
    caja.classList.toggle('good', bien);
    caja.classList.toggle('bad', !bien);
    el('jIcono').textContent = bien ? '✓' : '✕';
    el('jTitulo').textContent = bien ? '¡Correcto!' : r ? 'Casi…' : 'Sin respuesta';
    el('jPuntos').textContent = `+${r?.points ?? 0}`;

    const lista = ranking(sala.players);
    const puesto = lista.findIndex((p) => p.id === id) + 1;
    el('jTotal').textContent = String(yo?.score ?? 0);
    el('jPuesto').textContent = puesto ? `${puesto}º de ${lista.length}` : '—';
    mostrarPantalla('jugador-revelacion');
  }

  function pintarPodio(sala: Sala, yo: Jugador | undefined): void {
    const lista = ranking(sala.players);
    const puesto = lista.findIndex((p) => p.id === id) + 1;
    el('jFinalIcono').textContent = puesto === 1 ? '🏆' : puesto <= 3 ? '🎉' : '✎';
    el('jFinalTitulo').textContent = puesto === 1 ? '¡Ganaste!' : '¡Terminó!';
    el('jFinalPuntos').textContent = `${yo?.score ?? 0} pts`;
    el('jFinalPuesto').textContent = puesto ? `${puesto}º de ${lista.length}` : '—';
    mostrarPantalla('jugador-podio');
  }
}
