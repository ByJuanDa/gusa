"""
Importa el inventario desde el Excel de GUSA.

Uso:
    python -m app.db.import_excel /home/juanda/Downloads/"GUSA INVENTARIO OFICIAL 2023-2024.xlsx"
"""
import sys
import re
import pandas as pd
from app.db.database import SessionLocal, engine, Base
import app.models.puesto      # noqa
import app.models.usuario     # noqa
import app.models.marca       # noqa
import app.models.llanta      # noqa
import app.models.movimiento  # noqa
from app.models.marca import Marca
from app.models.llanta import Llanta

Base.metadata.create_all(bind=engine)

# ── Corrección de nombres de marcas (typos del Excel) ────────
MARCAS_NORMALIZADAS = {
    # BLACKHAWK variantes
    "BLACHAWK":    "BLACKHAWK",
    "BLACHAWL":    "BLACKHAWK",
    "BLACKWAHK":   "BLACKHAWK",
    "BLACKHAW":    "BLACKHAWK",
    "BLACKHAK":    "BLACKHAWK",
    # TORNEL variantes
    "TORNRL":      "TORNEL",
    "ORNEL":       "TORNEL",   # T recortado al parsear
    # MIRAGE variantes
    "IRAGE":       "MIRAGE",   # M recortado al parsear
    "MIRAGE-MR-166": "MIRAGE",
    # PIRELLI variantes
    "IRELLI":      "PIRELLI",  # P recortado
    # ATLAS variantes
    "TLAS":        "ATLAS",    # A recortado
    # MAXTREK variantes
    "MQXTREK":     "MAXTREK",
    "MAXTRK":      "MAXTREK",
    "AXTREK":      "MAXTREK",  # M recortado
    # MAZZINI variantes
    "AZZINI":      "MAZZINI",  # M recortado
    # MASTERCRAFT variantes
    "MASTERCREFT": "MASTERCRAFT",
    "ASTERCRAFT":  "MASTERCRAFT",
    "ASTERCREFT":  "MASTERCRAFT",
    # HAIDA variantes
    "AIDA":        "HAIDA",    # H recortado
    # SAFERICH variantes
    "AFERICH":     "SAFERICH", # S recortado
    # KELLY variantes
    "ELLY":        "KELLY",    # K recortado
    # WINRUN variantes
    "INRUN":       "WINRUN",   # W recortado
    # ANTARES variantes
    "NTARES":      "ANTARES",  # A recortado
    "ANTAERES":    "ANTARES",
    # AGATE variantes
    "GATE":        "AGATE",    # A recortado
    # SPORTRAK variantes
    "PORTRAK":     "SPORTRAK", # S recortado
    # Otros
    "COMSPALA":    "COSPALA",
    "GOODYEARD":   "GOODYEAR",
    "DUOBLEKING":  "DOUBLEKING",
    "SAULIN":      "SAILUN",
    "FORCELAD":    "FORCELAND",
    "FORCEAD":     "FORCELAND",
    "KHUMO":       "KUMHO",
    "CMICHELLIN":  "MICHELIN",
    "FRONWAY+B217":"FRONWAY",
    "LUISTONE":    "LAUFENN",
    "C":           "DESCONOCIDA",
}

# Nombre bonito para mostrar al público
NOMBRE_DISPLAY = {
    "BLACKHAWK":   "Blackhawk",
    "TORNEL":      "Tornel",
    "MIRAGE":      "Mirage",
    "BRIDGESTONE": "Bridgestone",
    "MICHELIN":    "Michelin",
    "CONTINENTAL": "Continental",
    "PIRELLI":     "Pirelli",
    "HANKOOK":     "Hankook",
    "GOODYEAR":    "Goodyear",
    "MAXTREK":     "Maxtrek",
    "ATLAS":       "Atlas",
    "BLACKHAWK":   "Blackhawk",
    "SAILUN":      "Sailun",
    "COSPALA":     "Cospala",
    "MAZZINI":     "Mazzini",
    "AGATE":       "Agate",
    "ILINK":       "iLink",
    "FARROAD":     "Farroad",
    "KUMHO":       "Kumho",
    "DOUBLEKING":  "Doubleking",
    "MASTERCRAFT": "Mastercraft",
    "FORCELAND":   "Forceland",
    "SURETRAC":    "Suretrac",
    "ANTARES":     "Antares",
    "WINRUN":      "Winrun",
    "HAIDA":       "Haida",
    "JK":          "JK Tyre",
    "KELLY":       "Kelly",
    "KAPSEN":      "Kapsen",
    "SUMITOMO":    "Sumitomo",
    "ACRON":       "Acron",
}


def normalizar_marca(nombre: str) -> str:
    nombre = nombre.upper().strip()
    return MARCAS_NORMALIZADAS.get(nombre, nombre)


