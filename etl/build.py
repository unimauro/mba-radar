"""Integra los datasets de data/ en los JSON que consume el dashboard.

Salidas:
  data/paises/index.json   países disponibles
  data/paises/pe.json      Perú (costos, ENAHO, escuelas, oferta, estudios)
  data/global.json         Hartley (2026) + evidencia internacional

Uso:  python3 etl/build.py   (solo librería estándar)
Para un país nuevo: crear data/<code>/... con la misma forma y añadir una función build_<code>().
"""
import json, re, math


def r0(x):
    """Redondeo half-up (igual que Math.round en el frontend; Python usa half-even)."""
    return int(math.floor(x + 0.5))
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / 'data'
load = lambda p: json.loads((D / p).read_text(encoding='utf-8'))

ACRED = re.compile(r'AACSB|AMBA|EQUIS', re.I)


def modalidad_grupo(m: str) -> str:
    m = (m or '').lower()
    if 'online' in m or 'virtual' in m or 'distancia' in m:
        return 'Online'
    if 'full' in m or 'tiempo completo' in m:
        return 'Full-time'
    if 'ejecut' in m or 'executive' in m or 'corporat' in m:
        return 'Ejecutivo'
    return 'Part-time / semipresencial'


def segmento(p: dict) -> str:
    g = (p.get('tipo_gestion') or '').lower()
    if 'públ' in g or 'publ' in g:
        return 'Universidad pública'
    acr = p.get('acreditaciones') or ''
    if isinstance(acr, list):
        acr = ', '.join(acr)
    return 'Escuela de negocios con acreditación internacional' if ACRED.search(acr) else 'Universidad privada'


def num(x):
    if x is None or x == '':
        return None
    try:
        v = float(str(x).replace(',', ''))
        return v if math.isfinite(v) else None
    except ValueError:
        return None


def build_programas(tc):
    raw = load('costos/programas.json')
    out = []
    for i, p in enumerate(raw['programas']):
        soles, usd = num(p.get('costo_total_soles')), num(p.get('costo_total_usd'))
        mon = 'USD' if (soles is None and usd) or (p.get('moneda') or '').upper() == 'USD' else 'PEN'
        if soles is None and usd:
            soles = round(usd * tc)
        acr = p.get('acreditaciones')
        acr = ', '.join(acr) if isinstance(acr, list) else (acr or '')
        rk = p.get('ranking')
        rk = ', '.join(rk) if isinstance(rk, list) else (rk or '')
        prog = p.get('programa') or ''
        out.append({
            'id': i, 'universidad': p.get('universidad'), 'siglas': p.get('siglas'),
            'gestion': p.get('tipo_gestion'), 'segmento': segmento({**p, 'acreditaciones': acr}),
            'programa': prog, 'programa_corto': re.sub(r'^(Maestr[ií]a en |Master in )', '', prog, flags=re.I),
            'modalidad': p.get('modalidad'), 'modalidad_grupo': modalidad_grupo(p.get('modalidad')),
            'duracion_meses': num(p.get('duracion_meses')), 'costo_soles': soles, 'costo_usd': usd,
            'moneda_original': mon, 'acreditaciones': acr, 'ranking': rk,
            'anio_precio': p.get('anio_precio'), 'fuente_url': p.get('fuente_url'),
            'confianza': p.get('confianza') or 'baja', 'nota': p.get('nota'),
        })
    return raw.get('meta', {}), out


