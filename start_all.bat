@echo off
echo ========================================================
echo Launching AeroRevenue Full-Stack Web Application...
echo ========================================================
start "AeroRevenue Backend (FastAPI)" cmd /k "start_backend.bat"
timeout /t 3 /nobreak >nul
start "AeroRevenue Frontend (Vite)" cmd /k "start_frontend.bat"
timeout /t 3 /nobreak >nul
echo Opening Dashboard in your browser...
start http://localhost:5173
