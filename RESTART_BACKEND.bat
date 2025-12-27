@echo off
echo ========================================
echo  RESTARTING BACKEND SERVER
echo ========================================
echo.

echo [1/3] Stopping all node processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM node.exe >nul 2>&1
    echo     Stopped old processes
    timeout /t 2 /nobreak >nul
) else (
    echo     No node processes running
)
echo.

echo [2/3] Starting backend server...
cd /d C:\Users\ravir\Desktop\calender\backend
start "Backend Server" cmd /k "npm start"
echo     Backend starting in new window...
timeout /t 5 /nobreak >nul
echo.

echo [3/3] Testing backend...
curl -s http://localhost:5001/ >nul 2>&1
if %errorlevel% equ 0 (
    echo     Backend is responding!
) else (
    echo     Waiting for backend to start...
    timeout /t 3 /nobreak >nul
    curl -s http://localhost:5001/ >nul 2>&1
    if %errorlevel% equ 0 (
        echo     Backend is now responding!
    ) else (
        echo     Backend may need more time to start
    )
)
echo.

echo ========================================
echo  DONE!
echo ========================================
echo.
echo Check the "Backend Server" window for status.
echo It should show: "Server running on port 5001"
echo.
echo Now refresh your Dashboard at: http://localhost:3000
echo.
pause
