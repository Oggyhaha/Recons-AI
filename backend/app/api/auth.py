from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["Authentication"])

class CurrentUserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    tenant_id: str
    tenant_name: str
    permissions: list[str]

@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user():
    return CurrentUserResponse(
        user_id="usr_finance_lead_01",
        email="controller@razorpay-merchant.com",
        name="Aarav Sharma",
        role="FINANCE_CONTROLLER",
        tenant_id="tenant_rzp_demo_01",
        tenant_name="Razorpay Enterprise D2C Merchant",
        permissions=[
            "reconciliation:run",
            "reconciliation:view",
            "exceptions:review",
            "exceptions:approve",
            "cash:view",
            "audit:view",
            "copilot:access"
        ]
    )

@router.post("/switch-role")
async def switch_user_role(role: str):
    allowed_roles = ["ADMIN", "FINANCE_CONTROLLER", "FINANCE_ANALYST", "AUDITOR"]
    selected_role = role if role in allowed_roles else "FINANCE_CONTROLLER"
    return {
        "status": "success",
        "active_role": selected_role,
        "message": f"Switched active persona to {selected_role}."
    }
