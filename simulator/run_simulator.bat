@echo off
echo ========================================================
echo  Starting CAP-06: EV Charging Telemetry Simulator
echo ========================================================
echo.

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH.
    pause
    exit /b 1
)

python simulator.py %*
pause

