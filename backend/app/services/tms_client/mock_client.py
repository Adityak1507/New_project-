import uuid
from typing import List, Dict, Any, Optional
from app.services.tms_client.base import ITMSClient
from app.models.tms_schemas import (
    PaginatedTMSUsers,
    TMSUserResponse,
    TMSUserCreateRequest,
    TMSUserUpdateRequest,
    IdentityGroup,
    OrganizationGroup,
    AccessGroup,
    PreferencesGroup,
    UserLevelLimitsGroup
)
from app.utils.exceptions import TMSException, CompanyAdminProtectedException

# Seed 24 products matching exact native TMS screenshot
ALL_PRODUCTS = [
    "AppXtend", "Dashboard", "eInvoice", "eProc", "Field Library", 
    "FlexiForm Studio", "iAnalyze", "iConsole", "iContract", "Import Studio", 
    "IMT", "iPerform", "iRequest", "iRisk", "iSave", "iSource", 
    "iSupplier", "Master Data Management", "Merlin AI Studio", "Project Tracker", 
    "Spend Analytics", "Supplier Network", "Workflow Engine", "Zycus Pay"
]

ALL_ROLES = [
    "Company Admin", "Tenant Manager", "Procurement Specialist", 
    "Approver Level 1", "Approver Level 2", "Financial Analyst", 
    "Auditor", "General Viewer"
]

ALL_DESIGNATIONS = [
    "Chief Operating Officer", "CEO", "Chief Finance Officer", "Head of Finance", 
    "Finance User", "Business Manager", "Cost Centre Owner", "Business User", 
    "Senior Procurement Specialist", "Procurement Analyst", "Strategic Sourcing Lead", 
    "System Administrator", "Lead Engineer", "Project Manager", "HR Partner", 
    "Legal Counsel", "DEFAULT"
]

ALL_DEPARTMENTS = [
    "Engineering", "Business Development", "Nova Finance", "Nova Marketing", 
    "Nova Engineering", "Global Procurement", "Human Resources", 
    "Legal & Compliance", "IT & Infrastructure", "Supply Chain Management", 
    "Logistics & Supply", "DEFAULT"
]

CASCADING_ORG_HIERARCHY = {
    "Nova": {
        "DEFAULT": {
            "IT & Cloud Operations": {
                "CC-IT-001": ["Mumbai (HQ)", "Bangalore Tech Park", "Princeton Office"],
                "CC-IT-002": ["London Branch", "Singapore Hub"]
            },
            "Engineering": {
                "CC-ENG-101": ["Mumbai (HQ)", "Pune R&D Center", "Austin Lab"],
                "CC-ENG-102": ["San Jose Tech Center"]
            },
            "Global Procurement": {
                "CC-PROC-500": ["Mumbai (HQ)", "New York Financial Office", "Tokyo Branch"]
            }
        },
        "EMEA Operations": {
            "Logistics & Supply": {
                "CC-LOG-800": ["Frankfurt Logistics", "Amsterdam Warehouse", "Dubai Hub"]
            }
        }
    },
    "Dewdrops Enterprise": {
        "Corporate": {
            "Human Resources": {
                "CC-HR-001": ["Chicago HQ", "Toronto Office"]
            },
            "Finance & Legal": {
                "CC-FIN-200": ["New York Financial Office", "Zurich Branch"]
            }
        }
    }
}

