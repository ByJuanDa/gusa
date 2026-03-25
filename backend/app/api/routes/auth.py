from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.usuario import LoginRequest, Token, UsuarioCreate, UsuarioOut
from app.models.usuario import Usuario
from app.core.security import hash_password, create_access_token
from app.services.auth_service import autenticar_usuario, get_usuario_actual

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    u = autenticar_usuario(db, data.usuario, data.password)
    if not u:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    token = create_access_token({"sub": str(u.id_usuario), "puesto": u.puesto.nombre})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioOut)
def perfil(u=Depends(get_usuario_actual)):
    return {
        "id_usuario": u.id_usuario,
        "nombre": u.nombre,
        "usuario": u.usuario,
        "correo": u.correo,
        "status": u.status,
        "id_puesto": u.id_puesto,
        "puesto_nombre": u.puesto.nombre,
    }
