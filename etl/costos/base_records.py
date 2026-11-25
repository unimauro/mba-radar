# Registros investigados directamente (parte "core"). Cada dict = un programa.
ACC_CENTRUM = "AACSB, AMBA, EQUIS, BGA; SUNEDU licenciada (PUCP)"
ACC_ESAN = "AACSB, AMBA, BGA; SUNEDU licenciada"
ACC_UP = "AACSB, AMBA; SUNEDU licenciada"
ACC_PAD = "AMBA; SUNEDU licenciada (UDEP)"
QS = "https://larepublica.pe/mundo/2024/10/03/las-unicas-universidades-de-america-latina-en-el-ranking-mundial-de-mba-2025-de-qs-superan-a-varias-de-estados-unidos-qs-global-mba-rankings-2025-114078"
RK_ESAN = "QS Global MBA 2025: 201-250 mundo, 7.º LatAm (1.º Perú)"
RK_CENTRUM = "QS Global MBA 2025: 251+ mundo, 8.º LatAm"
RK_UP = "QS Global MBA 2025: 251+ mundo, 9.º LatAm"
AACSB_C = "https://aacsb.edu/accredited/c/centrum-pucp-business-school"
UP25 = "https://up.edu.pe/Documents/Inversion-por-maestria-2025.pdf"

R = []
def add(base=None, **k):
    d=dict(base or {}); d.update(k); R.append(d)

# ---------------- CENTRUM PUCP (precios USD reportados a AACSB, survey 2024-25) -------------
cen = dict(universidad="Pontificia Universidad Católica del Perú – CENTRUM PUCP Business School", siglas="CENTRUM PUCP",
           tipo_gestion="privada asociativa", acreditaciones=ACC_CENTRUM, ranking=RK_CENTRUM, anio_precio="2024-25",
           fuente_url=AACSB_C, confianza="media", moneda="USD")
add(cen, programa="MBA Centrum (Master of Business Administration – Strategic Management), presencial", modalidad="part-time", sede="Lima (Surco / San Miguel)",
    duracion_meses=24, costo_total_usd=19739,
    nota="Precio total del programa reportado por la escuela al directorio AACSB (Survey Year 2024-25; 'Tuition for graduate programs is for the full program'). CENTRUM no publica precio en su web (centrum.pucp.edu.pe/programas/mba/mba-centrum/). Duración 24 meses lectivos (quincenal) o 18 (intensivo) según web oficial.")
add(cen, programa="MBA Centrum Blended (híbrido)", modalidad="semipresencial", sede="Lima",
    duracion_meses=None, costo_total_usd=19739,
    nota="AACSB 2024-25 lista formato 'Hybrid' del MBA a 19,739 USD (mismo precio que presencial). Duración no publicada en la página de AACSB.")
add(cen, programa="MBA Centrum Online", modalidad="online", sede="Online",
    duracion_meses=22, costo_total_usd=16882,
    nota="AACSB 2024-25 'Fully online' 16,882 USD programa completo. Duración 22 meses según Emagister (emagister.pe/mba-centrum-online-cursos-2799542.htm), que lista derecho de admisión S/ 420. Un directorio de terceros cita S/ 76,700 sin fecha (no usado).")
add(cen, programa="International MBA – International Business (MBA Gerencial Internacional)", modalidad="full-time", sede="Lima",
    duracion_meses=None, costo_total_usd=19739,
    nota="AACSB 2024-25: 'International MBA' 19,739 USD (Full-Time, Part-Time). Programa orientado también a estudiantes internacionales.")
add(cen, programa="Executive MBA – International Business (MBA Centrum modalidad ejecutiva)", modalidad="ejecutivo", sede="Lima (San Isidro)",
    duracion_meses=21, costo_total_usd=24600, incluye_viaje_internacional=None,
    nota="AACSB 2024-25: Executive MBA 24,600 USD programa completo. Web oficial (centrum.pucp.edu.pe/programas/mba/modalidad-ejecutiva/): 21 meses lectivos, clases mensuales. Una búsqueda previa mostró en AACSB cifras ligeramente distintas (24,873 USD), probablemente de otro año de encuesta; se usa el valor vigente en la página al 25-nov-2026.")
