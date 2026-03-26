import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.database import engine, Base
from app.api.routes import auth, llantas, usuarios, ventas, reportes

# Importar modelos para que SQLAlchemy los registre
import app.models.puesto      # noqa
import app.models.usuario     # noqa
import app.models.marca       # noqa
import app.models.llanta      # noqa
import app.models.movimiento  # noqa
import app.models.venta       # noqa

# Crear tablas
Base.metadata.create_all(bind=engine)

# Crear directorio de imágenes si no existe
os.makedirs("static/images/llantas", exist_ok=True)

# ── Auto-seed: poblar datos base si la BD está vacía ──────────
def _auto_seed():
    from app.db.database import SessionLocal
    from app.models.puesto import Puesto
    from app.models.usuario import Usuario
    from app.models.marca import Marca
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        if db.query(Puesto).count() > 0:
            return  # ya tiene datos, no hacer nada

        # Puestos
        for nombre in ["Sistemas", "Gerente General", "Encargado"]:
            db.add(Puesto(nombre=nombre))
        db.flush()

        # Marcas comunes de llantas
        marcas = [
            ("BRIDGESTONE",  "Bridgestone"),
            ("MICHELIN",     "Michelin"),
            ("GOODYEAR",     "Goodyear"),
            ("CONTINENTAL",  "Continental"),
            ("PIRELLI",      "Pirelli"),
            ("HANKOOK",      "Hankook"),
            ("DUNLOP",       "Dunlop"),
            ("COOPER",       "Cooper"),
            ("FIRESTONE",    "Firestone"),
            ("BLACKHAWK",    "Blackhawk"),
            ("TORNEL",       "Tornel"),
            ("GENERAL",      "General Tire"),
        ]
        for nombre, display in marcas:
            db.add(Marca(nombre=nombre, nombre_display=display))
        db.flush()

        # Usuario administrador
        sistemas = db.query(Puesto).filter(Puesto.nombre == "Sistemas").first()
        db.add(Usuario(
            nombre    = "Administrador",
            usuario   = "admin",
            password  = hash_password("gusa2024"),
            correo    = "admin@gusa.com",
            status    = True,
            id_puesto = sistemas.id_puesto,
        ))
        db.commit()
        print("✓ Seed inicial completado — usuario: admin / gusa2024")
    except Exception as e:
        db.rollback()
        print(f"Error en seed: {e}")
    finally:
        db.close()

_auto_seed()

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(llantas.router)
app.include_router(usuarios.router)
app.include_router(ventas.router)
app.include_router(reportes.router)


@app.get("/")
def root():
    return {"mensaje": "GUSA API funcionando"}
