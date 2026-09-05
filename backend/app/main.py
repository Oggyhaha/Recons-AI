from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.imports import router as imports_router
from app.api.reconciliation import router as recon_router
from app.api.exceptions import router as exceptions_router
from app.api.cash import router as cash_router
from app.api.agent import router as agent_router
from app.api.evaluation import router as evaluation_router
from app.api.audit import router as audit_router
from app.api.webhooks import router as webhooks_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Autonomous AI Finance Control Plane for continuous reconciliation, settlement verification, and cash intelligence"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(imports_router, prefix=api_v1)
app.include_router(recon_router, prefix=api_v1)
app.include_router(exceptions_router, prefix=api_v1)
app.include_router(cash_router, prefix=api_v1)
app.include_router(agent_router, prefix=api_v1)
app.include_router(evaluation_router, prefix=api_v1)
app.include_router(audit_router, prefix=api_v1)
app.include_router(webhooks_router, prefix=api_v1)

@app.get("/health")
@app.get(f"{api_v1}/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "ReconOS AI Finance Control Plane",
        "version": settings.VERSION,
        "environment": "production"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
