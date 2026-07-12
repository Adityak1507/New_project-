from fastapi import APIRouter, Depends, Query
from typing import List
from app.services.auth_service import get_current_user
from app.services.tms_client import get_tms_client, ITMSClient

router = APIRouter(prefix="/api/org", tags=["Cascading Organization Hierarchy"])

@router.get("/hierarchy", dependencies=[Depends(get_current_user)])
def get_full_hierarchy(client: ITMSClient = Depends(get_tms_client)):
    return client.get_org_hierarchy()

@router.get("/companies", response_model=List[str], dependencies=[Depends(get_current_user)])
def get_companies(client: ITMSClient = Depends(get_tms_client)):
    data = client.get_org_hierarchy()
    return list(data.keys())

@router.get("/business-units", response_model=List[str], dependencies=[Depends(get_current_user)])
def get_business_units(
    company: str = Query(..., description="Parent Company name"),
    client: ITMSClient = Depends(get_tms_client)
):
    data = client.get_org_hierarchy()
    company_data = data.get(company, {})
    return list(company_data.keys())

@router.get("/departments", response_model=List[str], dependencies=[Depends(get_current_user)])
def get_departments(
    company: str = Query(...),
    business_unit: str = Query(...),
    client: ITMSClient = Depends(get_tms_client)
):
    data = client.get_org_hierarchy()
    bu_data = data.get(company, {}).get(business_unit, {})
    return list(bu_data.keys())

@router.get("/cost-centers", response_model=List[str], dependencies=[Depends(get_current_user)])
def get_cost_centers(
    company: str = Query(...),
    business_unit: str = Query(...),
    department: str = Query(...),
    client: ITMSClient = Depends(get_tms_client)
):
    data = client.get_org_hierarchy()
    dept_data = data.get(company, {}).get(business_unit, {}).get(department, {})
    return list(dept_data.keys())

@router.get("/locations", response_model=List[str], dependencies=[Depends(get_current_user)])
def get_locations(
    company: str = Query(...),
    business_unit: str = Query(...),
    department: str = Query(...),
    cost_center: str = Query(...),
    client: ITMSClient = Depends(get_tms_client)
):
    data = client.get_org_hierarchy()
    cc_data = data.get(company, {}).get(business_unit, {}).get(department, {}).get(cost_center, [])
    return cc_data if isinstance(cc_data, list) else []

@router.get("/designations/suggestions", dependencies=[Depends(get_current_user)])
def get_designation_suggestions(q: str = Query("", description="Search term for designation"), client: ITMSClient = Depends(get_tms_client)):
    return {"suggestions": client.list_designations(q)}

@router.get("/departments/suggestions", dependencies=[Depends(get_current_user)])
def get_department_suggestions(q: str = Query("", description="Search term for departments across org"), client: ITMSClient = Depends(get_tms_client)):
    return {"suggestions": client.list_departments_suggestions(q)}

@router.get("/reporting-managers/suggestions", dependencies=[Depends(get_current_user)])
def get_reporting_manager_suggestions(q: str = Query("", description="Search active users as reporting managers"), client: ITMSClient = Depends(get_tms_client)):
    return {"suggestions": client.list_reporting_managers(q)}
