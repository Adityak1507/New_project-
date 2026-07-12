# TMS API Discovery & Endpoint Documentation (`TMS_API_DISCOVERY.md`)

This document details the discovered Zycus Dewdrops (`dewdrops-ausyut.zycus.com`) endpoints for TMS User Hub, derived from browser network traces and passwordless SSO integration (`Section 5` & `Section 8`).

---

## 1. Authentication & Session Management (`Passwordless SSO`)

### Obtain Session Token (`tokenId`)
- **Endpoint**: `POST {SSO_BASE_URL}/sso/passwordLessAccess`
- **When Called**: On backend startup or when the cached `SAAS_COMMON_BASE_TOKEN_ID` cookie expires.
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "authToken": "<secret_auth_token>",
    "loginId": "nova.admin@zycus.com",
    "env": "ausuat"
  }
  ```
- **Response Shape**:
  ```json
  {
    "tokenId": "sample_token_id_12345",
    "status": "success"
  }
  ```
- **How Used**: The extracted `tokenId` is attached as a cookie to **all subsequent HTTP calls** to Dewdrops TMS endpoints:
  `Cookie: SAAS_COMMON_BASE_TOKEN_ID=<tokenId>`

---

## 2. User Listing & Management Endpoints (`/tms-sso/api/a/tms-sso/user/*`)

### Search / List TMS Users
- **Endpoint**: `POST {TMS_TENANT_BASE_URL}/tms-sso/api/a/tms-sso/user/searchUser`
- **When Called**: By `GET /api/tms-users` to browse, search, and filter users across the tenant.
- **Request Payload**:
  ```json
  {
    "pageNumber": 1,
    "pageSize": 10,
    "searchKeyword": "",
    "status": "Active"
  }
  ```
- **Response Shape**:
  ```json
  {
    "status": "success",
    "statusCode": 200,
    "data": {
      "records": [
        {
          "userId": "usr_101",
          "displayName": "ABCD XYZ",
          "firstName": "ABCD",
          "lastName": "XYZ",
          "email": "abc345686@zycus.com",
          "designation": "Senior Procurement Specialist",
          "reportingManager": "nova.admin@zycus.com",
          "company": "Nova",
          "businessUnit": "DEFAULT",
          "department": "Engineering",
          "costCenter": "CC-ENG-101",
          "location": "Mumbai (HQ)",
          "productsAssigned": ["AppXtend", "Dashboard", "eProc"],
          "status": "Active",
          "lastLogin": "Never"
        }
      ],
      "totalCount": 79
    }
  }
  ```
- **Synchronization Behavior**: When actual connection returns data, our `LiveTMSClient` synchronizes and fills the local database (`tms_users` table in SQLite) to ensure high-speed local pagination and resilience.

---

## 3. Product & Role Discovery Endpoints (`/tms-sso/api/a/tms-sso/*`)

### Tenant Products Lookup
- **Endpoint**: `POST {TMS_TENANT_BASE_URL}/tms-sso/api/a/tms-sso/products/searchTenantProducts`
- **Payload**: `{}`
- **Response Shape**:
  ```json
  {
    "status": "success",
    "statusCode": 200,
    "data": {
      "records": [
        { "name": "AppXtend", "active": true, "productId": "7a4cf69c-1bb2-4ab4-a900-f33deacf6ebc" },
        { "name": "Dashboard", "active": true, "productId": "d306bd75-91b0-4004-8d37-4b30f35db349" },
        { "name": "eInvoice", "active": true, "productId": "4be516a3-92f0-4c0a-bfdc-ae78fd3d8268" },
        { "name": "eProc", "active": true, "productId": "6fa977df-ee25-435c-a4e0-0403d01e493b" },
        { "name": "Field Library", "active": true, "productId": "3bf91ad8-b08d-44d3-9011-7f0d8883da57" },
        { "name": "FlexiForm Studio", "active": true, "productId": "3183b07e-0e13-4f3e-8de0-34a30ce7f697" },
        { "name": "iAnalyze", "active": true, "productId": "c1e80a6b-066f-493b-bb5a-bc63d9ab835d" },
        { "name": "iConsole", "active": true, "productId": "d8ee2b06-5fbf-459d-89da-292cf9ae391f" },
        { "name": "iContract", "active": true, "productId": "2d3a2f50-2c62-4e6a-92f5-37189bce29b9" },
        { "name": "Import Studio", "active": true, "productId": "70ac3827-e5e5-4820-892c-b7d5f75861da" },
        { "name": "IMT", "active": true, "productId": "4f95be15-6159-49eb-a821-24a7a8c06938" },
        { "name": "iRequest", "active": true, "productId": "0ab3bfdb-684b-48ae-a96b-5722b2823862" },
        { "name": "iSource", "active": true, "productId": "db3cdb00-6d97-4d99-b17e-9bbb1fd2f484" },
        { "name": "Language Management Tool", "active": true, "productId": "5b1c4ef6-3c67-4ca2-a77e-efdc721c20e0" },
        { "name": "MAS", "active": true, "productId": "84749baa-d6fe-45bd-9172-43fa390b6741" },
        { "name": "Merlin", "active": true, "productId": "db69171f-bc4c-49fa-a68b-483a6fbe0f9f" },
        { "name": "OneView", "active": true, "productId": "be48c1da-5b0d-4918-b09d-db7459add3c8" },
        { "name": "ReportStudio", "active": true, "productId": "c7521f46-535f-4303-a4b1-c65b21fe9204" },
        { "name": "Rule Manager", "active": true, "productId": "6ce34baa-817d-42be-9313-70b89f4f53d8" },
        { "name": "SelfHelpComponent", "active": true, "productId": "23eb5380-d107-4f75-a327-a55bacd7609a" },
        { "name": "SIM", "active": true, "productId": "a8104008-8898-43bd-ac1e-12ac483c64e8" },
        { "name": "SPM", "active": true, "productId": "fff7223a-b301-4155-9459-f3a5761f4133" },
        { "name": "Supplier Portal", "active": true, "productId": "b95e92d5-8e60-447b-94b5-387fe4120665" },
        { "name": "TMS", "active": true, "productId": "ad18c3c5-3fe5-4858-b91e-c95129ff775d" }
      ],
      "totalRecords": 24
    }
  }
  ```

### User Roles Lookup
- **Endpoint**: `POST {TMS_TENANT_BASE_URL}/tms-sso/api/a/tms-sso/user/userRoleLising`
- **Payload**: `{"perPageRecords": 10, "pageNo": 1, "sorts": [{"fieldName": "roleName", "direction": "ASC"}], "criteriaGroup": {"logicalOperator": "AND", "criteria": []}}`
- **Response**: `records: [{ "roleName": "Access Merlin Insights", "productName": "ReportStudio" }, { "roleName": "Administrator", "productName": "iRequest" }, ...]` (Total 226 records).

---

## 4. Organization & Master Data Endpoints (`/tms-sso/api/a/cmd/*`)

### Departments Listing
- **Endpoint**: `POST {TMS_TENANT_BASE_URL}/tms-sso/api/a/cmd/departments/list`
- **Payload**: `{"pageNo": 1, "perPageRecords": 10}`
- **Response**: `records: [{ "name": "Engineering", "code": "DUMMY_ENG" }, { "name": "Business Development", "code": "DUMMY_BD" }, { "name": "Nova Finance", "code": "NOVA_DEPT_003" }, { "name": "Nova Marketing", "code": "NOVA_DEPT_002" }, { "name": "Nova Engineering", "code": "NOVA_DEPT_001" }, { "name": "DEFAULT", "code": "DEPT001" }]`

### Designations Listing
- **Endpoint**: `POST {TMS_TENANT_BASE_URL}/tms-sso/api/a/cmd/designation/getList`
- **Payload**: `{"perPageRecords": 10, "pageNo": 1, "bypassLocale": true}`
- **Response**: `records: [{ "name": "Chief Operating Officer", "code": "DES8" }, { "name": "CEO", "code": "DES7" }, { "name": "Chief Finance Officer", "code": "DES6" }, { "name": "Head of Finance", "code": "DES5" }, { "name": "Finance User", "code": "DES4" }, { "name": "Business Manager", "code": "DES3" }, { "name": "Cost Centre Owner", "code": "DES2" }, { "name": "Business User", "code": "DES1" }, { "name": "DEFAULT", "code": "DES001" }]`

### Master Entity Lookup (`Company` / `Cost Center` / `Location`)
- **Endpoint**: `POST {TMS_TENANT_BASE_URL}/tms-sso/api/a/cmd/organization/searchAllowedMasterEntity`
- **Payload**: `{"masterEntityDimensionCode": "COCE", "criteriaGroup": {"logicalOperator": "AND", "criteria": [{"fieldName": "ou", "multivalue": ["ORST_ORG_LVL_1", "OU_1-001"], "operation": "CONTAINS"}]}}`
- **Response**: `records: [{ "code": "CC001", "name": "DEFAULT" }, { "code": "DEFAULT", "name": "Cost Centre Owner" }]`

---

## 5. Preferences & Localization Endpoints (`/tms-sso/api/a/tms/users/preferenceData`)

### Get User Preference Master Data
- **Endpoint**: `GET {TMS_TENANT_BASE_URL}/tms-sso/api/a/tms/users/preferenceData`
- **When Called**: By form setup (`CreateUserModal` / `EditUserModal`) to populate dropdown options.
- **Response Shape**:
  ```json
  {
    "status": "success",
    "statusCode": 200,
    "data": {
      "localeMap": { "en_US": "English (US)", "en_GB": "English (UK)" },
      "currencyMap": { "USD": "American Dollar", "EUR": "Euro" },
      "timeZonesMap": { "UTC": "UTC - (GMT+00:00)", "America/New_York": "America/New_York - (GMT-4:00)" },
      "dateFormats": ["MM/dd/yyyy", "dd/MM/yyyy", "yyyy/MM/dd"],
      "numberFormats": ["#,###,###.##", "#.###.###,##"],
      "timeFormats": ["12 Hours", "24 Hours"]
    }
  }
  ```
