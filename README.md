# SpotiAmp

Reproductor web con estética Winamp 2000, búsqueda y dos fuentes de audio. Proyecto independiente de Spotify y Winamp.

## Abrir

Con Node.js 22 o superior, sin dependencias JavaScript externas:

```sh
npm start
```

Abrí `http://127.0.0.1:5173/`. `PORT` permite cambiar el puerto. `npm run build` verifica sintaxis, no genera bundle. `npm test` ejecuta pruebas unitarias. `server.js` es un servidor de desarrollo.

## Mis archivos: audio real en el navegador

Tocá **+ ARCHIVOS** para seleccionar MP3, WAV u otros formatos compatibles. Podés seleccionar varios. Los archivos no se suben a ningún servidor; se leen con URLs locales temporales. Si el nombre tiene formato `Artista - Canción.mp3`, se separan artista y título.

- Play, pausa y detener (pausa + posición cero) controlan el elemento de audio real.
- Anterior/siguiente recorren la biblioteca completa; shuffle evita repetir inmediatamente la pista actual cuando hay más de una.
- Repetir vuelve a reproducir la pista al finalizar; sin repetir, avanza hasta el final de la biblioteca.
- El buscador filtra los archivos por canción o artista.
- Volumen y preamplificador usan GainNode; las nueve bandas aplican filtros BiquadFilter a la señal. RESET EQ devuelve preamplificador y bandas a 0 dB.
- El analizador obtiene el espectro real de la señal. No hay animación simulada.
- Los controles sin pista quedan deshabilitados. Los archivos y la biblioteca no persisten al cerrar o recargar; deben seleccionarse nuevamente. La compatibilidad con formatos depende del navegador.

## Spotify: búsqueda y control remoto

1. Creá una app Web API en https://developer.spotify.com/dashboard y autorizá a los usuarios necesarios según las restricciones vigentes del modo desarrollo.
2. Registrá exactamente `http://127.0.0.1:5173/` como Redirect URI para desarrollo. Spotify no admite `localhost` HTTP. En producción usá la URL HTTPS completa de SpotiAmp con su ruta y `/` final.
3. Tocá **Conectar Spotify** e ingresá el Client ID público. No se necesita Client Secret ni contraseña en SpotiAmp.
4. Elegí Spotify como fuente. Abrí Spotify en un dispositivo y activá la reproducción. El control remoto requiere Premium y un dispositivo compatible activo.
5. Buscá una canción/artista con Buscar o Enter y seleccioná un resultado. Se envía la lista de resultados como cola de reproducción, comenzando por la canción seleccionada.

Play, pausa, detener, anterior/siguiente, posición, shuffle, repetición de pista y volumen envían comandos a la Web API. El volumen se deshabilita cuando Spotify informa que el dispositivo no lo soporta. La reproducción se consulta cada cinco segundos, sin inventar un temporizador local. **El audio se reproduce en el dispositivo Spotify activo.**

**Spotify no da acceso a su señal de audio mediante esta integración:** el ecualizador y su reset están deshabilitados y el analizador muestra un estado sin mediciones. No se simula que estos controles modifican Spotify. La lista muestra resultados; no edita playlists de la cuenta.

OAuth PKCE con validación de state. Client ID en localStorage; tokens en sessionStorage y renovación automática. Desconectar elimina los tokens locales; para revocar permisos usá las aplicaciones de tu cuenta Spotify. Destinos: accounts.spotify.com y api.spotify.com. Las fuentes Google son opcionales y tienen respaldo local. No hay descargas de música Spotify.

## Instalar en el celular

La PWA incluye manifest, iconos y service worker. En Android/Chrome: menú ⋮ → Instalar aplicación / Agregar a pantalla principal. En iPhone/Safari: Compartir → Agregar a inicio. Requiere despliegue HTTPS; `127.0.0.1` en el teléfono apunta al teléfono, no a tu computadora.

El caché guarda solo la interfaz, nunca respuestas o tokens Spotify. Los archivos seleccionados pueden reproducirse sin Internet. Después de recargar, seleccioná los archivos nuevamente. Spotify requiere conexión. Los tokens pueden no compartirse entre el navegador y la PWA; puede ser necesario autorizar de nuevo.

## GitHub Pages

Settings → Pages → Deploy from a branch → **main**, **/ (root)** → Save. Rutas relativas compatibles con la raíz y `/SpotiAmp/`. URL: `https://eduardofloress9402-a11y.github.io/SpotiAmp/`; registrá esta misma dirección como Redirect URI en Spotify. El despliegue depende de GitHub Pages.

## Verificación

`npm run build` y `npm test`. Prueba funcional opcional: Python Playwright y Chromium en `/usr/bin/chromium`, con el servidor iniciado:

```sh
python3 scripts/check_mobile.py
```

`BASE_URL` permite probar otra dirección, incluida una subruta. Esta prueba genera archivos WAV temporales y verifica reproducción, pausa, stop, seek, anterior/siguiente, shuffle, repetición al finalizar, volumen, respuesta de filtros EQ, preamplificación, analizador, búsqueda, offline y tamaños 320/390/430/1440px. Las solicitudes Spotify se comprueban con respuestas simuladas; no se probó una cuenta Premium real. No se verificó instalación en un teléfono físico.
