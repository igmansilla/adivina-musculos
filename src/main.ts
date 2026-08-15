import './style.css';
import vaultJson from './data/musculos.json';
import type { Vault } from './tipos';
import { armarCuestionario, hayConQueJugar } from './juego/preguntas';
import { estaConfigurado } from './juego/config';
import { iniciarHost } from './juego/host';
import { iniciarJugador } from './juego/jugador';
import { el, mostrarPantalla } from './ui/dom';

// El JSON lo genera scripts/build-vault.mjs y su forma la garantiza la
// validación de ese script; TypeScript solo ve strings sueltos.
const vault = vaultJson as unknown as Vault;

const aviso = el('avisoConfig');
const hayJuego = hayConQueJugar(vault.fichas, vault.conceptos);

if (!hayJuego) {
  aviso.textContent =
    'El vault no tiene cuatro grupos en la misma vista ni conceptos revisados, ' +
    'así que no hay preguntas. Cargá fichas y corré: npm run build-vault';
  aviso.hidden = false;
} else if (!estaConfigurado()) {
  aviso.textContent =
    'Falta pegar la config de Firebase en src/juego/config.ts. Sin eso no se puede crear la sala.';
  aviso.hidden = false;
}

const params = new URLSearchParams(location.search);

// Taller de la silueta: las dos vistas con todas las regiones, para trabajar el
// dibujo sin jugar una partida.
if (params.has('silueta')) {
  void import('./cuerpo/taller').then(({ abrirTaller }) => abrirTaller());
}

// Modo ensayo: recorrer las preguntas sin sala ni jugadores.
if (params.has('ensayo') && hayJuego) {
  void import('./juego/ensayo').then(({ iniciarEnsayo }) =>
    iniciarEnsayo(armarCuestionario(vault.fichas, vault.conceptos)),
  );
}

for (const boton of document.querySelectorAll<HTMLElement>('[data-accion]')) {
  boton.addEventListener('click', () => {
    switch (boton.dataset.accion) {
      case 'ser-host': {
        const quiz = armarCuestionario(vault.fichas, vault.conceptos);
        if (quiz.length === 0) {
          aviso.textContent = 'No se pudo armar ninguna pregunta con las fichas que hay.';
          aviso.hidden = false;
          return;
        }
        void iniciarHost(quiz);
        break;
      }
      case 'ser-jugador':
        mostrarPantalla('unirse');
        break;
      case 'reiniciar':
        location.reload();
        break;
    }
  });
}

iniciarJugador();
