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

## SIGUIENTE (pedido 25-nov, no iniciado)
- [ ] Vistas con router por hash (#/inicio #/precios #/calculadora #/retorno #/mundo #/fuentes): renderAll() una vez, luego mostrar/ocultar + resizeCharts(); reemplazar goToSection() en js/navigation.js.
- [ ] Escala más compacta (tipografías, hero, espaciados).
- [ ] Más gráficos: meses de sueldo por MBA, precio vs duración (dispersión), costo por mes, prima ENAHO 2019-24, distribución p25/mediana/p75, caída postulaciones 2026, matrícula HBS, CEOs F100, ratio MBA/bachiller, interés IA.
- [ ] Efectos: count-up, barras que crecen, transiciones (respetar prefers-reduced-motion).
- [ ] Plin (mismo número que Yape) + botones compartir (WhatsApp/LinkedIn/X/Facebook/copiar).
- [ ] Chat IA: gateway ai.tunky.net YA dado de alta (proyecto mba-radar, token en deploy/gateway-alta.sh); falta widget flotante inline que mande DATOS del tablero en el user message.
- [ ] Bug: vista móvil de #tb-costos (reglas nth-child no cuentan la columna Sede).
- [ ] Regenerar assets/og.png (dice 58 programas → 69 con precio / 60 únicos; ×10 pasó a ×8).

## Ranking (pedido 25-nov) — PRIORIDAD
- [ ] Vista `#/ranking`: ranking propio de programas MBA en Perú «valor por sol», transparente y reproducible.
- [ ] Indicadores por programa: costo total y por mes, aumento mínimo para recuperar (break-even), acreditaciones (AACSB/AMBA/EQUIS por programa), posiciones en rankings externos (QS Global MBA, FT Executive Education, AméricaEconomía), datos de empleabilidad/salario post-MBA cuando existan, duración, modalidad, confianza del dato.
- [ ] Tabla de rankings externos por escuela y año (AE 2020-2024, QS 2025-2026, FT EE 2023-2026) con fuentes; buscar AE 2025 y QS payback (captura manual, QS bloquea bots).
- [ ] Metodología pública del índice (pesos editables por el usuario con sliders: precio / acreditación / rankings / retorno), sensibilidad y advertencias (no es un ranking de calidad académica).
- [ ] Deduplicar por grupo_precio; excluir no generalistas o marcarlos; aviso cuando falten datos.
- [ ] Auditoría adversarial del ranking antes de publicar (sesgos, datos autorreportados).

## Decisiones
- Un JSON por país (`data/paises/<code>.json`) + `data/global.json` (evidencia mundial) → replicable país por país.
- Segmentos: escuela con acreditación internacional (AACSB/AMBA/EQUIS) / universidad privada / universidad pública.
- Calculadora: sueldos ×14 (gratificaciones), descuento mensual, prima atribuible editable con presets de la evidencia.
- Tema claro, mobile-first, combobox propio (no `<select>`).
