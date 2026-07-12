from .base import ITMSClient
from .mock_client import MockTMSClient
from .live_client import LiveTMSClient
from .sso import SSOTokenManager
from app.config import settings

from fastapi import Depends
from sqlmodel import Session
from app.database import get_session

def get_tms_client(session: Session = Depends(get_session)) -> ITMSClient:
    return LiveTMSClient(session=session)
