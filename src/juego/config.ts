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
  apiKey: 'AIzaSyBT32ZUIJOu_QRnZPZN6F44tEqNUdfnQkg',
  authDomain: 'adivina-musculos-ignacio.firebaseapp.com',
  databaseURL: 'https://adivina-musculos-ignacio-default-rtdb.firebaseio.com',
  projectId: 'adivina-musculos-ignacio',
  storageBucket: 'adivina-musculos-ignacio.firebasestorage.app',
  messagingSenderId: '380592745572',
  appId: '1:380592745572:web:4952fd7613699b29dc0371',
};

export const estaConfigurado = (): boolean => !firebaseConfig.apiKey.includes('PEGAR-ACÁ');
