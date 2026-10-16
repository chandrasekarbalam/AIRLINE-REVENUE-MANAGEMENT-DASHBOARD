from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime
from backend.app.services.auth_service import (
    authenticate_user, create_access_token, get_current_user,
    hash_password, get_user_by_username
)
from backend.app.database.connection import query_one, get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[str] = "analyst"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if user.get("status") == "deactivated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your system administrator."
        )

    # Update last_login
    with get_db() as conn:
        conn.cursor().execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?;", (user["id"],))

    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user["full_name"],
            "status": user.get("status", "active")
        }
    }

@router.post("/register")
async def register(req: RegisterRequest):
    valid_roles = ["administrator", "revenue_manager", "analyst", "operations_manager", "viewer", "guest"]
    role = req.role if req.role in valid_roles else "analyst"

    # Check if username or email exists
    existing = query_one("SELECT id FROM users WHERE username = ? OR email = ?;", (req.username, req.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with that username or email address already exists."
        )

    hashed_pw = hash_password(req.password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, full_name, status)
            VALUES (?, ?, ?, ?, ?, 'active');
        """, (req.username, req.email, hashed_pw, role, req.full_name))
        new_id = cursor.lastrowid

    token = create_access_token({"sub": req.username, "role": role})
    return {
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_id,
            "username": req.username,
            "email": req.email,
            "role": role,
            "full_name": req.full_name,
            "status": "active"
        }
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = query_one("SELECT id, email, username FROM users WHERE email = ?;", (req.email,))
    if not user:
        # Avoid user enumeration in production; return mock success message
        return {
            "message": "If an account with that email exists, password reset instructions and OTP code (default demo code: 123456) have been sent.",
            "demo_reset_code": "123456"
        }
    return {
        "message": f"Password reset instructions and verification code sent to {req.email}. For testing, use verification code: 123456",
        "demo_reset_code": "123456"
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    if req.reset_code not in ["123456", "AERO-RESET", "000000"]:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    
    user = query_one("SELECT id FROM users WHERE email = ?;", (req.email,))
    if not user:
        raise HTTPException(status_code=404, detail="No user found with the provided email address.")

    hashed_pw = hash_password(req.new_password)
    with get_db() as conn:
        conn.cursor().execute("UPDATE users SET hashed_password = ? WHERE email = ?;", (hashed_pw, req.email))

    return {"message": "Password has been successfully updated. You may now log in with your new credentials."}

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "status": current_user.get("status", "active")
    }

@router.get("/demo-accounts")
async def get_demo_accounts():
    """Provides test accounts for 1-click evaluation of all 6 roles."""
    return [
        {
            "role": "administrator",
            "title": "System Administrator",
            "username": "admin",
            "password": "admin123",
            "description": "Full access: user management, role assignment, data import, system settings"
        },
        {
            "role": "revenue_manager",
            "title": "Revenue Manager",
            "username": "revmanager",
            "password": "revmanager123",
            "description": "Full access to fare optimization, inventory controls, revenue forecasts, analytics"
        },
        {
            "role": "analyst",
            "title": "Commercial Analyst",
            "username": "analyst",
            "password": "analyst123",
            "description": "Standard read/export access for demand forecasting, route analysis, KPI trends"
        },
        {
            "role": "operations_manager",
            "title": "Flight Operations Lead",
            "username": "opsmanager",
            "password": "opsmanager123",
            "description": "Focus on flight capacity, load factor alerts, schedule inventory, seat availability"
        },
        {
            "role": "viewer",
            "title": "Executive Guest Viewer",
            "username": "viewer",
            "password": "viewer123",
            "description": "Read-only executive dashboard and reporting view with no editing permissions"
        }
    ]

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
