// Lee las fichas de vault/ y produce dos cosas:
//
//   src/data/musculos.json   los datos que come la app
//   vault/INDICE.md          el índice legible (para Ignacio y para Claude)
//
//     node scripts/build-vault.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = join(RAIZ, 'vault');
const SALIDA = join(RAIZ, 'src', 'data', 'musculos.json');
const INDICE = join(VAULT, 'INDICE.md');
const CONCEPTOS = join(VAULT, '_conceptos.md');

const TRENES = ['superior', 'inferior'];
const CADENAS = ['anterior', 'posterior', 'ninguna'];
const FUNCIONES = ['impulso', 'estabilidad'];
const VISTAS = ['frente', 'espalda'];
const ESTADOS = ['borrador', 'revisado'];

// Las regiones que sabe dibujar la silueta, y en qué vista está cada una.
// Tiene que coincidir con src/cuerpo/silueta.ts: si no, la chapa se dibujaría
// en el aire. Por eso se valida acá, donde el error se ve al correr el script.
const REGIONES = {
  deltoides: 'frente',
  pectorales: 'frente',
  psoas: 'frente',
  cuadriceps: 'frente',
  trapecios: 'espalda',
  dorsal: 'espalda',
  gluteos: 'espalda',
  isquiotibiales: 'espalda',
  gemelos: 'espalda',
};

// --- Parseo -------------------------------------------------------------
//
// El frontmatter usa un subconjunto chico de YAML a propósito: escalares y
// listas en línea. Alcanza para las fichas y evita una dependencia.

