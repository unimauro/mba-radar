# Segunda pasada (25-nov-2026): completa precios/duraciones faltantes y aplica
# correcciones de auditoría (AMBA por programa, modalidades, duraciones ESAN,
# es_mba_generalista, incluye_derecho_grado, grupo_precio).
# PATCH: (siglas, prefijo de 'programa') -> campos a sobrescribir. 'nota+' se añade a la nota existente.

ESAN_IDX = "https://www.esan.edu.pe/mba"
ESAN_TPL = ("Duración según el índice oficial esan.edu.pe/mba (convocatorias 2027, 'duración aproximada en meses lectivos'). "
            "El bloque 'Detalles generales' de cada página de programa muestra '17 meses / Mar.-Sáb. / 15-abr-2026' idéntico en todas "
            "las sedes (plantilla), por lo que no se usa para la duración.")

NEW = []  # registros nuevos (sin fila previa)
PATCH = {
 # ---------------- precios nuevos ----------------
 ("ULIMA", "MBA (Maestría en Administración)"): dict(
    costo_total_soles=58900, anio_precio="2022-1", confianza="media",
    fuente_url="https://web.archive.org/web/20220211190939id_/https://www.ulima.edu.pe/sites/default/files/brochure_mba_ulima_v.2021.12.20.pdf",
    nota="Último precio oficial publicado: brochure MBA Ulima v.2021-12-20 (copia Wayback), 'Inversión: S/ 58.900', inicio 17-may-2022, 20 meses "
         "(descuentos: 30% egresados Ulima; 20%/15% matrícula anticipada). Precio de 2022 → confianza media; el vigente probablemente es mayor. "
         "Los brochures 2023-2026 (texto e imágenes revisados) ya no publican el monto, solo inscripción S/ 350. Educaedu (ficha sin fecha) lista S/ 50,900 "
         "(educaedu.com.pe/maestria-en-administracion-de-negocios-maestria-27370.html), no usado por ser de terceros y sin fecha. "
         "Semana internacional en IQS–Ramon Llull: el costo cubre solo derechos académicos del viaje."),
 ("PAD-UDEP", "MBA Piura"): dict(
    costo_total_soles=65000, anio_precio="2025-2026", confianza="alta", incluye_viaje_internacional=False, costo_viaje_adicional_usd=3600,
    fuente_url="https://web.archive.org/web/20260809100211id_/https://pad.edu/maestria/mba-piura",
    nota="Web oficial PAD (FAQ, copias Wayback 10-oct-2025, 22-ene-2026 y 09-ago-2026): 'La inversión total es de S/ 65,000 que no incluye los gastos "
         "asociados a la semana internacional' (USD 3,600 adicionales); examen de admisión USD 100. Presencial, viernes noche y sábado mañana, "
         "24 meses, inicio 9-oct. La versión vigente de la página (nov-2026) ya no muestra el monto ('debe consultarse con el PAD')."),
 ("PAD-UDEP", "MBA a Distancia"): dict(
    nota="Web oficial (nov-2026): precio 'debe consultarse directamente con la institución'. No hay copias Wayback de esta página ni brochure con precio. "
         "Martes/jueves noche y sábado mañana; 24 meses; inicio 3 de mayo. Incluye opción de viaje a Lisboa ('solo gastos académicos')."),
 ("CENTRUM PUCP", "Global MBA CENTRUM PUCP"): dict(
    nota="Sin precio oficial publicado (web oficial, AACSB —que no lista este programa— ni Wayback). Web oficial: 20 meses lectivos, clases en Lima una vez al mes "
         "durante 4 días + módulos en Tulane. Terceros sin fecha: TopUniversities '65,300 SOL por año'; Unimy EUR 31,625 (19 meses). No usados por ambiguos."),

 # ---------------- auditoría CENTRUM ----------------
 ("CENTRUM PUCP", "MBA Centrum (Master"): dict(acreditaciones="AACSB, AMBA, EQUIS, BGA; SUNEDU licenciada (PUCP)"),
 ("CENTRUM PUCP", "MBA Centrum Blended"): dict(acreditaciones="AACSB, AMBA, EQUIS, BGA; SUNEDU licenciada (PUCP)",
    **{"nota+": "Duración no publicada (página oficial carga datos por JS; AMBA tampoco la indica)."}),
 ("CENTRUM PUCP", "MBA Centrum Online"): dict(acreditaciones="AACSB, AMBA, EQUIS, BGA; SUNEDU licenciada (PUCP)"),
 ("CENTRUM PUCP", "International MBA"): dict(modalidad="full-time / part-time", acreditaciones="AACSB, EQUIS, BGA (escuela); SUNEDU licenciada (PUCP)",
    **{"nota+": "Modalidad: AACSB lo lista como 'Full-Time, Part-Time' (presencial); la web de CENTRUM no permite confirmar cuál domina. "
                "Duración: terceros discrepan (TopMBA 24 meses; TopUniversities 15 meses), no se registra. No figura en la lista de programas acreditados por AMBA."}),
 ("CENTRUM PUCP", "Executive MBA"): dict(acreditaciones="AACSB, EQUIS, BGA (escuela); SUNEDU licenciada (PUCP)",
    **{"nota+": "No figura en la lista de programas acreditados por AMBA de CENTRUM."}),
 ("CENTRUM PUCP", "Global MBA"): dict(acreditaciones="AACSB, EQUIS, BGA (escuela); SUNEDU licenciada (PUCP)"),

 # ---------------- auditoría ESAN ----------------
 ("ESAN", "MBA Weekends"): dict(**{"nota+": "Duración verificada (25-nov-2026): el índice oficial esan.edu.pe/mba dice 'Weekends – 23 meses + Tesis' (inauguración 21-ago-2027). "
                                  "La página del programa muestra '17 meses' en un bloque de plantilla (mismo texto, fecha 15-abr-2026 y horario Mar./Sáb. en todas las sedes), "
                                  "incompatible con un formato de fin de semana; se mantiene 23."}),
 ("ESAN", "MBA Semipresencial (Lima)"): dict(duracion_meses=18, fuente_url="https://www.esan.edu.pe/mba/semipresencial",
    nota="Web oficial (página 'Flex MBA'): 'Inversión S/ 81,500'. Duración 18 meses aprox. según índice oficial esan.edu.pe/mba ('Flex – Semipresencial – 18 meses aprox.', inauguración 21-abr-2027)."),
 ("ESAN", "MBA Accelerated"): dict(duracion_meses=14, acreditaciones="AACSB, BGA (escuela); SUNEDU licenciada",
    nota="Web oficial: 'Inversión S/ 76,500'; mínimo 20 participantes. Duración: el índice oficial esan.edu.pe/mba indica 'Accelerated – Online – 14 meses aprox.' "
         "(convocatoria 21-abr-2027); la página del programa decía 17 meses lectivos + tesis (inauguración 15-abr-2026). No figura en la lista de programas acreditados por AMBA."),
 ("ESAN", "MBA Arequipa Semipresencial"): dict(acreditaciones="AACSB, BGA (escuela); SUNEDU licenciada",
    **{"nota+": "AMBA lista 'Blended Learning MBA' y 'MBA Regions' de ESAN sin precisar si incluye el semipresencial de Arequipa; no se marca AMBA."}),
 ("ESAN", "MBA Ica"): dict(duracion_meses=None, acreditaciones="AACSB, BGA (escuela); SUNEDU licenciada",
    **{"nota+": "Duración: la página solo muestra el bloque de plantilla (17 meses) e Ica no figura en el índice; no se registra. Sin AMBA verificable (programa no listado)."}),
}
for ciudad in ["Arequipa Presencial", "Cusco", "Huancayo", "Piura", "Trujillo"]:
    PATCH[("ESAN", f"MBA {ciudad}")] = dict(duracion_meses=23, **{"nota+": ESAN_TPL + " AMBA: cubierto como 'MBA Regions'."})

