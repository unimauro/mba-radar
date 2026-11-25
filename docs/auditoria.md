# Auditoría adversarial — MBA Radar (Perú)

Fecha: 25-nov-2026. Revisor: auditoría de solo lectura (no se editó ningún archivo salvo este).
Alcance: `data/paises/pe.json`, `data/global.json`, `data/retornos/*`, `data/costos/*`, `etl/enaho_prima_posgrado.py`, `app.js`, `index.html`.
Los números de línea de `index.html` pueden haberse movido porque otros agentes lo editan en paralelo. Por eso cito el texto además de la línea.

Pruebas numéricas: copié `simular()` de `app.js` (l. 206-220) y la corrí con node. Las cifras ENAHO salen de `data/retornos/enaho_prima.json`.

---

## Resumen

| Prioridad | # | Tema |
|---|---|---|
| CRÍTICO | C1 | La cifra «< 0, no rankeados» (Altonji y Zhu) va en el hero de Perú, no está en la fuente primaria y tiene el año mal |
| CRÍTICO | C2 | «Para ellos el posgrado no pagó» / «1 de cada 5»: es una afirmación causal sin contrafactual |
| CRÍTICO | C3 | La tabla de equilibrio (break-even) depende de dos supuestos que no se muestran: horizonte de 10 años y sueldo de partida |
| CRÍTICO | C4 | Dos de los cuatro presets de la calculadora (44 % y 60 %) están sesgados al alza y se presentan como «sugeridos por la evidencia» |
| IMPORTANTE | I1-I12 | Duplicados, programas que no son MBA, full-time mal asignado, impuestos, IC95 sin diseño muestral, «prima bruta», etc. |
| MENOR | M1-M10 | Redondeos inconsistentes, metadatos, código muerto, etiquetas |

**Seguridad: sin hallazgos.** Los 27 `innerHTML` de `app.js` escapan con `esc()` todo dato externo; las URL pasan por `safeUrl()`. Todos los `target="_blank"` llevan `rel="noopener"` (revisé `index.html`, `app.js` y `assets/og.html`).

---

## Verificación contra fuentes (cifras y precios)

