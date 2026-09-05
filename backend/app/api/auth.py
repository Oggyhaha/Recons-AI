import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

# Schemas
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    organization_name: str = "Enterprise Merchant Inc."
    role: str = "FINANCE_CONTROLLER"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SwitchRoleRequest(BaseModel):
    role: str

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    tenant_id: str
    tenant_name: str
    permissions: List[str]

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserProfile
    message: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

# In-memory user database pre-seeded with demo accounts
ROLE_PERMISSIONS = {
    "FINANCE_CONTROLLER": [
        "reconciliation:run",
        "reconciliation:view",
        "exceptions:review",
        "exceptions:approve",
        "disputes:generate",
        "journals:export",
        "cash:view",
        "audit:view",
        "copilot:access"
    ],
    "FINANCE_ANALYST": [
        "reconciliation:view",
        "exceptions:review",
        "cash:view",
        "copilot:access"
    ],
    "AUDITOR": [
        "reconciliation:view",
        "exceptions:view",
        "audit:view",
        "compliance:verify"
    ]
}

USERS_DB: Dict[str, Dict[str, Any]] = {
    "controller@razorpay-merchant.com": {
        "user_id": "usr_controller_01",
        "name": "Aarav Sharma",
        "email": "controller@razorpay-merchant.com",
        "password_hash": hash_password("password123"),
        "role": "FINANCE_CONTROLLER",
        "tenant_id": "tenant_rzp_enterprise_01",
        "tenant_name": "Razorpay Enterprise D2C Merchant",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    "analyst@razorpay-merchant.com": {
        "user_id": "usr_analyst_01",
        "name": "Priya Nair",
        "email": "analyst@razorpay-merchant.com",
        "password_hash": hash_password("password123"),
        "role": "FINANCE_ANALYST",
        "tenant_id": "tenant_rzp_enterprise_01",
        "tenant_name": "Razorpay Enterprise D2C Merchant",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    "auditor@razorpay-merchant.com": {
        "user_id": "usr_auditor_01",
        "name": "Vikram Sethi",
        "email": "auditor@razorpay-merchant.com",
        "password_hash": hash_password("password123"),
        "role": "AUDITOR",
        "tenant_id": "tenant_rzp_enterprise_01",
        "tenant_name": "Razorpay Enterprise D2C Merchant",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
}

ACTIVE_SESSION_USER = "controller@razorpay-merchant.com"

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    email_key = req.email.lower().strip()
    if email_key in USERS_DB:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user_id = f"usr_{int(datetime.now(timezone.utc).timestamp())}"
    role = req.role if req.role in ROLE_PERMISSIONS else "FINANCE_CONTROLLER"

    new_user = {
        "user_id": user_id,
        "name": req.name,
        "email": email_key,
        "password_hash": hash_password(req.password),
        "role": role,
        "tenant_id": f"tenant_{user_id}",
        "tenant_name": req.organization_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    USERS_DB[email_key] = new_user

    global ACTIVE_SESSION_USER
    ACTIVE_SESSION_USER = email_key

    token = f"reconos_jwt_{user_id}_{hashlib.sha256(email_key.encode()).hexdigest()[:16]}"
    
    profile = UserProfile(
        user_id=new_user["user_id"],
        name=new_user["name"],
        email=new_user["email"],
        role=new_user["role"],
        tenant_id=new_user["tenant_id"],
        tenant_name=new_user["tenant_name"],
        permissions=ROLE_PERMISSIONS.get(role, [])
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=profile,
        message="Registration successful."
    )

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    email_key = req.email.lower().strip()
    user = USERS_DB.get(email_key)
    if not user or user["password_hash"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    global ACTIVE_SESSION_USER
    ACTIVE_SESSION_USER = email_key

    token = f"reconos_jwt_{user['user_id']}_{hashlib.sha256(email_key.encode()).hexdigest()[:16]}"
    
    profile = UserProfile(
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        tenant_id=user["tenant_id"],
        tenant_name=user["tenant_name"],
        permissions=ROLE_PERMISSIONS.get(user["role"], [])
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=profile,
        message="Login successful."
    )

@router.get("/me", response_model=UserProfile)
async def get_current_user(authorization: Optional[str] = Header(None)):
    user = USERS_DB.get(ACTIVE_SESSION_USER, USERS_DB["controller@razorpay-merchant.com"])
    return UserProfile(
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        tenant_id=user["tenant_id"],
        tenant_name=user["tenant_name"],
        permissions=ROLE_PERMISSIONS.get(user["role"], [])
    )

@router.post("/switch-role")
async def switch_user_role(req: SwitchRoleRequest):
    allowed_roles = list(ROLE_PERMISSIONS.keys())
    selected_role = req.role if req.role in allowed_roles else "FINANCE_CONTROLLER"

    user = USERS_DB.get(ACTIVE_SESSION_USER)
    if user:
        user["role"] = selected_role

    return {
        "status": "success",
        "active_role": selected_role,
        "message": f"Switched active persona to {selected_role}."
    }