# ---------------- UP / PBS ----------------
PATCH[("UP / PBS", "Maestría en Administración (MBA)")] = dict(duracion_meses=24, **{"nota+":
    "Duración: 24 meses lectivos + fase de asesorías y sustentación según folleto oficial MBA 2025-II (https://sisisemail.up.edu.pe/sisisemail/docs/2025/1328/MBA_2025-II.pdf)."})
PATCH[("UP / PBS", "Maestría en Administración con especialización")] = dict(acreditaciones="AACSB (escuela); SUNEDU licenciada",
    **{"nota+": "No figura en la lista de programas acreditados por AMBA de Pacífico Business School."})
PATCH[("UP / PBS", "Executive Master")] = dict(**{"nota+": "Duración no publicada en un folleto específico del EMBA (los folletos MBA de PBS indican ~24 meses lectivos)."})

# ---------------- PAD ----------------
PATCH[("PAD-UDEP", "MBA a Distancia")]["acreditaciones"] = "SUNEDU licenciada (UDEP); PAD acreditada AMBA pero este programa no figura en su lista AMBA"

# ---------------- UTP ----------------
for sede in ["Presencial Lima", "Presencial Arequipa", "A distancia"]:
    PATCH[("UTP", f"Maestría en Administración de Empresas (MBA) – {sede}")] = dict(**{"nota+":
        "Duración en meses no publicada; malla curricular oficial 2026 (portal de transparencia UTP): 4 ciclos, 29 cursos, 48 créditos "
        "(https://www.utp.edu.pe/sites/default/files/Transparencia/Curriculas-posgrado-2026/P43%20-%20Maestri%CC%81a%20en%20Administracio%CC%81n%20de%20Empresas%20-%20Presencial.pdf)."})


