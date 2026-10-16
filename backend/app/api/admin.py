from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from backend.app.services.auth_service import get_current_user, require_role, hash_password
from backend.app.database.connection import query_all, query_one, get_db

router = APIRouter(prefix="/api/admin", tags=["User Administration"])

class UpdateStatusRequest(BaseModel):
    status: str  # 'active' or 'deactivated'

class UpdateRoleRequest(BaseModel):
    role: str  # 'administrator', 'revenue_manager', 'analyst', 'operations_manager', 'viewer', 'guest'

class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str
    status: Optional[str] = "active"

def record_audit(user_id: int, username: str, action: str, entity_type: str, entity_id: str, details: str):
    try:
        with get_db() as conn:
            conn.cursor().execute("""
                INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details)
                VALUES (?, ?, ?, ?, ?, ?);
            """, (user_id, username, action, entity_type, entity_id, details))
    except Exception as e:
        print("Audit logging error:", e)

@router.get("/users")
async def list_users(current_user: dict = Depends(require_role("administrator"))):
    rows = query_all("""
        SELECT id, username, email, role, full_name, status, created_at, last_login 
        FROM users 
        ORDER BY id ASC;
    """)
    return rows

@router.post("/users")
async def create_user(req: CreateUserRequest, current_user: dict = Depends(require_role("administrator"))):
    valid_roles = ["administrator", "revenue_manager", "analyst", "operations_manager", "viewer", "guest"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    existing = query_one("SELECT id FROM users WHERE username = ? OR email = ?;", (req.username, req.email))
    if existing:
        raise HTTPException(status_code=400, detail="User with this username or email already exists.")

    hashed_pw = hash_password(req.password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, full_name, status)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (req.username, req.email, hashed_pw, req.role, req.full_name, req.status or "active"))
        user_id = cursor.lastrowid

    record_audit(current_user["id"], current_user["username"], "CREATE_USER", "USER", str(user_id), f"Created user {req.username} with role {req.role}")
    return {"message": "User created successfully", "user_id": user_id}

@router.post("/users/{user_id}/status")
async def update_user_status(user_id: int, req: UpdateStatusRequest, current_user: dict = Depends(require_role("administrator"))):
    if req.status not in ["active", "deactivated"]:
        raise HTTPException(status_code=400, detail="Status must be either 'active' or 'deactivated'")
    
    target_user = query_one("SELECT id, username FROM users WHERE id = ?;", (user_id,))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user["username"] == current_user["username"] and req.status == "deactivated":
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account.")

    with get_db() as conn:
        conn.cursor().execute("UPDATE users SET status = ? WHERE id = ?;", (req.status, user_id))

    record_audit(current_user["id"], current_user["username"], "UPDATE_STATUS", "USER", str(user_id), f"Set status to {req.status}")
    return {"message": f"User status successfully updated to {req.status}"}

@router.post("/users/{user_id}/role")
async def update_user_role(user_id: int, req: UpdateRoleRequest, current_user: dict = Depends(require_role("administrator"))):
    valid_roles = ["administrator", "revenue_manager", "analyst", "operations_manager", "viewer", "guest"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    target_user = query_one("SELECT id, username FROM users WHERE id = ?;", (user_id,))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    with get_db() as conn:
        conn.cursor().execute("UPDATE users SET role = ? WHERE id = ?;", (req.role, user_id))

    record_audit(current_user["id"], current_user["username"], "UPDATE_ROLE", "USER", str(user_id), f"Changed role to {req.role}")
    return {"message": f"User role successfully updated to {req.role}"}

@router.get("/audit-logs")
async def get_audit_logs(current_user: dict = Depends(require_role("administrator"))):
    logs = query_all("SELECT id, user_id, username, action, entity_type, entity_id, details, timestamp FROM audit_logs ORDER BY id DESC LIMIT 100;")
    return logs
