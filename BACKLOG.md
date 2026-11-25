# BACKLOG — MBA Radar (costos y retorno del MBA)

Inicio: 25-nov-2026. Referencia base: Hartley (2026) *The Rise and Fall of the M.B.A.?* SSRN 7742198.

## Pendientes
- [ ] Perú: completar precios faltantes (llamar/escribir a admisión de las que no publican).
- [ ] Perú: validar todas las URLs (etl/check_links.py) antes de cada publicación.
- [ ] Publicar en GitHub Pages (pedir OK a Carlos).
- [ ] og.png para compartir.
- [ ] Siguientes países (misma estructura data/paises/<code>.json): Chile, Colombia, México, Argentina, España.

## Decisiones
- Un JSON por país (`data/paises/<code>.json`) + `data/global.json` (evidencia mundial) → replicable país por país.
- Segmentos: escuela con acreditación internacional (AACSB/AMBA/EQUIS) / universidad privada / universidad pública.
- Calculadora: sueldos ×14 (gratificaciones), descuento mensual, prima atribuible editable con presets de la evidencia.
- Tema claro, mobile-first, combobox propio (no `<select>`).
