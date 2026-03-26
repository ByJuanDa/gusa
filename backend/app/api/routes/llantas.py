from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.models.llanta import Llanta
from app.models.marca import Marca
from app.models.movimiento import MovimientoInventario, TipoMovimiento
from app.models.usuario import Usuario
from app.schemas.llanta import (
    LlantaCreate, LlantaUpdate, LlantaPublica, LlantaInventario,
    MovimientoCreate, MovimientoOut, MovimientoDetalle, MarcaOut, PrecioUpdate,
    PedidoCreate, PedidoResultado, ItemPedidoResultado,
)
from app.services.auth_service import get_usuario_actual, require_admin, require_precio
import os, uuid, shutil

UPLOAD_DIR = "static/images/llantas"

router = APIRouter(prefix="/api/llantas", tags=["Llantas"])


# ── MARCAS ───────────────────────────────────────────────────

@router.get("/marcas", response_model=list[MarcaOut])
def listar_marcas(db: Session = Depends(get_db)):
    return db.query(Marca).order_by(Marca.nombre).all()


# ── CATÁLOGO PÚBLICO ─────────────────────────────────────────

@router.get("/catalogo", response_model=list[LlantaPublica])
def catalogo_publico(db: Session = Depends(get_db)):
    llantas = (
        db.query(Llanta)
        .options(joinedload(Llanta.marca))
        .filter(Llanta.visible_catalogo == True, Llanta.stock > 0)
        .order_by(Llanta.codigo)
        .all()
    )
    result = []
    for l in llantas:
        result.append(LlantaPublica(
            id=l.id,
            codigo=l.codigo,
            medida=l.medida,
            marca_nombre=l.marca.nombre_display or l.marca.nombre if l.marca else None,
            modelo=l.modelo,
            descripcion=l.descripcion,
            imagen_url=l.imagen_url,
            precio_venta=l.precio_venta,
        ))
    return result


# ── INVENTARIO PRIVADO ───────────────────────────────────────

