from pydantic import BaseModel, EmailStr


class UsuarioCreate(BaseModel):
    nombre: str
    usuario: str
    password: str
    correo: EmailStr
    id_puesto: int
    status: bool = True


class UsuarioOut(BaseModel):
    id_usuario: int
    nombre: str
    usuario: str
    correo: str
    status: bool
    id_puesto: int
    puesto_nombre: str | None = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    usuario: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
