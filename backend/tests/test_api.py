import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.database import get_session

test_engine = create_engine("sqlite:///./test_tms_hub.db", connect_args={"check_same_thread": False})

def override_get_session():
    with Session(test_engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(autouse=True)
def setup_db():
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)

client = TestClient(app)

def test_login_and_roles():
    # Seed users
    seed_resp = client.post("/api/auth/seed")
    assert seed_resp.status_code == 200

    # Login as Viewer
    viewer_login = client.post("/api/auth/login", data={"username": "viewer@hub.com", "password": "password123"})
    assert viewer_login.status_code == 200
    viewer_token = viewer_login.json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}

    # Viewer should be able to list TMS users
    list_resp = client.get("/api/tms-users", headers=viewer_headers)
    assert list_resp.status_code == 200
    assert "records" in list_resp.json()

    # Viewer should NOT be able to create TMS users (Scenario V-6)
    create_payload = {
        "identity": {
            "display_name": "Test User",
            "first_name": "Test",
            "last_name": "User",
            "email": "test.viewer.block@zycus.com",
            "designation": "Specialist",
            "reporting_manager": "nova.admin@zycus.com"
        },
        "organization": {
            "company": "Nova",
            "business_unit": "DEFAULT",
            "department": "Engineering",
            "cost_center": "CC-ENG-101",
            "location": "Mumbai (HQ)"
        },
        "access": {
            "products_assigned": ["Dashboard"],
            "roles": ["Procurement Specialist"],
            "account_status": "Unlocked"
        }
    }
    create_block = client.post("/api/tms-users", json=create_payload, headers=viewer_headers)
    assert create_block.status_code == 403

def test_admin_create_and_protect_company_admin():
    client.post("/api/auth/seed")
    admin_login = client.post("/api/auth/login", data={"username": "admin@hub.com", "password": "password123"})
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Admin should be able to create TMS user
    create_payload = {
        "identity": {
            "display_name": "Admin Created User",
            "first_name": "Admin",
            "last_name": "Created",
            "email": "admin.created@zycus.com",
            "designation": "Analyst",
            "reporting_manager": "nova.admin@zycus.com"
        },
        "organization": {
            "company": "Nova",
            "business_unit": "DEFAULT",
            "department": "IT & Cloud Operations",
            "cost_center": "CC-IT-001",
            "location": "Mumbai (HQ)"
        },
        "access": {
            "products_assigned": ["Dashboard", "AppXtend"],
            "roles": ["Tenant Manager"],
            "account_status": "Unlocked"
        }
    }
    create_resp = client.post("/api/tms-users", json=create_payload, headers=admin_headers)
    assert create_resp.status_code == 200
    new_user_id = create_resp.json()["id"]

    # Protect Company Admin (Rule 3 / Scenario V-7)
    # Attempt to deactivate usr_admin (Company Admin)
    deact_admin = client.post("/api/tms-users/usr_admin/status?active=false", headers=admin_headers)
    assert deact_admin.status_code == 403
    assert "Company Admin" in deact_admin.json()["detail"]

    # Verify audit trail recorded failure
    audit_resp = client.get("/api/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()["records"]
    assert any("DEACTIVATE_TMS_USER" == l["action_type"] and l["status"] == "FAILURE" for l in logs)

def test_cascading_org_hierarchy():
    client.post("/api/auth/seed")
    viewer_login = client.post("/api/auth/login", data={"username": "viewer@hub.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {viewer_login.json()['access_token']}"}

    companies_resp = client.get("/api/org/companies", headers=headers)
    assert companies_resp.status_code == 200
    assert "Nova" in companies_resp.json()

    bu_resp = client.get("/api/org/business-units?company=Nova", headers=headers)
    assert bu_resp.status_code == 200
    assert "DEFAULT" in bu_resp.json()
