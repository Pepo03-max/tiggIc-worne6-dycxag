# 🧠 Mente Activa

PWA offline de entrenamiento mental con 16 juegos, dificultad adaptativa y progreso local. No usa dependencias ni servidor.

## Implementación

Sirve la carpeta desde HTTPS (por ejemplo, GitHub Pages). El service worker se activa en HTTPS; para probar localmente usa `python3 -m http.server` desde esta carpeta. El progreso se guarda en `localStorage`.

## Desarrollo y pruebas

Las pruebas usan el ejecutor incluido en Node.js y no requieren instalar dependencias:

```bash
npm test
```

La suite comprueba la unicidad de los sudokus, los invariantes de los generadores, la progresión de dificultad, los resultados, las puntuaciones, el ciclo de vida de las partidas y las migraciones del progreso.

## Organización

- `js/app.js`: navegación y composición de las pantallas principales.
- `js/core/`: persistencia, ciclo de vida, resultados y reto de recuerdo.
- `js/games/`: generadores y presentación de cada juego.
- `tests/`: pruebas automatizadas permanentes.

El progreso usa un esquema versionado. El módulo de almacenamiento valida y migra automáticamente los datos antes de entregarlos a la aplicación.

## Correcciones aplicadas

- Sesiones con token para invalidar eventos de partidas abandonadas.
- Kakuro con tablero y pistas correctamente alineados.
- Buscador de palabras que solo muestra palabras realmente colocadas.
- Generadores con respuestas válidas y controles de finalización protegidos.
