#!/usr/bin/env python3
"""
Prima de ingreso laboral del POSGRADO (maestría/doctorado) vs universitaria completa
con microdatos ENAHO (INEI, Perú) — insumo del dashboard "retorno del MBA en Perú".

Fuente
------
ENAHO anual, metodología actualizada, módulo 05 "Empleo e Ingresos" (enaho01a-AAAA-500.dta).
Portal: https://proyectos.inei.gob.pe/microdatos/
Descarga directa (formato STATA):
    https://proyectos.inei.gob.pe/iinei/srienaho/descarga/STATA/<codigo>-Modulo05.zip
Códigos de encuesta verificados (nov-2026):
    2019 -> 687 | 2022 -> 784 | 2023 -> 906 | 2024 -> 966
El módulo 05 ya trae p301a (nivel educativo), así que NO hace falta el módulo 03.

Uso
---
    python3 -m venv ~/.venvs/mba-peru && ~/.venvs/mba-peru/bin/pip install pandas pyreadstat statsmodels
    ~/.venvs/mba-peru/bin/python -I etl/enaho_prima_posgrado.py \
        --raw-dir /ruta/scratch/enaho --out data/retornos/enaho_prima.json
Los zips son datos externos (no confiables): se descargan en --raw-dir (carpeta propia,
fuera del repo) y se leen sólo como datos con pyreadstat; correr Python con -I.

Definiciones clave
------------------
* Posgrado = p301a == 11 ("maestría/doctorado"); Universitaria completa = p301a == 10.
  ENAHO NO distingue maestría de doctorado, ni completo de incompleto, ni la especialidad
  (no aísla MBA).
* Ingreso laboral mensual (todas las ocupaciones, monetario + especie), construcción
  estándar INEI, valores anuales imputados/deflactados del año de la encuesta (IPC
  departamental), dividido entre 12:
      i524a1 (dependiente, ppal., monetario)  + d529t (dependiente, ppal., especie)
    + i530a  (independiente, ppal., ganancia) + d536  (independiente, ppal., autoconsumo)
    + i538a1 (dependiente, secund., monetario)+ d540t (dependiente, secund., especie)
    + i541a  (independiente, secund.)         + d543  (independiente, secund., autoconsumo)
    + d544t  (ingresos extraordinarios por trabajo)
  Variante robustez: sólo monetario ocupación principal = (i524a1 + i530a) / 12.
* Ingreso por hora = ingreso mensual / ((i513t + i518) * 52/12)  (horas semana pasada,
  todas las ocupaciones, imputadas).
* Muestra: residentes habituales ((p204==1 & p205==2) | (p204==2 & p206==1)), ocupados
  (ocu500==1), 25-64 años, p301a en {10, 11}, ingreso > 0. Factor: fac500a.
* Lima Metropolitana = dominio 8 (incluye Callao); urbano = estrato 1-5;
  público = p510 en {1,2,3}; dependiente = p507 en {3,4,6}.
* Mincer (WLS con fac500a, errores robustos HC1):
    A: log(y) ~ posgrado + edad + edad² + mujer + lima + urbano
    B: A + público + dependiente + efectos fijos de departamento (ubigeo[:2])
  prima = exp(b_posgrado) - 1.
"""
import argparse
import glob
import json
import os
import subprocess
import zipfile

import numpy as np
import pandas as pd
import pyreadstat
import statsmodels.formula.api as smf

CODIGOS = {2019: 687, 2022: 784, 2023: 906, 2024: 966}
URL = "https://proyectos.inei.gob.pe/iinei/srienaho/descarga/STATA/{c}-Modulo05.zip"

INC_COLS = ["i524a1", "d529t", "i530a", "d536", "i538a1", "d540t", "i541a", "d543", "d544t"]
COLS = ["p301a", "p208a", "p207", "p507", "p510", "p505r4", "i513t", "i518", "fac500a",
        "ubigeo", "estrato", "dominio", "ocu500", "p204", "p205", "p206"] + INC_COLS