@router.get("/inventario", response_model=list[LlantaInventario])
def inventario(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    return (
        db.query(Llanta)
        .options(joinedload(Llanta.marca))
        .order_by(Llanta.codigo)
        .all()
    )


@router.get("/inventario/{llanta_id}", response_model=LlantaInventario)
def detalle_llanta(llanta_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    llanta = db.query(Llanta).options(joinedload(Llanta.marca)).filter(Llanta.id == llanta_id).first()
    if not llanta:
        raise HTTPException(status_code=404, detail="Llanta no encontrada")
    return llanta


@router.post("/", response_model=LlantaInventario, status_code=201)
def crear_llanta(data: LlantaCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Llanta).filter(Llanta.codigo == data.codigo).first():
        raise HTTPException(status_code=400, detail="Código ya existe")
    llanta = Llanta(**data.model_dump())
    db.add(llanta)
    db.commit()
    db.refresh(llanta)
    return llanta


@router.patch("/{llanta_id}", response_model=LlantaInventario)
def actualizar_llanta(llanta_id: int, data: LlantaUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Edición completa — solo Sistemas y Gerente General."""
    llanta = db.query(Llanta).filter(Llanta.id == llanta_id).first()
    if not llanta:
        raise HTTPException(status_code=404, detail="Llanta no encontrada")
    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(llanta, campo, valor)
    db.commit()
    db.refresh(llanta)
    return llanta


@router.patch("/{llanta_id}/precio", response_model=LlantaInventario)
def actualizar_precio(llanta_id: int, data: PrecioUpdate, db: Session = Depends(get_db), _=Depends(require_precio)):
    """Solo actualiza precios — Sistemas, Gerente General y Encargado."""
    llanta = db.query(Llanta).filter(Llanta.id == llanta_id).first()
    if not llanta:
        raise HTTPException(status_code=404, detail="Llanta no encontrada")
    llanta.costo_compra = data.costo_compra
    llanta.precio_venta = data.precio_venta
    db.commit()
    db.refresh(llanta)
    return llanta


@router.delete("/{llanta_id}", status_code=204)
def eliminar_llanta(llanta_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Eliminar — solo Sistemas y Gerente General."""
    llanta = db.query(Llanta).filter(Llanta.id == llanta_id).first()
    if not llanta:
        raise HTTPException(status_code=404, detail="Llanta no encontrada")
    db.delete(llanta)
    db.commit()


# ── MOVIMIENTOS ──────────────────────────────────────────────

@router.post("/movimiento", response_model=MovimientoOut, status_code=201)
def registrar_movimiento(
    data: MovimientoCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_actual),
):
    llanta = db.query(Llanta).filter(Llanta.id == data.id_llanta).first()
    if not llanta:
        raise HTTPException(status_code=404, detail="Llanta no encontrada")

    try:
        tipo = TipoMovimiento(data.tipo)
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo inválido: entrada | salida | ajuste")

    # Actualizar stock
    if tipo == TipoMovimiento.entrada:
        llanta.entradas += data.cantidad
        llanta.stock    += data.cantidad
    elif tipo == TipoMovimiento.salida:
        llanta.salidas += data.cantidad
        llanta.stock   -= data.cantidad
    elif tipo == TipoMovimiento.ajuste:
        llanta.stock = data.cantidad   # ajuste directo

    mov = MovimientoInventario(
        id_llanta=data.id_llanta,
        id_usuario=usuario.id_usuario,
        tipo=tipo,
        cantidad=data.cantidad,
        costo_unitario=data.costo_unitario,
        notas=data.notas,
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@router.post("/pedido", response_model=PedidoResultado, status_code=201)
def registrar_pedido(
    data: PedidoCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_actual),
):
    """Entrada masiva: registra múltiples llantas de un mismo pedido de una sola vez."""
    if not data.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos una llanta")

    # Validar que todas las llantas existan antes de procesar
    for item in data.items:
        if not db.query(Llanta).filter(Llanta.id == item.id_llanta).first():
            raise HTTPException(status_code=404, detail=f"Llanta con id {item.id_llanta} no encontrada")
        if item.cantidad < 1:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    resultados = []
    for item in data.items:
        llanta = db.query(Llanta).options(joinedload(Llanta.marca)).filter(Llanta.id == item.id_llanta).first()
        stock_anterior = llanta.stock

        llanta.entradas += item.cantidad
        llanta.stock    += item.cantidad

        notas_mov = data.notas or "Entrada de pedido"
        mov = MovimientoInventario(
            id_llanta=item.id_llanta,
            id_usuario=usuario.id_usuario,
            tipo=TipoMovimiento.entrada,
            cantidad=item.cantidad,
            costo_unitario=item.costo_unitario,
            notas=notas_mov,
        )
        db.add(mov)

        resultados.append(ItemPedidoResultado(
            id_llanta=llanta.id,
            codigo=llanta.codigo,
            marca=(llanta.marca.nombre_display or llanta.marca.nombre) if llanta.marca else None,
            modelo=llanta.modelo,
            medida=llanta.medida,
            cantidad=item.cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_anterior + item.cantidad,
            costo_unitario=item.costo_unitario,
        ))

    db.commit()

    return PedidoResultado(
        total_piezas=sum(r.cantidad for r in resultados),
        items=resultados,
        notas=data.notas,
    )


@router.get("/{llanta_id}/movimientos", response_model=list[MovimientoDetalle])
def historial_movimientos(llanta_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    movs = (
        db.query(MovimientoInventario)
        .filter(MovimientoInventario.id_llanta == llanta_id)
        .order_by(MovimientoInventario.fecha.desc())
        .all()
    )
    result = []
    for m in movs:
        u = db.query(Usuario).filter(Usuario.id_usuario == m.id_usuario).first() if m.id_usuario else None
        result.append(MovimientoDetalle(
            id=m.id,
            id_llanta=m.id_llanta,
            id_usuario=m.id_usuario,
            usuario_nombre=u.nombre if u else None,
            tipo=m.tipo.value,
            cantidad=m.cantidad,
            costo_unitario=m.costo_unitario,
            notas=m.notas,
            fecha=m.fecha,
        ))
    return result


@router.post("/{llanta_id}/imagen", response_model=LlantaInventario)
async def subir_imagen(
    llanta_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    llanta = db.query(Llanta).options(joinedload(Llanta.marca)).filter(Llanta.id == llanta_id).first()
    if not llanta:
        raise HTTPException(status_code=404, detail="Llanta no encontrada")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Solo jpg, png o webp")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Borrar imagen anterior
    if llanta.imagen_url:
        old = llanta.imagen_url.lstrip("/")
        if os.path.exists(old):
            os.remove(old)
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    llanta.imagen_url = f"/static/images/llantas/{filename}"
    db.commit()
    db.refresh(llanta)
    return llanta
