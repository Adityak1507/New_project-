from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class HubUserRole(str, Enum):
    VIEWER = "viewer"
    USER_MANAGER = "user_manager"
    ADMIN = "admin"

class HubUser(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    role: HubUserRole = Field(default=HubUserRole.VIEWER)
    hashed_password: str