# ------------------------------------------------------------------ descarga
def obtener_dta(anio, raw_dir):
    """Devuelve la ruta al enaho01a-AAAA-500.dta; descarga y extrae si no existe."""
    hits = glob.glob(os.path.join(raw_dir, "**", f"enaho01a-{anio}-500.dta"), recursive=True)
    if hits:
        return hits[0]
    c = CODIGOS[anio]
    dest = os.path.join(raw_dir, f"dl_{c}")
    os.makedirs(dest, exist_ok=True)
    z = os.path.join(dest, f"{c}-Modulo05.zip")
    for _ in range(3):
        r = subprocess.run(["curl", "-sS", "-L", "-A", "Mozilla/5.0", "--max-time", "600",
                            "-o", z, URL.format(c=c)])
        if r.returncode == 0 and zipfile.is_zipfile(z):
            break
    else:
        raise RuntimeError(f"No se pudo descargar {URL.format(c=c)}")
    with zipfile.ZipFile(z) as zf:
        for n in zf.namelist():
            if n.lower().endswith(f"enaho01a-{anio}-500.dta"):
                out = os.path.join(dest, os.path.basename(n))
                with zf.open(n) as src, open(out, "wb") as dst:
                    dst.write(src.read())
                return out
    raise RuntimeError("dta no encontrado en el zip")


# ------------------------------------------------------------------ utilidades
def wquantile(x, w, q=0.5):
    x, w = np.asarray(x, float), np.asarray(w, float)
    o = np.argsort(x)
    x, w = x[o], w[o]
    cw = np.cumsum(w) - 0.5 * w
    return float(np.interp(q * w.sum(), cw, x))


def r(v, d=1):
    return None if v is None or (isinstance(v, float) and np.isnan(v)) else round(float(v), d)


def preparar(path, anio):
    df, _ = pyreadstat.read_dta(path, usecols=COLS)
    for c in COLS:
        if c != "ubigeo":
            df[c] = pd.to_numeric(df[c], errors="coerce").astype(float)
    df = df[((df.p204 == 1) & (df.p205 == 2)) | ((df.p204 == 2) & (df.p206 == 1))]
    df = df[(df.ocu500 == 1) & df.p208a.between(25, 64) & df.p301a.isin([10, 11])].copy()
    df["y_mes"] = df[INC_COLS].fillna(0).sum(axis=1) / 12
    df["y_mes_ppal_monet"] = df[["i524a1", "i530a"]].fillna(0).sum(axis=1) / 12
    df = df[(df.y_mes > 0) & (df.fac500a > 0)].copy()
    horas = df[["i513t", "i518"]].astype(float).fillna(0).sum(axis=1)
    df["y_hora"] = df.y_mes / (horas.where(horas > 0) * 52 / 12)
    df["posgrado"] = (df.p301a == 11).astype(int)
    df["edad"] = df.p208a.astype(float)
    df["edad2"] = df.edad ** 2
    df["mujer"] = (df.p207 == 2).astype(int)
    df["lima"] = (df.dominio == 8).astype(int)
    df["urbano"] = (df.estrato <= 5).astype(int)
    df["publico"] = df.p510.isin([1, 2, 3]).astype(int)
    df["dependiente"] = df.p507.isin([3, 4, 6]).astype(int)
    df["dpto"] = df.ubigeo.astype(str).str.zfill(6).str[:2]
    gran = pd.to_numeric(df.p505r4, errors="coerce") // 1000
    df["ocup_gran"] = gran
    df["tramo"] = pd.cut(df.edad, [24, 34, 44, 64], labels=["25-34", "35-44", "45-64"]).astype(str)
    df["ly"] = np.log(df.y_mes)
    df["lyh"] = np.log(df.y_hora)
    df["anio"] = anio
    return df


def mincer(d, formula):
    d = d.dropna(subset=[formula.split("~")[0].strip()])
    if d.posgrado.sum() < 30 or (1 - d.posgrado).sum() < 30:
        return None
    m = smf.wls(formula, data=d, weights=d.fac500a).fit(cov_type="HC1")
    b, se = m.params["posgrado"], m.bse["posgrado"]
    return {"b": r(b, 4), "se": r(se, 4), "prima_pct": r((np.exp(b) - 1) * 100),
            "ic95_pct": [r((np.exp(b - 1.96 * se) - 1) * 100), r((np.exp(b + 1.96 * se) - 1) * 100)],
            "p_valor": r(m.pvalues["posgrado"], 4), "n": int(m.nobs), "r2": r(m.rsquared, 3)}


