R = []
def add(**k):
    d = dict(moneda="PEN", ranking=None); d.update(k); R.append(d)

USIL25 = "https://web.archive.org/web/20250815092903id_/https://usil.edu.pe/sites/default/files/2025-04/tarifario-posgrado-2025.pdf"
usil = dict(universidad="Universidad San Ignacio de Loyola – Escuela de Posgrado", siglas="USIL", tipo_gestion="privada societaria",
            acreditaciones="SUNEDU licenciada", anio_precio="2025-1", fuente_url=USIL25, confianza="alta", sede="Lima",
            modalidad="semipresencial", duracion_meses=20, costo_inscripcion=250, costo_matricula=350, n_cuotas=20)
add(**usil, programa="Maestría en Administración de Negocios – Executive MBA (semipresencial, doble grado)", costo_total_soles=45900, monto_cuota=2195,
    nota="Tarifario oficial 'Tarifas de Posgrado 2025-1' (copia Wayback; usil.edu.pe bloquea con Cloudflare y el PDF original da 404). Pensiones 20 x S/ 2,195 = S/ 43,900 + postulación S/ 250 + 5 matrículas x S/ 350 = S/ 45,900. En 2024 las pensiones sumaban S/ 39,900 (+10%). Socio del doble grado no verificado. No hay tarifario 2026 accesible.")
add(**usil, programa="Maestría en Administración de Negocios – Executive MBA (semipresencial)", costo_total_soles=36700, monto_cuota=1735,
    nota="Tarifario oficial 2025-1 (Wayback): pensiones 20 x S/ 1,735 = S/ 34,700 + postulación S/ 250 + 5 matrículas x S/ 350 = S/ 36,700. En 2024: S/ 31,500 en pensiones.")

upc = dict(universidad="Universidad Peruana de Ciencias Aplicadas – Escuela de Postgrado (EPG UPC)", siglas="UPC", tipo_gestion="privada societaria",
           acreditaciones="WSCUC (institucional); SUNEDU licenciada", anio_precio="2026-2027", confianza="alta", n_cuotas=None, monto_cuota=None)
add(**upc, programa="Maestría MBA Ejecutivo", modalidad="ejecutivo", sede="Lima (San Isidro) / virtual en vivo", duracion_meses=21, costo_total_soles=68500,
    incluye_viaje_internacional=True, fuente_url="https://postgrado.upc.edu.pe/landings/maestrias/mba/mba-ejecutivo/",
    nota="Web oficial: inversión S/ 68,500, inicio 15-mar-2027. Misión académica obligatoria a Barcelona incluida (sesiones, hospedaje, desayunos, almuerzos, visitas); NO incluye pasajes, cenas, traslados, seguros ni viáticos. Opción de Máster en MBA Internacional (Univ. Politécnica de Cataluña).")
add(**upc, programa="E-MBA (MBA a distancia)", modalidad="online", sede="Online + 2 semanas presenciales en San Isidro", duracion_meses=24, costo_total_soles=45900,
    incluye_viaje_internacional=False, fuente_url="https://postgrado.upc.edu.pe/landings/maestrias/mba/e-mba-a-distancia/",
    nota="Web oficial: inversión S/ 45,900, inicio 18-mar-2027; clases síncronas quincenales.")
add(**upc, programa="MBA Online – Exclusivo para Regiones", modalidad="online", sede="Regiones (online)", duracion_meses=24, costo_total_soles=39375,
    incluye_viaje_internacional=False, fuente_url="https://postgrado.upc.edu.pe/landings/maestrias/mba/e-mba-regiones/",
    nota="Web oficial: inversión S/ 39,375, inicio 20-mar-2027, clases síncronas sábados.")
add(**upc, programa="MBA para Egresados EPG (complemento a maestría especializada)", modalidad="semipresencial", sede="Lima / virtual", duracion_meses=12, costo_total_soles=41895,
    incluye_viaje_internacional=None, fuente_url="https://postgrado.upc.edu.pe/landings/mba-para-master/",
    nota="Web oficial: S/ 41,895 lista (S/ 33,516 con 20% para egresados UPC). Programa de nicho: requiere maestría previa.")

