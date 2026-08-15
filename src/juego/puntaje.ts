export const SEGUNDOS = 20;

const MAXIMO = 1000;
const MINIMO = 500;

/**
 * Puntaje por rapidez: acertar al toque vale 1000, acertar sobre la hora 500.
 * Errar vale 0. Mismo criterio que en adivina-nubes, para que el que jugó a
 * uno entienda el otro sin explicación.
 */
export function puntos(ms: number): number {
  const fraccion = Math.min(Math.max(ms, 0) / (SEGUNDOS * 1000), 1);
  return Math.round(MINIMO + (MAXIMO - MINIMO) * (1 - fraccion));
}

/**
 * Cuenta regresiva. Devuelve una función para cancelarla: si el host revela
 * antes de tiempo, el timer no tiene que disparar igual.
 */
export function cuentaRegresiva(
  segundos: number,
  cadaTick: (quedan: number) => void,
  alTerminar: () => void,
): () => void {
  const arranque = Date.now();
  let terminado = false;

  cadaTick(segundos);
  const tick = setInterval(() => {
    const quedan = Math.max(Math.ceil(segundos - (Date.now() - arranque) / 1000), 0);
    cadaTick(quedan);
  }, 250);

  const fin = setTimeout(() => {
    if (terminado) return;
    terminado = true;
    clearInterval(tick);
    alTerminar();
  }, segundos * 1000);

  return () => {
    if (terminado) return;
    terminado = true;
    clearInterval(tick);
    clearTimeout(fin);
  };
}