FA = "ly ~ posgrado + edad + edad2 + mujer + lima + urbano"
FB = FA + " + publico + dependiente + C(dpto)"


def describir(d, base_med_uni=None):
    out = {}
    for k, g in (("universitaria_completa", d[d.posgrado == 0]), ("posgrado", d[d.posgrado == 1])):
        out[k] = {"n_muestra": int(len(g)), "n_expandido": int(round(g.fac500a.sum())),
                  "mediana_mes": r(wquantile(g.y_mes, g.fac500a)) if len(g) else None,
                  "media_mes": r(np.average(g.y_mes, weights=g.fac500a)) if len(g) else None,
                  "p25_mes": r(wquantile(g.y_mes, g.fac500a, .25)) if len(g) else None,
                  "p75_mes": r(wquantile(g.y_mes, g.fac500a, .75)) if len(g) else None}
    u, p = out["universitaria_completa"], out["posgrado"]
    if u["mediana_mes"] and p["mediana_mes"]:
        out["brecha_mediana_soles"] = r(p["mediana_mes"] - u["mediana_mes"])
        out["brecha_mediana_pct"] = r((p["mediana_mes"] / u["mediana_mes"] - 1) * 100)
        out["brecha_media_soles"] = r(p["media_mes"] - u["media_mes"])
        out["brecha_media_pct"] = r((p["media_mes"] / u["media_mes"] - 1) * 100)
        # % posgraduados con ingreso < mediana de universitarios completos (mismo grupo)
        g = d[d.posgrado == 1]
        out["pct_posgrado_bajo_mediana_uni"] = r(100 * g.fac500a[g.y_mes < u["mediana_mes"]].sum() / g.fac500a.sum())
    return out


def subempleo(d):
    res = {}
    for k, g in (("universitaria_completa", d[d.posgrado == 0]), ("posgrado", d[d.posgrado == 1])):
        g = g.dropna(subset=["ocup_gran"])
        w = g.fac500a.sum()
        res[k] = {"pct_grupos_1_3_directivos_profesionales_tecnicos": r(100 * g.fac500a[g.ocup_gran.between(1, 3)].sum() / w),
                  "pct_grupos_4_9_no_profesionales": r(100 * g.fac500a[g.ocup_gran.between(4, 9)].sum() / w),
                  "pct_grupo_0_ffaa": r(100 * g.fac500a[g.ocup_gran == 0].sum() / w),
                  "n_muestra": int(len(g))}
    return res


def analizar(d):
    return {"descriptivo": describir(d),
            "mincer_mensual_A": mincer(d, FA),
            "mincer_mensual_B": mincer(d, FB),
            "mincer_hora_A": mincer(d, FA.replace("ly ~", "lyh ~")),
            "mincer_mensual_A_solo_monetario_ppal": mincer(d.assign(ly=np.log(d.y_mes_ppal_monet.where(d.y_mes_ppal_monet > 0))), FA),
            "subempleo_calificacion": subempleo(d),
            "composicion_pct": {k: {c: r(100 * np.average(g[c], weights=g.fac500a))
                                    for c in ("publico", "dependiente", "mujer", "lima", "urbano")}
                                for k, g in (("universitaria_completa", d[d.posgrado == 0]),
                                             ("posgrado", d[d.posgrado == 1]))}}


