import type { Chapa, Concepto, Ficha, Funcion, Pregunta, Tren, Vista } from '../tipos';

/**
 * Arma el cuestionario a partir del vault.
 *
 * Regla de oro, igual que en toponimia: acá no se inventa contenido. Cada
 * pregunta sale de campos que ya están escritos en la ficha, y los distractores
 * son siempre *datos reales de otro grupo* —el movimiento que sí hace otro
 * músculo, la región donde sí está otro grupo—, nunca explicaciones fabricadas.
 * Si el vault no da, se generan menos preguntas y ya.
 *
 * Varias clases son la misma pregunta dada vuelta: "¿dónde está el cuádriceps?"
 * contra "el grupo marcado, ¿cuál es?". No es relleno: cambia de qué lado tenés
 * que saber la respuesta, y al que juega le cambia el ritmo. Por eso van
 * marcadas con la misma `familia`, para no meter las dos sobre el mismo grupo
 * en una misma ronda.
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
 * Los enunciados que nombran al grupo tienen la forma "<Nombre>: ¿… este grupo …?".
 *
 * No es capricho: los nombres del vault mezclan singular y plural (Cuádriceps y
 * Dorsal contra Glúteos y Gemelos), así que cualquier enunciado que ponga el
 * grupo de sujeto necesita concordar —"¿qué movimiento hace?" contra "hacen"—.
 * Poniendo el nombre adelante y "este grupo" de sujeto, una sola plantilla anda
 * para los nueve y no hay que cargar artículos a mano en cada ficha.
 */

// --- Dónde está: de ida y de vuelta -------------------------------------
//
// Las cuatro opciones son cuatro regiones de la *misma* silueta: si mezcláramos
// frente y espalda habría que dibujar dos cuerpos y la pregunta dejaría de
// leerse de un vistazo desde el fondo del salón.

function cuatroDeLaMismaVista(sujeto: Ficha, candidatos: Ficha[]): Ficha[] | null {
  const mismaVista = candidatos.filter((f) => f.vista === sujeto.vista);
  const otros = distractores(sujeto, mismaVista, OPCIONES - 1);
  return otros.length < OPCIONES - 1 ? null : mezclar([sujeto, ...otros]);
}

/** "Cuádriceps: ¿en cuál de las cuatro chapas?" — la respuesta es un lugar. */
function preguntaUbicacion(sujeto: Ficha, candidatos: Ficha[]): Pregunta | null {
  const orden = cuatroDeLaMismaVista(sujeto, candidatos);
  if (!orden) return null;

  const chapas: Chapa[] = orden.map((f, i) => ({ region: f.region, opcion: i }));
  return {
    clase: 'ubicacion',
    familia: 'posicion',
    grupo: sujeto.slug,
    enunciado: `${sujeto.nombre}: ¿en cuál de las cuatro chapas?`,
    opciones: orden.map((f) => f.nombre),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto.nombre,
    vista: sujeto.vista,
    chapas,
  };
}