| # | Dato en el dashboard | Fuente consultada | Resultado |
|---|---|---|---|
| 1 | UP Maestría en Administración S/ 98,500 | up.edu.pe/Documents/Inversion-por-maestria-2025.pdf | ✅ |
| 2 | UP MBA blended S/ 69,800; a distancia S/ 104,500 | ídem | ✅ |
| 3 | UP Corporate MBA S/ 157,000; EMBA S/ 120,000 | ídem | ✅ Pero los metadatos del PDF dicen «Inversión por maestría **2021**.docx» (ver M7) |
| 4 | PAD MBA S/ 79,000, 24 meses, sin Semana Internacional (US$ 3,600) | pad.edu/maestria/mba | ✅ |
| 5 | UPC MBA Ejecutivo S/ 68,500, 21 meses | postgrado.upc.edu.pe | ✅ precio. La misma página dice 21 y 23 meses |
| 6 | UNSA S/ 8,200 (7,200 + 300 + 2×350), 2 años | posgrado.unsa.edu.pe | ✅ |
| 7 | UCV a distancia S/ 4,800 (100 + 2×250 + 12×350) | RGG 213-2026/UCV | ✅ La tarifa «Maestría Tipo A» también cubre maestrías en educación |
| 8 | CENTRUM: EMBA US$ 24,600; MBA US$ 19,739; online US$ 16,882 | aacsb.edu/accredited/c/centrum-pucp-business-school (2024-25) | ✅ La fila «International MBA» dice **«Full-Time, Part-Time»** (ver I4) |
| 9 | ESAN MBA Weekends S/ 98,500, **23 meses** | esan.edu.pe/mba/weekends | ⚠️ El precio coincide. La página leída hoy dice **«17 meses»** → revisar la duración |
| 10 | TC 3.479 (BCRP PD04640PD, 24-nov-2026) | API del BCRP | ✅ |
| 11 | AméricaEconomía 2024: Pacífico US$ 4,278/mes, +44 %, 63 %; USIL US$ 2,624, +44 %, 49 % | PDF AE 2024, p. 16 | ✅ La nota (2) define la variación como «promedio … entre el año previo al ingreso y el tercer año desde el egreso» |
| 12 | Mediana LatAm US$ 4,160 y +57 % (38 escuelas) | cálculo sobre la tabla AE 2024 | ✅ (4,161 / 4,159 → 4,160; mediana de la variación = 57) |
| 13 | «Antes» de USIL 2024 = 1,822; de Pacífico = 2,971 | despues / (1 + var) | ✅ aritmética. Ojo: la variación es un promedio de % individuales, así que el «antes» reconstruido es aproximado (desigualdad de Jensen; la nota ya lo advierte) |
| 14 | Gestión/CAPPES: −31.7 % públicas, −0.3 % privadas, Gestión Pública 13.3 %, top 5 = 47.8 %, 9 de 10 trabajan | gestion.pe | ✅ El artículo dice «alrededor del 70 %» y el JSON dice «>70 %» (M8) |
| 15 | Infobae/INEI: desempleo universitario 7 %, nacional 5.9 %, ingreso S/ 3,176.7 | infobae.com | ✅ |
| 16 | Yamada y Oviedo (IPAE): premio de 15.9 %–48.9 %; 19.84 % vs 12.67 % con posgrado | PDF IPAE | ✅ El 48.9 % es «en el mejor de los casos». El rango central del texto es 15.9–20.4 % |
| 17 | Infocard CE: 1,991 maestrías, 104,252 / 94,095 estudiantes, 24 % de profesionales con posgrado, S/ 60–90 mil | PDF CE | ✅ |
| 18 | ENAHO 2024: mediana S/ 3,958 vs S/ 2,567; prima +60.5 % (IC 49.6–72.2); 56.8 % de posgraduados en el sector público; 18.4 % × 297,242 ≈ 55 mil | enaho_prima.json | ✅ Coherente con el JSON |
| 19 | Altonji y Zhu: «0,156 log», «no rankeados < 0» | NBER WP 33530 (feb-2025, rev. nov-2026), resumen | ❌ Ver C1 |
| 20 | Hartley (2026), SSRN 7742198 | papers.ssrn.com | ⚠️ HTTP 403: no se pudo verificar. Todas las cifras de la sección 5 dependen de este documento |
| 21 | «Ninguna escuela latinoamericana en el top 100 del FT 2025» | PDF del FT en iima.ac.in | ✅ Para 2025, ningún país latinoamericano aparece en la tabla |

---

## CRÍTICO

### C1. «< 0 retorno de los MBA no rankeados (Altonji y Zhu, EE.UU.)» en el hero de Perú
- **Dónde:** `app.js:64` (tarjeta roja del hero). También `data/global.json` → `hartley.hallazgos[id=calidad]` y `hartley.otros.altonji_zhu_2021.no_rankeados`, y el preset «Programa no rankeado» en `pe.json → presets_prima[0]`.
- **Qué está mal:**
  1. La cifra llega de segunda mano, desde el resumen que hace Hartley. El resumen del paper original (NBER WP 33530, Altonji y Zhu, 2025, revisado en nov-2026) solo dice: «school-specific returns are higher for higher-ranked JD and MBA programs». No menciona un retorno negativo para los no rankeados.
  2. El año está mal: se cita como 2021, pero la versión pública es NBER 2025 (rev. 2026).
  3. Es una cifra de Texas puesta en el hero de un dashboard de Perú, en rojo y sin ningún matiz. El lector entiende que los MBA peruanos «no rankeados» (casi todos) tienen retorno negativo. Ningún dato peruano respalda eso.
  4. Al mismo resumen le falta un dato que sí aplica a Perú y quedó fuera: «Returns are … **lower for part-time students**». Casi todos los MBA peruanos son part-time.
- **Evidencia:** https://www.nber.org/papers/w33530 (resumen).
- **Corrección:** sacar la tarjeta del hero o reescribirla así:
  ```js
  {b: 'Menor', r: 1, s: 'retorno del MBA en programas peor rankeados y en part-time (Altonji y Zhu 2025, Texas)'}
  ```
  Recitar como «Altonji, J. y Zhu, Z. (2025). Returns to Specific Graduate Degrees: Evidence from Texas Administrative Records. NBER WP 33530». Mantener «no rankeados < 0» solo si se encuentra en una tabla del paper (citar el número de tabla). Si no, atribuirlo de forma explícita: «según el resumen de Hartley (2026)».

