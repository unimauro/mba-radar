"""Integra los datasets de data/ en los JSON que consume el dashboard.

Salidas:
  data/paises/index.json   países disponibles
  data/paises/pe.json      Perú (costos, ENAHO, escuelas, oferta, estudios)
  data/global.json         Hartley (2026) + evidencia internacional

Uso:  python3 etl/build.py   (solo librería estándar)
Para un país nuevo: crear data/paises/<code>.json con la misma forma (o sus fuentes en data/)
y añadir una función build_<code>() registrada en BUILDERS.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'

TC_DEFAULT = 3.75                      # S/ por US$ si la fuente de costos no trae tipo de cambio
FECHA = '2026-11-25'
FECHA_TEXTO = 'noviembre 2026'
INEI_MICRODATOS = 'https://proyectos.inei.gob.pe/microdatos/'
BCRP_TC_URL = 'https://estadisticas.bcrp.gob.pe/estadisticas/series/diarias/tipo-de-cambio'
ANIO_ENAHO = '2024'
ANIO_ESCUELA_TOP = 2024
TRAMOS_EDAD = ('25-34', '35-44', '45-64')

ACREDITACION = re.compile(r'AACSB|AMBA|EQUIS', re.I)
PREFIJO_PROGRAMA = re.compile(r'^(Maestr[ií]a en |Master in )', re.I)

SEG_ESCUELA = 'Escuela de negocios con acreditación internacional'
SEG_PRIVADA = 'Universidad privada'
SEG_PUBLICA = 'Universidad pública'

CORTES_ENAHO = {
    ('sexo', 'hombre'): 'Hombres', ('sexo', 'mujer'): 'Mujeres',
    ('region', 'lima_metropolitana'): 'Lima Metropolitana', ('region', 'resto_pais'): 'Resto del país',
    ('sector', 'publico'): 'Sector público', ('sector', 'privado'): 'Sector privado',
    ('tramo_edad', '25-34'): '25–34 años', ('tramo_edad', '35-44'): '35–44 años', ('tramo_edad', '45-64'): '45–64 años',
}

PAISES = [
    {'code': 'pe', 'nombre': 'Perú', 'bandera': '🇵🇪', 'listo': True},
    {'code': 'cl', 'nombre': 'Chile', 'bandera': '🇨🇱', 'listo': False},
    {'code': 'co', 'nombre': 'Colombia', 'bandera': '🇨🇴', 'listo': False},
    {'code': 'mx', 'nombre': 'México', 'bandera': '🇲🇽', 'listo': False},
    {'code': 'ar', 'nombre': 'Argentina', 'bandera': '🇦🇷', 'listo': False},
]

METODOLOGIA_PE = [
    'Costos: precio total publicado por cada universidad (web, brochures, tarifarios TUPA/TUSNE) o por prensa y portales cuando la universidad no lo publica; cada fila indica su nivel de confianza y su fuente. Los precios en dólares se convierten al tipo de cambio indicado. No incluyen descuentos corporativos, becas ni intereses de financiamiento.',
    'Segmentos: «escuela con acreditación internacional» = el programa o la escuela tiene AACSB, AMBA o EQUIS; el resto se separa en universidad privada o pública según SUNEDU.',
    'Prima salarial: regresión de Mincer ponderada con la ENAHO (INEI) de 2019, 2022, 2023 y 2024; ocupados de 25 a 64 años con ingreso positivo; maestría/doctorado (p301a = 11) frente a universitaria completa (p301a = 10); controles: edad, edad², sexo, Lima Metropolitana y área urbana; errores agrupados por conglomerado (diseño muestral). Prima = exp(β) − 1. Es una asociación, no un efecto causal.',
    'Calculadora: flujo mensual descontado; el costo del programa se reparte en partes iguales durante su duración; en modalidad full-time se suma el sueldo que se deja de percibir; el aumento se aplica desde el mes siguiente al egreso. Sueldo anual = 14 sueldos.',
    'Todo el código y los datos están en el repositorio; los enlaces se verificaron el 25-nov-2026.',
]

Json = dict[str, Any]


# ---------- utilidades ----------

def load(rel: str) -> Any:
    """Lee un JSON relativo a data/."""
    return json.loads((DATA / rel).read_text(encoding='utf-8'))


def write(rel: str, obj: Any) -> None:
    """Escribe un JSON relativo a data/ (UTF-8, indentación 1, igual que siempre)."""
    (DATA / rel).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding='utf-8')


def r0(x: float) -> int:
    """Redondeo half-up (igual que Math.round en el frontend; round() de Python es half-even)."""
    return int(math.floor(x + 0.5))


def num(x: Any) -> float | None:
    """Número finito o None ('', None, texto no numérico, NaN, inf)."""
    if x is None or x == '':
        return None
    try:
        v = float(str(x).replace(',', ''))
    except ValueError:
        return None
    return v if math.isfinite(v) else None


def joined(x: Any) -> str:
    """Lista → 'a, b'; texto → texto; vacío → ''."""
    return ', '.join(x) if isinstance(x, list) else (x or '')


# ---------- costos ----------

ONLINE = ('online', 'virtual', 'distancia')
FULL_TIME = ('full', 'tiempo completo')
EJECUTIVO = ('ejecut', 'executive', 'corporat')


def modalidad_grupo(m: str | None) -> str:
    """Agrupa la modalidad libre en Online / Ejecutivo / Full-time / Part-time.

    Las modalidades combinadas ("part-time / online") solo son Online o Full-time si TODAS sus
    partes lo son; cualquier parte part-time o semipresencial las lleva a 'Part-time / semipresencial'.
    """
    partes = [x.strip() for x in re.split(r'/|,|\by\b', (m or '').lower()) if x.strip()]
    todas = lambda claves: bool(partes) and all(any(k in x for k in claves) for x in partes)
    if todas(ONLINE):
        return 'Online'
    if any(k in x for x in partes for k in EJECUTIVO):
        return 'Ejecutivo'
    if todas(FULL_TIME):
        return 'Full-time'
    return 'Part-time / semipresencial'


def segmento(gestion: str | None, acreditaciones: str) -> str:
    """Pública según SUNEDU; si es privada, escuela acreditada (AACSB/AMBA/EQUIS) o universidad privada."""
    g = (gestion or '').lower()
    if 'públ' in g or 'publ' in g:
        return SEG_PUBLICA
    return SEG_ESCUELA if ACREDITACION.search(acreditaciones) else SEG_PRIVADA


def build_programa(i: int, p: Json, tc: float) -> Json:
    """Normaliza un programa de data/costos/programas.json."""
    soles, usd = num(p.get('costo_total_soles')), num(p.get('costo_total_usd'))
    moneda = 'USD' if (soles is None and usd) or (p.get('moneda') or '').upper() == 'USD' else 'PEN'
    if soles is None and usd:
        soles = round(usd * tc)
    acr = joined(p.get('acreditaciones'))
    prog = p.get('programa') or ''
    return {
        'id': i, 'universidad': p.get('universidad'), 'siglas': p.get('siglas'),
        'gestion': p.get('tipo_gestion'), 'segmento': segmento(p.get('tipo_gestion'), acr),
        'programa': prog, 'programa_corto': PREFIJO_PROGRAMA.sub('', prog),
        'modalidad': p.get('modalidad'), 'modalidad_grupo': modalidad_grupo(p.get('modalidad')),
        'duracion_meses': num(p.get('duracion_meses')), 'costo_soles': soles, 'costo_usd': usd,
        'moneda_original': moneda, 'acreditaciones': acr, 'ranking': joined(p.get('ranking')),
        'anio_precio': p.get('anio_precio'), 'fuente_url': p.get('fuente_url'),
        'confianza': p.get('confianza') or 'baja', 'nota': p.get('nota'),
        'sede': p.get('sede'), 'es_mba_generalista': p.get('es_mba_generalista'),
        'incluye_derecho_grado': p.get('incluye_derecho_grado'), 'grupo_precio': p.get('grupo_precio'),
    }


def load_costos() -> tuple[Json, list[Json]]:
    """(meta, programas crudos) de data/costos/programas.json; vacío si aún no existe."""
    try:
        raw = load('costos/programas.json')
    except FileNotFoundError:
        return {}, []
    return raw.get('meta', {}), raw['programas']


def tipo_cambio(meta: Json) -> float:
    return num(meta.get('tipo_cambio_usd_pen')) or TC_DEFAULT


# ---------- retorno (ENAHO) ----------

def enaho_cortes(cortes: Json) -> list[Json]:
    """Prima por subgrupo (sexo, región, sector, edad) para el gráfico de barras."""
    out = []
    for (k, g), etiqueta in CORTES_ENAHO.items():
        x = cortes.get(k, {}).get(g)
        if x:
            out.append({'grupo': etiqueta, 'prima_pct': x['mincer_mensual_A']['prima_pct'], 'n': x['descriptivo']['posgrado']['n_muestra']})
    return out


def enaho_panel(r: Json, desc: Json, A: Json, cortes: list[Json], tend: dict[str, float]) -> Json:
    """Panel "Prima salarial del posgrado" de la sección Retorno."""
    prima = r0(A['prima_pct'])
    pos, uni = desc['posgrado'], desc['universitaria_completa']
    return {
        'titulo': 'Prima salarial del posgrado (cálculo propio con ENAHO)',
        'fuente': 'INEI, Encuesta Nacional de Hogares 2019-2024, módulo 500. Cálculo propio: etl/enaho_prima_posgrado.py',
        'url': INEI_MICRODATOS,
        'cifra': f"+{prima} %",
        'texto': (f"En 2024 la mediana mensual de quien tiene maestría o doctorado fue S/ {pos['mediana_mes']:,.0f} "
                  f"frente a S/ {uni['mediana_mes']:,.0f} del universitario completo. Controlando edad, sexo y zona, "
                  f"la prima es +{prima} % y casi no cambió desde 2019 ("
                  + ', '.join(f"{y}: +{r0(v)} %" for y, v in tend.items()) + "). La prima es mucho mayor en el sector privado (+73 %) que en el público (+28 %), "
                  "donde trabaja el 57 % de los posgraduados."),
        'advertencia': ("ENAHO no registra la especialidad del posgrado: incluye MBA, maestrías en educación, gestión pública, etc. "
                        "El nivel 11 mezcla maestría y doctorado, completos o no. Es una correlación: quien hace un posgrado ya ganaba más antes "
                        f"(sesgo de selección), así que la prima causal es menor. n = {pos['n_muestra']:,} posgraduados y "
                        f"{uni['n_muestra']:,} universitarios en la muestra."),
        'cortes': cortes, 'tendencia': tend,
    }


def enaho_alertas(r: Json, a24: Json) -> list[Json]:
    """Señales negativas calculadas con ENAHO (sección Riesgos)."""
    desc = a24['descriptivo']
    por_edad = [r['cortes'][ANIO_ENAHO]['tramo_edad'][t]['descriptivo']['pct_posgrado_bajo_mediana_uni'] for t in TRAMOS_EDAD]
    sub = a24['subempleo_calificacion']
    sub_pos = sub['posgrado']['pct_grupos_4_9_no_profesionales']
    sub_uni = sub['universitaria_completa']['pct_grupos_4_9_no_profesionales']
    comun = {'autores': 'Cálculo propio con ENAHO', 'anio': 2024, 'tipo': 'microdatos', 'url': INEI_MICRODATOS}
    bajo_mediana = {
        'id': 'enaho_bajo_mediana', 'signo': 'negativo', 'pct': desc['pct_posgrado_bajo_mediana_uni'],
        'pct_misma_edad': round(sum(por_edad) / len(por_edad), 1),
        'titulo': '1 de cada 4 posgraduados gana menos que el universitario típico de su misma edad',
        'hallazgo_clave': (f"Comparado con universitarios de su mismo tramo de edad, entre {min(por_edad):.0f} % y {max(por_edad):.0f} % de quienes tienen maestría o doctorado ganan menos que la mediana "
                           f"(frente a todos los universitarios: {desc['pct_posgrado_bajo_mediana_uni']:.0f} %). Para ellos el posgrado no se tradujo en un sueldo por encima del promedio de quienes no lo tienen. "
                           "No prueba que el posgrado les hizo perder: sin él podrían ganar aún menos; y la ENAHO incluye posgrados en curso."),
        **comun}
    subempleo = {
        'id': 'enaho_subempleo', 'signo': 'negativo', 'titulo': f'{sub_pos:.0f} % de los posgraduados trabaja en ocupaciones no profesionales',
        'hallazgo_clave': f"Vendedores, oficinistas, operarios, etc. (CNO grupos 4-9). Es menos que entre universitarios ({sub_uni:.0f} %), pero son ~{desc['posgrado']['n_expandido'] * sub_pos / 100 / 1000:,.0f} mil personas con maestría en empleos que no la requieren.",
        **comun}
    return [bajo_mediana, subempleo]


def build_enaho() -> tuple[Json, Json, list[Json], float]:
    """(resumen para KPIs, panel de Retorno, alertas de Riesgos, prima % 2024)."""
    r = load('retornos/enaho_prima.json')['resultados']
    a24 = r['por_anio'][ANIO_ENAHO]
    A = a24['mincer_mensual_A']
    tend = {y: r['por_anio'][y]['mincer_mensual_A']['prima_pct'] for y in sorted(r['por_anio'])}
    resumen = {'prima_pct': A['prima_pct'], 'etiqueta': 'más gana, en promedio, quien tiene maestría/doctorado que un universitario completo comparable',
               'detalle': f"ENAHO 2024, mismo sexo, edad y zona · IC95 {A['ic95_pct'][0]:.0f}–{A['ic95_pct'][1]:.0f} %"}
    panel = enaho_panel(r, a24['descriptivo'], A, enaho_cortes(r['cortes'][ANIO_ENAHO]), tend)
    return resumen, panel, enaho_alertas(r, a24), A['prima_pct']


# ---------- sueldos de referencia y escuelas ----------

def nombre_escuela(escuela: str) -> str:
    return 'Pacífico' if 'Pac' in escuela else ('USIL' if 'USIL' in escuela else escuela)


def sueldo_antes(post: float, var_pct: float) -> float:
    """Sueldo previo al MBA reconstruido desde el posterior y la variación % publicada."""
    return post / (1 + var_pct / 100)


def postulante_top(tc: float) -> int:
    """Sueldo previo al MBA de Pacífico (AméricaEconomía 2024), en soles al mes."""
    escuelas = load('retornos/salarios_escuelas.json')['escuelas_peruanas']
    x = next(e for e in escuelas if 'Pac' in e['escuela'] and e['anio_ranking'] == ANIO_ESCUELA_TOP)
    return round(sueldo_antes(x['ingreso_mensual_post_usd'], x['variacion_pre_post_pct']) * tc)


def sueldos_ref(tc: float) -> list[Json]:
    """Sueldos de partida del gráfico de aumento necesario (ENAHO = ingreso anual / 12)."""
    r = load('retornos/enaho_prima.json')['resultados']
    u = r['por_anio'][ANIO_ENAHO]['descriptivo']['universitaria_completa']
    lima = r['cortes'][ANIO_ENAHO]['region']['lima_metropolitana']['descriptivo']['universitaria_completa']
    return [
        {'etiqueta': 'Universitario típico (Perú)', 'mensual': u['mediana_mes']},
        {'etiqueta': 'Universitario típico (Lima)', 'mensual': lima['mediana_mes']},
        {'etiqueta': 'Universitario del 25 % mejor pagado (Lima)', 'mensual': lima['p75_mes']},
        {'etiqueta': 'Postulante a escuela top (AméricaEconomía)', 'mensual': postulante_top(tc)},
    ]


def build_escuelas() -> tuple[list[Json], str | None]:
    """Sueldo antes/después por escuela peruana (rankings) + nota metodológica."""
    s = load('retornos/salarios_escuelas.json')
    out = []
    for x in s['escuelas_peruanas']:
        post, var = x.get('ingreso_mensual_post_usd'), x.get('variacion_pre_post_pct')
        if not post or var is None:
            continue
        out.append({'escuela': f"{nombre_escuela(x['escuela'])} ({x['anio_ranking']})", 'antes': round(sueldo_antes(post, var)), 'despues': post,
                    'moneda': 'US$/mes', 'anio': x['anio_ranking'], 'fuente': x['fuente'], 'fuente_url': x['url'], 'var': var})
    return sorted(out, key=lambda r: (r['escuela'].split(' (')[0], r['anio'])), s.get('nota_metodologica')


# ---------- oferta (SUNEDU) y estudios ----------

def titulo_universidad(u: str) -> str:
    """'UNIVERSIDAD DE LIMA' → 'Universidad de Lima'."""
    return u.title().replace(' De ', ' de ').replace(' Del ', ' del ').replace(' La ', ' la ')


def build_oferta() -> Json:
    o = load('retornos/oferta_grados.json')
    t = o['totales']
    return {
        'titulo': f"{t['programas_maestria_unicos']:,} maestrías en {t['universidades_con_maestria']} universidades",
        'fuente': o['fuente'], 'url': o['url_dataset'],
        'texto': (f"Con datos abiertos de SUNEDU (corte {o['fecha_corte_datos']}): {t['programas_maestria_campo_administracion_y_comercio']} maestrías del campo "
                  f"Administración y Comercio, {t['programas_tipo_mba_o_administracion_general']} de tipo MBA o administración general en {t['universidades_con_programa_tipo_mba']} universidades, "
                  f"y {t['programas_maestria_educacion_docencia']} en educación. Para licenciarse se cerraron 3,243 programas (27 % maestrías); la UCV desistió de 21 maestrías."),
        'serie': [[titulo_universidad(x['universidad']), x['programas']] for x in o['top15_universidades_maestrias_administracion_y_comercio']],
        'unidad': 'maestrías en Administración y Comercio',
        'nota': 'Son programas autorizados, no graduados: SUNEDU no publica como dato abierto los grados otorgados por universidad (habría que pedirlos por Ley 27806).',
    }


def load_estudios() -> list[Json]:
    """Estudios peruanos; cifra_clave {texto: …} se aplana a texto."""
    estudios = load('retornos/estudios.json')
    for e in estudios:
        if isinstance(e.get('cifra_clave'), dict):
            e['cifra_clave'] = e['cifra_clave'].get('texto')
    return estudios


def presets_prima(prima_enaho: float) -> list[Json]:
    """Botones de referencia de la calculadora (las dos últimas son techos, no efectos del MBA)."""
    return [
        {'etiqueta': 'Pesimista', 'valor': 0, 'tipo': 'escenario', 'fuente': 'Programa de baja calidad: el retorno es menor en programas peor rankeados y part-time (Altonji y Zhu 2025, Texas)'},
        {'etiqueta': 'EE.UU., efectos fijos', 'valor': 17, 'tipo': 'estimacion', 'fuente': 'Altonji y Zhu: 0,156 log ≈ +17 % (efectos fijos, Texas; supuestos fuertes)'},
        {'etiqueta': 'Techo: AméricaEconomía', 'valor': 44, 'tipo': 'techo', 'fuente': 'Variación pre/post autorreportada; incluye ~5 años de crecimiento normal. NO es atribuible al MBA'},
        {'etiqueta': 'Techo: ENAHO', 'valor': r0(prima_enaho), 'tipo': 'techo', 'fuente': 'Diferencia asociada a cualquier maestría/doctorado; incluye selección. NO es atribuible al MBA'},
    ]


# ---------- países ----------

def build_pe() -> Json:
    meta, raw = load_costos()
    tc = tipo_cambio(meta)
    resumen, panel, alertas, prima = build_enaho()
    escuelas, nota_escuelas = build_escuelas()
    return {
        'pais': {'code': 'pe', 'nombre': 'Perú', 'simbolo': 'S/', 'fecha': FECHA, 'fecha_texto': FECHA_TEXTO,
                 'tc_usd': tc, 'tc_fuente': meta.get('tipo_cambio_fuente') or 'Tipo de cambio usado para convertir precios en dólares',
                 'tc_url': meta.get('tipo_cambio_url') or BCRP_TC_URL},
        'programas': [build_programa(i, p, tc) for i, p in enumerate(raw)],
        'enaho_resumen': resumen, 'enaho_panel': panel,
        'salarios_escuelas': escuelas,
        'oferta': build_oferta(),
        'estudios': load_estudios(), 'alertas': alertas,
        'sueldos_ref': sueldos_ref(tc),
        'presets_prima': presets_prima(prima),
        'textos': {
            'retorno_sub': 'Sí hay una prima salarial asociada al posgrado en el Perú, y es grande. Pero no toda se debe al título: quien estudia un MBA ya ganaba más, y la evidencia indica que la parte causal depende mucho de la calidad del programa.',
            'salarios_nota': (nota_escuelas or '') + ' "Antes" se reconstruye a partir de la variación porcentual publicada.',
        },
        'metodologia': METODOLOGIA_PE,
    }


BUILDERS: dict[str, Callable[[], Json]] = {'pe': build_pe}


def build_global() -> Json:
    return {'hartley': load('hartley/hartley_2026.json'),
            'internacional': {'fuentes': load('internacional/fuentes.json'), 'series': load('internacional/series.json')}}


def main() -> None:
    (DATA / 'paises').mkdir(exist_ok=True)
    for code, build in BUILDERS.items():
        pais = build()
        write(f'paises/{code}.json', pais)
        progs = pais['programas']
        print(f"{code}: {len(progs)} programas, {sum(1 for p in progs if p['costo_soles'])} con precio; estudios {len(pais['estudios'])}")
    write('global.json', build_global())
    write('paises/index.json', {'default': 'pe', 'paises': PAISES})


if __name__ == '__main__':
    main()
