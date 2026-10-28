# SpotiAmp · Diseño

Referencia: reproductores Winamp de los 2000 y captura aportada por el usuario. Implementación original para web.

- Fondo carbón `#14151b`; chasis `#32333f`; pantallas `#090f09`.
- Texto LCD lima `#88ef36`; detalles ámbar `#f5ad44`; secundario `#8c8e9c`.
- Tipografía: Space Mono en instrumentos, DM Sans en interfaz externa; respaldos locales monospace/sans-serif.
- Reproductor de 440px máximo, apilado: pantalla, espectro, transporte, ecualizador, buscador y lista. En móviles ocupa el ancho disponible sin marco de teléfono.
- Bordes biselados, líneas dobles y controles metálicos; sombra verde muy tenue.
- Estados: demo explícita sin audio, conectado, reproducción, pausado, búsqueda, vacío y error legible.
- Botones etiquetados, foco visible, rangos accesibles y animación desactivada con prefers-reduced-motion.

## Aplicación móvil

Hasta 600px se oculta la introducción y se prioriza el chasis de borde a borde. Transporte de al menos 44px de alto; búsqueda de 16px para evitar zoom automático de iOS; volumen en su propia fila. Márgenes seguros con env(safe-area-inset-*), viewport-fit=cover y lista con scroll propio. Instalable como PWA standalone con icono original de rayo y pantalla de arranque carbón. Los estados y la lógica Spotify son compartidos con escritorio.