add({**cen, "fuente_url": "https://centrum.pucp.edu.pe/programas/double-degree/mba-centrum-tulane/", "confianza": "baja", "anio_precio": None},
    programa="Global MBA CENTRUM PUCP – Tulane (doble grado: Magíster en Adm. de Negocios Globales + MBA Tulane)", modalidad="ejecutivo", sede="Lima + EE.UU.",
    duracion_meses=20, costo_total_usd=None, costo_total_soles=None, moneda=None, incluye_viaje_internacional=True,
    nota="Sin precio oficial publicado. Web oficial: 20 meses lectivos, clases mensuales en Lima + módulos en Tulane. TopUniversities lista '65,300 SOL por año' (sin fecha ni claridad de programa), no usado como costo total.")

# ---------------- ESAN (web oficial, inauguraciones 2026-2027) ----------------------------
es = dict(universidad="Universidad ESAN – ESAN Graduate School of Business", siglas="ESAN", tipo_gestion="privada asociativa",
          acreditaciones=ACC_ESAN, ranking=RK_ESAN, confianza="alta", moneda="PEN", incluye_viaje_internacional=None)
add(es, programa="MBA Tiempo Parcial (Lima)", modalidad="part-time", sede="Lima", duracion_meses=20, costo_total_soles=96500, anio_precio="2026-2027",
    fuente_url="https://www.esan.edu.pe/mba/tiempo-parcial", nota="Web oficial: 'Inversión S/ 96,500'; 20 meses + periodo de trabajo de investigación; miércoles y sábados; inauguración 21-abr-2027 (landing esan.edu.pe/landings/mba/presencial). ESAN promociona 'el mayor componente internacional' pero la web no precisa si el viaje está incluido.")
add(es, programa="MBA Weekends (Lima)", modalidad="part-time", sede="Lima", duracion_meses=23, costo_total_soles=98500, anio_precio="2026-2027",
    fuente_url="https://www.esan.edu.pe/mba/weekends", nota="Web oficial: 'Inversión S/ 98,500'; 23 meses + investigación; sábados y domingos; inauguración 21-ago-2027.")
add(es, programa="MBA Semipresencial (Lima)", modalidad="semipresencial", sede="Lima", duracion_meses=None, costo_total_soles=81500, anio_precio="2026",
    fuente_url="https://www.esan.edu.pe/mba/semipresencial", nota="Web oficial: 'Inversión S/ 81,500'. La duración '17 meses' de la plantilla web parece genérica; no se registra.")
add(es, programa="MBA Accelerated (Online)", modalidad="online", sede="Online", duracion_meses=17, costo_total_soles=76500, anio_precio="2026",
    fuente_url="https://www.esan.edu.pe/mba/accelerated", nota="Web oficial: 'Inversión S/ 76,500'; 17 meses lectivos + periodo de tesis; inauguración 15-abr-2026; mínimo 20 participantes.")
add(es, programa="MBA Arequipa Semipresencial", modalidad="semipresencial", sede="Arequipa", duracion_meses=18, costo_total_soles=68000, anio_precio="2026-2027",
    fuente_url="https://www.esan.edu.pe/mba/arequipa", nota="Web oficial: 'Inversión S/ 68,000'; 18 meses según página índice esan.edu.pe/mba (inauguración 15-mar-2027).")
for ciudad, slug in [("Arequipa", "arequipa-presencial"), ("Cusco", "cusco"), ("Huancayo", "huancayo"), ("Piura", "piura"), ("Trujillo", "trujillo")]:
    add(es, programa=f"MBA {ciudad} Presencial", modalidad="part-time", sede=ciudad, duracion_meses=17, costo_total_soles=78950, anio_precio="2026",
        fuente_url=f"https://www.esan.edu.pe/mba/{slug}", nota="Web oficial: 'Inversión S/ 78,950'; 17 meses (martes noche y sábado mañana).")
