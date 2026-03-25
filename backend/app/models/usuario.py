from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    usuario = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    status = Column(Boolean, default=True)
    id_puesto = Column(Integer, ForeignKey("puestos.id_puesto"), nullable=False)

    puesto = relationship("Puesto", back_populates="usuarios")
