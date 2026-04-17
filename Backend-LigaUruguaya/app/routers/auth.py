from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.User import User
from app.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# ── Configuración JWT ─────────────────────────────────────────────────────────

SECRET_KEY                  = settings.SECRET_KEY
ALGORITHM                   = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer()


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str


# ── Helpers internos ──────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    return pwd_context.hash(password)

def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def _create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


# ── Dependencia reutilizable: obtener usuario autenticado ─────────────────────
#
# Usala en cualquier endpoint que requiera login:
#   from app.routers.auth import get_current_user
#   current_user: User = Depends(get_current_user)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token   = credentials.credentials  # ← extrae el token del header
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Registro abierto. Devuelve el usuario creado (sin password)."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    user = User(
        email=data.email,
        hashed_password=_hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login con email y password. Devuelve un JWT Bearer token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not _verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(
        access_token=_create_access_token(user.id),
        token_type="bearer",
    )