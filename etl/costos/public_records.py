R = []
def add(**k): R.append(dict(tipo_gestion="publica", moneda="PEN", acreditaciones="SUNEDU licenciada", ranking=None, **k))

add(universidad="Universidad Nacional de Ingeniería – Escuela de Posgrado", siglas="UNI",
    programa="Maestría en Administración de Empresas (MBA) con mención en Gerencia y Tecnología", modalidad="online", sede="Online",
    duracion_meses=20, costo_total_soles=17500, costo_inscripcion=300, costo_matricula=300, n_cuotas=16, monto_cuota=1000,
    anio_precio="2025", confianza="alta",
    fuente_url="https://web.archive.org/web/20251002234254/https://posgrado.uni.edu.pe/media/attachments/2025/01/15/brochure-mba-2025-10_compressed.pdf",
    nota="Brochure oficial UNI 2025 (copia Wayback 2-oct-2025; el original da 404): 'COSTO TOTAL S/ 17,500' = postulación S/ 300 + 4 matrículas x S/ 300 + 16 pensiones x S/ 1,000. Derecho de grado aparte S/ 4,375 (TUPA 2025). Página vigente posgrado.uni.edu.pe/programas/mba/ (Admisión 2027-I) no publica precio.")
add(universidad="Universidad Nacional del Callao – Unidad de Posgrado FCA", siglas="UNAC",
    programa="Maestría en Administración Estratégica de Empresas", modalidad="semipresencial", sede="Callao",
    duracion_meses=18, costo_total_soles=6500, costo_inscripcion=200, costo_matricula=100, n_cuotas=12, monto_cuota=500,
    anio_precio="2025", confianza="media",
    fuente_url="https://posgrado.unac.edu.pe/maestrias/facultades/brochure_fca-1.pdf",
    nota="Brochure oficial 2025: inscripción S/ 200 + 3 semestres x (matrícula S/ 100 + '4 pensiones por ciclo: s/ 500.00'). Total = 200 + 3x(100+4x500) = S/ 6,500 leyendo S/ 500 por pensión; si fueran S/ 500 por ciclo el total sería ~S/ 2,000 (texto ambiguo, por eso confianza media). Grado y tesis aparte.")
add(universidad="Universidad Nacional Agraria La Molina – Escuela de Posgrado", siglas="UNALM",
    programa="Maestría en Administración", modalidad="part-time", sede="Lima",
    duracion_meses=24, costo_total_soles=17391.6, costo_matricula=147.9, n_cuotas=None, monto_cuota=None,
    anio_precio="2026-I", confianza="media",
    fuente_url="https://www.lamolina.edu.pe/Postgrado/cienciambientales/web/I_CICLO/4.%20GUIA_MATRICULA_2026-I.pdf",
    nota="Guía de matrícula oficial 2026-I: S/ 350 por crédito (nacionales) + matrícula S/ 147.90 por semestre. Total calculado = 48 créditos (plan de estudios RC 2020-0270) x 350 + 4 x 147.90 = S/ 17,391.60, sin derecho de admisión, autoseguro (S/ 35/sem) ni grado. Tarifa oficial, total es cálculo propio.")
for menc, url in [("Gerencia Empresarial", "https://posgrado.unsa.edu.pe/escuela/maestria-en-ciencias-administracion-mba-con-mencion-en-gerencia-empresarial/"),
                  ("Dirección y Gestión Empresarial", "https://posgrado.unsa.edu.pe/escuela/direccion-y-gestion-empresarial/")]:
    add(universidad="Universidad Nacional de San Agustín de Arequipa – Escuela de Posgrado", siglas="UNSA",
        programa=f"Maestría en Ciencias: Administración (MBA), con mención en {menc}", modalidad="semipresencial", sede="Arequipa",
        duracion_meses=24, costo_total_soles=8200, costo_inscripcion=300, costo_matricula=350, n_cuotas=None, monto_cuota=None,
        anio_precio="2026", confianza="alta", fuente_url=url,
        nota="Web oficial: costo de enseñanza S/ 7,200 por programa + inscripción S/ 300 + matrícula anual S/ 350 x 2 = S/ 8,200. Presencial/a distancia sáb-dom. Otras menciones MBA de la UNSA tienen igual tarifa de enseñanza (no verificadas una a una).")