### C2. «1 de cada 5 … gana menos que un universitario típico» / «Para ellos el posgrado, de hecho, no pagó»
- **Dónde:** `pe.json → alertas[id=enaho_bajo_mediana].hallazgo_clave` y `app.js:60`.
- **Qué está mal:**
  1. «No pagó» es una afirmación causal. No sabemos cuánto ganaría esa persona sin el posgrado; podría ganar todavía menos.
  2. `p301a == 11` incluye posgrados **incompletos o en curso**: personas que hoy están pagando la maestría. Eso infla la cifra.
  3. La comparación no es entre iguales. El 19.1 % compara a todos los posgraduados con la mediana de **todos** los universitarios. Dentro de cada grupo (misma edad o mismo sector) el porcentaje sube a **24–28 %** (25-34 años: 25.6 %; 35-44: 24.0 %; 45-64: 25.3 %; público: 27.7 %; privado: 28.0 %; `cortes.2024.*.descriptivo.pct_posgrado_bajo_mediana_uni`). Paradójicamente, la cifra nacional es **conservadora**: el titular más sólido sería «1 de cada 4 en su mismo grupo de edad».
  4. Contexto que falta: por definición, el 50 % de los universitarios gana menos que su propia mediana. Que lo haga el 19 % de los posgraduados también indica que a la mayoría le va mejor.
- **Corrección (texto):**
  > **1 de cada 4** personas con maestría o doctorado gana menos que el universitario típico **de su misma edad** (ENAHO 2024). Para ellas, el posgrado no se tradujo en un sueldo por encima del promedio de quienes no lo tienen.

  Y en `app.js:57` dejar de extraer el porcentaje con la regex `/(\d+) %/` del texto (es frágil). Usar un campo numérico `pct` en la alerta.

### C3. La tabla de equilibrio («¿cuánto tendría que subir tu sueldo…?») depende de supuestos que no se muestran
- **Dónde:** `app.js:144-161` (`renderBE`). Horizonte fijo `H: 10`, sueldo de partida tomado de `sueldos_ref`.
- **Qué está mal:** el resultado («n de 58 programas exigen más de +17 % / +61 %») cambia mucho según el horizonte y el sueldo de partida. Ninguno de los dos se puede ajustar en el gráfico:

  | Sueldo de partida (M) | H = 10 | H = 20 | H = 30 |
  |---|---|---|---|
  | S/ 2,567 (univ. típico Perú) | 35 > 17 %, **6 > 61 %** | 29 / 0 | 28 / 0 |
  | S/ 4,509 (p75 Lima, por defecto) | 28 / 0 | 12 / 0 | 7 / 0 |
  | S/ 8,000 | 11 / 0 | 2 / 0 | 1 / 0 |
  | S/ 10,000 | 3 / 0 | 1 / 0 | 1 / 0 |

  Una persona de 30 años tiene 30 años de carrera por delante. Con 10 años de horizonte y sin valor terminal, el aumento necesario sube a más del doble (caso por defecto de la calculadora: 38 % a 5 años, 17 % a 10, 10.4 % a 20 y 9.4 % a 25).

  Además, quien postula a PBS, ESAN o CENTRUM no gana S/ 4,509. Según AméricaEconomía, el ingreso **previo** de quienes postulan a Pacífico fue de US$ 2,971 al mes (≈ S/ 10,300). Medir el MBA de S/ 157 mil contra sueldos de S/ 2,567–4,509 exagera el aumento necesario en las escuelas caras.
- **Corrección:**
  - Agregar chips de horizonte (10 / 20 / 30 años) y un chip de sueldo «Postulante típico de escuela top (AméricaEconomía): S/ ~10,000».
  - Cambiar el subtítulo de `index.html` («Aumento salarial permanente que necesitas solo para no perder dinero en 10 años…») por:
    > «Aumento salarial que necesitas para no perder dinero **si el aumento dura solo 10 años** (descuento 8 %). Con 20 o 30 años de carrera el umbral baja a la mitad o menos: cambia el horizonte arriba.»

