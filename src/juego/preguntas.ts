import type { Chapa, Concepto, Ficha, Funcion, Pregunta, Tren, Vista } from '../tipos';

/**
 * Arma el cuestionario a partir del vault.
 *
 * Regla de oro, igual que en toponimia: acá no se inventa contenido. Cada
 * pregunta sale de campos que ya están escritos en la ficha, y los distractores
 * son siempre *datos reales de otro grupo* —el movimiento que sí hace otro
 * músculo, la región donde sí está otro grupo—, nunca explicaciones fabricadas.
 * Si el vault no da, se generan menos preguntas y ya.
 */

const OPCIONES = 4;

function mezclar<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Elige n distractores entre los candidatos, salteando al sujeto. */
function distractores(sujeto: Ficha, candidatos: Ficha[], n: number): Ficha[] {
  return mezclar(candidatos.filter((f) => f.slug !== sujeto.slug)).slice(0, n);
}

/**
 * Todos los enunciados tienen la forma "<Nombre>: ¿… este grupo …?".
 *
 * No es capricho: los nombres del vault mezclan singular y plural (Cuádriceps y
 * Dorsal contra Glúteos y Gemelos), así que cualquier enunciado que ponga el
 * grupo de sujeto necesita concordar —"¿qué movimiento hace?" contra "hacen"—.
 * Poniendo el nombre adelante y "este grupo" de sujeto, una sola plantilla anda
 * para los nueve y no hay que cargar artículos a mano en cada ficha.
 */

// --- Preguntas de ubicación ---------------------------------------------
//
// Las cuatro opciones son cuatro regiones de la *misma* silueta: si mezcláramos
// frente y espalda habría que dibujar dos cuerpos y la pregunta dejaría de
// leerse de un vistazo desde el fondo del salón.

function preguntaUbicacion(sujeto: Ficha, candidatos: Ficha[]): Pregunta | null {
  const mismaVista = candidatos.filter((f) => f.vista === sujeto.vista);
  const otros = distractores(sujeto, mismaVista, OPCIONES - 1);
  if (otros.length < OPCIONES - 1) return null;

  const orden = mezclar([sujeto, ...otros]);
  const chapas: Chapa[] = orden.map((f, i) => ({ region: f.region, opcion: i }));

  return {
    clase: 'ubicacion',
    enunciado: `${sujeto.nombre}: ¿en cuál de las cuatro chapas?`,
    opciones: orden.map((f) => f.nombre),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto.nombre,
    vista: sujeto.vista,
    chapas,
  };
}

// --- Preguntas de movimiento y de elongación ----------------------------
//
// Las dos tienen la misma forma: el texto de una sección de la ficha contra el
// texto de la misma sección de otras tres. Por eso comparten armador.

function preguntaDeTexto(
  clase: 'movimiento' | 'elongacion',
  campo: 'mueve' | 'elonga',
  enunciado: string,
  sujeto: Ficha,
  candidatos: Ficha[],
): Pregunta | null {
  const otros = distractores(sujeto, candidatos, OPCIONES - 1);
  if (otros.length < OPCIONES - 1) return null;

  const orden = mezclar([sujeto, ...otros]);
  return {
    clase,
    enunciado,
    opciones: orden.map((f) => f[campo]),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto[campo],
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

// --- Preguntas de tren y función ----------------------------------------
//
// Las cuatro opciones son las cuatro celdas del cuadro que está en las notas
// (tren superior/inferior × estabilidad/impulso). Que sólo dos se usen es
// justamente lo que hay que aprender: "impulso abajo, estabilidad arriba".

const TEXTO_TREN: Record<`${Tren}-${Funcion}`, string> = {
  'inferior-impulso': 'Tren inferior, da impulso',
  'inferior-estabilidad': 'Tren inferior, da estabilidad',
  'superior-impulso': 'Tren superior, da impulso',
  'superior-estabilidad': 'Tren superior, da estabilidad',
};

function preguntaTren(sujeto: Ficha): Pregunta | null {
  if (!sujeto.tren || !sujeto.funcion) return null;
  const correcta = TEXTO_TREN[`${sujeto.tren}-${sujeto.funcion}`];
  const opciones = mezclar(Object.values(TEXTO_TREN));

  return {
    clase: 'tren',
    enunciado: `${sujeto.nombre}: ¿de qué tren es este grupo y para qué sirve?`,
    opciones,
    correcta: opciones.indexOf(correcta),
    dato: sujeto.juego || sujeto.texto,
    sujeto: correcta,
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

// --- Preguntas de concepto ----------------------------------------------

function preguntaConcepto(c: Concepto): Pregunta {
  return {
    clase: 'concepto',
    enunciado: c.enunciado,
    opciones: c.opciones,
    correcta: c.correcta,
    dato: c.dato,
    sujeto: c.opciones[c.correcta] ?? '',
  };
}

// --- Armado del cuestionario --------------------------------------------

export function armarCuestionario(
  fichas: Ficha[],
  conceptos: Concepto[],
  cuantas = 12,
): Pregunta[] {
  const conMovimiento = fichas.filter((f) => f.mueve);
  const conElongacion = fichas.filter((f) => f.elonga);

  const preguntas: Pregunta[] = [];

  for (const f of mezclar(fichas)) {
    const p = preguntaUbicacion(f, fichas);
    if (p) preguntas.push(p);
  }
  for (const f of mezclar(conMovimiento)) {
    const p = preguntaDeTexto(
      'movimiento',
      'mueve',
      `${f.nombre}: ¿qué movimiento controla este grupo?`,
      f,
      conMovimiento,
    );
    if (p) preguntas.push(p);
  }
  for (const f of mezclar(conElongacion)) {
    const p = preguntaDeTexto(
      'elongacion',
      'elonga',
      `${f.nombre}: ¿qué movimiento elonga este grupo?`,
      f,
      conElongacion,
    );
    if (p) preguntas.push(p);
  }
  for (const f of mezclar(fichas)) {
    const p = preguntaTren(f);
    if (p) preguntas.push(p);
  }
  for (const c of mezclar(conceptos)) preguntas.push(preguntaConcepto(c));

  // Se mezclan las clases para que el juego no venga por bloques: si salen
  // cuatro de ubicación seguidas, para la quinta ya nadie mira la silueta.
  return mezclar(preguntas).slice(0, cuantas);
}

/** Sin cuatro grupos en la misma vista no hay ni una pregunta de ubicación. */
export function hayConQueJugar(fichas: Ficha[], conceptos: Concepto[]): boolean {
  const porVista = (v: Vista) => fichas.filter((f) => f.vista === v).length;
  return porVista('frente') >= OPCIONES || porVista('espalda') >= OPCIONES || conceptos.length > 0;
}
