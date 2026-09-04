from fastapi import APIRouter, Query
from typing import Dict, Any, List
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Trail & Compliance"])

@router.get("/logs")
async def get_audit_logs(limit: int = Query(100, ge=1, le=500)):
    logs = audit_service.get_logs(limit=limit)
    return {
        "total": len(logs),
        "logs": logs
    }
