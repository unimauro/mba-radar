# MBA Radar — ¿vale la pena un MBA?

Dashboard abierto sobre el **costo** de los programas MBA y la **evidencia de su retorno**, país por país (empezando por Perú).

- Precios por universidad y programa, con fuente y nivel de confianza.
- Calculadora de retorno (VAN, recuperación, TIR, aumento mínimo necesario).
- Prima salarial del posgrado calculada con microdatos ENAHO (INEI) 2019-2024 — `etl/enaho_prima_posgrado.py`.
- Estudios peruanos, oferta de maestrías (SUNEDU) y evidencia internacional (Hartley 2026, GMAC, FT, Altonji y Zhu…).

Sitio estático: HTML + CSS + módulos ES nativos (sin bundler ni npm en runtime). Chart.js 4 se carga por CDN.

## Tareas

| Comando       | Equivalente                      | Qué hace |
|---------------|----------------------------------|----------|
| `make build`  | `python3 etl/build.py`           | Regenera `data/paises/*.json` y `data/global.json` |
| `make test`   | `node --test tests/`             | Pruebas de `simular()` y del esquema de `pe.json` |
| `make links`  | `python3 etl/check_links.py`     | Verifica las URLs citadas (sale con 1 si hay 404) |
| `make serve`  | `python3 -m http.server 8791`    | Sirve el sitio en http://localhost:8791/ |

Si `make` no está disponible, `npm run build|test|links|serve` ejecuta lo mismo (no instala nada).
Los módulos usan `import`, así que la página debe servirse por HTTP (con `file://` no carga).

## Estructura

```
index.html            página (secciones con IDs estables: costos, calculadora, retorno, riesgos, mundo, apoya, fuentes)
styles.css            estilos base y tokens de color (:root)
charts.css            componentes cx-* creados desde JS (filtros, barras, buscadores, stepper)
js/
  main.js             punto de entrada: carga datos y llama a cada render<Sección>()
  constants.js        colores, segmentos, supuestos (tasa, impuesto, horizontes…)
  state.js            estado compartido: data (país, global), ui (filtros, detalle abierto), charts
  data.js             carga de JSON y consultas (programas con costo, comparables, únicos por grupo_precio)
  util.js             esc(), safeUrl(), formatos, debounce, búsqueda sin tildes
  simular.js          modelo financiero puro (sin DOM; lo prueban los tests)
  aumento.js          aumento necesario por programa (break-even), con caché
  filters.js          panel de filtros, orden y hash de la URL
  bars.js             lista de barras HTML + ficha de detalle
  kpis.js             portada: cifras de impacto y KPIs
  costos.js           barras de costos, tabla y tarjetas por segmento
  breakeven.js        gráfico "¿cuánto tendría que subir tu sueldo?"
  calc.js             calculadora (formulario, resultado, gráfico, resumen móvil)
  evidencia.js        Retorno, Riesgos y Mundo (Chart.js)
  studies.js          tarjetas de estudios y su buscador
  refs.js             referencias numeradas [n] y sección Fuentes
  charts-common.js    configuración común de Chart.js, makeChart/resizeCharts
  combo.js            combobox accesible
  navigation.js       goToSection(): único punto a cambiar si se añade un router
  page-chrome.js      barra de secciones activa y botón copiar Yape
tests/simular.test.mjs
etl/
  build.py            integra data/ → JSON del dashboard
  check_links.py      verificación de enlaces
  enaho_prima_posgrado.py  prima ENAHO (requiere microdatos INEI, no se ejecuta en build)
  costos/             scripts que generan data/costos/
data/
  costos/programas.{json,csv}   precios relevados (fuente de build)
  retornos/, hartley/, internacional/   evidencia
  paises/index.json, paises/<code>.json, global.json   salidas de build (lo que lee la web)
```

Todo `innerHTML` con datos externos pasa por `esc()`, y todo enlace externo por `safeUrl()`.

## Agregar un país

1. Reunir sus fuentes en `data/` (por ejemplo `data/costos_cl/…`) o escribir directamente `data/paises/<code>.json`
   con la misma forma que `pe.json`: `pais` (code, nombre, simbolo, tc_usd…), `programas` (costo_soles, segmento,
   modalidad_grupo, confianza…), `sueldos_ref`, `presets_prima`, `estudios`, `alertas`, `metodologia`, etc.
2. En `etl/build.py`, escribir `build_<code>()` que devuelva ese diccionario y registrarla en `BUILDERS`.
3. En `PAISES` (mismo archivo) marcar el país con `'listo': True`.
4. `make build && make test`. La web toma el país de `#pais=<code>` o del botón en la barra superior.

Los textos de las secciones que dependen del país (ENAHO, SUNEDU) se ocultan o muestran "pendiente" si faltan sus datos.
