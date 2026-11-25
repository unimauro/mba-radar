# BACKLOG — MBA Radar (costos y retorno del MBA)

Inicio: 25-nov-2026. Referencia base: Hartley (2026) *The Rise and Fall of the M.B.A.?* SSRN 7742198.

## Pendientes
- [x] Precios: 69 programas, 58 con precio (25-nov). Scripts en etl/costos/ (build.py regenera data/costos).
- [x] Prima ENAHO 2019-2024 (etl/enaho_prima_posgrado.py).
- [x] Validación de links: etl/check_links.py (solo 403 anti-bot: SSRN, P&Q, Bloomberg, DOI AMLE).
- [x] Publicado: https://unimauro.github.io/mba-radar/ (25-nov).
- [x] Gráfico "aumento mínimo para recuperar cada MBA" con sueldos ENAHO de referencia.
- [ ] Precios faltantes: U. de Lima, Continental, Científica, USMP, UPN, UNMSM, UNFV, UIGV, PAD Piura/Distancia, CENTRUM–Tulane (escribir a admisión).
- [ ] CENTRUM: precios vienen de AACSB (USD, 2024-25) → confirmar con la escuela.
- [ ] UNAC: brochure ambiguo (S/ 6,500 vs ~S/ 2,000).
- [ ] QS payback (meses) de escuelas latam: QS bloquea bots → capturar a mano.
- [ ] AméricaEconomía Ranking MBA 2025: no hallado.
- [ ] Grados de maestría otorgados por universidad: pedir a SUNEDU (Ley 27806).
- [ ] og.png para compartir.
- [ ] Siguientes países (misma estructura data/paises/<code>.json): Chile, Colombia, México, Argentina, España.

## Decisiones
- Un JSON por país (`data/paises/<code>.json`) + `data/global.json` (evidencia mundial) → replicable país por país.
- Segmentos: escuela con acreditación internacional (AACSB/AMBA/EQUIS) / universidad privada / universidad pública.
- Calculadora: sueldos ×14 (gratificaciones), descuento mensual, prima atribuible editable con presets de la evidencia.
- Tema claro, mobile-first, combobox propio (no `<select>`).
