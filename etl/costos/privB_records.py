R = []
def add(**k):
    d = dict(moneda="PEN", ranking=None, acreditaciones="SUNEDU licenciada"); d.update(k); R.append(d)

ucv = dict(universidad="Universidad César Vallejo – Escuela de Posgrado", siglas="UCV", tipo_gestion="privada societaria",
           programa="Maestría en Administración de Negocios – MBA", duracion_meses=12, anio_precio="2026-II", confianza="alta",
           costo_inscripcion=100, n_cuotas=12)
add(**ucv, modalidad="online", sede="Online", costo_total_soles=4800, costo_matricula=250, monto_cuota=350,
    fuente_url="https://www.ucv.edu.pe/uploads/files/Transparencia/pensiones/RGG_N_213-2025_PENSIONES_2026-II_POSGRADO_A_DISTANCIA_20260603124342.pdf",
    nota="RGG N.° 213-2026/UCV (17-mar-2026), ingresantes 2026-II, MBA = 'Maestría Tipo A': inscripción S/ 100 + 2 matrículas x S/ 250 + 12 cuotas x S/ 350 = S/ 4,800. Estudiantes del extranjero: cuota S/ 800 (total S/ 10,200). Brochure: 2 ciclos, 48 créditos. En 2022 (RGG 226-2022) costaba S/ 7,900 (18 cuotas x S/ 400).")
add(**ucv, modalidad="semipresencial", sede="Sedes UCV", costo_total_soles=10100, costo_matricula=200, monto_cuota=800,
    fuente_url="https://www.ucv.edu.pe/uploads/files/Transparencia/pensiones/RGG_N_211-2026_PENSIONES_INGRESANTES_2026-II_POSGRADO_SEMIPRESENCIAL_20260603124342.pdf",
    nota="RGG N.° 211-2026/UCV, Anexo 01, Maestría Tipo A: 100 + 2 x 200 + 12 x 800 (Categoría A) = S/ 10,100; Categoría B (cuota S/ 600) = S/ 7,700. La tabla presencial 2026-II (RGG 210-2026) no incluye el MBA.")

upao = dict(universidad="Universidad Privada Antenor Orrego – Escuela de Posgrado", siglas="UPAO", tipo_gestion="privada asociativa",
            modalidad="semipresencial", sede="Trujillo / a distancia", duracion_meses=12, costo_total_soles=10850, costo_inscripcion=350,
            costo_matricula=500, n_cuotas=15, monto_cuota=600, anio_precio="2025", confianza="alta")
add(**upao, programa="Maestría en Administración con mención en Finanzas", fuente_url="https://posgrado.upao.edu.pe/maestria-en-administracion-con-mencion-en-finanzas",
    nota="Web oficial (admisión mar-abr 2025): inscripción S/ 350 + 3 matrículas x S/ 500 + 15 cuotas (5 x 3 ciclos) x S/ 600 = S/ 10,850. Aparte: carpeta de tesis S/ 2,700, diploma S/ 100. No se denomina MBA (equivalente).")
add(**upao, programa="Maestría en Administración con mención en Recursos Humanos", fuente_url="https://posgrado.upao.edu.pe/maestria-en-administracion-con-mencion-en-recursos-humanos",
    nota="Misma estructura de pagos que la mención Finanzas: S/ 10,850. No se denomina MBA.")

uac = dict(universidad="Universidad Andina del Cusco – Escuela de Posgrado", siglas="UAC", tipo_gestion="privada asociativa",
           programa="Maestría en Administración de Negocios", duracion_meses=16, costo_inscripcion=335, n_cuotas=16, anio_precio="2025-2026", confianza="media",
           fuente_url="https://www.uandina.edu.pe/posgrado/programas/maestrias/maestria-en-administracion-de-negocios")
add(**uac, modalidad="part-time", sede="Cusco", costo_total_soles=14535, costo_matricula=710, monto_cuota=710,
    nota="Web oficial: 4 ciclos (16 meses), matrícula S/ 710 y mensualidad S/ 710 (confirmado por tarifario 2026, Res. 710-CU-2025-UAC). Total calculado suponiendo 16 mensualidades y 4 matrículas: 335 + 4 x 710 + 16 x 710 = S/ 14,535 (tarifas oficiales; nº de pagos inferido → confianza media).")
add(**uac, modalidad="online", sede="Online", costo_total_soles=11695, costo_matricula=568, monto_cuota=568,
    nota="Web oficial a distancia: S/ 568 (incluye 20% descuento). Total calculado 335 + 4 x 568 + 16 x 568 = S/ 11,695 (supuesto de 16 mensualidades).")

add(universidad="Universidad Católica de Santa María – Escuela de Postgrado", siglas="UCSM", tipo_gestion="privada asociativa",
    programa="Maestría en Administración de Negocios (a distancia)", modalidad="online", sede="Arequipa / online", duracion_meses=18,
    costo_total_soles=11100, costo_matricula=740, n_cuotas=12, monto_cuota=740, anio_precio="2025", confianza="media",
    fuente_url="https://web.archive.org/web/20260204133237/https://postgrado.ucsm.edu.pe/wp-content/uploads/2025/06/Brochure-MAD-Adm-de-Negocios.pdf",
    nota="Brochure oficial UCSM 2025 vía Wayback (postgrado.ucsm.edu.pe responde 403): 3 semestres x (matrícula S/ 740 + 4 tasas S/ 740) = S/ 11,100, sin inscripción.")