/** La misma, al revés: se enciende una región y la respuesta es un nombre. */
function preguntaIdentificar(sujeto: Ficha, candidatos: Ficha[]): Pregunta | null {
  const orden = cuatroDeLaMismaVista(sujeto, candidatos);
  if (!orden) return null;

  return {
    clase: 'identificar',
    familia: 'posicion',
    grupo: sujeto.slug,
    enunciado: 'El grupo marcado en la silueta, ¿cuál es?',
    opciones: orden.map((f) => f.nombre),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto.nombre,
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

// --- Qué mueve: de ida y de vuelta --------------------------------------

function preguntaMovimiento(sujeto: Ficha, candidatos: Ficha[]): Pregunta | null {
  const otros = distractores(sujeto, candidatos, OPCIONES - 1);
  if (otros.length < OPCIONES - 1) return null;

  const orden = mezclar([sujeto, ...otros]);
  return {
    clase: 'movimiento',
    familia: 'movimiento',
    grupo: sujeto.slug,
    enunciado: `${sujeto.nombre}: ¿qué movimiento controla este grupo?`,
    opciones: orden.map((f) => f.mueve),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto.mueve,
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

/** Se da el movimiento y hay que decir de quién es. Sin silueta: la regalaría. */
function preguntaQuien(sujeto: Ficha, candidatos: Ficha[]): Pregunta | null {
  const otros = distractores(sujeto, candidatos, OPCIONES - 1);
  if (otros.length < OPCIONES - 1) return null;

  const orden = mezclar([sujeto, ...otros]);
  return {
    clase: 'quien',
    familia: 'movimiento',
    grupo: sujeto.slug,
    enunciado: `«${sujeto.mueve}» ¿De qué grupo es ese movimiento?`,
    opciones: orden.map((f) => f.nombre),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto.nombre,
  };
}

// --- Cómo se elonga -----------------------------------------------------

function preguntaElongacion(sujeto: Ficha, candidatos: Ficha[]): Pregunta | null {
  const otros = distractores(sujeto, candidatos, OPCIONES - 1);
  if (otros.length < OPCIONES - 1) return null;

  const orden = mezclar([sujeto, ...otros]);
  return {
    clase: 'elongacion',
    familia: 'elongacion',
    grupo: sujeto.slug,
    enunciado: `${sujeto.nombre}: ¿qué movimiento elonga este grupo?`,
    opciones: orden.map((f) => f.elonga),
    correcta: orden.findIndex((f) => f.slug === sujeto.slug),
    dato: sujeto.juego || sujeto.texto,
    sujeto: sujeto.elonga,
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

// --- Tren y función -----------------------------------------------------
//
// Las cuatro opciones son las cuatro celdas del cuadro (tren superior/inferior ×
// estabilidad/impulso). Que sólo dos se usen es justamente lo que hay que
// aprender: impulso abajo, estabilidad arriba.

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
    familia: 'tren',
    grupo: sujeto.slug,
    enunciado: `${sujeto.nombre}: ¿de qué tren es este grupo y para qué sirve?`,
    opciones,
    correcta: opciones.indexOf(correcta),
    dato: sujeto.juego || sujeto.texto,
    sujeto: correcta,
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

// --- Cuántos músculos son -----------------------------------------------

function preguntaCuantos(sujeto: Ficha): Pregunta | null {
  const n = sujeto.cuantos;
  if (n === null) return null;

  // Los distractores son números vecinos: no dicen nada falso sobre ningún otro
  // grupo, sólo obligan a acordarse del número.
  const vecinos = mezclar([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 2 && x !== n));
  const opciones = mezclar([n, ...vecinos.slice(0, OPCIONES - 1)]).map(String);

  return {
    clase: 'cuantos',
    familia: 'cuantos',
    grupo: sujeto.slug,
    enunciado: `${sujeto.nombre}: ¿cuántos músculos son?`,
    opciones,
    correcta: opciones.indexOf(String(n)),
    dato: sujeto.juego || sujeto.texto,
    sujeto: String(n),
    vista: sujeto.vista,
    resaltar: sujeto.region,
  };
}

// --- Conceptos ----------------------------------------------------------

function preguntaConcepto(c: Concepto): Pregunta {
  return {
    clase: 'concepto',
    familia: 'concepto',
    enunciado: c.enunciado,
    opciones: c.opciones,
    correcta: c.correcta,
    dato: c.dato,
    sujeto: c.opciones[c.correcta] ?? '',
  };
}

// --- Armado del cuestionario --------------------------------------------

/**
 * Elige repartiendo entre clases en vez de sortear del montón.
 *
 * Sorteando parejo gana la clase que más candidatas tiene: como `tren` sale para
 * ocho grupos y `elongación` sólo para los cuatro que la tienen escrita, una
 * ronda de doce terminaba con cinco de tren, y después de la segunda ya no hay
 * nada que pensar. Yendo por turnos, cada clase pone una hasta que se le acaban.
 *
 * De paso saltea la que repita familia y grupo: preguntar dónde está el
 * cuádriceps y después cuál es el grupo marcado (el cuádriceps) es la misma
 * pregunta dos veces.
 *
 * Y le pone un tope a cuántas veces puede salir un mismo grupo. Sin eso el
 * cuádriceps —que es el único que tiene todos los campos escritos— se llevaba
 * cuatro de las doce, y la ronda se sentía como si fuera sobre un solo músculo.
 * El tope se calcula según lo que haya en el vault: con nueve grupos y doce
 * preguntas da dos, y si mañana hay menos grupos sube solo.
 */
function repartir(porClase: Pregunta[][], cuantas: number): Pregunta[] {
  const elegidas: Pregunta[] = [];
  const usadas = new Set<string>();
  const veces = new Map<string, number>();
  const pilas = porClase.map((p) => mezclar(p));

  const grupos = new Set(porClase.flat().flatMap((p) => (p.grupo ? [p.grupo] : [])));
  const tope = Math.max(2, Math.ceil(cuantas / Math.max(grupos.size, 1)));

  const clave = (p: Pregunta): string => `${p.familia}:${p.grupo ?? p.enunciado}`;
  const sirve = (p: Pregunta, conTope: boolean): boolean =>
    !usadas.has(clave(p)) && (!conTope || !p.grupo || (veces.get(p.grupo) ?? 0) < tope);

  /** Da vueltas por las clases, una pregunta por clase, hasta que nadie aporte. */
  const pasada = (conTope: boolean): void => {
    let hubo = true;
    while (hubo && elegidas.length < cuantas) {
      hubo = false;
      for (const pila of mezclar(pilas)) {
        if (elegidas.length >= cuantas) break;
        const i = pila.findIndex((p) => sirve(p, conTope));
        if (i === -1) continue;
        const p = pila.splice(i, 1)[0]!;
        usadas.add(clave(p));
        if (p.grupo) veces.set(p.grupo, (veces.get(p.grupo) ?? 0) + 1);
        elegidas.push(p);
        hubo = true;
      }
    }
  };

  // Primero con el tope puesto. Si con eso no se llena la ronda, otra vuelta sin
  // él: es preferible una ronda desbalanceada a una ronda corta.
  pasada(true);
  pasada(false);
  return elegidas;
}

/**
 * Ordena para que no caigan dos seguidas de la misma clase ni sobre el mismo
 * grupo. Es un acomodo goloso: si no encuentra ninguna que sirva, pone la que
 * sigue y listo. En una ronda de doce alcanza y sobra.
 */
function espaciar(preguntas: Pregunta[]): Pregunta[] {
  const pendientes = mezclar(preguntas);
  const salida: Pregunta[] = [];

  while (pendientes.length) {
    const previa = salida[salida.length - 1];
    let i = pendientes.findIndex(
      (p) => !previa || (p.clase !== previa.clase && (!p.grupo || p.grupo !== previa.grupo)),
    );
    if (i === -1) i = 0;
    salida.push(pendientes.splice(i, 1)[0]!);
  }
  return salida;
}

export function armarCuestionario(
  fichas: Ficha[],
  conceptos: Concepto[],
  cuantas = 12,
): Pregunta[] {
  const conMovimiento = fichas.filter((f) => f.mueve);
  const conElongacion = fichas.filter((f) => f.elonga);

  const arma = <T>(xs: T[], f: (x: T) => Pregunta | null): Pregunta[] =>
    xs.map(f).filter((p): p is Pregunta => p !== null);

  const porClase: Pregunta[][] = [
    arma(fichas, (f) => preguntaUbicacion(f, fichas)),
    arma(fichas, (f) => preguntaIdentificar(f, fichas)),
    arma(conMovimiento, (f) => preguntaMovimiento(f, conMovimiento)),
    arma(conMovimiento, (f) => preguntaQuien(f, conMovimiento)),
    arma(conElongacion, (f) => preguntaElongacion(f, conElongacion)),
    arma(fichas, preguntaTren),
    arma(fichas, preguntaCuantos),
    conceptos.map(preguntaConcepto),
  ];

  return espaciar(repartir(porClase, cuantas));
}

/** Sin cuatro grupos en la misma vista no hay ni una pregunta de ubicación. */
export function hayConQueJugar(fichas: Ficha[], conceptos: Concepto[]): boolean {
  const porVista = (v: Vista) => fichas.filter((f) => f.vista === v).length;
  return porVista('frente') >= OPCIONES || porVista('espalda') >= OPCIONES || conceptos.length > 0;
}
