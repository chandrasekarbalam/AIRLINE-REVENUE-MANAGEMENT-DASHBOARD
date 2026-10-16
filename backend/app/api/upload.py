import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import FileResponse
from pathlib import Path
from backend.app.services.upload_service import preview_uploaded_file, process_and_import_data
from backend.app.database.connection import PROJECT_ROOT

router = APIRouter(prefix="/api/upload", tags=["Dataset Upload"])

@router.post("/preview")
async def preview_file(file: UploadFile = File(...)):
    if not file.filename.endswith((".csv", ".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are supported.")
    
    contents = await file.read()
    try:
        res = preview_uploaded_file(contents, file.filename)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/process")
async def process_file(
    file: UploadFile = File(...),
    column_mapping: str = Form(...)  # JSON string of column mapping
):
    contents = await file.read()
    try:
        mapping = json.loads(column_mapping)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON column mapping provided.")

    try:
        result = process_and_import_data(contents, file.filename, mapping)
        from backend.app.services.cache_service import cache
        cache.invalidate_all()
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sample-template")
async def download_sample_template():
    sample_file = PROJECT_ROOT / "data" / "sample_airline_data.csv"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="Sample template not found")
    return FileResponse(
        path=str(sample_file),
        filename="sample_airline_data.csv",
        media_type="text/csv"
    )