add({**es, "confianza": "media"}, programa="MBA Ica Presencial", modalidad="part-time", sede="Ica", duracion_meses=17, costo_total_soles=76500, anio_precio="2026",
    fuente_url="https://esan.edu.pe/mba/ica", nota="Página oficial responde con 'Inversión S/ 76,500' (inicio 15-abr-2026) pero Ica ya no aparece en el índice esan.edu.pe/mba: posible convocatoria anterior/no vigente.")

# ---------------- Universidad del Pacífico – PBS (tabla oficial 2025) -----------------------
up = dict(universidad="Universidad del Pacífico – Pacífico Business School", siglas="UP / PBS", tipo_gestion="privada asociativa",
          acreditaciones=ACC_UP, ranking=RK_UP, anio_precio="2025", fuente_url=UP25, confianza="alta", moneda="PEN")
add(up, programa="Maestría en Administración (MBA)", modalidad="part-time", sede="Lima", duracion_meses=None, costo_total_soles=98500,
    nota="Tabla oficial 'Inversión por Maestría 2025' (no se halló versión 2026; up.edu.pe/Documents/Inversion-por-maestria-2026.pdf no existe). Precio 2026 puede variar.")
add(up, programa="MBA Weekend (Maestría en Administración, fines de semana)", modalidad="part-time", sede="Lima", duracion_meses=22, costo_total_soles=98500,
    nota="Se asume el precio de 'Maestría en Administración' de la tabla 2025 (la tabla no separa Weekend). Duración 22 meses lectivos + tesis según folleto MBA Weekend 2026-I (sisisemail.up.edu.pe/sisisemail/docs/2026/24/MBA%20Weekend_2026-I.pdf), que no publica precio.")
add(up, programa="Maestría en Administración (MBA Blended, modalidad semipresencial)", modalidad="semipresencial", sede="Lima", duracion_meses=24, costo_total_soles=69800,
    nota="Tabla oficial 2025: S/ 69,800. Duración 24 meses lectivos según folleto MBA blended 2025-III.")
add(up, programa="Maestría en Administración (MBA a distancia)", modalidad="online", sede="Online", duracion_meses=24, costo_total_soles=104500,
    nota="Tabla oficial 2025: S/ 104,500 (sí, más caro que el presencial según la tabla; verificado con extracción de tabla pdfplumber). 24 meses lectivos según folleto MBA a distancia 2025-III.")
add(up, programa="Maestría en Administración con especialización en Innovación y Ciencia y Tecnología", modalidad="part-time", sede="Lima", duracion_meses=None, costo_total_soles=98500,
    nota="Tabla oficial 2025.")
add({**up, "acreditaciones": ACC_UP + "; doble grado con ESADE"}, programa="Corporate MBA (CMBA, doble grado PBS–ESADE)", modalidad="ejecutivo", sede="Lima + España", duracion_meses=17,
    costo_total_soles=157000, incluye_viaje_internacional=True,
    nota="Tabla oficial 2025: S/ 157,000. 17 meses + módulo internacional (folleto Corporate 12 – 2026). AACSB 2024-25 lo reporta en 42,500 USD. Se marca viaje incluido por ser doble grado con módulo en ESADE; confirmar si pasajes/estadía están incluidos.")
add(up, programa="Executive Master of Business Administration (EMBA)", modalidad="ejecutivo", sede="Lima", duracion_meses=None, costo_total_soles=120000,
    nota="Tabla oficial 2025: S/ 120,000. (Libertify, terceros, cita S/ 98,500 para EMBA 2026 — no coincide con la tabla oficial.)")

# ---------------- PAD – Universidad de Piura -------------------------------------------------
pad = dict(universidad="Universidad de Piura – PAD Escuela de Dirección", siglas="PAD-UDEP", tipo_gestion="privada asociativa",
           acreditaciones=ACC_PAD, ranking=None, confianza="alta", moneda="PEN", costo_inscripcion_usd=100)
add(pad, programa="MBA (Maestría en Dirección de Empresas)", modalidad="part-time", sede="Lima", duracion_meses=24, costo_total_soles=79000, anio_precio="2026",
    incluye_viaje_internacional=False, costo_viaje_adicional_usd=3600, fuente_url="https://pad.edu/maestria/mba",
    nota="Web oficial: inversión total S/ 79,000 sin Semana Internacional (USD 3,600 adicional); examen de admisión USD 100. Lunes noche y sábado mañana. Total con semana internacional ≈ S/ 79,000 + USD 3,600.")
