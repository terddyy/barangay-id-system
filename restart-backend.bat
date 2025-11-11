@echo off
echo ============================================
echo   Barangay ID System - Chatbot Setup
echo ============================================
echo.

cd backend

echo Step 1: Checking if server is running on port 3000...
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [!] Server already running on port 3000
    echo [*] Please close the running server first or use a different terminal
    pause
    exit /b 1
)

echo [OK] Port 3000 is available
echo.

echo Step 2: Starting backend server...
echo [*] Backend will run on: http://localhost:3000
echo [*] Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

node server.js
