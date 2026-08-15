import type { Pregunta } from '../tipos';
import { crear, el, mostrarPantalla, pastilla, vaciar } from '../ui/dom';
import { pintarCuerpo } from './host';

/**
 * Modo ensayo (`?ensayo`): recorre el cuestionario en la pantalla grande sin
 * Firebase y sin jugadores. Sirve para revisar las preguntas antes de una
 * charla y para mirar la silueta mientras se trabaja en ella.
 */
export function iniciarEnsayo(quiz: Pregunta[]): void {
  let indice = 0;

  function pregunta(): void {
    const p = quiz[indice]!;
    el('hNumero').textContent = `${indice + 1} / ${quiz.length} · ensayo`;
    el('hTimer').textContent = '—';
    el('hEnunciado').textContent = p.enunciado;

    const opts = el('hOpciones');
    vaciar(opts);
    opts.classList.toggle('options--letras', p.clase === 'ubicacion');
    p.opciones.forEach((texto, j) => {
      const d = crear('div', 'opt');
      d.append(pastilla(j));
      if (p.clase !== 'ubicacion') d.append(crear('span', undefined, texto));
      opts.append(d);
    });

    el('hRespondieron').textContent = '0';
    mostrarPantalla('host-pregunta');
    pintarCuerpo('cuerpo', p);
  }

  function revelacion(): void {
    const p = quiz[indice]!;
    el('rNumero').textContent = `${indice + 1} / ${quiz.length} · ensayo`;
    el('rCorrecta').textContent = p.sujeto || (p.opciones[p.correcta] ?? '');
    el('rDato').textContent = p.dato;
    vaciar(el('rBarras'));
    vaciar(el('rRanking'));
    mostrarPantalla('host-revelacion');
    pintarCuerpo('cuerpoRevelado', p, true);
  }

  el<HTMLButtonElement>('btnRevelar').onclick = revelacion;
  el<HTMLButtonElement>('btnSiguiente').onclick = () => {
    indice = (indice + 1) % quiz.length;
    pregunta();
  };

  pregunta();
}