add(universidad="Universidad Católica de Santa María – Escuela de Postgrado", siglas="UCSM", tipo_gestion="privada asociativa",
    programa="Maestría en Administración de Negocios (presencial, tarifa general de maestrías)", modalidad="part-time", sede="Arequipa", duracion_meses=18,
    costo_total_soles=14250, costo_inscripcion=350, costo_matricula=950, n_cuotas=12, monto_cuota=950, anio_precio="2021", confianza="media",
    ranking="UCSM difundió (2024) ser MBA n.° 2 del Perú según Financial Times — no verificado",
    fuente_url="https://www.caa.org.pe/concurso-de-admision-ucsm/",
    nota="Fuente de terceros (Colegio de Abogados de Arequipa, ene-2021), tarifa genérica de maestrías presenciales: 3 x (950 + 4 x 950) = S/ 14,250 (+ postulación S/ 350). Semipresencial: S/ 11,250. Desactualizado. URL devuelve 406 a curl sin User-Agent de navegador.")

add(universidad="Universidad Autónoma del Perú – Escuela de Posgrado", siglas="UA", tipo_gestion="privada societaria",
    programa="Maestría en Administración de Empresas – MBA", modalidad="online", sede="Online", duracion_meses=15,
    costo_total_soles=16400, costo_inscripcion=50, costo_matricula=350, n_cuotas=18, monto_cuota=850, anio_precio="2025", confianza="media",
    fuente_url="https://web.archive.org/web/20250116031150/https://www.autonoma.pe/maestria/maestria-en-administracion-de-empresas/",
    nota="Snapshot Wayback ene-2025 de la web oficial: 50 + 3 x 350 + 18 x 850 = S/ 16,400 (regular); promocional 18 x S/ 640 = S/ 12,620. La web actual ya no publica precios ('S/ 0 inscripción y matrícula').")

add(universidad="Universidad Privada Norbert Wiener – Escuela de Posgrado", siglas="UWIENER", tipo_gestion="privada societaria",
    programa="Maestría en Gestión Administrativa de la Salud – MBA", modalidad="online", sede="Online", duracion_meses=16,
    costo_total_soles=20500, costo_inscripcion=300, costo_matricula=300, n_cuotas=16, monto_cuota=1206, anio_precio="2025-2026", confianza="alta",
    fuente_url="https://posgrado.uwiener.edu.pe/wp-content/uploads/2025/04/dscto-Brochure-MBA-SALUD.pdf",
    nota="Brochure oficial: misma estructura que el MBA a distancia (S/ 20,500 regular; campaña S/ 17,605; convenio S/ 16,640; egresado S/ 14,710). Certificaciones ASU. MBA sectorial (salud).")

add(universidad="Universidad Señor de Sipán – Escuela de Posgrado", siglas="USS", tipo_gestion="privada societaria",
    programa="Maestría en Administración y Marketing (antecesora del actual MBA)", modalidad=None, sede="Chiclayo", duracion_meses=12,
    costo_total_soles=8000, costo_inscripcion=100, costo_matricula=350, n_cuotas=12, monto_cuota=600, anio_precio="2023", confianza="baja",
    fuente_url="https://web.archive.org/web/20240430083239/https://www.uss.edu.pe/uss/TransparenciaDoc/RegEstudiantes/cobranzas.pdf",
    nota="Reglamento de Cobranza 2023 (Wayback), Maestrías Grupo II: 100 + 2 x 350 + 12 x 600 = S/ 8,000 suponiendo 2 ciclos (S/ 11,950 con 3). El MBA actual 100% virtual (posgradouss.edu.pe) no publica precio.")

add(universidad="Universidad Inca Garcilaso de la Vega – Escuela de Posgrado", siglas="UIGV", tipo_gestion="privada asociativa",
    programa="Maestría (escala general de posgrado; programa de administración no confirmado)", modalidad="part-time", sede="Lima", duracion_meses=None,
    costo_total_soles=None, costo_matricula=200, n_cuotas=None, monto_cuota=950, anio_precio="2026", confianza="baja",
    fuente_url="https://uigv.edu.pe/wp-content/uploads/2026/07/Tarifas-pensiones-2026.pdf",
    nota="Tarifa oficial 2026 posgrado presencial: matrícula S/ 200 + 4 pensiones por ciclo de S/ 950 / 825 / 700 según nivel (S/ 3,000–4,000 por ciclo). Nº de ciclos del programa no confirmado: total no calculado (2 ciclos ≈ S/ 6,000–8,000; 3 ciclos ≈ S/ 9,000–12,000).")

add(universidad="Universidad Privada del Norte – Escuela de Posgrado", siglas="UPN", tipo_gestion="privada societaria",
    programa="MBA Executive Leaders / MBA virtual", modalidad="online", sede="Online", duracion_meses=18,
    costo_total_soles=None, anio_precio=None, confianza="baja", fuente_url=None,
    nota="SIN PRECIO: UPN no publica tarifas de posgrado (brochures y portal de transparencia solo mencionan 3, 6 o 12 cuotas sin intereses). MBA Executive Leaders 18 meses a distancia; MBA virtual autónomo 12 meses.")
