/** Helpers mínimos de DOM, para no repetir castings por toda la app. */

export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const nodo = document.getElementById(id);
  if (!nodo) throw new Error(`Falta el elemento #${id} en el HTML`);
  return nodo as T;
}

export function mostrarPantalla(nombre: string): void {
  for (const s of document.querySelectorAll<HTMLElement>('.screen')) {
    s.classList.toggle('is-active', s.dataset.screen === nombre);
  }
}

export function pantallaActiva(): string | undefined {
  return document.querySelector<HTMLElement>('.screen.is-active')?.dataset.screen;
}

export function vaciar(nodo: HTMLElement): void {
  nodo.replaceChildren();
}

/** Crea un elemento con clase y texto. El texto va por textContent: nunca innerHTML. */
export function crear<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  clase?: string,
  texto?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto !== undefined) n.textContent = texto;
  return n;
}

export const LETRAS = ['A', 'B', 'C', 'D'];

/** La pastilla con la letra de la opción. */
export function pastilla(i: number): HTMLElement {
  return crear('span', `letra letra--${i}`, LETRAS[i] ?? '?');
}
