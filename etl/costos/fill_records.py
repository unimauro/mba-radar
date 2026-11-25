# Segunda pasada (25-nov-2026): completa precios/duraciones faltantes y aplica
# correcciones de auditoría (AMBA por programa, modalidades, duraciones ESAN,
# es_mba_generalista, incluye_derecho_grado, grupo_precio).
# PATCH: (siglas, prefijo de 'programa') -> campos a sobrescribir. 'nota+' se añade a la nota existente.

ESAN_IDX = "https://www.esan.edu.pe/mba"
ESAN_TPL = ("Duración según el índice oficial esan.edu.pe/mba (convocatorias 2027, 'duración aproximada en meses lectivos'). "
            "El bloque 'Detalles generales' de cada página de programa muestra '17 meses / Mar.-Sáb. / 15-abr-2026' idéntico en todas "
            "las sedes (plantilla), por lo que no se usa para la duración.")

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

# Registros nuevos (universidades sin fila previa)
NEW = []

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