def normalizar_medida(medida_raw: str) -> str:
    """Convierte 205-60-13 → 205/60R13"""
    m = medida_raw.strip().upper()
    # Patrón estándar: ancho-perfil-rin
    match = re.match(r'^(\d+)[xX\-](\d+)[xX\-](\d+\.?\d*)([CcRr]?)$', m)
    if match:
        ancho, perfil, rin, sufijo = match.groups()
        sufijo = sufijo.upper()
        if sufijo == 'C':
            return f"{ancho}/{perfil}R{rin}C"
        return f"{ancho}/{perfil}R{rin}"
    return m  # si no matchea dejar como está


def parsear_descripcion(desc: str):
    """
    Recibe: '205-60-13 TORNEL TURBO'
    Retorna: (medida_raw, marca, modelo)
    """
    desc = desc.strip()
    if not desc:
        return None, None, None

    # Regex para capturar la medida al inicio
    # Solo acepta C o R como sufijo de llanta, NO otras letras (evita robar la inicial de la marca)
    patron = re.compile(
        r'^([\d]+[\d\-xXrR./]*[0-9][CcRr]?(?:\s?[0-9]+[Cc]?)?)',
        re.IGNORECASE,
    )
    match = patron.match(desc)

    if match:
        medida_raw = match.group(1).strip().rstrip('-')
        resto = desc[len(match.group(1)):].strip()
    else:
        medida_raw = ''
        resto = desc

    partes = resto.split()
    if not partes:
        return medida_raw, 'DESCONOCIDA', None

    marca  = normalizar_marca(partes[0])
    modelo = ' '.join(partes[1:]).strip() or None

    return medida_raw, marca, modelo


def get_o_crear_marca(db, nombre: str) -> Marca:
    nombre = nombre.upper().strip()
    marca = db.query(Marca).filter(Marca.nombre == nombre).first()
    if not marca:
        display = NOMBRE_DISPLAY.get(nombre, nombre.capitalize())
        marca = Marca(nombre=nombre, nombre_display=display)
        db.add(marca)
        db.flush()
    return marca


def importar(ruta_excel: str):
    print(f"\nLeyendo: {ruta_excel}")
    df = pd.read_excel(ruta_excel, header=3)
    df.columns = df.columns.str.strip()

    # Renombrar columnas
    df = df.rename(columns={
        'Codigo Producto': 'codigo',
        'Descripción':     'descripcion_raw',
        'Entradas':        'entradas',
        'Salidas':         'salidas',
        'Stock Actual':    'stock',
        'Costo de compra': 'costo_compra',
        'Precio de venta': 'precio_venta',
    })

    # Filtrar solo filas válidas (código LL + número)
    df = df[df['codigo'].astype(str).str.match(r'^LL\d+$')]
    df = df.fillna(0)

    db = SessionLocal()
    insertados = 0
    omitidos   = 0
    errores    = []

    for _, fila in df.iterrows():
        codigo = str(fila['codigo']).strip()
        desc   = str(fila['descripcion_raw']).strip()

        if not desc or desc == '0':
            omitidos += 1
            continue

        medida_raw, marca_nombre, modelo = parsear_descripcion(desc)

        if not medida_raw or not marca_nombre:
            errores.append(f"{codigo}: no se pudo parsear '{desc}'")
            omitidos += 1
            continue

        medida = normalizar_medida(medida_raw)

        try:
            # Saltar si ya existe
            if db.query(Llanta).filter(Llanta.codigo == codigo).first():
                omitidos += 1
                continue

            marca_obj = get_o_crear_marca(db, marca_nombre)

            stock_val = int(fila['stock'])
            # Normalizar stocks negativos a 0 (errores de datos en el Excel)
            if stock_val < 0:
                stock_val = 0

            llanta = Llanta(
                codigo       = codigo,
                medida       = medida,
                id_marca     = marca_obj.id_marca,
                modelo       = modelo,
                entradas     = int(fila['entradas']),
                salidas      = int(fila['salidas']),
                stock        = stock_val,
                costo_compra = float(fila['costo_compra']),
                precio_venta = round(float(fila['precio_venta']), 2),
                visible_catalogo = True,
            )
            db.add(llanta)
            insertados += 1

        except Exception as e:
            errores.append(f"{codigo}: {e}")
            omitidos += 1

    db.commit()
    db.close()

    print(f"\n✓ Importación completada")
    print(f"  Insertadas : {insertados}")
    print(f"  Omitidas   : {omitidos}")
    if errores:
        print(f"\n  Advertencias ({len(errores)}):")
        for e in errores:
            print(f"    - {e}")


if __name__ == "__main__":
    ruta = sys.argv[1] if len(sys.argv) > 1 else (
        '/home/juanda/Downloads/GUSA INVENTARIO OFICIAL 2023-2024.xlsx'
    )
    importar(ruta)
