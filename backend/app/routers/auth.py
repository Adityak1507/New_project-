from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel
from app.database import get_session
from app.models import HubUser
from app.services.auth_service import verify_password, create_access_token, get_current_user, seed_default_hub_users

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # Ensure default accounts exist
    seed_default_hub_users(session)

    user = session.exec(select(HubUser).where(HubUser.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
    }

@router.get("/me")
def get_me(current_user: HubUser = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value
    }

@router.post("/seed")
def seed_users(session: Session = Depends(get_session)):
    seed_default_hub_users(session)
    return {"message": "Default Hub Users seeded successfully."}
