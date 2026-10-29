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

## Analizador dinámico

32 bandas logarítmicas entre 45 Hz y 16 kHz (ajustadas al sample rate), FFT de 2048 muestras y suavizado del analizador de 0,08. Magnitudes reales en dB, rango visual de −78 a −18 dB y compensación fija de agudos de hasta 6 dB. Ataque inmediato, caída exponencial de 85 ms y marcadores de pico con retención breve y caída independiente del refresco. No se interpolan las alturas con CSS y no se generan datos aleatorios; silencio y pausa vuelven a cero. El análisis no modifica el volumen ni el audio reproducido.

## Movimiento afinado con el video aportado

Referencia observada: clip del usuario de Winamp reproduciendo la introducción de DJ Mike Llama. Se compararon fotogramas consecutivos y se reprodujo localmente el audio del clip para revisar el comportamiento, sin incluir esos archivos en la app ni el repositorio.

Se sustituye el ataque instantáneo por una subida exponencial de 14 ms y la caída exponencial por descenso con aceleración. Los picos blancos se retienen 140 ms y caen independientemente, más despacio que las barras. Bandas Mel sin bins iniciales duplicados; escala de amplitud con margen entre señales débiles y golpes fuertes, evitando una pared uniforme de barras altas. Colores fijos por altura: verde, amarillo y ámbar; rejilla tenue y segmentos de 2px. La escala anterior en dB y su caída de 85 ms quedan reemplazadas por este ajuste. La animación conserva datos de audio reales y no modifica la reproducción.