# ---------------- públicas (UNMSM, UNFV, UNAC) ----------------
UNMSM_API = "https://posgradoadministracion.unmsm.edu.pe/strapi-api/maestrias?filters[slug][$eq]=magister-en-administracion-con-mencion-en-gestion-empresarial-semipresencial&populate[inversion_economica]=*"
PATCH[("UNMSM", "Maestría en Administración con mención en Gestión Empresarial")] = dict(
    costo_total_soles=13480, costo_inscripcion=450, costo_matricula=400, n_cuotas=16, monto_cuota=720, anio_precio="2026", confianza="alta",
    duracion_meses=24, incluye_derecho_grado=False,
    fuente_url="https://posgradoadministracion.unmsm.edu.pe/programas/maestrias/magister-en-administracion-con-mencion-en-gestion-empresarial-semipresencial",
    nota="Web oficial UPG Fac. Ciencias Administrativas (datos servidos por su API pública, registro actualizado 10-jun-2026: " + UNMSM_API + "). "
         "Admisión S/ 450 (S/ 350 bachilleres UNMSM y docentes de universidades nacionales) + matrícula ingresante S/ 310 (UPG 258 + EPG 52) + "
         "3 matrículas regulares x S/ 400 (UPG 348 + EPG 52) + 4 semestres x 4 cuotas de S/ 720 = S/ 13,480 (S/ 12,040 pagando cada ciclo por adelantado: S/ 2,520). "
         "Duración '2 años (4 semestres)'. No incluye trámite de grado. Las demás menciones (RR.HH., Finanzas, Marketing, Gestión Pública, Turismo) tienen la misma tarifa.")
PATCH[("UNFV", "Maestría en Administración")] = dict(
    costo_total_soles=10706, costo_inscripcion=500, costo_matricula=551.5, n_cuotas=16, monto_cuota=500, duracion_meses=24,
    anio_precio="2024-I (tarifa R.R. 2167-2018-CU-UNFV)", confianza="media",
    fuente_url="https://web.unfv.edu.pe/facultades/fh/images/slider/principal/2024/2024_ADMISIN_EUPG.pdf",
    nota="Prospecto oficial Admisión 2024 EUPG-UNFV ('Inversión 2024-I'): inscripción S/ 500 + 4 semestres x (matrícula S/ 551.50 [500 + carné 11.50 + biblioteca 40] "
         "+ 4 pensiones de S/ 500 semipresencial) = S/ 10,706; presencial (pensión S/ 600) = S/ 12,306. Certificado de ingreso S/ 60.40 aparte. "
         "Duración 4 semestres de 16 semanas (prospecto; consistente con calendario 2026, R.R. 6279-2026-CU-UNFV). Tarifa oficial pero de 2024 → confianza media; "
         "no se halló tarifario 2025-2026 publicado.")
