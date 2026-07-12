from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlmodel import Session
from typing import Optional
from app.database import get_session
from app.models import HubUser, HubUserRole, AuditStatus
from app.models.tms_schemas import PaginatedTMSUsers, TMSUserResponse, TMSUserCreateRequest, TMSUserUpdateRequest
from app.services.auth_service import get_current_user, require_roles
from app.services.audit_service import log_audit_action
from app.services.tms_client import get_tms_client, ITMSClient
from app.utils.exceptions import TMSException, CompanyAdminProtectedException

router = APIRouter(prefix="/api/tms-users", tags=["TMS Users"])

@router.get("", response_model=PaginatedTMSUsers)
def list_tms_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by name, email, designation"),
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: Optional[str] = Query(None),
    client: ITMSClient = Depends(get_tms_client),
    current_user: HubUser = Depends(get_current_user)
):
    return client.list_users(page=page, size=size, search=search, status_filter=status_filter, sort_by=sort_by)

@router.get("/products/available", dependencies=[Depends(get_current_user)])
def get_available_products(client: ITMSClient = Depends(get_tms_client)):
    return {"products": client.list_available_products()}

@router.get("/roles/available", dependencies=[Depends(get_current_user)])
def get_available_roles(client: ITMSClient = Depends(get_tms_client)):
    return {"roles": client.list_available_roles()}

@router.get("/{user_id}", response_model=TMSUserResponse)
def get_tms_user(
    user_id: str,
    client: ITMSClient = Depends(get_tms_client),
    current_user: HubUser = Depends(get_current_user)
):
    user = client.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"TMS User '{user_id}' not found.")
    return user

@router.post("", response_model=TMSUserResponse, dependencies=[Depends(require_roles([HubUserRole.USER_MANAGER, HubUserRole.ADMIN]))])
def create_tms_user(
    data: TMSUserCreateRequest,
    session: Session = Depends(get_session),
    client: ITMSClient = Depends(get_tms_client),
    current_user: HubUser = Depends(get_current_user)
):
    try:
        new_user = client.create_user(data)
        log_audit_action(
            session=session,
            hub_user_email=current_user.email,
            hub_user_role=current_user.role.value,
            action_type="CREATE_TMS_USER",
            target_tms_user_id=new_user.id,
            target_tms_user_email=new_user.identity.email,
            details={"display_name": new_user.identity.display_name, "company": new_user.organization.company},
            status=AuditStatus.SUCCESS
        )
        return new_user
    except Exception as e:
        log_audit_action(
            session=session,
            hub_user_email=current_user.email,
            hub_user_role=current_user.role.value,
            action_type="CREATE_TMS_USER",
            target_tms_user_id=None,
            target_tms_user_email=data.identity.email,
            details=str(e),
            status=AuditStatus.FAILURE
        )
        if isinstance(e, (HTTPException, TMSException, CompanyAdminProtectedException)):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to create TMS user: {str(e)}")

@router.patch("/{user_id}", response_model=TMSUserResponse, dependencies=[Depends(require_roles([HubUserRole.USER_MANAGER, HubUserRole.ADMIN]))])
def update_tms_user(
    user_id: str,
    data: TMSUserUpdateRequest,
    session: Session = Depends(get_session),
    client: ITMSClient = Depends(get_tms_client),
    current_user: HubUser = Depends(get_current_user)
):
    try:
        updated_user = client.update_user(user_id, data)
        log_audit_action(
            session=session,
            hub_user_email=current_user.email,
            hub_user_role=current_user.role.value,
            action_type="UPDATE_TMS_USER",
            target_tms_user_id=updated_user.id,
            target_tms_user_email=updated_user.identity.email,
            details=data.model_dump(exclude_unset=True),
            status=AuditStatus.SUCCESS
        )
        return updated_user
    except Exception as e:
        log_audit_action(
            session=session,
            hub_user_email=current_user.email,
            hub_user_role=current_user.role.value,
            action_type="UPDATE_TMS_USER",
            target_tms_user_id=user_id,
            details=str(e),
            status=AuditStatus.FAILURE
        )
        if isinstance(e, (HTTPException, TMSException, CompanyAdminProtectedException)):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to update TMS user: {str(e)}")

@router.post("/{user_id}/status", response_model=TMSUserResponse, dependencies=[Depends(require_roles([HubUserRole.USER_MANAGER, HubUserRole.ADMIN]))])
def change_user_status(
    user_id: str,
    active: bool = Query(..., description="True for Active, False for Inactive"),
    session: Session = Depends(get_session),
    client: ITMSClient = Depends(get_tms_client),
    current_user: HubUser = Depends(get_current_user)
):
    action_type = "ACTIVATE_TMS_USER" if active else "DEACTIVATE_TMS_USER"
    try:
        result = client.change_status(user_id, active)
        log_audit_action(
            session=session,
            hub_user_email=current_user.email,
            hub_user_role=current_user.role.value,
            action_type=action_type,
            target_tms_user_id=result.id,
            target_tms_user_email=result.identity.email,
            details=f"Status changed to {result.status}",
            status=AuditStatus.SUCCESS
        )
        return result
    except Exception as e:
        log_audit_action(
            session=session,
            hub_user_email=current_user.email,
            hub_user_role=current_user.role.value,
            action_type=action_type,
            target_tms_user_id=user_id,
            details=str(e),
            status=AuditStatus.FAILURE
        )
        if isinstance(e, (HTTPException, TMSException, CompanyAdminProtectedException)):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to change status: {str(e)}")