upch = dict(universidad="Universidad Peruana Cayetano Heredia – Escuela de Posgrado", siglas="UPCH", tipo_gestion="privada asociativa",
            acreditaciones="SUNEDU licenciada", anio_precio="2026", confianza="alta", modalidad="online", sede="Online", duracion_meses=20,
            costo_inscripcion=600, costo_matricula=600, n_cuotas=26)
add(**upch, programa="MBA en Salud (grado: Maestro en Dirección de Empresas de Salud)", costo_total_soles=63000, monto_cuota=2308, incluye_viaje_internacional=True,
    fuente_url="https://posgrado.cayetano.edu.pe/wp-content/uploads/sites/13/2026/04/MBA_EN-SALUD.pdf",
    nota="Brochure oficial 2026: admisión S/ 600 + 4 matrículas x S/ 600 + programa S/ 60,000 = S/ 63,000 (26 cuotas de S/ 2,308). Pasantía en París incluye parte académica; no pasajes, alojamiento ni viáticos. MBA sectorial.")
add(**upch, programa="MBA en Innovación Ambiental y Recursos Naturales", costo_total_soles=48500, monto_cuota=1750, incluye_viaje_internacional=False,
    fuente_url="https://posgrado.cayetano.edu.pe/wp-content/uploads/sites/13/2026/04/BR_MBA-INNOVACION-AMBIENTAL.pdf",
    nota="Brochure oficial 2026: 600 + 4 x 600 + 45,500 = S/ 48,500 (26 x S/ 1,750). MBA sectorial.")

add(universidad="Universidad de Lima – Escuela de Posgrado", siglas="ULIMA", tipo_gestion="privada asociativa", acreditaciones="SUNEDU licenciada",
    programa="MBA (Maestría en Administración)", modalidad="part-time", sede="Lima", duracion_meses=20, costo_total_soles=None, costo_inscripcion=350,
    incluye_viaje_internacional=True, anio_precio="2026", confianza="baja",
    fuente_url="https://www.ulima.edu.pe/sites/default/files/2026-08/2026-brochure_mba_1.pdf",
    nota="PRECIO NO PUBLICADO en brochures 2025-2026 (ni texto ni imagen); solo inscripción S/ 350 y 'financiamiento sin intereses'. Semana internacional en IQS–Ramon Llull: el costo cubre solo derechos académicos del viaje. Brochure 2023 indicaba S/ 58,900 (URL ya no responde).")
add(universidad="Universidad Continental – Escuela de Posgrado", siglas="UC", tipo_gestion="privada societaria", acreditaciones="ACBSP; SUNEDU licenciada",
    programa="MBA – Maestría en Administración de Negocios", modalidad="online", sede="Online", duracion_meses=None, costo_total_soles=None,
    anio_precio="2026", confianza="baja", fuente_url="https://posgrado.ucontinental.edu.pe/programas/mba-maestria-en-administracion-de-negocios/",
    nota="PRECIO NO PUBLICADO (web, API WordPress ni prensa). 768 horas académicas, 100% virtual, convocatoria 2026.")
add(universidad="Universidad Científica del Sur – Escuela de Posgrado", siglas="UCSUR", tipo_gestion="privada societaria", acreditaciones="SUNEDU licenciada",
    programa="Maestría en Administración de Negocios – MBA", modalidad="semipresencial", sede="Lima / virtual sincrónica", duracion_meses=16, costo_total_soles=None,
    incluye_viaje_internacional=None, anio_precio="2026", confianza="baja", fuente_url="https://madne.cientifica.edu.pe/",
    nota="PRECIO NO PUBLICADO (landing y brochure 2024). Pasantía con Universitat Carlemany (Andorra), sin indicar si está incluida.")
add(universidad="Universidad de San Martín de Porres – Fac. Ciencias Administrativas y RRHH", siglas="USMP", tipo_gestion="privada asociativa", acreditaciones="SUNEDU licenciada",
    programa="Maestría en Administración de Negocios (MBA)", modalidad=None, sede="Lima", duracion_meses=None, costo_total_soles=None,
    anio_precio=None, confianza="baja", fuente_url=None,
    nota="SIN DATO: usmp.edu.pe responde 403 (Cloudflare) y administracion.usmp.edu.pe 500; no hay URL verificable. Existen también IMBA y Maestría en Negocios Internacionales.")
