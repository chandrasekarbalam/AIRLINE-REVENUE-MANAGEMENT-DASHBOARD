from fastapi import APIRouter, Body
from typing import Dict, Any
from backend.app.database.connection import query_all, get_db

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("")
async def get_settings():
    rows = query_all("SELECT key, value, description FROM app_settings;")
    settings_dict = {r["key"]: r["value"] for r in rows}
    return {
        "settings": settings_dict,
        "details": rows
    }

@router.post("")
async def update_settings(updates: Dict[str, str] = Body(...)):
    with get_db() as conn:
        cursor = conn.cursor()
        for k, v in updates.items():
            cursor.execute("""
                INSERT INTO app_settings (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value;
            """, (k, str(v)))
    return {"message": "Settings updated successfully", "updated": updates}
