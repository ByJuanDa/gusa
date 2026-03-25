from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Venta(Base):
    __tablename__ = "ventas"

    id          = Column(Integer, primary_key=True, index=True)
    id_usuario  = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    fecha       = Column(DateTime(timezone=True), server_default=func.now())
    total       = Column(Float, default=0)
    notas       = Column(String, nullable=True)
    status      = Column(String, default="activa")   # activa | cancelada

    usuario  = relationship("Usuario")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")


class DetalleVenta(Base):
    __tablename__ = "detalles_venta"

    id               = Column(Integer, primary_key=True, index=True)
    id_venta         = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    id_llanta        = Column(Integer, ForeignKey("llantas.id"), nullable=False)
    cantidad         = Column(Integer, nullable=False)
    precio_unitario  = Column(Float, nullable=False)
    subtotal         = Column(Float, nullable=False)

    venta  = relationship("Venta", back_populates="detalles")
    llanta = relationship("Llanta")