class MockTMSClient(ITMSClient):
    _users: Dict[str, TMSUserResponse] = {}
    _seeded: bool = False

    def __init__(self):
        if not MockTMSClient._seeded:
            self._seed_mock_users()
            MockTMSClient._seeded = True

    @classmethod
    def _seed_mock_users(cls):
        # 10 exact screenshot rows plus 69 additional users to total 79 active/inactive users
        base_rows = [
            ("usr_101", "ABCD XYZ", "abc345686@zycus.com", "nova.admin@zycus.com", "Never", ["AppXtend", "Dashboard", "eProc"]),
            ("usr_102", "ABCDu XYZu", "abc2345@zycus.com", "ronaldo@dewdrops.com", "Never", ["Dashboard", "eInvoice", "iAnalyze", "iSource"]),
            ("usr_103", "aditya XYZ", "hirhrir@gmail.com", "nova.admin@zycus.com", "Never", ["AppXtend", "Dashboard", "iContract"]),
            ("usr_104", "asashdiqhwhdoq asfas", "sadasda@asdf.com", "messi@test.com", "Never", ["Dashboard"]),
            ("usr_105", "ashijklm sfikj", "user@zycus.com", "nova.admin@zycus.com", "Never", ["Dashboard", "eProc", "iPerform", "iSave"]),
            ("usr_106", "AtoZ atoz", "atoz@zycus.com", "nova.admin@zycus.com", "Never", ["Dashboard", "AppXtend", "IMT", "iRisk"]),
            ("usr_admin", "Company Admin", "nova.admin@zycus.com", "-", "12/07/2026 - 02:08:00", ["AppXtend", "Dashboard"]),
            ("usr_108", "Cristiano Ronaldo", "cr7@hub.com", "meetshah@zycus.com", "Never", ["Dashboard", "iPerform"]),
            ("usr_109", "Demo Engineer", "demo.engineer@zycus.com", "nova.admin@zycus.com", "Never", ["Dashboard"]),
            ("usr_110", "demo90 DEMO90", "demo90@gmail.com", "nova-test1@zycus.com", "Never", ["Dashboard"])
        ]

        cls._users = {}
        for uid, name, email, mgr, last_login, prods in base_rows:
            parts = name.split(" ", 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else ""
            cls._users[uid] = TMSUserResponse(
                id=uid,
                identity=IdentityGroup(
                    display_name=name,
                    first_name=first,
                    last_name=last,
                    email=email,
                    designation="Senior Procurement Specialist" if "Admin" not in name else "Company Administrator",
                    reporting_manager=mgr
                ),
                organization=OrganizationGroup(
                    company="Nova",
                    business_unit="DEFAULT",
                    department="Engineering" if "Engineer" in name else "IT & Cloud Operations",
                    cost_center="CC-ENG-101" if "Engineer" in name else "CC-IT-001",
                    location="Mumbai (HQ)"
                ),
                access=AccessGroup(
                    products_assigned=prods,
                    roles=["Company Admin"] if "Admin" in name else ["Tenant Manager", "Procurement Specialist"],
                    account_status="Unlocked"
                ),
                preferences=PreferencesGroup(),
                limits=UserLevelLimitsGroup(),
                status="Active",
                last_login=last_login,
                travel_policy=False
            )

        # Add 69 more realistic active users to reach exactly 79 records
        for i in range(111, 180):
            uid = f"usr_{i}"
            name = f"Dewdrops User {i - 110}"
            cls._users[uid] = TMSUserResponse(
                id=uid,
                identity=IdentityGroup(
                    display_name=name,
                    first_name="Dewdrops",
                    last_name=f"User {i - 110}",
                    email=f"user.{i}@zycus.com",
                    designation="Procurement Specialist",
                    reporting_manager="nova.admin@zycus.com"
                ),
                organization=OrganizationGroup(
                    company="Nova",
                    business_unit="DEFAULT",
                    department="Global Procurement",
                    cost_center="CC-PROC-500",
                    location="Mumbai (HQ)"
                ),
                access=AccessGroup(
                    products_assigned=["Dashboard", "eProc", "iAnalyze"] if i % 2 == 0 else ["AppXtend", "Dashboard"],
                    roles=["Procurement Specialist"],
                    account_status="Unlocked"
                ),
                preferences=PreferencesGroup(),
                limits=UserLevelLimitsGroup(),
                status="Active" if i % 10 != 0 else "Inactive",  # 90% active, 10% inactive
                last_login="Never" if i % 3 != 0 else f"10/07/2026 - 14:{i%60:02d}:12",
                travel_policy=i % 5 == 0
            )

    def list_users(
        self, 
        page: int = 1, 
        size: int = 10, 
        search: str = "", 
        status_filter: Optional[str] = None, 
        sort_by: Optional[str] = None
    ) -> PaginatedTMSUsers:
        records = list(self._users.values())

        if search:
            q = search.lower()
            records = [
                u for u in records 
                if q in u.identity.display_name.lower() 
                or q in u.identity.email.lower() 
                or q in u.identity.designation.lower()
            ]

        if status_filter and status_filter.strip() and status_filter.lower() != "all":
            records = [u for u in records if u.status.lower() == status_filter.lower()]

        if sort_by:
            if sort_by == "name_asc":
                records.sort(key=lambda x: x.identity.display_name.lower())
            elif sort_by == "name_desc":
                records.sort(key=lambda x: x.identity.display_name.lower(), reverse=True)

        total_count = len(records)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paged_records = records[start_idx:end_idx]

        return PaginatedTMSUsers(
            records=paged_records,
            total_count=total_count,
            page=page,
            page_size=size
        )

    def get_user(self, user_id: str) -> Optional[TMSUserResponse]:
        return self._users.get(user_id)

    def create_user(self, data: TMSUserCreateRequest) -> TMSUserResponse:
        # Check duplicate email (Scenario V-3)
        for u in self._users.values():
            if u.identity.email.lower() == data.identity.email.lower():
                raise TMSException(f"User with email '{data.identity.email}' already exists in TMS.", status_code=409)

        new_id = f"usr_{uuid.uuid4().hex[:8]}"
        new_user = TMSUserResponse(
            id=new_id,
            identity=data.identity,
            organization=data.organization,
            access=data.access,
            preferences=data.preferences if data.preferences else PreferencesGroup(),
            limits=data.limits if data.limits else UserLevelLimitsGroup(),
            status="Active",
            last_login="Never",
            travel_policy=False
        )
        self._users[new_id] = new_user
        return new_user

    def update_user(self, user_id: str, data: TMSUserUpdateRequest) -> TMSUserResponse:
        existing = self._users.get(user_id)
        if not existing:
            raise TMSException(f"TMS User '{user_id}' not found.", status_code=404)

        # Protect Company Admin on email modification check
        if existing.identity.email.lower() == "nova.admin@zycus.com" and data.status and data.status.lower() == "inactive":
            raise CompanyAdminProtectedException()

        # Update only fields passed in diff
        if data.identity:
            for k, v in data.identity.items():
                if hasattr(existing.identity, k) and v is not None:
                    setattr(existing.identity, k, v)

        if data.organization:
            for k, v in data.organization.items():
                if hasattr(existing.organization, k) and v is not None:
                    setattr(existing.organization, k, v)

        if data.access:
            for k, v in data.access.items():
                if hasattr(existing.access, k) and v is not None:
                    setattr(existing.access, k, v)

        if data.preferences:
            for k, v in data.preferences.items():
                if hasattr(existing.preferences, k) and v is not None:
                    setattr(existing.preferences, k, v)

        if data.limits:
            for k, v in data.limits.items():
                if hasattr(existing.limits, k) and v is not None:
                    setattr(existing.limits, k, v)

        if data.status is not None:
            existing.status = data.status

        if data.travel_policy is not None:
            existing.travel_policy = data.travel_policy

        self._users[user_id] = existing
        return existing

    def change_status(self, user_id: str, active: bool) -> TMSUserResponse:
        existing = self._users.get(user_id)
        if not existing:
            raise TMSException(f"TMS User '{user_id}' not found.", status_code=404)

        if existing.identity.email.lower() == "nova.admin@zycus.com" and not active:
            raise CompanyAdminProtectedException()

        existing.status = "Active" if active else "Inactive"
        self._users[user_id] = existing
        return existing

    def get_org_hierarchy(self) -> Dict[str, Any]:
        return CASCADING_ORG_HIERARCHY

    def list_available_products(self) -> List[str]:
        return ALL_PRODUCTS

    def list_available_roles(self) -> List[str]:
        return ALL_ROLES

    def list_designations(self, q: str = "") -> List[str]:
        if not q:
            return ALL_DESIGNATIONS
        q_low = q.lower()
        return [d for d in ALL_DESIGNATIONS if q_low in d.lower()]

    def list_departments_suggestions(self, q: str = "") -> List[str]:
        if not q:
            return ALL_DEPARTMENTS
        q_low = q.lower()
        return [dept for dept in ALL_DEPARTMENTS if q_low in dept.lower()]

    def list_reporting_managers(self, q: str = "") -> List[Dict[str, str]]:
        active_users = [u for u in self._users.values() if u.status.lower() == "active"]
        if q:
            q_low = q.lower()
            active_users = [
                u for u in active_users 
                if q_low in u.identity.display_name.lower() or q_low in u.identity.email.lower()
            ]
        return [
            {
                "displayName": u.identity.display_name,
                "email": u.identity.email,
                "label": f"{u.identity.display_name} ({u.identity.email})"
            }
            for u in active_users[:25]
        ]
