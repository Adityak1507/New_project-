from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, tms_users, org_hierarchy, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    init_db()
    yield

from scalar_fastapi import get_scalar_api_reference, Layout, Theme

app = FastAPI(
    title="TMS User Hub API",
    description="Standalone backend managing Hub Users and bridging TMS via passwordless SSO on Dewdrops.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/swagger",  # Traditional Swagger moved to /swagger for fallback
    redoc_url="/redoc"
)

# CORS middleware to allow React+Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or exact frontend origins like ["http://localhost:5173", "http://127.0.0.1:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tms_users.router)
app.include_router(org_hierarchy.router)
app.include_router(audit.router)

from fastapi.responses import RedirectResponse

@app.get("/docs", include_in_schema=False)
@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="TMS User Hub API Reference - Scalar",
        layout=Layout.MODERN,
        theme=Theme.DEFAULT,
        show_sidebar=True
    )

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TMS User Hub Backend"}
