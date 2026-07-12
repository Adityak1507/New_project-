import json
from typing import Optional, Any
from sqlmodel import Session
from app.models import AuditLog, AuditStatus

def log_audit_action(
    session: Session,
    hub_user_email: str,
    hub_user_role: str,
    action_type: str,
    target_tms_user_id: Optional[str] = None,
    target_tms_user_email: Optional[str] = None,
    details: Any = "",
    status: AuditStatus = AuditStatus.SUCCESS
):
    if isinstance(details, (dict, list)):
        details_str = json.dumps(details)
    else:
        details_str = str(details)

    entry = AuditLog(
        hub_user_email=hub_user_email,
        hub_user_role=hub_user_role,
        action_type=action_type,
        target_tms_user_id=target_tms_user_id,
        target_tms_user_email=target_tms_user_email,
        details=details_str,
        status=status
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry
