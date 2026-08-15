import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  update,
  get,
  onValue,
  onDisconnect,
  serverTimestamp,
  runTransaction,
  type Database,
} from 'firebase/database';
import { firebaseConfig } from './config';
import type { Pregunta } from '../tipos';

/**
 * La capa de red: todo lo que toca Firebase vive acá y nada más lo importa.
 * El resto del juego habla de salas y jugadores, no de rutas de la base.
 */

export interface Jugador {
  name: string;
  score: number;
  answers?: Record<number, Respuesta>;
}

export interface Respuesta {
  option: number;
  correct: boolean;
  points: number;
}

export type EstadoSala = 'lobby' | 'question' | 'reveal' | 'ended';

export interface Sala {
  status: EstadoSala;
  currentQuestion: number;
  questionStartTime?: number;
  /**
   * El cuestionario se publica en la sala porque se arma al vuelo desde el
   * vault y tiene que ser el mismo para el host y para todos los celulares.
   * (Sí: quien mire la base ve las respuestas. En un Kahoot de campamento el
   * cliente siempre las tuvo; no es un secreto que se pueda guardar.)
   */
  quiz?: Pregunta[];
  players?: Record<string, Jugador>;
}

let db: Database | null = null;

function base(): Database {
  if (!db) db = getDatabase(initializeApp(firebaseConfig));
  return db;
}

const salaRef = (pin: string) => ref(base(), `games/${pin}`);
const jugadorRef = (pin: string, id: string) => ref(base(), `games/${pin}/players/${id}`);

const pinAlAzar = () => String(Math.floor(1000 + Math.random() * 9000));

export async function crearSala(quiz: Pregunta[]): Promise<string> {
  let pin = pinAlAzar();
  for (let i = 0; i < 20; i++) {
    pin = pinAlAzar();
    const snap = await get(salaRef(pin));
    if (!snap.exists()) break;
  }

  await set(salaRef(pin), {
    status: 'lobby',
    currentQuestion: -1,
    quiz,
    createdAt: serverTimestamp(),
  });
  // Si se cierra la pantalla del host, la partida se borra sola.
  onDisconnect(salaRef(pin)).remove();
  return pin;
}

export function escucharSala(pin: string, cb: (sala: Sala | null) => void): () => void {
  return onValue(salaRef(pin), (snap) => cb(snap.val()));
}

export function escucharJugadores(
  pin: string,
  cb: (jugadores: Record<string, Jugador>) => void,
): () => void {
  return onValue(ref(base(), `games/${pin}/players`), (snap) => cb(snap.val() ?? {}));
}

export const empezarPregunta = (pin: string, indice: number) =>
  update(salaRef(pin), {
    status: 'question',
    currentQuestion: indice,
    questionStartTime: serverTimestamp(),
  });

export const revelar = (pin: string) => update(salaRef(pin), { status: 'reveal' });
export const terminar = (pin: string) => update(salaRef(pin), { status: 'ended' });

export async function buscarSala(pin: string): Promise<Sala | null> {
  const snap = await get(salaRef(pin));
  return snap.exists() ? (snap.val() as Sala) : null;
}

export async function sumarse(pin: string, nombre: string): Promise<string> {
  const id = crypto.randomUUID();
  await set(jugadorRef(pin, id), { name: nombre, score: 0, joinedAt: serverTimestamp() });
  return id;
}

export async function responder(
  pin: string,
  id: string,
  indice: number,
  respuesta: Respuesta,
): Promise<void> {
  await set(ref(base(), `games/${pin}/players/${id}/answers/${indice}`), respuesta);
  if (respuesta.points > 0) {
    await runTransaction(
      ref(base(), `games/${pin}/players/${id}/score`),
      (s: number | null) => (s ?? 0) + respuesta.points,
    );
  }
}

export interface Puesto {
  id: string;
  nombre: string;
  puntos: number;
}

export function ranking(jugadores: Record<string, Jugador> | undefined): Puesto[] {
  return Object.entries(jugadores ?? {})
    .map(([id, p]) => ({ id, nombre: p.name, puntos: p.score ?? 0 }))
    .sort((a, b) => b.puntos - a.puntos);
}
