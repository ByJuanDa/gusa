from pydantic import BaseModel
from datetime import datetime


# ── Marca ────────────────────────────────────────────────────
class MarcaOut(BaseModel):
    id_marca: int
    nombre: str
    nombre_display: str | None

    model_config = {"from_attributes": True}


# ── Llanta ───────────────────────────────────────────────────
class LlantaBase(BaseModel):
    codigo: str
    medida: str
    id_marca: int
    modelo: str | None = None
    descripcion: str | None = None
    entradas: int = 0
    salidas: int = 0
    stock: int = 0
    costo_compra: float = 0
    precio_venta: float = 0
    imagen_url: str | None = None
    visible_catalogo: bool = True


class LlantaCreate(LlantaBase):
    pass


class LlantaUpdate(BaseModel):
    medida: str | None = None
    id_marca: int | None = None
    modelo: str | None = None
    descripcion: str | None = None
    stock: int | None = None
    costo_compra: float | None = None
    precio_venta: float | None = None
    imagen_url: str | None = None
    visible_catalogo: bool | None = None


# Vista pública (catálogo sin precios)
class LlantaPublica(BaseModel):
    id: int
    codigo: str
    medida: str
    marca_nombre: str | None = None
    modelo: str | None = None
    descripcion: str | None = None
    imagen_url: str | None = None

    model_config = {"from_attributes": True}


# Vista completa (inventario empleados)
class LlantaInventario(BaseModel):
    id: int
    codigo: str
    medida: str
    marca: MarcaOut | None = None
    modelo: str | None = None
    descripcion: str | None = None
    entradas: int
    salidas: int
    stock: int
    costo_compra: float
    precio_venta: float
    visible_catalogo: bool
    creado_en: datetime | None = None

    model_config = {"from_attributes": True}


# ── Movimiento ───────────────────────────────────────────────
class PrecioUpdate(BaseModel):
    costo_compra: float
    precio_venta: float


class MovimientoCreate(BaseModel):
    id_llanta: int
    tipo: str          # entrada | salida | ajuste
    cantidad: int
    costo_unitario: float | None = None
    notas: str | None = None


class MovimientoOut(BaseModel):
    id: int
    id_llanta: int
    tipo: str
    cantidad: int
    costo_unitario: float | None
    notas: str | None
    fecha: datetime

    model_config = {"from_attributes": True}


class MovimientoDetalle(MovimientoOut):
    id_usuario: int | None = None
    usuario_nombre: str | None = None


# ── Pedido / entrada masiva ───────────────────────────────────
class ItemPedido(BaseModel):
    id_llanta: int
    cantidad: int
    costo_unitario: float | None = None


class PedidoCreate(BaseModel):
    items: list[ItemPedido]
    notas: str | None = None          # ej: "Pedido Bridgestone factura #123"


class ItemPedidoResultado(BaseModel):
    id_llanta: int
    codigo: str
    marca: str | None = None
    modelo: str | None = None
    medida: str
    cantidad: int
    stock_anterior: int
    stock_nuevo: int
    costo_unitario: float | None = None


class PedidoResultado(BaseModel):
    total_piezas: int
    items: list[ItemPedidoResultado]
    notas: str | None = None
