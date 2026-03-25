from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class TipoMovimiento(str, enum.Enum):
    entrada = "entrada"
    salida  = "salida"
    ajuste  = "ajuste"


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id          = Column(Integer, primary_key=True, index=True)
    id_llanta   = Column(Integer, ForeignKey("llantas.id"), nullable=False)
    id_usuario  = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    tipo        = Column(Enum(TipoMovimiento), nullable=False)
    cantidad    = Column(Integer, nullable=False)
    costo_unitario = Column(Float, nullable=True)   # precio en ese momento
    notas       = Column(String, nullable=True)
    fecha       = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    llanta  = relationship("Llanta", back_populates="movimientos")
    usuario = relationship("Usuario", foreign_keys=[id_usuario])
