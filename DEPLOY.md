# Subirlo a Firebase

Los pasos 1 a 5 se hacen **una sola vez**. Después, cada cambio se sube con
`firebase deploy` y nada más.

El nombre de proyecto que ya está puesto en `.firebaserc` es
**`adivina-musculos-ignacio`**, siguiendo la convención de los hermanos
(`adivina-nubes-ignacio`, `constelaciones-ignacio`). Si en la consola te toma
otro ID, cambialo ahí.

---

## 1. Crear el proyecto

1. <https://console.firebase.google.com> → **Agregar proyecto**.
2. Nombre: `adivina-musculos-ignacio`. Podés saltear Google Analytics.

## 2. Activar la base en tiempo real

**Compilación → Realtime Database → Crear base de datos.** Elegí ubicación y
empezá en **modo bloqueado**: las reglas buenas las sube el `deploy` del paso 5.

## 3. Activar Hosting

**Compilación → Hosting → Comenzar.** No hace falta correr nada ahí; el deploy
sale de tu compu.

## 4. Pegar la config

1. **⚙️ Configuración del proyecto → General → Tus apps** → ícono **`</>`** (Web)
   → apodo `web` → **Registrar app**.
2. Copiá el bloque `const firebaseConfig = { ... }`.
3. Pegá cada valor en **`src/juego/config.ts`**, reemplazando los `PEGAR-ACÁ`.

   > Si no ves `databaseURL`, es la dirección de la Realtime Database del paso 2
   > (algo como `https://adivina-musculos-ignacio-default-rtdb.firebaseio.com`).

Esas claves son **públicas por diseño**: van en el bundle del navegador. Lo que
protege la base son las reglas de `database.rules.json`, no ellas.

## 5. Desplegar

Parado en la carpeta del proyecto:

```bash
npm install       # si es la primera vez
firebase login
firebase deploy
```

Te devuelve una URL tipo **`https://adivina-musculos-ignacio.web.app`**.

`firebase deploy` corre solo, antes de subir, `npm run build-vault` y
`npm run build` (está declarado como `predeploy` en `firebase.json`). Así nunca
se sube un `dist/` viejo que no tenga los últimos cambios del vault.

---

## Después

Cada vez que toques el vault o el código:

```bash
firebase deploy
```

Y si sólo querés ver el resultado sin subir nada:

```bash
npm run build-vault && npm run dev
```

- `http://localhost:5173/?ensayo` — recorre las preguntas sin Firebase.
- `http://localhost:5173/?silueta` — el taller del dibujo.

## Las reglas de la base

`database.rules.json` deja el root cerrado y abre sólo `games/<pin>`, validando
la forma de lo que se escribe (el PIN son 4 a 6 dígitos, el nombre hasta 20
caracteres, el puntaje un número).

Cualquiera que sepa el PIN puede leer y escribir esa sala: es un juego de fogón,
no hay cuentas ni login, y la sala se borra sola cuando el host cierra la
pantalla. No guardes nada ahí que no quieras que vean.
