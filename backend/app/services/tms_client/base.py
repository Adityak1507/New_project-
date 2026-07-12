from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.models.tms_schemas import PaginatedTMSUsers, TMSUserResponse, TMSUserCreateRequest, TMSUserUpdateRequest

class ITMSClient(ABC):
    @abstractmethod
    def list_users(
        self, 
        page: int = 1, 
        size: int = 10, 
        search: str = "", 
        status_filter: Optional[str] = None, 
        sort_by: Optional[str] = None
    ) -> PaginatedTMSUsers:
        pass

    @abstractmethod
    def get_user(self, user_id: str) -> Optional[TMSUserResponse]:
        pass

    @abstractmethod
    def create_user(self, data: TMSUserCreateRequest) -> TMSUserResponse:
        pass

    @abstractmethod
    def update_user(self, user_id: str, data: TMSUserUpdateRequest) -> TMSUserResponse:
        pass

    @abstractmethod
    def change_status(self, user_id: str, active: bool) -> TMSUserResponse:
        pass

    @abstractmethod
    def get_org_hierarchy(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_available_products(self) -> List[str]:
        pass

    @abstractmethod
    def list_available_roles(self) -> List[str]:
        pass

    @abstractmethod
    def list_designations(self, q: str = "") -> List[str]:
        pass

    @abstractmethod
    def list_departments_suggestions(self, q: str = "") -> List[str]:
        pass

    @abstractmethod
    def list_reporting_managers(self, q: str = "") -> List[Dict[str, str]]:
        pass