def build_enaho():
    e = load('retornos/enaho_prima.json')
    r = e['resultados']
    a24 = r['por_anio']['2024']
    nombres = {('sexo', 'hombre'): 'Hombres', ('sexo', 'mujer'): 'Mujeres',
               ('region', 'lima_metropolitana'): 'Lima Metropolitana', ('region', 'resto_pais'): 'Resto del país',
               ('sector', 'publico'): 'Sector público', ('sector', 'privado'): 'Sector privado',
               ('tramo_edad', '25-34'): '25–34 años', ('tramo_edad', '35-44'): '35–44 años', ('tramo_edad', '45-64'): '45–64 años'}
    cortes = []
    for (k, g), lab in nombres.items():
        x = r['cortes']['2024'].get(k, {}).get(g)
        if x:
            cortes.append({'grupo': lab, 'prima_pct': x['mincer_mensual_A']['prima_pct'], 'n': x['descriptivo']['posgrado']['n_muestra']})
    tend = {y: r['por_anio'][y]['mincer_mensual_A']['prima_pct'] for y in sorted(r['por_anio'])}
    desc = a24['descriptivo']
    A = a24['mincer_mensual_A']
    resumen = {'prima_pct': A['prima_pct'], 'etiqueta': 'más gana, en promedio, quien tiene maestría/doctorado que un universitario completo comparable',
               'detalle': f"ENAHO 2024, mismo sexo, edad y zona · IC95 {A['ic95_pct'][0]:.0f}–{A['ic95_pct'][1]:.0f} %"}
    sub = a24['subempleo_calificacion']['posgrado']['pct_grupos_4_9_no_profesionales']
    panel = {
        'titulo': 'Prima salarial del posgrado (cálculo propio con ENAHO)',
        'fuente': 'INEI, Encuesta Nacional de Hogares 2019-2024, módulo 500. Cálculo propio: etl/enaho_prima_posgrado.py',
        'url': 'https://proyectos.inei.gob.pe/microdatos/',
        'cifra': f"+{int(A['prima_pct']+0.5)} %",
        'texto': (f"En 2024 la mediana mensual de quien tiene maestría o doctorado fue S/ {desc['posgrado']['mediana_mes']:,.0f} "
                  f"frente a S/ {desc['universitaria_completa']['mediana_mes']:,.0f} del universitario completo. Controlando edad, sexo y zona, "
                  f"la prima es +{int(A['prima_pct']+0.5)} % y casi no cambió desde 2019 ("
                  + ', '.join(f"{y}: +{r0(v)} %" for y, v in tend.items()) + "). La prima es mucho mayor en el sector privado (+73 %) que en el público (+28 %), "
                  "donde trabaja el 57 % de los posgraduados."),
        'advertencia': ("ENAHO no registra la especialidad del posgrado: incluye MBA, maestrías en educación, gestión pública, etc. "
                        "El nivel 11 mezcla maestría y doctorado, completos o no. Es una correlación: quien hace un posgrado ya ganaba más antes "
                        f"(sesgo de selección), así que la prima causal es menor. n = {desc['posgrado']['n_muestra']:,} posgraduados y "
                        f"{desc['universitaria_completa']['n_muestra']:,} universitarios en la muestra."),
        'cortes': cortes, 'tendencia': tend,
    }
    por_edad = [r['cortes']['2024']['tramo_edad'][t]['descriptivo']['pct_posgrado_bajo_mediana_uni'] for t in ('25-34', '35-44', '45-64')]
    alertas = [{
        'id': 'enaho_bajo_mediana', 'signo': 'negativo', 'pct': desc['pct_posgrado_bajo_mediana_uni'],
        'pct_misma_edad': round(sum(por_edad) / len(por_edad), 1),
        'titulo': '1 de cada 4 posgraduados gana menos que el universitario típico de su misma edad',
        'hallazgo_clave': (f"Comparado con universitarios de su mismo tramo de edad, entre {min(por_edad):.0f} % y {max(por_edad):.0f} % de quienes tienen maestría o doctorado ganan menos que la mediana "
                           f"(frente a todos los universitarios: {desc['pct_posgrado_bajo_mediana_uni']:.0f} %). Para ellos el posgrado no se tradujo en un sueldo por encima del promedio de quienes no lo tienen. "
                           "No prueba que el posgrado les hizo perder: sin él podrían ganar aún menos; y la ENAHO incluye posgrados en curso."),
        'autores': 'Cálculo propio con ENAHO', 'anio': 2024, 'tipo': 'microdatos', 'url': 'https://proyectos.inei.gob.pe/microdatos/'}, {
        'id': 'enaho_subempleo', 'signo': 'negativo', 'titulo': f'{sub:.0f} % de los posgraduados trabaja en ocupaciones no profesionales',
        'hallazgo_clave': f"Vendedores, oficinistas, operarios, etc. (CNO grupos 4-9). Es menos que entre universitarios ({a24['subempleo_calificacion']['universitaria_completa']['pct_grupos_4_9_no_profesionales']:.0f} %), pero son ~{desc['posgrado']['n_expandido'] * sub / 100 / 1000:,.0f} mil personas con maestría en empleos que no la requieren.",
        'autores': 'Cálculo propio con ENAHO', 'anio': 2024, 'tipo': 'microdatos', 'url': 'https://proyectos.inei.gob.pe/microdatos/'}]
    return resumen, panel, alertas, A['prima_pct']


