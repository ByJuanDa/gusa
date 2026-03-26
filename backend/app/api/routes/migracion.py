"""
Endpoint temporal de migración — ELIMINAR después de usarlo.
POST /api/admin/import?token=<IMPORT_SECRET>
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.marca import Marca
from app.models.llanta import Llanta
from app.models.usuario import Usuario
from app.models.puesto import Puesto

router = APIRouter(prefix="/api/admin", tags=["admin"])

IMPORT_SECRET = os.environ.get("IMPORT_SECRET", "migrar-gusa-2024")


@router.post("/import")
def importar_datos(payload: dict, token: str, db: Session = Depends(get_db)):
    if token != IMPORT_SECRET:
        raise HTTPException(status_code=403, detail="Token inválido")

    # ── 1. Marcas ──────────────────────────────────────────────
    # Mapeo: id_marca original → id_marca en la BD de destino
    marca_id_map: dict[int, int] = {}

    for m in payload.get("marcas", []):
        existing = db.query(Marca).filter(Marca.nombre == m["nombre"]).first()
        if existing:
            marca_id_map[m["id_marca"]] = existing.id_marca
        else:
            nueva = Marca(nombre=m["nombre"], nombre_display=m.get("nombre_display"))
            db.add(nueva)
            db.flush()
            marca_id_map[m["id_marca"]] = nueva.id_marca

    # ── 2. Llantas ─────────────────────────────────────────────
    inserted_llantas = 0
    skipped_llantas = 0
    for ll in payload.get("llantas", []):
        # Saltar si ya existe ese código
        existing = db.query(Llanta).filter(Llanta.codigo == ll["codigo"]).first()
        if existing:
            # Actualizar imagen_url si el export trae una y la BD no tiene
            if ll.get("imagen_url") and not existing.imagen_url:
                existing.imagen_url = ll["imagen_url"]
            skipped_llantas += 1
            continue

        nueva_id_marca = marca_id_map.get(ll["id_marca"])
        if not nueva_id_marca:
            continue  # marca no encontrada, saltar

        nueva_ll = Llanta(
            codigo=ll["codigo"],
            medida=ll["medida"],
            id_marca=nueva_id_marca,
            modelo=ll.get("modelo"),
            descripcion=ll.get("descripcion"),
            entradas=ll.get("entradas", 0),
            salidas=ll.get("salidas", 0),
            stock=ll.get("stock", 0),
            costo_compra=ll.get("costo_compra", 0),
            precio_venta=ll.get("precio_venta", 0),
            imagen_url=ll.get("imagen_url"),
            visible_catalogo=bool(ll.get("visible_catalogo", True)),
        )
        db.add(nueva_ll)
        inserted_llantas += 1

    # ── 3. Usuarios ────────────────────────────────────────────
    inserted_usuarios = 0
    skipped_usuarios = 0
    for u in payload.get("usuarios", []):
        if db.query(Usuario).filter(Usuario.usuario == u["usuario"]).first():
            skipped_usuarios += 1
            continue

        # Resolver puesto por nombre
        puesto_obj = db.query(Puesto).filter(Puesto.nombre == u.get("puesto_nombre", "")).first()
        if not puesto_obj:
            skipped_usuarios += 1
            continue

        nuevo_u = Usuario(
            nombre=u["nombre"],
            usuario=u["usuario"],
            password=u["password"],  # ya hasheado
            correo=u.get("correo"),
            status=u.get("status", True),
            id_puesto=puesto_obj.id_puesto,
        )
        db.add(nuevo_u)
        inserted_usuarios += 1

    db.commit()

    return {
        "ok": True,
        "marcas_mapeadas": len(marca_id_map),
        "llantas_insertadas": inserted_llantas,
        "llantas_omitidas": skipped_llantas,
        "usuarios_insertados": inserted_usuarios,
        "usuarios_omitidos": skipped_usuarios,
    }