add(pad, programa="MBA Executive MEDEX (Máster en Dirección de Empresas para Ejecutivos)", modalidad="ejecutivo", sede="Lima", duracion_meses=20, costo_total_soles=117000, anio_precio="2026-2027",
    incluye_viaje_internacional=False, costo_viaje_adicional_usd=4200, fuente_url="https://pad.edu/maestria/executive-mba-medex",
    nota="Web oficial: S/ 117,000 sin semana internacional (USD 4,200 adicional); examen USD 100; requiere 8+ años de experiencia (3 directivos).")
add(pad, programa="Senior Executive MBA (SEMBA)", modalidad="ejecutivo", sede="Lima", duracion_meses=20, costo_total_soles=132000, anio_precio="2026-2027",
    incluye_viaje_internacional=False, costo_viaje_adicional_usd=4200, fuente_url="https://pad.edu/maestria/senior-executive-mba-semba",
    nota="Web oficial: S/ 132,000 'incluye todos los gastos, a excepción de la Semana Internacional' (USD 4,200 adicional, sujeto a variación). Clases 3 días consecutivos al mes. Requiere 10+ años en alta dirección.")
add({**pad, "confianza": "baja"}, programa="MBA Piura (Maestría en Dirección de Empresas para Ejecutivos – Piura)", modalidad="ejecutivo", sede="Piura", duracion_meses=24, costo_total_soles=None, anio_precio=None,
    fuente_url="https://pad.edu/maestria/mba-piura", nota="Web oficial dice que la inversión 'debe consultarse directamente con el PAD'. Una búsqueda indexada mostró S/ 65,000 + USD 3,600 de semana internacional, pero la página vigente no lo publica: se deja null.")
add({**pad, "confianza": "baja"}, programa="MBA a Distancia PAD", modalidad="semipresencial", sede="Online + presencial", duracion_meses=24, costo_total_soles=None, anio_precio=None,
    fuente_url="https://pad.edu/maestria/mba-a-distancia", nota="Web oficial: precio 'debe consultarse directamente con la institución'. Martes/jueves noche y sábado mañana; inicio 3 de mayo.")

# ---------------- UTP (tarifario oficial 2026) ------------------------------------------------
utp = dict(universidad="Universidad Tecnológica del Perú – Escuela de Postgrado", siglas="UTP", tipo_gestion="privada societaria",
           acreditaciones="SUNEDU licenciada", ranking=None, anio_precio="2026", confianza="alta", moneda="PEN",
           fuente_url="https://www.utp.edu.pe/web/sites/default/files/2026-08/TARIFARIO-EPG-2026_04.08.2026.pdf", n_cuotas=25)
add(utp, programa="Maestría en Administración de Empresas (MBA) – Presencial Lima", modalidad="part-time", sede="Lima", duracion_meses=None, costo_total_soles=28900, monto_cuota=1156,
    nota="Tarifario EPG 2026 (04-ago-2026): S/ 28,900 total; S/ 1,156 mensuales financiado en 25 cuotas. El tarifario no indica duración.")
add(utp, programa="Maestría en Administración de Empresas (MBA) – Presencial Arequipa", modalidad="part-time", sede="Arequipa", duracion_meses=None, costo_total_soles=19900, monto_cuota=796,
    nota="Tarifario EPG 2026: S/ 19,900; S/ 796 x 25 cuotas.")
add(utp, programa="Maestría en Administración de Empresas (MBA) – A distancia", modalidad="online", sede="Online", duracion_meses=None, costo_total_soles=26900, monto_cuota=1076,
    nota="Tarifario EPG 2026: S/ 26,900; S/ 1,076 x 25 cuotas.")

