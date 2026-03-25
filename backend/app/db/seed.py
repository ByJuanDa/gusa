"""
Crea tablas y datos base (puestos + usuario admin).
Ejecutar con: python -m app.db.seed
"""
from app.db.database import SessionLocal, engine, Base
import app.models.puesto      # noqa
import app.models.usuario     # noqa
import app.models.marca       # noqa
import app.models.llanta      # noqa
import app.models.movimiento  # noqa
from app.models.puesto import Puesto
from app.models.usuario import Usuario
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Puestos
for nombre in ["Sistemas", "Gerente General", "Encargado"]:
    if not db.query(Puesto).filter(Puesto.nombre == nombre).first():
        db.add(Puesto(nombre=nombre))
db.flush()

sistemas = db.query(Puesto).filter(Puesto.nombre == "Sistemas").first()

# Usuario
if not db.query(Usuario).filter(Usuario.usuario == "byjuanda").first():
    db.add(Usuario(
        nombre    = "Juan David Rodriguez Hernandez",
        usuario   = "byjuanda",
        password  = hash_password("JD210103"),
        correo    = "jd2921@hotmail.com",
        status    = True,
        id_puesto = sistemas.id_puesto,
    ))

db.commit()
db.close()
print("Seed completado.")
print("Usuario: byjuanda / JD210103")
