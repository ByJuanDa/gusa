from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Llanta(Base):
    __tablename__ = "llantas"

    id            = Column(Integer, primary_key=True, index=True)
    codigo        = Column(String, unique=True, index=True, nullable=False)  # LL001
    medida        = Column(String, nullable=False)   # 205/60R13
    id_marca      = Column(Integer, ForeignKey("marcas.id_marca"), nullable=False)
    modelo        = Column(String, nullable=True)    # TURBO, REAL, Edge Touring…
    descripcion   = Column(String, nullable=True)    # texto libre para catálogo

    # Inventario
    entradas      = Column(Integer, default=0)
    salidas       = Column(Integer, default=0)
    stock         = Column(Integer, default=0)       # stock_actual del Excel

    # Precios
    costo_compra  = Column(Float, nullable=False, default=0)
    precio_venta  = Column(Float, nullable=False, default=0)

    # Catálogo público
    imagen_url        = Column(String, nullable=True)
    visible_catalogo  = Column(Boolean, default=True)

    # Auditoría
    creado_en     = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    marca       = relationship("Marca", back_populates="llantas")
    movimientos = relationship("MovimientoInventario", back_populates="llanta", lazy="dynamic")
