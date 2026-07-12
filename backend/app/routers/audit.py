from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import AuditLog, HubUser, HubUserRole
from app.services.auth_service import require_roles

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Trail"])

@router.get("", dependencies=[Depends(require_roles([HubUserRole.USER_MANAGER, HubUserRole.ADMIN]))])
def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session)
):
    offset = (page - 1) * size
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())
    results = session.exec(query.offset(offset).limit(size)).all()
    total = len(session.exec(select(AuditLog)).all())
    return {
        "records": results,
        "total_count": total,
        "page": page,
        "page_size": size
    }
