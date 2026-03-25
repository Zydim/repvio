import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from models.database import User, get_db

router = APIRouter(prefix="/auth")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben.")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert.")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user = User(email=body.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    return {"email": user.email}


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch.")
    return {"email": user.email}