PATCH[("UNAC", "Maestría en Administración Estratégica de Empresas")] = dict(confianza="alta", incluye_derecho_grado=False,
    nota="Brochure oficial FCA 2025: inscripción S/ 200 + 3 semestres x (matrícula S/ 100 + 4 pensiones de S/ 500) = S/ 6,500. Ambigüedad resuelta: "
         "el mismo brochure indica que tras la matrícula y primera pensión 'las pensiones restantes se harán después de 20 días cada una', y la Directiva de pagos FCA "
         "(R.R. 712-2017-R, https://unac.edu.pe/wp-content/uploads/documentos/transparencia/resoluciones-rectorales/2017/712-17-R%20DIRECTIVA%20DE%20PAGOS%20FCA%202017.pdf) "
         "fija para esta maestría 'pensión de enseñanza (4 meses): cant. 4, S/ 500.00' → S/ 500 por pensión, no por ciclo. Supone matrícula cada ciclo (S/ 6,300 si fuera única). "
         "Grado y tesis aparte. Duración 1.5 años (3 semestres).")


# ---------------- privadas (USMP, UIGV, UPN, UC, UCSUR) ----------------
USMP_RES = "https://web.archive.org/web/20260519032649id_/https://usmp.edu.pe/wp-content/uploads/2026/02/RESOLUCION-No-045-2026-CD-P-USMP-CUADRO-DE-PENSIONES-DE-MAESTRIA-DOCTORADO-Y-ESPECIALIDADADES-SEMESTRE-ACADEMICO-2026-I-y-II.pdf"
USMP_NOTA = ("Res. N.° 045-2026-CD-P-USMP 'Pensiones de maestrías, doctorados y especialidades 2026 I-II' (ingresantes; enlazada desde "
             "usmp.edu.pe/transparencia/relacion-de-pagos-exigidos-a-los-alumnos/; copia Wayback porque usmp.edu.pe responde 403 a scripts). ")
PATCH[("USMP", "Maestría en Administración de Negocios (MBA)")] = dict(
    programa="Maestría en Administración de Negocios – MBA (semipresencial, 2 años)", modalidad="semipresencial", duracion_meses=24,
    costo_total_soles=27030, costo_inscripcion=350, costo_matricula=585, n_cuotas=20, monto_cuota=1217, anio_precio="2026", confianza="alta", fuente_url=USMP_RES,
    nota=USMP_NOTA + "Fila 'Semipresencial 02 años': inscripción S/ 350 + matrícula S/ 585 + 5 cuotas de S/ 1,217 por semestre. Total = 350 + 4 x 585 + 4 x 5 x 1,217 = S/ 27,030 "
         "(supone matrícula cada semestre). Igual tarifa en 'A distancia 02 años'.")
NEW.append(dict(universidad="Universidad de San Martín de Porres – Fac. Ciencias Administrativas y RRHH", siglas="USMP", tipo_gestion="privada asociativa",
    acreditaciones="SUNEDU licenciada", ranking=None, moneda="PEN", programa="Maestría en Administración de Negocios – MBA (a distancia, 2 años)",
    modalidad="online", sede="Online", duracion_meses=24, costo_total_soles=27030, costo_inscripcion=350, costo_matricula=585, n_cuotas=20, monto_cuota=1217,
    anio_precio="2026", confianza="alta", fuente_url=USMP_RES,
    nota=USMP_NOTA + "Fila 'A distancia 02 años': mismos montos que la semipresencial de 2 años: 350 + 4 x 585 + 20 x 1,217 = S/ 27,030 (supone matrícula cada semestre)."))
for mod, sede, cuota, total in [("semipresencial", "Lima", 1685, 22910), ("online", "Online", 1447, 20054)]:
    NEW.append(dict(universidad="Universidad de San Martín de Porres – Fac. Ciencias Administrativas y RRHH", siglas="USMP", tipo_gestion="privada asociativa",
        acreditaciones="SUNEDU licenciada", ranking=None, moneda="PEN",
        programa=f"Maestría en Administración de Negocios – MBA ({'semipresencial' if mod == 'semipresencial' else 'a distancia'}, 1 año)",
        modalidad=mod, sede=sede, duracion_meses=12, costo_total_soles=total, costo_inscripcion=350, costo_matricula=1170, n_cuotas=12, monto_cuota=cuota,
        anio_precio="2026", confianza="media", fuente_url=USMP_RES,
        nota=USMP_NOTA + f"Fila '{'Semipresencial' if mod == 'semipresencial' else 'A distancia'} 01 año': inscripción S/ 350 + matrícula S/ 1,170 + 6 cuotas de S/ {cuota:,} por semestre. "
             f"Total = 350 + 2 x 1,170 + 12 x {cuota:,} = S/ {total:,} suponiendo 2 semestres con matrícula cada uno (la resolución no indica el nº de semestres del formato de 1 año → confianza media)."))
