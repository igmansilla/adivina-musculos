/**
 * Config del SDK de Firebase. Pegá acá la de tu proyecto.
 *
 * Consola → Configuración del proyecto → Tus apps → app web → SDK setup.
 * Ver README.md, sección "Juego en vivo".
 *
 * Estas claves son públicas por diseño (van en el bundle del navegador). Lo
 * que protege la base son las reglas de database.rules.json, no esto.
 */
export const firebaseConfig = {
  apiKey: 'PEGAR-ACÁ',
  authDomain: 'PEGAR-ACÁ.firebaseapp.com',
  databaseURL: 'https://PEGAR-ACÁ-default-rtdb.firebaseio.com',
  projectId: 'PEGAR-ACÁ',
  storageBucket: 'PEGAR-ACÁ.appspot.com',
  messagingSenderId: 'PEGAR-ACÁ',
  appId: 'PEGAR-ACÁ',
};

export const estaConfigurado = (): boolean => !firebaseConfig.apiKey.includes('PEGAR-ACÁ');
