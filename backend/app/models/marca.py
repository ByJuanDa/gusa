from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base


class Marca(Base):
    __tablename__ = "marcas"

    id_marca  = Column(Integer, primary_key=True, index=True)
    nombre    = Column(String, unique=True, nullable=False)   # BLACKHAWK, MICHELIN…
    nombre_display = Column(String, nullable=True)            # nombre limpio para mostrar

    llantas = relationship("Llanta", back_populates="marca")