PATCH[("UIGV", "Maestría (escala general")] = dict(
    programa="Maestría Ejecutiva en Administración de Negocios (nivel de pensión no publicado)", duracion_meses=None, n_cuotas=16,
    nota="Tarifa oficial 2026 (Tarifas-pensiones-2026.pdf), tabla 'Sistema presencial – Posgrado Maestría': matrícula S/ 200 por ciclo + 4 pensiones por ciclo de "
         "S/ 950 / 825 / 700 según nivel (nivel 1/2/3; doctorado tiene tabla aparte). Plan curricular oficial (https://uigv.edu.pe/wp-content/uploads/2023/09/ejecutiva.pdf): "
         "4 ciclos, 64 créditos. Total = 4 x (200 + 4 x pensión) = S/ 16,000 (nivel 1), S/ 14,000 (nivel 2) o S/ 12,000 (nivel 3), sin carné ni admisión. "
         "Ningún documento asigna el nivel a este programa (el Reglamento de Gestión de Cobranzas 2026, art. 15, solo dice que varía por programa): total no registrado. "
         "Escala 2025 idéntica. Duración en meses no publicada (4 ciclos).")
PATCH[("UPN", "MBA Executive Leaders")] = dict(
    programa="Maestría Ejecutiva en Administración de Empresas (MBA Executive Leaders / MBA virtual)",
    fuente_url="https://www.upn.edu.pe/posgrado/mbas/maestria-ejecutiva-en-administracion-de-empresas", anio_precio="2025",
    nota="Sin precio por programa. Portal de transparencia (https://www.upn.edu.pe/transparencia/pensiones-tarifas), admisión posgrado 2025: '18 cuotas: desde S/ 861 "
         "hasta S/ 1,362; 24 cuotas: desde S/ 646 hasta S/ 1,021, de acuerdo con cada maestría y sede' → cualquier maestría UPN costaría ~S/ 15,500–24,500; "
         "no se publica dónde cae el MBA, así que no se registra total. Web oficial: virtual en vivo ~18 meses (quincenal); virtual autónomo ~12 meses (48 créditos). "
         "Brochures sin precio.")
PATCH[("UC", "MBA – Maestría en Administración de Negocios")] = dict(duracion_meses=18,
    nota="PRECIO NO PUBLICADO: web oficial, brochure y portal de transparencia (solo escalas de pregrado; la página de tasas de posgrado da 404 y sus copias Wayback "
         "2019-2021 solo tienen trámites). 768 horas, 100% virtual (75% asincrónica). Duración 18 meses según copia Wayback de la página oficial "
         "(https://web.archive.org/web/20240920213758/https://posgrado.ucontinental.edu.pe/programas/mba-maestria-en-administracion-de-negocios/). "
         "Agregador quecursar.com lista 'PEN 35,000' con datos genéricos (60 créditos para todos los programas): no usado.")
PATCH[("UCSUR", "Maestría en Administración de Negocios – MBA")] = dict(modalidad="online", sede="A distancia (clases mar/jue/sáb)",
    nota="PRECIO NO PUBLICADO: landing madne.cientifica.edu.pe (16 meses, a distancia, 4 ciclos), brochure 2024 (solo imágenes, sin precio), portal de transparencia "
         "(pensiones solo de pregrado; tarifario de posgrado solo trámites) y copias Wayback 2021-2024. Agregador quecursar.com lista 'PEN 40,000 / 18 meses' "
         "(contradice la duración oficial): no usado. Pasantía con Universitat Carlemany (Andorra), sin indicar si está incluida.")

# ---------------- regiones (agregadas 25-nov-2026) ----------------
def pub(**k):
    d = dict(tipo_gestion="publica", moneda="PEN", acreditaciones="SUNEDU licenciada", ranking=None, costo_total_usd=None); d.update(k); NEW.append(d)
