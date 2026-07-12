from enum import Enum
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class AuditStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    hub_user_email: str = Field(index=True)
    hub_user_role: str
    action_type: str = Field(index=True)  # e.g. CREATE_TMS_USER, UPDATE_TMS_USER, ACTIVATE_TMS_USER, DEACTIVATE_TMS_USER
    target_tms_user_id: Optional[str] = Field(default=None, index=True)
    target_tms_user_email: Optional[str] = Field(default=None)
    details: str  # JSON formatted string or detailed explanation
    status: AuditStatus = Field(default=AuditStatus.SUCCESS)
