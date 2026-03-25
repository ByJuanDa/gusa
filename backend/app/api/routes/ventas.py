from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.models.venta import Venta, DetalleVenta
from app.models.llanta import Llanta
from app.models.movimiento import MovimientoInventario, TipoMovimiento
from app.schemas.venta import VentaCreate, VentaOut, VentaDetalle, DetalleVentaOut
from app.services.auth_service import get_usuario_actual, require_admin

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


def _detalle_out(d: DetalleVenta) -> DetalleVentaOut:
    l = d.llanta
    marca = None
    if l and l.marca:
        marca = l.marca.nombre_display or l.marca.nombre
    return DetalleVentaOut(
        id=d.id,
        id_llanta=d.id_llanta,
        cantidad=d.cantidad,
        precio_unitario=d.precio_unitario,
        subtotal=d.subtotal,
        llanta_codigo=l.codigo if l else None,
        llanta_medida=l.medida if l else None,
        llanta_marca=marca,
        llanta_modelo=l.modelo if l else None,
    )


def _venta_out(v: Venta, con_detalles=False):
    base = VentaOut(
        id=v.id,
        id_usuario=v.id_usuario,
        usuario_nombre=v.usuario.nombre if v.usuario else None,
        fecha=v.fecha,
        total=v.total,
        notas=v.notas,
        status=v.status,
        num_items=sum(d.cantidad for d in v.detalles),
    )
    if con_detalles:
        return VentaDetalle(
            **base.model_dump(),
            detalles=[_detalle_out(d) for d in v.detalles],
        )
    return base


@router.get("/", response_model=list[VentaOut])
def listar_ventas(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.usuario), joinedload(Venta.detalles))
        .order_by(Venta.fecha.desc())
        .all()
    )
    return [_venta_out(v) for v in ventas]


@router.get("/{venta_id}", response_model=VentaDetalle)
def detalle_venta(venta_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    v = (
        db.query(Venta)
        .options(
            joinedload(Venta.usuario),
            joinedload(Venta.detalles).joinedload(DetalleVenta.llanta).joinedload(Llanta.marca),
        )
        .filter(Venta.id == venta_id)
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return _venta_out(v, con_detalles=True)


@router.post("/", response_model=VentaDetalle, status_code=201)
def crear_venta(data: VentaCreate, db: Session = Depends(get_db), usuario=Depends(get_usuario_actual)):
    if not data.detalles:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un producto")

    # Validar stock antes de procesar
    for item in data.detalles:
        llanta = db.query(Llanta).filter(Llanta.id == item.id_llanta).first()
        if not llanta:
            raise HTTPException(status_code=404, detail=f"Llanta {item.id_llanta} no encontrada")
        if llanta.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {llanta.codigo}: disponible {llanta.stock}, solicitado {item.cantidad}",
            )

    total = sum(i.cantidad * i.precio_unitario for i in data.detalles)

    venta = Venta(
        id_usuario=usuario.id_usuario,
        total=total,
        notas=data.notas,
        status="activa",
    )
    db.add(venta)
    db.flush()  # para obtener venta.id

    for item in data.detalles:
        llanta = db.query(Llanta).filter(Llanta.id == item.id_llanta).first()
        subtotal = item.cantidad * item.precio_unitario

        # Detalle de venta
        detalle = DetalleVenta(
            id_venta=venta.id,
            id_llanta=item.id_llanta,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=subtotal,
        )
        db.add(detalle)

        # Movimiento de salida
        mov = MovimientoInventario(
            id_llanta=item.id_llanta,
            id_usuario=usuario.id_usuario,
            tipo=TipoMovimiento.salida,
            cantidad=item.cantidad,
            costo_unitario=item.precio_unitario,
            notas=f"Venta #{venta.id}",
        )
        db.add(mov)

        # Actualizar stock
        llanta.salidas += item.cantidad
        llanta.stock   -= item.cantidad

    db.commit()

    # Recargar con relaciones
    v = (
        db.query(Venta)
        .options(
            joinedload(Venta.usuario),
            joinedload(Venta.detalles).joinedload(DetalleVenta.llanta).joinedload(Llanta.marca),
        )
        .filter(Venta.id == venta.id)
        .first()
    )
    return _venta_out(v, con_detalles=True)


@router.patch("/{venta_id}/cancelar", response_model=VentaDetalle)
def cancelar_venta(venta_id: int, db: Session = Depends(get_db), usuario=Depends(require_admin)):
    """Cancelar una venta — solo Sistemas y Gerente General. Devuelve el stock."""
    v = (
        db.query(Venta)
        .options(
            joinedload(Venta.usuario),
            joinedload(Venta.detalles).joinedload(DetalleVenta.llanta).joinedload(Llanta.marca),
        )
        .filter(Venta.id == venta_id)
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if v.status == "cancelada":
        raise HTTPException(status_code=400, detail="La venta ya está cancelada")

    # Revertir stock
    for d in v.detalles:
        llanta = db.query(Llanta).filter(Llanta.id == d.id_llanta).first()
        if llanta:
            llanta.stock   += d.cantidad
            llanta.salidas -= d.cantidad
            # Movimiento de entrada por devolución
            mov = MovimientoInventario(
                id_llanta=d.id_llanta,
                id_usuario=usuario.id_usuario,
                tipo=TipoMovimiento.entrada,
                cantidad=d.cantidad,
                notas=f"Cancelación venta #{venta_id}",
            )
            db.add(mov)

    v.status = "cancelada"
    db.commit()
    db.refresh(v)

    v = (
        db.query(Venta)
        .options(
            joinedload(Venta.usuario),
            joinedload(Venta.detalles).joinedload(DetalleVenta.llanta).joinedload(Llanta.marca),
        )
        .filter(Venta.id == venta_id)
        .first()
    )
    return _venta_out(v, con_detalles=True)
