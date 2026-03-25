from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.db.database import get_db
from app.models.usuario import Usuario
from app.models.puesto import Puesto
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.core.security import hash_password
from app.services.auth_service import require_admin

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


class PasswordUpdate(BaseModel):
    password: str


def _out(u: Usuario) -> dict:
    return {
        "id_usuario": u.id_usuario,
        "nombre": u.nombre,
        "usuario": u.usuario,
        "correo": u.correo,
        "status": u.status,
        "id_puesto": u.id_puesto,
        "puesto_nombre": u.puesto.nombre if u.puesto else None,
    }


@router.get("/puestos")
def listar_puestos(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Puesto).order_by(Puesto.nombre).all()


@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), _=Depends(require_admin)):
    usuarios = (
        db.query(Usuario)
        .options(joinedload(Usuario.puesto))
        .order_by(Usuario.nombre)
        .all()
    )
    return [_out(u) for u in usuarios]


@router.post("/", response_model=UsuarioOut, status_code=201)
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Usuario).filter(Usuario.usuario == data.usuario).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    if db.query(Usuario).filter(Usuario.correo == data.correo).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    nuevo = Usuario(
        nombre=data.nombre,
        usuario=data.usuario,
        password=hash_password(data.password),
        correo=data.correo,
        id_puesto=data.id_puesto,
        status=data.status,
    )
    db.add(nuevo)
    db.commit()
    u = db.query(Usuario).options(joinedload(Usuario.puesto)).filter(Usuario.id_usuario == nuevo.id_usuario).first()
    return _out(u)


@router.patch("/{usuario_id}/status", response_model=UsuarioOut)
def cambiar_status(usuario_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.query(Usuario).options(joinedload(Usuario.puesto)).filter(Usuario.id_usuario == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u.status = not u.status
    db.commit()
    db.refresh(u)
    u = db.query(Usuario).options(joinedload(Usuario.puesto)).filter(Usuario.id_usuario == usuario_id).first()
    return _out(u)


@router.patch("/{usuario_id}/password")
def cambiar_password(
    usuario_id: int,
    data: PasswordUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    u = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if len(data.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")
    u.password = hash_password(data.password.strip())
    db.commit()
    return {"ok": True}
