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
