from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.db.database import get_db
from app.models.usuario import Usuario
from app.core.security import verify_password, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

ROLES_ADMIN      = {"Sistemas", "Gerente General"}             # editar + eliminar todo
ROLES_PRECIO     = {"Sistemas", "Gerente General", "Encargado"}  # editar precios
ROLES_INVENTARIO = {"Sistemas", "Gerente General", "Encargado"}  # crear/editar llantas


def autenticar_usuario(db: Session, usuario: str, password: str) -> Usuario | None:
    u = db.query(Usuario).filter(Usuario.usuario == usuario).first()
    if not u or not verify_password(password, u.password):
        return None
    if not u.status:
        return None
    return u


def get_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    u = db.query(Usuario).filter(Usuario.id_usuario == payload.get("sub")).first()
    if not u or not u.status:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return u


def require_admin(u: Usuario = Depends(get_usuario_actual)) -> Usuario:
    """Solo Sistemas y Gerente General pueden editar/eliminar todo."""
    if u.puesto.nombre not in ROLES_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol Administrador")
    return u


def require_precio(u: Usuario = Depends(get_usuario_actual)) -> Usuario:
    """Sistemas, Gerente General y Encargado pueden editar precios."""
    if u.puesto.nombre not in ROLES_PRECIO:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos para editar precios")
    return u


def require_inventario(u: Usuario = Depends(get_usuario_actual)) -> Usuario:
    """Sistemas, Gerente General y Encargado pueden crear y editar llantas."""
    if u.puesto.nombre not in ROLES_INVENTARIO:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos para gestionar inventario")
    return u


def require_reporte(u: Usuario = Depends(get_usuario_actual)) -> Usuario:
    """Sistemas, Gerente General y Encargado pueden descargar reportes."""
    if u.puesto.nombre not in ROLES_PRECIO:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos para generar reportes")
    return u


# Alias para no romper imports existentes
require_sistemas = require_admin
