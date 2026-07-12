import httpx
from typing import Optional
from datetime import datetime, timedelta
from app.config import settings
from app.utils.exceptions import TMSException

class SSOTokenManager:
    _instance = None
    _cached_token: Optional[str] = None
    _expires_at: Optional[datetime] = None
    _offline_until: Optional[datetime] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SSOTokenManager()
        return cls._instance

    def get_token(self, force_refresh: bool = False) -> str:
        if not force_refresh and self._cached_token and self._expires_at and datetime.utcnow() < self._expires_at:
            return self._cached_token

        if not force_refresh and self._offline_until and datetime.utcnow() < self._offline_until:
            raise TMSException("SSO service unreachable (cached offline state)")

        if not settings.SSO_AUTH_TOKEN or not settings.SSO_LOGIN_ID:
            raise TMSException("SSO credentials not configured in settings/env.")

        url = f"{settings.SSO_BASE_URL.rstrip('/')}/sso/passwordLessAccess"
        payload = {
            "authToken": settings.SSO_AUTH_TOKEN,
            "loginId": settings.SSO_LOGIN_ID,
            "env": settings.SSO_ENV
        }

        try:
            with httpx.Client(timeout=2.0) as client:
                response = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if response.status_code != 200:
                    raise TMSException(f"SSO passwordlessAccess failed with HTTP {response.status_code}: {response.text}")
                
                data = response.json()
                # Parse defensively: tokenId may be top-level or nested under data
                token_id = data.get("tokenId")
                if not token_id and isinstance(data.get("data"), dict):
                    token_id = data["data"].get("tokenId")
                
                if not token_id:
                    raise TMSException(f"Could not extract tokenId from SSO response: {data}")

                self._cached_token = str(token_id)
                self._expires_at = datetime.utcnow() + timedelta(hours=2)  # cache for 2 hours
                self._offline_until = None
                return self._cached_token
        except httpx.RequestError as e:
            self._offline_until = datetime.utcnow() + timedelta(seconds=30)
            raise TMSException(f"Network error connecting to SSO service: {str(e)}")

    def get_cookie_header(self) -> dict:
        token_id = self.get_token()
        return {"Cookie": f"SAAS_COMMON_BASE_TOKEN_ID={token_id}"}