def postulante_top():
    """Sueldo previo al MBA de Pacífico (AE 2024): ingreso post / (1+variación), en soles → equivalente ENAHO (anual/12)."""
    tc = num(load('costos/programas.json')['meta'].get('tipo_cambio_usd_pen')) or 3.75
    x = next(e for e in load('retornos/salarios_escuelas.json')['escuelas_peruanas'] if 'Pac' in e['escuela'] and e['anio_ranking'] == 2024)
    return round(x['ingreso_mensual_post_usd'] / (1 + x['variacion_pre_post_pct'] / 100) * tc)


def sueldos_ref():
    r = load('retornos/enaho_prima.json')['resultados']
    u = r['por_anio']['2024']['descriptivo']['universitaria_completa']
    l = r['cortes']['2024']['region']['lima_metropolitana']['descriptivo']['universitaria_completa']
    return [
        {'etiqueta': 'Universitario típico (Perú)', 'mensual': u['mediana_mes']},
        {'etiqueta': 'Universitario típico (Lima)', 'mensual': l['mediana_mes']},
        {'etiqueta': 'Universitario del 25 % mejor pagado (Lima)', 'mensual': l['p75_mes']},
        {'etiqueta': 'Postulante a escuela top (AméricaEconomía)', 'mensual': postulante_top()},
    ]


def build_escuelas():
    s = load('retornos/salarios_escuelas.json')
    out = []
    for x in s['escuelas_peruanas']:
        post, var = x.get('ingreso_mensual_post_usd'), x.get('variacion_pre_post_pct')
        if not post or var is None:
            continue
        nombre = 'Pacífico' if 'Pac' in x['escuela'] else ('USIL' if 'USIL' in x['escuela'] else x['escuela'])
        out.append({'escuela': f"{nombre} ({x['anio_ranking']})", 'antes': round(post / (1 + var / 100)), 'despues': post,
                    'moneda': 'US$/mes', 'anio': x['anio_ranking'], 'fuente': x['fuente'], 'fuente_url': x['url'], 'var': var})
    return sorted(out, key=lambda r: (r['escuela'].split(' (')[0], r['anio'])), s.get('nota_metodologica')


def build_oferta():
    o = load('retornos/oferta_grados.json')
    t = o['totales']
    tit = lambda u: u.title().replace(' De ', ' de ').replace(' Del ', ' del ').replace(' La ', ' la ')
    return {
        'titulo': f"{t['programas_maestria_unicos']:,} maestrías en {t['universidades_con_maestria']} universidades",
        'fuente': o['fuente'], 'url': o['url_dataset'],
        'texto': (f"Con datos abiertos de SUNEDU (corte {o['fecha_corte_datos']}): {t['programas_maestria_campo_administracion_y_comercio']} maestrías del campo "
                  f"Administración y Comercio, {t['programas_tipo_mba_o_administracion_general']} de tipo MBA o administración general en {t['universidades_con_programa_tipo_mba']} universidades, "
                  f"y {t['programas_maestria_educacion_docencia']} en educación. Para licenciarse se cerraron 3,243 programas (27 % maestrías); la UCV desistió de 21 maestrías."),
        'serie': [[tit(x['universidad']), x['programas']] for x in o['top15_universidades_maestrias_administracion_y_comercio']],
        'unidad': 'maestrías en Administración y Comercio',
        'nota': 'Son programas autorizados, no graduados: SUNEDU no publica como dato abierto los grados otorgados por universidad (habría que pedirlos por Ley 27806).',
    }