# ---------------- Universidad Ricardo Palma ---------------------------------------------------
add(universidad="Universidad Ricardo Palma – Escuela de Posgrado", siglas="URP", tipo_gestion="privada asociativa",
    programa="Maestría en Administración de Negocios", modalidad="semipresencial", sede="Lima", duracion_meses=24,
    costo_total_soles=23380, moneda="PEN", costo_inscripcion=150, n_cuotas=20, monto_cuota=1100,
    acreditaciones="SUNEDU licenciada", ranking=None, anio_precio="2026-I", confianza="alta",
    fuente_url="https://file.urp.edu.pe/file-urp-20260316-022257-221-49169b85891165d1.pdf",
    nota="Brochure oficial 2026-I: armada S/ 1,100 (5 por semestre); S/ 5,980 por semestre; 'todo el programa S/ 23,380' (incluye matrículas, cuota de inscripción S/ 150 y constancia de ingreso). 4 semestres.")

# ---------------- Norbert Wiener ----------------------------------------------------------
add(universidad="Universidad Privada Norbert Wiener – Escuela de Posgrado", siglas="UWIENER", tipo_gestion="privada societaria",
    programa="MBA – Maestría en Administración de Negocios (a distancia)", modalidad="online", sede="Online", duracion_meses=16,
    costo_total_soles=20500, moneda="PEN", costo_inscripcion=300, costo_matricula=300, n_cuotas=16, monto_cuota=1206,
    acreditaciones="SUNEDU licenciada", ranking=None, anio_precio="2026", confianza="alta",
    fuente_url="https://posgrado.uwiener.edu.pe/wp-content/uploads/2024/04/Brochure-MBA-5.pdf",
    nota="Brochure oficial (campaña admisión 2026): inversión regular S/ 20,500 = admisión S/ 300 + 3 matrículas S/ 300 + 16 cuotas S/ 1,206 (o 20 cuotas S/ 965). Descuentos: campaña 15% (S/ 17,605), convenio 20% (S/ 16,640), egresado 30% (S/ 14,710). 16 meses, sábados.")

# ---------------- UPCH ------------------------------------------------------------------------
add(universidad="Universidad Peruana Cayetano Heredia – Escuela de Posgrado", siglas="UPCH", tipo_gestion="privada asociativa",
    programa="MBA en Innovación Educativa", modalidad="online", sede="Online", duracion_meses=20,
    costo_total_soles=41000, moneda="PEN", costo_inscripcion=600, costo_matricula=600, n_cuotas=26, monto_cuota=1462,
    acreditaciones="SUNEDU licenciada", ranking=None, anio_precio="2026", confianza="alta",
    fuente_url="https://posgrado.cayetano.edu.pe/wp-content/uploads/sites/13/2026/04/MBA_INNOVACION-EDUCATIVA.pdf",
    nota="Brochure oficial 2026: admisión S/ 600 + 4 matrículas S/ 600 + costo programa S/ 38,000 = valor total S/ 41,000; financiamiento 26 cuotas de S/ 1,462. No incluye grado. MBA de nicho (gestión educativa), no MBA generalista.")

# ---------------- UCV (2022, a distancia) -----------------------------------------------------
add(universidad="Universidad César Vallejo – Escuela de Posgrado", siglas="UCV", tipo_gestion="privada societaria",
    programa="Maestría en Administración de Negocios – MBA (a distancia)", modalidad="online", sede="Online", duracion_meses=None,
    costo_total_soles=7900, moneda="PEN", costo_inscripcion=100, costo_matricula=200, n_cuotas=18, monto_cuota=400,
    acreditaciones="SUNEDU licenciada", ranking=None, anio_precio="2022-II", confianza="media",
    fuente_url="https://webadminportal.ucv.edu.pe/uploads/files/backup/RGG-N--226-2022-PENSIONES-INGRESANTES-POSGRADO-A-DISTANCIA-2022-II.pdf",
    nota="Resolución de Gerencia General N.° 226-2022/UCV (oficial pero de 2022): inscripción S/ 100 + 3 matrículas x S/ 200 + 18 cuotas x S/ 400 = S/ 7,900. Fila leída del bloque de programas al que pertenece el MBA (layout PDF). Precio vigente 2026 no publicado en brochures UCV 2026 (2-3 ciclos, 48 créditos).")
