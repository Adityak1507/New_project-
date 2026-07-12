import json
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.tms_schemas import (
    TMSUserResponse,
    IdentityGroup,
    OrganizationGroup,
    AccessGroup,
    PreferencesGroup,
    UserLevelLimitsGroup
)

class TMSUserRecord(SQLModel, table=True):
    __tablename__ = "tms_users"

    id: str = Field(primary_key=True)
    display_name: str = Field(index=True)
    first_name: str
    last_name: str
    email: str = Field(index=True)
    designation: str
    reporting_manager: str
    
    company: str = Field(index=True)
    business_unit: str
    department: str
    cost_center: str
    location: str
    
    products_assigned_json: str = "[]"
    roles_json: str = "[]"
    account_status: str = "Unlocked"
    
    timezone: str = "UTC"
    date_format: str = "DD/MM/YYYY"
    number_format: str = "1,234.56"
    
    status: str = Field(default="Active", index=True)
    last_login: str = "Never"
    travel_policy: bool = False

    def to_schema(self) -> TMSUserResponse:
        try:
            prods = json.loads(self.products_assigned_json)
        except Exception:
            prods = []
        try:
            roles = json.loads(self.roles_json)
        except Exception:
            roles = []

        return TMSUserResponse(
            id=self.id,
            identity=IdentityGroup(
                display_name=self.display_name,
                first_name=self.first_name,
                last_name=self.last_name,
                email=self.email,
                designation=self.designation,
                reporting_manager=self.reporting_manager
            ),
            organization=OrganizationGroup(
                company=self.company,
                business_unit=self.business_unit,
                department=self.department,
                cost_center=self.cost_center,
                location=self.location
            ),
            access=AccessGroup(
                products_assigned=prods,
                roles=roles,
                account_status=self.account_status
            ),
            preferences=PreferencesGroup(
                timezone=self.timezone,
                date_format=self.date_format,
                number_format=self.number_format
            ),
            limits=UserLevelLimitsGroup(),
            status=self.status,
            last_login=self.last_login,
            travel_policy=self.travel_policy
        )

    @classmethod
    def from_schema(cls, u: TMSUserResponse) -> "TMSUserRecord":
        return cls(
            id=u.id,
            display_name=u.identity.display_name,
            first_name=u.identity.first_name,
            last_name=u.identity.last_name,
            email=u.identity.email,
            designation=u.identity.designation,
            reporting_manager=u.identity.reporting_manager,
            company=u.organization.company,
            business_unit=u.organization.business_unit,
            department=u.organization.department,
            cost_center=u.organization.cost_center,
            location=u.organization.location,
            products_assigned_json=json.dumps(u.access.products_assigned),
            roles_json=json.dumps(u.access.roles),
            account_status=u.access.account_status,
            timezone=u.preferences.timezone,
            date_format=u.preferences.date_format,
            number_format=u.preferences.number_format,
            status=u.status,
            last_login=u.last_login,
            travel_policy=u.travel_policy
        )
