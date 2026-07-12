from fastapi import HTTPException, status

class TMSException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class RoleAccessDeniedException(HTTPException):
    def __init__(self, detail: str = "Access denied for your role."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class CompanyAdminProtectedException(HTTPException):
    def __init__(self, detail: str = "The Company Admin TMS user cannot be deactivated or locked."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
