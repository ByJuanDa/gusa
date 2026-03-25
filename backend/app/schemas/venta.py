from pydantic import BaseModel
from datetime import datetime


class DetalleVentaCreate(BaseModel):
    id_llanta: int
    cantidad: int
    precio_unitario: float


class VentaCreate(BaseModel):
    detalles: list[DetalleVentaCreate]
    notas: str | None = None


class DetalleVentaOut(BaseModel):
    id: int
    id_llanta: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    llanta_codigo: str | None = None
    llanta_medida: str | None = None
    llanta_marca: str | None = None
    llanta_modelo: str | None = None

    model_config = {"from_attributes": True}


class VentaOut(BaseModel):
    id: int
    id_usuario: int | None
    usuario_nombre: str | None = None
    fecha: datetime
    total: float
    notas: str | None
    status: str
    num_items: int = 0

    model_config = {"from_attributes": True}


class VentaDetalle(VentaOut):
    detalles: list[DetalleVentaOut] = []