### C4. Presets de la calculadora: dos de cuatro están sesgados al alza y se presentan como «sugeridos por la evidencia»
- **Dónde:** `pe.json → presets_prima`; `app.js:198` («Primas sugeridas por la evidencia:»).
- **Qué está mal:**
  - El preset **AméricaEconomía 44 %** mide la variación bruta entre el año previo al MBA y el tercer año tras egresar, es decir, unos 5-6 años de carrera. Con un crecimiento normal de 3-5 % real al año, entre 16 y 28 puntos de ese 44 % llegarían igual sin MBA. Además viene de una encuesta autoseleccionada.
  - El preset **ENAHO 60 %** es la prima de cualquier maestría o doctorado, condicionada solo por edad, sexo y zona. Es una correlación, no un efecto.
  - La calculadora aplica esa prima completa y **constante durante todo el horizonte**. Eso contradice la propia nota de supuestos («la prima atribuible debe ser menor que la diferencia bruta»).
  - El preset **«Causal EE.UU.» 17 %** usa efectos fijos (un supuesto fuerte, no un experimento), en Texas y mezclando full-time con part-time. El paper dice que el retorno es menor en part-time.
  - El preset «No rankeado 0 %» se apoya en el «< 0» no verificado de C1.
- **Corrección (`presets_prima`):**
  ```json
  [{"etiqueta":"Pesimista (programa de baja calidad)","valor":0,"fuente":"Retorno menor en programas peor rankeados y part-time (Altonji y Zhu 2025)"},
   {"etiqueta":"EE.UU., efectos fijos","valor":17,"fuente":"Altonji y Zhu: 0,156 log ≈ +17 % (supuestos fuertes; Texas)"},
   {"etiqueta":"Techo: variación bruta AméricaEconomía","valor":44,"fuente":"Pre/post autorreportado; incluye ~5 años de crecimiento normal. NO es atribuible al MBA"},
   {"etiqueta":"Techo: prima ENAHO (correlación)","valor":60,"fuente":"Cualquier maestría/doctorado; incluye selección. NO es atribuible al MBA"}]
  ```
  En la interfaz: «Referencias (las dos últimas son techos, no efectos del MBA):».

---

## IMPORTANTE

### I1. Hero: «Miles de peruanos se endeudan cada año por un MBA… para muchos, ese dinero no regresa»
- **Dónde:** `index.html` (~l. 56, `<p class="lead">`).
- **Problemas:**
  - No hay ninguna fuente sobre endeudamiento ni sobre cuántas personas estudian un MBA. CAPPES da la matrícula de todo el posgrado, no la de MBA.
  - «Para muchos no regresa» no tiene medición directa para el MBA en Perú: ENAHO no aísla el MBA.
- **Propuesta:**
  > «Miles de peruanos pagan cada año por un MBA, muchas veces a crédito. Reunimos precios reales, microdatos del INEI y la investigación más reciente para responder lo que no te dicen en la charla informativa: **el retorno no está garantizado y, según el programa y tu sueldo, puede no llegar nunca.**»

### I2. «+61 %» presentado como «prima bruta»
- **Dónde:** `app.js:134` («Más de 61 %: supera incluso la prima bruta del posgrado») y `app.js:161` («prima bruta promedio del posgrado (+61 %)»).
- **Qué está mal:** el +60.5 % no es bruto. Es el coeficiente de una regresión de Mincer con controles. Las brechas brutas son +54.2 % en medianas y +69.9 % en medias. Además es una prima de **cualquier** posgrado a nivel nacional. En Lima es +81 % y en el sector privado +73.5 %, que es donde están casi todos los alumnos de MBA. Un crítico diría que el umbral rojo está **bajo**.
- **Propuesta:**
  - `"Más de 61 %: más que la diferencia de sueldos promedio entre posgraduados y universitarios (ENAHO, no causal)"`.
  - Tramo medio: `"17–61 %: más que el efecto estimado en EE.UU.; dentro de la diferencia observada en Perú (que incluye selección)"`.
  - Tramo verde: `"Hasta 17 %: por debajo del efecto estimado en EE.UU. con efectos fijos"`. Hoy dice «alcanzable según la evidencia causal», que es overclaiming.

### I3. Duplicados y precios repetidos inflan los conteos y las medianas por segmento
- **Dónde:** `pe.json → programas`.
  - ESAN tiene 11 filas. Cinco sedes regionales (Arequipa, Cusco, Huancayo, Piura, Trujillo) tienen el mismo programa y precio (S/ 78,950).
  - UP: las filas 17 y 18 son el mismo programa. La nota de la 18 lo admite: «la tabla no separa Weekend».
  - CENTRUM: tres filas a US$ 19,739 (presencial, blended, international).