def build_pe():
    meta_c, programas = None, []
    tc = 3.75
    try:
        meta_c = load('costos/programas.json').get('meta', {})
        tc = num(meta_c.get('tipo_cambio_usd_pen')) or tc
        _, programas = build_programas(tc)
    except FileNotFoundError:
        pass
    resumen, panel, alertas, prima = build_enaho()
    esc, nota_esc = build_escuelas()
    estudios = load('retornos/estudios.json')
    for e in estudios:
        if isinstance(e.get('cifra_clave'), dict):
            e['cifra_clave'] = e['cifra_clave'].get('texto')
    return {
        'pais': {'code': 'pe', 'nombre': 'Perú', 'simbolo': 'S/', 'fecha': '2026-11-25', 'fecha_texto': 'noviembre 2026',
                 'tc_usd': tc, 'tc_fuente': (meta_c or {}).get('tipo_cambio_fuente') or 'Tipo de cambio usado para convertir precios en dólares',
                 'tc_url': (meta_c or {}).get('tipo_cambio_url') or 'https://estadisticas.bcrp.gob.pe/estadisticas/series/diarias/tipo-de-cambio'},
        'programas': programas,
        'enaho_resumen': resumen, 'enaho_panel': panel,
        'salarios_escuelas': esc,
        'oferta': build_oferta(),
        'estudios': estudios, 'alertas': alertas,
        'sueldos_ref': sueldos_ref(),
        'presets_prima': [
            {'etiqueta': 'Pesimista', 'valor': 0, 'tipo': 'escenario', 'fuente': 'Programa de baja calidad: el retorno es menor en programas peor rankeados y part-time (Altonji y Zhu 2025, Texas)'},
            {'etiqueta': 'EE.UU., efectos fijos', 'valor': 17, 'tipo': 'estimacion', 'fuente': 'Altonji y Zhu: 0,156 log ≈ +17 % (efectos fijos, Texas; supuestos fuertes)'},
            {'etiqueta': 'Techo: AméricaEconomía', 'valor': 44, 'tipo': 'techo', 'fuente': 'Variación pre/post autorreportada; incluye ~5 años de crecimiento normal. NO es atribuible al MBA'},
            {'etiqueta': 'Techo: ENAHO', 'valor': r0(prima), 'tipo': 'techo', 'fuente': 'Diferencia asociada a cualquier maestría/doctorado; incluye selección. NO es atribuible al MBA'},
        ],
        'textos': {
            'retorno_sub': 'Sí hay una prima salarial asociada al posgrado en el Perú, y es grande. Pero no toda se debe al título: quien estudia un MBA ya ganaba más, y la evidencia indica que la parte causal depende mucho de la calidad del programa.',
            'salarios_nota': (nota_esc or '') + ' "Antes" se reconstruye a partir de la variación porcentual publicada.',
        },
        'metodologia': [
            'Costos: precio total publicado por cada universidad (web, brochures, tarifarios TUPA/TUSNE) o por prensa y portales cuando la universidad no lo publica; cada fila indica su nivel de confianza y su fuente. Los precios en dólares se convierten al tipo de cambio indicado. No incluyen descuentos corporativos, becas ni intereses de financiamiento.',
            'Segmentos: «escuela con acreditación internacional» = el programa o la escuela tiene AACSB, AMBA o EQUIS; el resto se separa en universidad privada o pública según SUNEDU.',
            'Prima salarial: regresión de Mincer ponderada con la ENAHO (INEI) de 2019, 2022, 2023 y 2024; ocupados de 25 a 64 años con ingreso positivo; maestría/doctorado (p301a = 11) frente a universitaria completa (p301a = 10); controles: edad, edad², sexo, Lima Metropolitana y área urbana; errores agrupados por conglomerado (diseño muestral). Prima = exp(β) − 1. Es una asociación, no un efecto causal.',
            'Calculadora: flujo mensual descontado; el costo del programa se reparte en partes iguales durante su duración; en modalidad full-time se suma el sueldo que se deja de percibir; el aumento se aplica desde el mes siguiente al egreso. Sueldo anual = 14 sueldos.',
            'Todo el código y los datos están en el repositorio; los enlaces se verificaron el 25-nov-2026.',
        ],
    }


def main():
    (D / 'paises').mkdir(exist_ok=True)
    pe = build_pe()
    (D / 'paises' / 'pe.json').write_text(json.dumps(pe, ensure_ascii=False, indent=1), encoding='utf-8')
    glob = {'hartley': load('hartley/hartley_2026.json'),
            'internacional': {'fuentes': load('internacional/fuentes.json'), 'series': load('internacional/series.json')}}
    (D / 'global.json').write_text(json.dumps(glob, ensure_ascii=False, indent=1), encoding='utf-8')
    idx = {'default': 'pe', 'paises': [
        {'code': 'pe', 'nombre': 'Perú', 'bandera': '🇵🇪', 'listo': True},
        {'code': 'cl', 'nombre': 'Chile', 'bandera': '🇨🇱', 'listo': False},
        {'code': 'co', 'nombre': 'Colombia', 'bandera': '🇨🇴', 'listo': False},
        {'code': 'mx', 'nombre': 'México', 'bandera': '🇲🇽', 'listo': False},
        {'code': 'ar', 'nombre': 'Argentina', 'bandera': '🇦🇷', 'listo': False},
    ]}
    (D / 'paises' / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"pe: {len(pe['programas'])} programas, {sum(1 for p in pe['programas'] if p['costo_soles'])} con precio; estudios {len(pe['estudios'])}")


if __name__ == '__main__':
    main()
