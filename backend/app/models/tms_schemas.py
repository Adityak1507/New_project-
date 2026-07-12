from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class IdentityGroup(BaseModel):
    salutation: Optional[str] = "Mr."
    display_name: str
    first_name: str
    last_name: str
    email: EmailStr
    designation: str
    reporting_manager: str
    user_initials: Optional[str] = ""

class OrganizationGroup(BaseModel):
    company: str
    business_unit: str
    department: str
    cost_center: str
    location: str

class AccessGroup(BaseModel):
    products_assigned: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    account_status: str = "Unlocked"
    unique_keys: List[str] = Field(default_factory=list)

class PreferencesGroup(BaseModel):
    timezone: str = "UTC"
    date_format: str = "DD/MM/YYYY"
    number_format: str = "1,234.56"

class UserLevelLimitsGroup(BaseModel):
    purchase_limit: Optional[str] = ""
    requisition_approval_limit: Optional[str] = ""
    invoice_approval_limit: Optional[str] = ""
    approval_currency: Optional[str] = "USD"

class TMSUserResponse(BaseModel):
    id: str
    identity: IdentityGroup
    organization: OrganizationGroup
    access: AccessGroup
    preferences: PreferencesGroup
    limits: Optional[UserLevelLimitsGroup] = Field(default_factory=UserLevelLimitsGroup)
    status: str = "Active"  # "Active" or "Inactive"
    last_login: str = "Never"
    travel_policy: bool = False

class TMSUserCreateRequest(BaseModel):
    identity: IdentityGroup
    organization: OrganizationGroup
    access: AccessGroup
    preferences: Optional[PreferencesGroup] = Field(default_factory=PreferencesGroup)
    limits: Optional[UserLevelLimitsGroup] = Field(default_factory=UserLevelLimitsGroup)

class TMSUserUpdateRequest(BaseModel):
    identity: Optional[Dict[str, Any]] = None
    organization: Optional[Dict[str, Any]] = None
    access: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    travel_policy: Optional[bool] = None

class PaginatedTMSUsers(BaseModel):
    records: List[TMSUserResponse]
    total_count: int
    page: int
    page_size: int