- **Efecto:**
  - La mediana del segmento «acreditadas» es S/ 78,975 con 26 filas y **S/ 85,583** si se deduplica por (escuela, precio), con 17 filas.
  - La mediana del segmento privado pasa de 20,500 a 23,380.
  - En `be-nota` el conteo «n de 58» pondera cinco veces el mismo programa de ESAN.
- **Corrección:** agregar `duplicado_de` o `grupo_precio` y, en `renderSegmentos` y `renderBE`, contar programas únicos. Como mínimo, en la nota: «58 filas, 44 combinaciones únicas de escuela y precio».

### I4. CENTRUM «International MBA» marcado como Full-time → se le suman 18 meses de sueldo perdido
- **Dónde:** `pe.json → programas[id=3]` (`modalidad_grupo: "Full-time"`, `duracion_meses: null`).
- **Evidencia:** AACSB lista el programa como «Full-Time, **Part-Time**». Como no tiene duración, `renderBE` usa 18 meses por defecto. Con el sueldo de partida por defecto, el aumento necesario pasa de **21.6 % a 47.1 %** solo por esta clasificación. Es el único full-time de la base.
- **Corrección:** `modalidad_grupo: "Part-time / semipresencial"` mientras no se confirme el formato en centrum.pucp.edu.pe; o confirmar y cargar la duración real.

### I5. En la calculadora, al elegir un programa sin duración se queda la duración anterior
- **Dónde:** `app.js:191`: `if (p.duracion_meses) $('c-dur').value = …`.
- **Qué está mal:** al elegir UP EMBA o UP MBA (duración `null`), la calculadora conserva la duración del programa anterior, mientras el gráfico de equilibrio usa 18. El mismo programa da resultados distintos en los dos gráficos.
- **Corrección:** `$('c-dur').value = p.duracion_meses || 18;` y mostrar «(duración no publicada, se asumen 18 meses)».

### I6. «×33» entre el más caro y el más barato compara cosas distintas
- **Dónde:** `app.js:61` y `app.js:77`.
- **Qué está mal:**
  - Se compara el Corporate MBA de PBS (doble grado con ESADE, módulo internacional) con el MBA a distancia de la UCV (S/ 4,800, que **no incluye** derecho de grado).
  - Los totales no son homogéneos: el de UNI excluye S/ 4,375 de grado (casi lo que cuesta toda la UCV); el de UNALM excluye admisión, autoseguro y grado; el de UNSAAC excluye inscripción.
  - Las fechas de los precios van de 2021 (UCSM) a 2027.
- **Corrección:**
  - Agregar un campo `incluye_grado` (true/false) y mostrar «el total no incluye grado» en la tabla y el tooltip.
  - Para el titular, usar una relación más robusta: mediana de acreditadas / mediana de públicas = 78,975 / 8,200 ≈ **×10**. Por ejemplo: «Un MBA de escuela acreditada cuesta ~10 veces uno de universidad pública». Si se quiere el extremo, decir «×33 (de un MBA virtual sin derecho de grado a un doble grado internacional)».

### I7. Programas que no son MBA comparados como si lo fueran
- **Dónde:** `pe.json → programas`, ids 40, 34, 65, 49, 66, 67.
  - **40 (UNSAAC):** «Maestría en Administración, menciones … Gestión Pública, Turismo, Gerencia de la Educación».
  - **34 (UPCH):** «MBA en Innovación Educativa». La propia nota dice «no MBA generalista».
  - **65 (UWIENER):** Gestión Administrativa de la Salud.
  - **49 (UPC):** «MBA para Egresados EPG», un complemento de 12 meses, no un programa completo.
  - **66 (USS):** «antecesora del actual MBA», precio de 2023, confianza baja, y sí aparece en el gráfico.
  - **67 (UIGV):** «programa no confirmado».
- **Corrección:** agregar `tipo_programa: "MBA general" | "MBA sectorial" | "Maestría en administración (no MBA)" | "complemento"`. Excluir «complemento» y la confianza «baja» de los KPIs (mín./máx./×N) y de las medianas, o mostrarlos con trama.

