from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base


class Puesto(Base):
    __tablename__ = "puestos"

    id_puesto = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)

    usuarios = relationship("Usuario", back_populates="puesto")