add(universidad="Universidad Nacional de San Antonio Abad del Cusco – Escuela de Posgrado", siglas="UNSAAC",
    programa="Maestría en Administración (menciones Desarrollo Empresarial, Gestión Pública, Turismo, Gerencia de la Educación)", modalidad="online", sede="Cusco / virtual",
    duracion_meses=12, costo_total_soles=7400, costo_inscripcion=313, costo_matricula=400, n_cuotas=12, monto_cuota=550,
    anio_precio="2026", confianza="alta", fuente_url="http://postgrado.unsaac.edu.pe/inversion.php",
    nota="Web oficial: inversión total S/ 7,400 = 2 matrículas x S/ 400 + 12 pensiones x S/ 550; inscripción al examen S/ 313 no incluida (S/ 7,713 con ella). Duración 12 meses inferida de 2 semestres.")
add(universidad="Universidad Nacional Tecnológica de Lima Sur – Escuela de Posgrado", siglas="UNTELS",
    programa="Maestría en Administración de Negocios (MBA) con mención en Gestión Estratégica de Empresas", modalidad="semipresencial", sede="Lima (Villa El Salvador)",
    duracion_meses=18, costo_total_soles=10450, costo_inscripcion=700, costo_matricula=650, n_cuotas=12, monto_cuota=650,
    anio_precio="2026-I", confianza="alta",
    fuente_url="https://www.untels.edu.pe/FTP/2026.03.20.0020_CARPETA%20DE%20ADMI%20MBA%20LECTURA.pdf",
    nota="Carpeta de admisión oficial 2026-I: carpeta S/ 100 + inscripción S/ 500 + constancia S/ 100 + 3 semestres x (matrícula S/ 650 + 4 pensiones x S/ 650) = S/ 10,450. Comunidad UNTELS: S/ 8,200. 70% virtual.")
add(universidad="Universidad Nacional Mayor de San Marcos – UPG Fac. Ciencias Administrativas", siglas="UNMSM",
    programa="Maestría en Administración con mención en Gestión Empresarial", modalidad="semipresencial", sede="Lima",
    duracion_meses=24, costo_total_soles=None, costo_inscripcion=450, n_cuotas=None, monto_cuota=None,
    anio_precio="2026", confianza="baja",
    fuente_url="https://www.americatv.com.pe/noticias/util-e-interesante/san-marcos-como-inscribirse-maestria-y-cuanto-cuesta-n514526",
    nota="Sin precio oficial por programa (web posgradoadministracion.unmsm.edu.pe carga datos por JavaScript). Prensa (América TV) estima S/ 15,000–20,000 total para maestrías UNMSM y admisión S/ 450 (S/ 350 egresados). No se registra total por ser estimación genérica.")
add(universidad="Universidad Nacional Federico Villarreal – EUPG", siglas="UNFV",
    programa="Maestría en Administración", modalidad="semipresencial", sede="Lima",
    duracion_meses=None, costo_total_soles=None, costo_inscripcion=500, costo_matricula=557.7, n_cuotas=None, monto_cuota=500,
    anio_precio="tarifa R.R. 2167-2018-CU-UNFV (citada por terceros)", confianza="baja",
    fuente_url="https://tramitesperu.com/universidades/unfv/posgrado/",
    nota="Fuente de terceros: inscripción S/ 500, matrícula S/ 557.70 por ciclo, pensión S/ 500 (semipresencial) / S/ 600 (presencial). No indica nº de pensiones ni duración: total no calculado.")
