@echo off
echo ========================================================
echo  Starting CAP-06: EV Charging Ecosystem
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Spring Boot Backend (Port 8080)...
start "CAP-06 Spring Boot Backend" cmd /k "cd evcharging && mvnw.cmd spring-boot:run"

timeout /t 5 /nobreak >nul

echo [2/3] Starting React Vite Frontend (Port 5173)...
start "CAP-06 React Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser...
start http://localhost:5173

echo.
echo ========================================================
echo  All services launched!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:8080
echo.
echo  To run the telemetry simulator in a separate window:
echo    cd simulator ^&^& python simulator.py
echo ========================================================
echo.

