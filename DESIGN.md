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

## Controles funcionales (v3)

Se eliminan botones de ventana ficticios y el temporizador demo. La fuente se elige explícitamente: archivos locales o Spotify. Los iconos de transporte son SVG propios para evitar emojis de cada plataforma. El chasis usa bordes ridge, LCD verde intenso y controles ámbar, aproximando la referencia aportada. Todos los controles interactivos invocan acciones reales; los controles que no están disponibles muestran estado disabled y una explicación. El ecualizador y analizador son reales solo con archivos locales; Spotify no expone la señal de audio.

## Skin clásico (referencia nueva)

Se reemplaza el layout alto por tres módulos compactos: player con reloj/espectro izquierdo y título/volumen derecho; ecualizador con preamp y diez bandas (60–16K, incluida 14K), curva de ganancias, ON/OFF y presets; playlist de una línea con artista/título/duración y selección azul. Chasis violeta grisáceo, biseles plateados, barras doradas y verde de fósforo. Tipografía de sistema para no depender de fuentes remotas. Los controles se amplían en móvil manteniendo el orden del Winamp clásico; conexión y selector de fuente quedan fuera del chasis. No se incluyen botones de cerrar/minimizar ficticios. Los presets y bypass son funcionales en audio local; quedan deshabilitados con Spotify.
