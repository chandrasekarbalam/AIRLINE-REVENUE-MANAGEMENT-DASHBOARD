@echo off
echo ========================================================
echo Starting AeroRevenue Vite Frontend on port 5173...
echo ========================================================
set PATH=C:\Program Files\nodejs;%PATH%
cd frontend
call npm.cmd run dev
pause