pub(universidad="Universidad Nacional Pedro Ruiz Gallo – Escuela de Posgrado", siglas="UNPRG",
    programa="Maestría en Administración con mención en Gerencia Empresarial", modalidad="part-time", sede="Lambayeque", duracion_meses=24,
    costo_total_soles=13250, costo_inscripcion=250, costo_matricula=250, n_cuotas=24, monto_cuota=500, anio_precio="2025-I", confianza="alta",
    fuente_url="https://drive.google.com/file/d/1VsdmSBx0_1FSKfS0GaL-zY5ky9322iPA/view",
    nota="Prospecto oficial de Admisión 2025-I de la EPG-UNPRG (PDF en Drive enlazado desde https://epgunprg.edu.pe/admision/prospecto/), tabla 'Para maestrías de cuatro "
         "semestres': matrícula 4 x S/ 250 + enseñanza 24 x S/ 500 = S/ 13,000 ('Total'), + inscripción S/ 250 = S/ 13,250. Presencial, 40 vacantes, 4 semestres.")
pub(universidad="Universidad Nacional de Piura – Escuela de Posgrado", siglas="UNP",
    programa="Maestría en Administración con mención en Gerencia Empresarial", modalidad="online", sede="Piura / a distancia (sáb-dom)", duracion_meses=24,
    costo_total_soles=10234.6, costo_inscripcion=510.6, costo_matricula=662, n_cuotas=24, monto_cuota=350, anio_precio="2026-2027", confianza="alta",
    fuente_url="https://epg.unp.edu.pe/maestria-en-administracion-con-mencion-en-gerencia-empresarial/",
    nota="Web oficial EPG-UNP (tabla 'Inversión'): admisión S/ 510.60 (única) + 2 matrículas anuales x S/ 662 + 24 pensiones mensuales x S/ 350 = S/ 10,234.60. "
         "Modalidad 'a distancia', sábados y domingos, 60 créditos en 4 ciclos; duración 24 meses deducida de las 24 pensiones mensuales. Admisión 2027-I (epg.unp.edu.pe/admision/).")
pub(universidad="Universidad Nacional de Trujillo – Escuela de Posgrado", siglas="UNT",
    programa="Maestría en Ciencias Económicas con mención en Dirección y Gestión de Negocios (equivalente; también mención Gestión Estratégica Empresarial)",
    modalidad="part-time / online", sede="Trujillo", duracion_meses=24, costo_total_soles=7000, costo_inscripcion=280, costo_matricula=105, n_cuotas=None, monto_cuota=None,
    anio_precio="2019", confianza="media",
    fuente_url="https://transparencia.unitru.edu.pe/doc/TUSNE/Anexo%20Oficio%20015-2019%20Tasas%20UNT%202019.pdf",
    nota="UNT no tiene 'Maestría en Administración'; se registra la mención de negocios de la Maestría en Ciencias Económicas (4 ciclos, 60 créditos según "
         "epgunitru.edu.pe). Tasas oficiales UNT 2019 (TUSNE, % de UIT S/ 4,200): matrícula semestral S/ 105 + derecho de estudios S/ 105 por crédito + inscripción S/ 280 "
         "→ 280 + 4 x 105 + 60 x 105 = S/ 7,000. Tarifa de 2019 (no se halló TUSNE 2023-2026) → confianza media; si se indexa a la UIT vigente sería mayor (no calculado).")
pub(universidad="Universidad Nacional del Centro del Perú – UPG Fac. Ciencias de la Administración", siglas="UNCP",
    programa="Maestría en Administración (menciones Administración Estratégica de Empresas, Finanzas, Gestión de Proyectos Públicos y Privados)",
    modalidad=None, sede="Huancayo", duracion_meses=None, costo_total_soles=None, costo_inscripcion=211, anio_precio="2026-II", confianza="baja",
    fuente_url="https://uncpadmision.edu.pe/posgrado.html",
    nota="SIN PRECIO: solo se publica la inscripción a maestría 2026-II (S/ 211). El catálogo de maestrías 2026-II publica pensiones de otras maestrías (matrícula S/ 100-150, "
         "pensión S/ 390-450) pero no de Administración; el sitio de la UPG no responde y no hay copias Wayback. Plan de estudios de 2 semestres.")
NEW.append(dict(universidad="Universidad Católica Santo Toribio de Mogrovejo – Escuela de Posgrado", siglas="USAT", tipo_gestion="privada asociativa",
    acreditaciones="SUNEDU licenciada", ranking=None, moneda=None, programa="Maestría en Administración y Dirección de Empresas", modalidad="part-time",
    sede="Chiclayo", duracion_meses=18, costo_total_soles=None, anio_precio=None, confianza="baja",
    fuente_url="https://www.usat.edu.pe/maestria-en-administracion-y-direccion-de-empresas/",
    nota="SIN PRECIO: web oficial, brochures 2026 y 2027 y documentos de transparencia (tarifas.pdf, cartilla_pensiones.pdf 2026-II, que solo listan trámites: "
         "p.ej. grado de maestro S/ 2,210) no publican la pensión. Presencial con 20% virtual, 48 créditos, 1.5 años según brochure 2026."))