### I8. Acreditaciones: AMBA es por programa, no por escuela
- **Dónde:** el campo `acreditaciones` y el segmento «Escuela de negocios con acreditación internacional».
- **Qué está mal:** AACSB acredita a la escuela, pero AMBA acredita **programas MBA concretos**. Poner «AACSB, AMBA» en la «Maestría en Administración con especialización en Innovación y Ciencia y Tecnología» o en el «MBA a distancia» de UP, o en todas las sedes regionales de ESAN, sugiere que cada programa está acreditado por AMBA, cosa que no está verificada. PAD figura «solo AMBA», pero eso no está contrastado con el listado de AMBA.
- **Verificado:** CENTRUM tiene AACSB (página de AACSB). Pacífico tiene «AMBA – AACSB» y USIL «–» (tabla de AméricaEconomía 2024).
- **Corrección:** separar `acreditacion_escuela` de `acreditacion_programa` y enlazar el directorio de AMBA de cada programa. Renombrar el segmento a «Escuela con acreditación internacional (AACSB/AMBA/EQUIS)», que es lo que en realidad se mide.

### I9. La calculadora ignora el impuesto a la renta
- **Dónde:** el texto de supuestos de la calculadora (`index.html` ~l. 124) y `simular()`.
- **Qué está mal:** el aumento de sueldo paga 5.ª categoría a la tasa marginal: 14 % entre 5 y 20 UIT, 17 % y 20 % más arriba. La matrícula, en cambio, se paga con dinero ya neto de impuestos.
- **Efecto:** para que el aumento neto sea del 17 %, el aumento bruto tiene que ser de **19.8 % a 21.3 %**. Omitir impuestos favorece al MBA, y el dashboard sí lo dice («No incluye impuestos»), pero no muestra hacia qué lado sesga.
- **Corrección:** agregar un input «Tasa marginal de impuesto (%)», por defecto 14, y multiplicar la ganancia por `(1 - t)`:
  ```js
  // en simular: flows.push(t < D ? -C / D - (ft ? base*(1-tax) : 0) : base * p * (1 - tax));
  ```
  (El sueldo perdido en full-time también es neto.) Como mínimo, cambiar el texto a: «No incluye impuestos: el aumento bruto necesario es ~15-25 % mayor que el mostrado».

### I10. Los IC95 de ENAHO ignoran el diseño muestral
- **Dónde:** `etl/enaho_prima_posgrado.py:143` (`smf.wls(...).fit(cov_type="HC1")`).
- **Qué está mal:** la ENAHO es una muestra por conglomerados y estratos. Con errores HC1 sin clusterizar, el IC 50–72 % (que se publica en el KPI) sale demasiado estrecho.
- **Corrección:** agregar `conglome` a `COLS` y usar `fit(cov_type="cluster", cov_kwds={"groups": d.conglome})`, o `svy` en Stata/R `survey`. Recalcular `detalle` y `cortes`.

### I11. ENAHO: muestra «posgrado» = completo + incompleto + en curso; Lima con n = 180
- **Dónde:** `etl/enaho_prima_posgrado.py:115`.
- **Qué está mal:**
  - `p301a == 11` no separa a quien terminó de quien está cursando. Revisar `p301b`/`p301c` para aislar «completo», si la codificación del año lo permite.
  - El corte de Lima tiene 180 posgraduados (IC 60–106 %), y el panel lo muestra con la misma jerarquía visual que los demás.
- **Corrección:** probar la restricción a grado completo como análisis de robustez y mostrar los IC en el tooltip de `ch-enaho` (hoy solo muestra la n).

### I12. Sueldo de referencia: ÷12 vs ×14 es consistente en el cálculo pero confuso en la interfaz
- **Dónde:** `app.js:140, 144, 156, 158`.
- **Consistencia, revisada:**
  - El ingreso de ENAHO = (anual con extraordinarios, `d544t`, que incluye gratificaciones) / 12 = M.
  - `renderBE` usa S = M·12/14 y `simular` reconstruye la base como S·14/12 = M. **El aumento porcentual necesario es correcto.** No hay doble conteo de ingresos.
  - Las variables de ingreso son las de la construcción estándar de INEI (principal + secundaria + especie + extraordinarios).
