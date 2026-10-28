# SpotiAmp

Reproductor web inspirado en Winamp de los 2000: paneles metálicos, pantalla verde, visualizador animado, playlist y búsqueda. Adaptado a móvil y escritorio. Proyecto independiente, sin afiliación con Spotify ni Winamp.

## Ejecutar

Node.js 22 o superior. Sin dependencias externas de JavaScript ni instalación obligatoria.

```sh
npm start
```

Abrí `http://127.0.0.1:5173/`. `PORT` permite cambiar el puerto. `npm run build` verifica sintaxis (no genera un bundle); `npm test` ejecuta pruebas unitarias. Para publicar, los archivos `index.html` y `src/` pueden servirse como sitio estático HTTPS. `server.js` es un servidor de desarrollo.

## Conectar Spotify

1. Creá una aplicación en https://developer.spotify.com/dashboard y habilitá Web API. Las restricciones vigentes del modo desarrollo y los usuarios autorizados se administran allí.
2. Registrá exactamente `http://127.0.0.1:5173/` como Redirect URI. En producción usá la URL HTTPS de tu despliegue con `/` final. Spotify no admite `localhost` como redirect HTTP.
3. En SpotiAmp, pulsá **Conectar Spotify**, ingresá el Client ID público y autorizá. Nunca ingreses un Client Secret.
4. Abrí Spotify en tu teléfono o computadora y activá la reproducción. SpotiAmp controla ese dispositivo con Spotify Connect. El control de reproducción requiere Spotify Premium y permisos del usuario.
5. Buscá una canción o artista y presioná Buscar/Enter. Seleccioná un resultado para reproducirlo.

OAuth Authorization Code con PKCE y validación de `state`. Client ID en localStorage; tokens solo en sessionStorage, con renovación automática. Desconectar elimina los tokens locales; para revocar permisos usá las aplicaciones de tu cuenta Spotify. No hay secretos de servidor. Destinos necesarios: accounts.spotify.com y api.spotify.com. Las fuentes de Google son opcionales; existen fuentes de respaldo.

## Qué funciona y límites

- Demo local: búsqueda de seis canciones de ejemplo, selección, temporizador y controles visuales. **No reproduce audio**.
- Spotify: búsqueda real, lectura del reproductor activo, play, pause, siguiente/anterior, seek, volumen, shuffle y repetición de pista. Requiere configuración y una cuenta autorizada; no se comprobó con credenciales reales durante la implementación.
- El ecualizador y espectro son decorativos, no procesan ni analizan el audio de Spotify. No se afirma una calidad/bitrate del stream.
- La lista se denomina playlist en la interfaz, pero no crea ni edita playlists de tu cuenta; muestra resultados de búsqueda.
- Sin descarga de música ni reproducción offline. El audio se reproduce en el dispositivo Spotify activo, no mediante un motor propio en esta página.

## Verificación

Pruebas unitarias: filtrado, formato temporal y conversión de respuestas Spotify. Se comprobó con Chromium la búsqueda demo, selección, pausa, vacío, shuffle, EQ, diálogo y diseño móvil. La autorización y reproducción reales están pendientes de configurar el Client ID y probar con una cuenta Spotify elegible.

## Instalar en el celular (PWA)

La vista móvil muestra directamente el reproductor, con controles táctiles y soporte para áreas seguras. Incluye manifest, iconos y service worker. No requiere una tienda de aplicaciones.

1. Publicá este repositorio como sitio estático HTTPS (por ejemplo Netlify; directorio de publicación `.`; sin comando de build obligatorio).
2. Abrí la URL publicada en el teléfono. `127.0.0.1` apunta al propio teléfono y no al servidor de tu PC.
3. Android/Chrome: botón de instalación de SpotiAmp o menú ⋮ → Instalar aplicación / Agregar a pantalla principal. iPhone/Safari: Compartir → Agregar a inicio.
4. Registrá también la URL HTTPS publicada con `/` final en las Redirect URIs de Spotify.

El caché guarda únicamente la interfaz local. No almacena respuestas ni tokens de Spotify. Después de la primera visita, el modo demo puede abrirse sin Internet; la búsqueda y el control Spotify requieren conexión. Los tokens de sesión no necesariamente se comparten entre el navegador y la app instalada: puede ser necesario volver a conectar Spotify.

La instalación efectiva en Android/iOS requiere un dispositivo y despliegue HTTPS; no fue verificada en un teléfono físico. Se verificaron en Chromium 320, 390, 430 y 1440px, manifest, recursos y demo offline. Prueba opcional con Python Playwright y Chromium: `python3 scripts/check_mobile.py` con el servidor iniciado; `BASE_URL` permite cambiar la URL.
