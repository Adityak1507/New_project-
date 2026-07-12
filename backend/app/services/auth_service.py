from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.config import settings
from app.database import get_session
from app.models import HubUser, HubUserRole
from app.utils.exceptions import RoleAccessDeniedException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def seed_default_hub_users(session: Session):
    existing_admin = session.exec(select(HubUser).where(HubUser.email == "admin@hub.com")).first()
    if not existing_admin:
        default_pwd = hash_password("password123")
        users = [
            HubUser(email="admin@hub.com", name="Hub Admin", role=HubUserRole.ADMIN, hashed_password=default_pwd),
            HubUser(email="manager@hub.com", name="Hub User Manager", role=HubUserRole.USER_MANAGER, hashed_password=default_pwd),
            HubUser(email="viewer@hub.com", name="Hub Viewer", role=HubUserRole.VIEWER, hashed_password=default_pwd),
        ]
        for u in users:
            session.add(u)
        session.commit()

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> HubUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = session.exec(select(HubUser).where(HubUser.email == email)).first()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[HubUserRole]):
    def role_checker(current_user: HubUser = Depends(get_current_user)) -> HubUser:
        if current_user.role not in allowed_roles and current_user.role != HubUserRole.ADMIN:
            raise RoleAccessDeniedException(
                f"Action restricted to roles: {[r.value for r in allowed_roles]}. Your role: {current_user.role.value}"
            )
        return current_user
    return role_checker