def cortes(d):
    out = {}
    defs = {"sexo": ("mujer", {0: "hombre", 1: "mujer"}),
            "region": ("lima", {1: "lima_metropolitana", 0: "resto_pais"}),
            "sector": ("publico", {1: "publico", 0: "privado"}),
            "tramo_edad": ("tramo", {"25-34": "25-34", "35-44": "35-44", "45-64": "45-64"})}
    for corte, (var, labels) in defs.items():
        out[corte] = {}
        for val, lab in labels.items():
            g = d[d[var] == val]
            f = FA.replace(f" + {var}", "") if var != "tramo" else FA
            if var == "lima" and val == 1:  # Lima Metropolitana es 100 % urbana
                f = f.replace(" + urbano", "")
            out[corte][lab] = {"descriptivo": describir(g), "mincer_mensual_A": mincer(g, f)}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--anios", default="2019,2022,2023,2024")
    a = ap.parse_args()
    anios = [int(x) for x in a.anios.split(",")]
    por_anio, cort = {}, {}
    for y in anios:
        d = preparar(obtener_dta(y, a.raw_dir), y)
        por_anio[str(y)] = analizar(d)
        cort[str(y)] = cortes(d)
        print(y, json.dumps(por_anio[str(y)]["descriptivo"], ensure_ascii=False))
        print("   A:", por_anio[str(y)]["mincer_mensual_A"])
        print("   B:", por_anio[str(y)]["mincer_mensual_B"])
    meta = {
        "fuente": "INEI, ENAHO anual (metodología actualizada), módulo 05 Empleo e Ingresos (enaho01a-AAAA-500). "
                  "https://proyectos.inei.gob.pe/microdatos/",
        "urls_descarga": {str(y): URL.format(c=CODIGOS[y]) for y in anios},
        "anios": anios,
        "fecha_proceso": pd.Timestamp.today().strftime("%Y-%m-%d"),
        "script": "etl/enaho_prima_posgrado.py",
        "definiciones": {
            "posgrado": "p301a == 11 (maestría/doctorado; no distingue completo/incompleto ni especialidad)",
            "comparador": "p301a == 10 (superior universitaria completa)",
            "muestra": "residentes habituales, ocupados (ocu500==1), 25-64 años, ingreso laboral > 0",
            "ingreso_mensual": "(i524a1+d529t+i530a+d536+i538a1+d540t+i541a+d543+d544t)/12; todas las ocupaciones, "
                               "monetario + especie, soles corrientes del año de la encuesta (imputados y deflactados "
                               "dentro del año con IPC departamental). No comparable en niveles entre años sin ajustar por inflación.",
            "ingreso_hora": "ingreso mensual / ((i513t+i518)*52/12)",
            "mincer_A": FA + " ; WLS con fac500a, errores HC1; prima = exp(b)-1",
            "mincer_B": FB + " ; idem",
            "lima": "dominio == 8 (Lima Metropolitana + Callao)",
            "urbano": "estrato 1-5",
            "publico": "p510 en {1 FFAA/PNP, 2 adm. pública, 3 empresa pública}",
            "dependiente": "p507 en {3 empleado, 4 obrero, 6 trabajador del hogar}",
            "retorno_negativo_de_facto": "% de ocupados con posgrado (ponderado) cuyo ingreso mensual < mediana de universitarios completos del mismo año/grupo",
            "subempleo_calificacion": "CNO-2015 (p505r4) gran grupo 4-9 = ocupaciones no profesionales; 1-3 = directivos/profesionales/técnicos; 0 = FFAA",
            "n_expandido": "suma de fac500a",
        },
        "variables_usadas": COLS,
        "advertencias": [
            "ENAHO no identifica la especialidad del posgrado: la prima corresponde a CUALQUIER maestría/doctorado, no al MBA.",
            "p301a==11 agrupa maestría y doctorado, y no distingue grado obtenido vs estudios incompletos/en curso.",
            "Son correlaciones condicionales, no efectos causales: hay sesgo de selección (habilidad, red, empleador que financia, sector).",
            "La especificación B controla por sector público y condición de dependiente, que son canales del propio posgrado (malos controles); usar A como titular.",
            "Ingresos autodeclarados; los altos ingresos están subcapturados en encuestas de hogares (la cola superior del MBA queda subrepresentada).",
            "Montos en soles corrientes de cada año; para comparar niveles entre años deflactar con IPC. Las primas (%) sí son comparables.",
            "Muestra de posgrado pequeña en cortes (ver n_muestra); IC95 amplios en regiones fuera de Lima.",
            "2020-2021 omitidos a propósito (pandemia: trabajo de campo telefónico y mercado laboral atípico).",
        ],
    }
    out = {"meta": meta, "resultados": {"por_anio": por_anio, "cortes": cort}}
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("ok ->", a.out)


if __name__ == "__main__":
    main()
