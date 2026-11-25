import json, csv, sys
sys.path.insert(0, '.')
import base_records, public_records, privA_records, privB_records, fill_records
TC = 3.479
recs = [r for r in base_records.R if r['siglas'] != 'UCV'] + public_records.R + privA_records.R + privB_records.R
recs = fill_records.apply(recs)
FIELDS = ["id","universidad","siglas","tipo_gestion","programa","modalidad","sede","duracion_meses","moneda",
          "costo_total_soles","costo_total_usd","costo_total_soles_equiv","costo_inscripcion","costo_inscripcion_usd","costo_matricula",
          "n_cuotas","monto_cuota","incluye_viaje_internacional","costo_viaje_adicional_usd","acreditaciones","ranking",
          "anio_precio","fuente_url","fecha_consulta","confianza","es_mba_generalista","incluye_derecho_grado","grupo_precio","nota"]
out = []
for i, r in enumerate(recs, 1):
    d = {f: r.get(f) for f in FIELDS}
    extra = set(r) - set(FIELDS)
    assert not extra, extra
    d['id'] = i
    d['fecha_consulta'] = '2026-11-25'
    if d['grupo_precio'] is None: d['grupo_precio'] = f"g{i:03d}"
    if d['costo_total_soles'] is not None: d['costo_total_soles_equiv'] = d['costo_total_soles']; d['moneda'] = d['moneda'] or 'PEN'
    elif d['costo_total_usd'] is not None: d['costo_total_soles_equiv'] = round(d['costo_total_usd'] * TC)
    if d['costo_total_soles'] is None and d['costo_total_usd'] is None: d['moneda'] = None
    out.append(d)
meta = {
 "fecha": "2026-11-25",
 "tipo_cambio_usd_pen": TC,
 "tipo_cambio_fuente": "BCRP – serie PD04640PD 'TC Sistema bancario SBS (S/ por US$) – Venta', 24-nov-2026 (último dato disponible; 25-nov n.d.). https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04640PD/json/2026-11-10/2026-11-25/esp",
 "n_programas": len(out),
 "n_con_precio": sum(1 for d in out if d['costo_total_soles_equiv'] is not None),
 "notas": [
  "costo_total_soles_equiv = costo_total_soles si el precio está en soles; si está en USD, costo_total_usd x tipo_cambio_usd_pen. Úsese para ordenar/comparar.",
  "Cuando el total no estaba publicado, se calculó como inscripción/admisión + matrículas + cuotas; el cálculo está en 'nota'. Salvo indicación, no incluye derecho de grado, tesis, pasajes ni viáticos.",
  "confianza: alta = precio oficial publicado por la universidad (web, brochure, tarifario, resolución; incluye copias Wayback de documentos oficiales); media = terceros (p.ej. directorio AACSB con datos reportados por la escuela), año anterior o total con supuestos; baja = estimado o sin precio.",
  "Precios de CENTRUM PUCP en USD provienen del directorio AACSB (Survey Year 2024-25, precio del programa completo); CENTRUM no publica precios en su web.",
  "Universidad del Pacífico: se usa la tabla oficial 'Inversión por Maestría 2025' (no existe versión 2026 publicada).",
  "Precios de PAD excluyen la Semana Internacional (USD 3,600–4,200 adicionales, ver costo_viaje_adicional_usd).",
  "Varios programas registrados son MBA sectoriales (salud, educación, ambiental) o 'Maestría en Administración' equivalentes sin la marca MBA; se indica en 'nota'.",
  "Sin precio encontrado (costo null): Universidad de Lima, Continental, Científica del Sur, USMP, UPN, UNMSM, UNFV, UIGV (solo escala general), PAD MBA Piura y MBA a Distancia, Global MBA CENTRUM–Tulane.",
  "No incluidas: Universidad Alas Peruanas (licencia denegada, Res. 119-2022-SUNEDU/CD) y Universidad Peruana de Ciencias e Informática (licencia denegada, Res. 162-2019-SUNEDU/CD), ambas en cese; Universidad Católica San Pablo (sin MBA vigente en su oferta; su maestría más cercana es Gerencia de Operaciones y Logística, S/ 18,840); USAT y UPLA (tienen maestría en administración/MBA pero no publican precio); UNT, UNCP, UNPRG, UNP (sin datos accesibles).",
  "Ranking QS Global MBA 2025 según La República (03-oct-2024): https://larepublica.pe/mundo/2024/10/03/las-unicas-universidades-de-america-latina-en-el-ranking-mundial-de-mba-2025-de-qs-superan-a-varias-de-estados-unidos-qs-global-mba-rankings-2025-114078 . No se halló la edición 2025 del ranking MBA de AméricaEconomía.",
  "tipo_gestion se asignó por conocimiento general del régimen legal de cada universidad (Ley 30220); verificar en SUNEDU si es crítico."
 ]}
D = '/Users/unimauro/Documents/Repos/mba-peru/data/costos/'
json.dump({"meta": meta, "programas": out}, open(D + 'programas.json', 'w'), ensure_ascii=False, indent=1)
with open(D + 'programas.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=FIELDS); w.writeheader()
    for d in out: w.writerow({k: ('' if v is None else v) for k, v in d.items()})
p = sorted([d for d in out if d['costo_total_soles_equiv']], key=lambda d: d['costo_total_soles_equiv'])
print(len(out), len(p))
for d in p[:6]: print('LOW', d['costo_total_soles_equiv'], d['siglas'], d['programa'], d['modalidad'], d['confianza'])
for d in p[-6:]: print('HIGH', d['costo_total_soles_equiv'], d['siglas'], d['programa'], d['confianza'])
print('sin precio:', sorted({d['siglas'] for d in out if not d['costo_total_soles_equiv']}))