NEW.append(dict(universidad="Universidad Peruana Los Andes – Escuela de Posgrado", siglas="UPLA", tipo_gestion="privada asociativa",
    acreditaciones="SUNEDU licenciada", ranking=None, moneda=None, programa="Maestría en Administración de Empresas (MBA)", modalidad="part-time / semipresencial / online",
    sede="Huancayo / Chanchamayo", duracion_meses=12, costo_total_soles=None, anio_precio=None, confianza="baja",
    fuente_url="https://upla.edu.pe/maestria-en-administracion-de-empresas-dba/",
    nota="SIN PRECIO: programa nuevo (2026), 2 semestres; ni la web ni el brochure 2026 indican costo. Referencia NO aplicable al MBA: costos oficiales posgrado 2025-II "
         "(Maestría en Gestión Pública) presencial matrícula S/ 400 + 5 cuotas de S/ 500 por semestre; semipresencial/a distancia S/ 550 + 5 x S/ 620 "
         "(https://upla.edu.pe/web/wp-content/uploads/2025/09/COSTO-DE-MATRICULA-Y-CUOTAS-DE-ENSENANZA-POSGRADO.pdf)."))

# ---------------- clasificación ----------------
NO_GENERALISTA = [  # (siglas, prefijo programa)
 ("UPC", "MBA para Egresados"), ("UPCH", ""), ("UWIENER", "Maestría en Gestión Administrativa de la Salud"),
 ("UNI", "Maestría en Administración de Empresas (MBA) con mención en Gerencia y Tecnología"),
 ("UP / PBS", "Maestría en Administración con especialización"), ("UPAO", ""), ("USS", ""),
]
GENERALISTA_NULL = [("UIGV", "")]
DERECHO_GRADO = {  # False = no incluye (consta en la fuente)
 ("UCV", ""): False, ("UNI", ""): False, ("UNAC", ""): False, ("UPAO", ""): False, ("UPCH", "MBA en Innovación Educativa"): False,
 ("UNALM", ""): False,
}
GRUPOS = {
 "ESAN-regiones-presencial-78950": [("ESAN", f"MBA {c}") for c in ["Arequipa Presencial", "Cusco", "Huancayo", "Piura", "Trujillo"]],
 "UP-MBA-part-time-98500": [("UP / PBS", "Maestría en Administración (MBA)"), ("UP / PBS", "MBA Weekend")],
 "CENTRUM-MBA-presencial-blended-19739usd": [("CENTRUM PUCP", "MBA Centrum (Master"), ("CENTRUM PUCP", "MBA Centrum Blended")],
 "UPAO-maestria-administracion-10850": [("UPAO", "")],
 "UNSA-maestria-administracion-8200": [("UNSA", "")],
}
GRUPOS["USMP-MBA-2anios-27030"] = [("USMP", "Maestría en Administración de Negocios – MBA (semipresencial, 2 años)"), ("USMP", "Maestría en Administración de Negocios – MBA (a distancia, 2 años)")]


def _match(r, key):
    s, pre = key
    return r["siglas"] == s and r["programa"].startswith(pre)


def apply(recs):
    recs = recs + NEW
    used = set()
    for r in recs:
        for key, upd in PATCH.items():
            if _match(r, key):
                used.add(key)
                for k, v in upd.items():
                    if k == "nota+":
                        r["nota"] = (r.get("nota") or "") + " " + v
                    else:
                        r[k] = v
        r["es_mba_generalista"] = not any(_match(r, k) for k in NO_GENERALISTA)
        if any(_match(r, k) for k in GENERALISTA_NULL): r["es_mba_generalista"] = None
        r.setdefault("incluye_derecho_grado", None)
        for k, v in DERECHO_GRADO.items():
            if _match(r, k): r["incluye_derecho_grado"] = v
        r["grupo_precio"] = None
        for g, keys in GRUPOS.items():
            if any(_match(r, k) for k in keys): r["grupo_precio"] = g
    missing = set(PATCH) - used
    assert not missing, missing
    return recs