function valor(crudo) {
  const s = crudo.trim();
  if (s === '' || s === '~' || s === 'null') return null;
  if (s.startsWith('[')) {
    const dentro = s.slice(1, -1).trim();
    if (!dentro) return [];
    return dentro.split(',').map((x) => valor(x));
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s.replace(/^["']|["']$/g, '');
}

function frontmatter(bloque) {
  const meta = {};
  for (const linea of bloque.split('\n')) {
    if (!linea.trim() || linea.trimStart().startsWith('#')) continue;
    const i = linea.indexOf(':');
    if (i === -1) continue;
    meta[linea.slice(0, i).trim()] = valor(linea.slice(i + 1).replace(/\s+#.*$/, ''));
  }
  return meta;
}

function parsear(texto, archivo) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${archivo}: no tiene frontmatter`);

  const cuerpo = m[2];

  // Las citas (las líneas que empiezan con ">") son andamiaje: notas para
  // Ignacio sobre qué falta o de dónde salió algo. Nunca son contenido, así que
  // se sacan de todas las secciones antes de que lleguen al juego.
  const sinCitas = (s) =>
    s
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('>'))
      .join('\n')
      .trim();

  const seccion = (titulo) => {
    const re = new RegExp(`^##\\s+${titulo}\\s*$([\\s\\S]*?)(?=^##\\s|\\Z)`, 'm');
    const s = cuerpo.match(re);
    return s ? sinCitas(s[1]) : '';
  };

  // El texto principal: lo que va entre el H1 y el primer H2.
  const principal = sinCitas((cuerpo.split(/^##\s/m)[0] || '').replace(/^#\s+.*$/m, ''));

  return {
    meta: frontmatter(m[1]),
    texto: principal,
    mueve: seccion('Qué mueve'),
    elonga: seccion('Cómo se elonga'),
    juego: seccion('Para el juego'),
    dudas: seccion('Sin confirmar'),
  };
}

// --- Validación ---------------------------------------------------------

function validar(f, archivo, errores) {
  const mal = (msg) => errores.push(`${archivo}: ${msg}`);
  const uno = (campo, lista) => {
    if (!lista.includes(f[campo])) mal(`${campo} "${f[campo]}" no es uno de ${lista.join(', ')}`);
  };
  // Los campos que las notas no dan para todos los grupos: se aceptan vacíos,
  // pero si están escritos tienen que ser un valor de la lista.
  const opcional = (campo, lista) => {
    if (f[campo] !== null) uno(campo, lista);
  };

  if (!f.nombre) mal('falta "nombre"');
  opcional('tren', TRENES);
  opcional('cadena', CADENAS);
  opcional('funcion', FUNCIONES);
  uno('vista', VISTAS);
  uno('estado', ESTADOS);

  if (!(f.region in REGIONES)) {
    mal(`region "${f.region}" no existe en la silueta (${Object.keys(REGIONES).join(', ')})`);
  } else if (REGIONES[f.region] !== f.vista) {
    mal(`region "${f.region}" se dibuja de ${REGIONES[f.region]}, pero la ficha dice ${f.vista}`);
  }

  if (f.cuantos !== null && (!Number.isInteger(f.cuantos) || f.cuantos < 1)) {
    mal(`cuantos tiene que ser un entero ≥ 1 o vacío, no "${f.cuantos}"`);
  }

  if (f.estado === 'revisado' && !f.mueve) {
    mal('está en "revisado" pero no tiene "## Qué mueve" escrito');
  }
}

// --- Conceptos ----------------------------------------------------------
//
// Una pregunta por "##": las opciones son ítems de lista con [x] en la
// correcta, y el dato de revelación va en la cita de abajo.

function leerConceptos(errores) {
  let crudo;
  try {
    crudo = readFileSync(CONCEPTOS, 'utf8');
  } catch {
    return [];
  }

  const m = crudo.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) {
    errores.push('_conceptos.md: no tiene frontmatter');
    return [];
  }
  const meta = frontmatter(m[1]);
  if (!ESTADOS.includes(meta.estado)) {
    errores.push(`_conceptos.md: estado "${meta.estado}" no es uno de ${ESTADOS.join(', ')}`);
    return [];
  }

  const conceptos = [];
  const bloques = m[2].split(/^##\s+/m).slice(1);
  for (const bloque of bloques) {
    const lineas = bloque.split('\n');
    const enunciado = (lineas.shift() ?? '').trim();
    const resto = lineas.join('\n');

    const opciones = [];
    let correcta = -1;
    for (const l of resto.split('\n')) {
      const op = l.match(/^\s*-\s*\[( |x|X)\]\s*(.+)$/);
      if (!op) continue;
      if (op[1].toLowerCase() === 'x') correcta = opciones.length;
      opciones.push(op[2].trim());
    }

    const dato = resto
      .split('\n')
      .filter((l) => l.trimStart().startsWith('>'))
      .map((l) => l.replace(/^\s*>\s?/, ''))
      .join(' ')
      .trim();

    // Una pregunta a medio escribir no rompe el build: no entra y se avisa.
    if (opciones.length !== 4 || correcta === -1) {
      if (meta.estado === 'revisado') {
        errores.push(
          `_conceptos.md: "${enunciado}" tiene ${opciones.length} opciones y ` +
            `${correcta === -1 ? 'ninguna' : 'una'} marcada con [x]; hacen falta 4 y una marcada`,
        );
      }
      continue;
    }
    conceptos.push({ enunciado, opciones, correcta, dato });
  }

  return meta.estado === 'revisado' ? conceptos : [];
}

// --- Main ---------------------------------------------------------------

const archivos = readdirSync(VAULT)
  .filter((n) => n.endsWith('.md') && n !== 'INDICE.md' && !n.startsWith('_'))
  .sort();

const errores = [];
const fichas = archivos.map((archivo) => {
  const p = parsear(readFileSync(join(VAULT, archivo), 'utf8'), archivo);
  const f = {
    slug: basename(archivo, '.md'),
    nombre: p.meta.nombre,
    tren: p.meta.tren ?? null,
    cadena: p.meta.cadena ?? null,
    funcion: p.meta.funcion ?? null,
    vista: p.meta.vista,
    region: p.meta.region,
    cuantos: typeof p.meta.cuantos === 'number' ? p.meta.cuantos : null,
    estado: p.meta.estado ?? 'borrador',
    texto: p.texto,
    mueve: p.mueve,
    elonga: p.elonga,
    juego: p.juego,
    dudas: p.dudas,
  };
  validar(f, archivo, errores);
  return f;
});

const conceptos = leerConceptos(errores);

if (errores.length) {
  console.error('Fichas con problemas:\n');
  for (const e of errores) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const conMovimiento = fichas.filter((f) => f.mueve);
const conElongacion = fichas.filter((f) => f.elonga);

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(
  SALIDA,
  JSON.stringify({ generado: new Date().toISOString().slice(0, 10), fichas, conceptos }),
);

// --- Índice -------------------------------------------------------------

const si = (b) => (b ? '✓' : '—');
const o = (v) => v ?? '—';
const filas = fichas.map(
  (f) =>
    `| ${f.nombre} | ${o(f.tren)} | ${o(f.funcion)} | ${f.region} | ${si(f.mueve)} | ` +
    `${si(f.elonga)} | ${f.estado} |`,
);

const huecos = fichas
  .filter((f) => !f.mueve || !f.elonga)
  .map((f) => {
    const falta = [!f.mueve && '`## Qué mueve`', !f.elonga && '`## Cómo se elonga`'].filter(Boolean);
    return `- **${f.nombre}** (\`${f.slug}\`) — falta ${falta.join(' y ')}`;
  });

writeFileSync(
  INDICE,
  `# Índice del vault

Generado por \`node scripts/build-vault.mjs\`. **No editar a mano.**

${fichas.length} grupos · ${conMovimiento.length} con movimiento · ${conElongacion.length} con elongación · ${conceptos.length} conceptos

| Grupo | Tren | Función | Región | Mueve | Elonga | Estado |
|---|---|---|---|---|---|---|
${filas.join('\n')}

## Qué falta

${huecos.join('\n') || '- Nada: todos los grupos tienen movimiento y elongación escritos.'}
`,
);

console.log(
  `${fichas.length} grupos · ${conMovimiento.length} con movimiento · ` +
    `${conElongacion.length} con elongación · ${conceptos.length} conceptos`,
);
console.log(`Escrito ${SALIDA}`);
console.log(`Escrito ${INDICE}`);
if (conMovimiento.length < 4) {
  console.log(`\n⚠ Con ${conMovimiento.length} grupos con "## Qué mueve" no hay preguntas de`);
  console.log('  movimiento: hacen falta 4 (una respuesta y tres distractores reales).');
}
