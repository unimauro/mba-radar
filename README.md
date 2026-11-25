# MBA Radar — ¿vale la pena un MBA?

Dashboard abierto sobre el **costo** de los programas MBA y la **evidencia de su retorno**, país por país (empezando por Perú).

- Precios por universidad y programa, con fuente y nivel de confianza.
- Calculadora de retorno (VAN, recuperación, TIR, aumento mínimo necesario).
- Prima salarial del posgrado calculada con microdatos ENAHO (INEI) 2019-2024 — `etl/enaho_prima_posgrado.py`.
- Estudios peruanos, oferta de maestrías (SUNEDU) y evidencia internacional (Hartley 2026, GMAC, FT, Altonji y Zhu…).

Regenerar datos: `python3 etl/build.py`. Estructura: `data/paises/<code>.json` + `data/global.json`.
