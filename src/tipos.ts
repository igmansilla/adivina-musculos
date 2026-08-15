export type Vista = 'frente' | 'espalda';
export type Tren = 'superior' | 'inferior';
export type Cadena = 'anterior' | 'posterior' | 'ninguna';
export type Funcion = 'impulso' | 'estabilidad';
export type Estado = 'borrador' | 'revisado';

/** Los grupos que sabe dibujar la silueta. El id acá es el id del path en el SVG. */
export type Region =
  | 'deltoides'
  | 'pectorales'
  | 'psoas'
  | 'cuadriceps'
  | 'trapecios'
  | 'dorsal'
  | 'gluteos'
  | 'isquiotibiales'
  | 'gemelos';

export interface Ficha {
  slug: string;
  nombre: string;
  /**
   * Tren, cadena y función pueden venir en null: las notas de Ignacio no los
   * dan para todos los grupos, y un hueco explícito es mejor que una inferencia.
   * Las preguntas que los necesitan simplemente no se generan.
   */
  tren: Tren | null;
  cadena: Cadena | null;
  funcion: Funcion | null;
  /** Dónde se dibuja. Esto sí se resuelve solo: dónde queda un músculo no está en disputa. */
  vista: Vista;
  region: Region;
  /** Cuántos músculos tiene el grupo. null mientras no se sepa. */
  cuantos: number | null;
  estado: Estado;
  /** El cuerpo de la ficha: lo que se cuenta del grupo. */
  texto: string;
  /** "## Qué mueve" — el movimiento que controla. Vacío hasta que Ignacio lo escriba. */
  mueve: string;
  /** "## Cómo se elonga" — el movimiento contrario. */
  elonga: string;
  /** "## Para el juego" — el dato que se lee al revelar. */
  juego: string;
  dudas: string;
}

/** Una pregunta de principio, escrita a mano en vault/_conceptos.md. */
export interface Concepto {
  enunciado: string;
  opciones: string[];
  correcta: number;
  dato: string;
}

export interface Vault {
  generado: string;
  fichas: Ficha[];
  conceptos: Concepto[];
}

/** Una chapa sobre la silueta: una opción de respuesta apoyada en una región. */
export interface Chapa {
  region: Region;
  /** Índice 0-3, que en pantalla se muestra como A, B, C o D. */
  opcion: number;
}

export type ClasePregunta = 'ubicacion' | 'movimiento' | 'elongacion' | 'tren' | 'concepto';

export interface Pregunta {
  clase: ClasePregunta;
  enunciado: string;
  opciones: string[];
  correcta: number;
  /** Lo que se cuenta al revelar la respuesta. */
  dato: string;
  /** Cómo se nombra la respuesta al revelarla (el grupo en juego). */
  sujeto: string;
  /** Qué silueta se dibuja. Las de concepto no llevan ninguna. */
  vista?: Vista;
  /** Solo en las de ubicación: las cuatro opciones apoyadas sobre la silueta. */
  chapas?: Chapa[];
  /**
   * En las que preguntan por un grupo ya nombrado (movimiento, elongación,
   * tren), la región se muestra encendida de entrada: saber dónde está el
   * cuádriceps no adelanta qué movimiento hace, y ayuda a seguir la explicación.
   */
  resaltar?: Region;
}