- **Lo confuso:**
  1. El chip dice «S/ 4,509/mes», pero al tocar la barra la calculadora pone «Tu sueldo bruto mensual: 3,865» (`app.js:158`).
  2. El tooltip dice «≈ S/ X más al mes» sobre M, mientras la calculadora trabaja con S.
  3. Quien no recibe gratificaciones (independiente o informal: 14 % de los posgraduados no son dependientes) no tiene 14 sueldos.
- **Corrección:** mostrar en los chips el sueldo en base 14: `money(r.mensual*12/14)` + «/mes (14 sueldos)», y en el tooltip `money(S*x.v/100)`. Agregar a los supuestos: «Si no recibes gratificaciones, ingresa tu ingreso anual ÷ 14».

---

## MENOR

- **M1. Redondeos inconsistentes.**
  - `pe.json → enaho_panel.texto` dice «la prima es +61 %» y, en la misma frase, «2024: +60 %».
  - `presets_prima[3]` usa 60; el KPI y el hero usan 61.
  - Unificar en «+61 %» o mostrar «+60.5 %».
- **M2. «gana en promedio quien tiene posgrado… pero buena parte ya ganaba más antes»** (`app.js:63`). «En promedio» es impreciso (es una prima condicionada en logaritmos) y «buena parte» no está cuantificado para Perú. Propuesta: «más gana, con igual edad, sexo y zona, quien tiene maestría o doctorado. Parte de esa diferencia es selección, no efecto del título».
- **M3. El veredicto «el MBA destruye valor para ti»** (`app.js:227`) también aparece con un VAN de −S/ 87 (el caso por defecto da VAN ≈ 0 y TIR 8.0 %). Propuesta: «Con estos supuestos no se recupera en {H} años». Agregar un tercer estado «≈ equilibrio» si |VAN| < 2 % del costo.
- **M4. Código muerto.** `app.js:142`: `BE_TIERS[1].txt.replace('promediode', …)` no hace nada; el texto ya está bien.
- **M5. Recuperación con costo 0:** marca 19 meses (`pay` se activa en t = D con acumulado 0). Usar `acc > 0`.
- **M6. El costo se reparte en partes iguales;** muchos programas cobran admisión y matrícula por adelantado. El efecto es pequeño y favorece al MBA. Mencionarlo en los supuestos.
- **M7. UP:** el PDF «Inversión por maestría 2025» tiene como título interno «Inversión por maestría 2021.docx». Probablemente es una plantilla reutilizada, pero conviene decir «tabla publicada en 2025» y guardar una copia en Wayback.
- **M8. Gestión/CAPPES:** el JSON dice «Maestrías >70 % de la matrícula»; el artículo dice «alrededor del 70 %».
- **M9. UCV:** el nombre del archivo dice `RGG_N_213-2025` pero la resolución es la 213-2026 (la nota está bien; solo es para no confundir).
- **M10. Oferta:** el panel dice «1,803 maestrías» (SUNEDU 2024) y la ficha de la CE dice «1,991» (SUNEDU 2021) en la misma página. Aclarar en una nota que son cortes distintos. `app.js:62` hace `ofe.titulo.split(' ')[0]`, que es frágil.
- **M11. CENTRUM:** precios de AACSB 2024-25 convertidos al TC de nov-2026. Indicarlo en el tooltip como «precio 2024-25».
- **M12. Hartley (2026):** SSRN responde 403 a clientes automáticos y no pude verificar que exista ni sus cifras. Toda la sección 5 depende de él: guardar el PDF o una copia en Wayback en el repo.
- **M13. ENAHO, variables `i*` vs `d*`:** el docstring dice «imputados/deflactados» para todas. Verificar en el diccionario de INEI si `i524a1` es imputado y anualizado pero no deflactado, y documentarlo. No cambia la prima.

---

## Lo que está bien (para no sobrecorregir)

- La aritmética financiera es correcta. VAN, TIR (por bisección sobre la tasa mensual) y prima de equilibrio (`pvCost/pvGain`, lineal en p) coinciden con un cálculo manual (17.0 % en el caso por defecto). La TIR del caso con VAN ≈ 0 da 8.0 %, igual a la tasa de descuento.
- La mayoría de los precios verificados coinciden con la fuente oficial, y cada fila documenta qué incluye.
- Las advertencias de ENAHO (no aísla el MBA, selección, especificación B con malos controles) están bien planteadas en el JSON; falta llevarlas al texto de la interfaz.
- Seguridad: sin hallazgos.
