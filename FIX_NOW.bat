@echo off
echo ========================================
echo  CALENDAR SYNC FIX - AUTOMATED SETUP
echo ========================================
echo.

REM Step 1: Check MongoDB
echo [1/6] Checking MongoDB status...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is running
) else (
    echo [WARNING] MongoDB is not running!
    echo Starting MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to start MongoDB
        echo Please start MongoDB manually:
        echo   - Open Services (services.msc)
        echo   - Find "MongoDB" service
        echo   - Click "Start"
        echo.
        echo Or install MongoDB from: https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
    echo [OK] MongoDB started
)
echo.

REM Step 2: Kill old node processes
echo [2/6] Stopping old backend processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM node.exe >nul 2>&1
    echo [OK] Stopped old node processes
) else (
    echo [OK] No node processes running
)
timeout /t 2 /nobreak >nul
echo.

REM Step 3: Install dependencies
echo [3/6] Checking backend dependencies...
cd backend
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ready
echo.

REM Step 4: Run migration
echo [4/6] Running migration script...
echo This will convert old schedule data to the new system...
node src/scripts/migrateSchedule.js
if %errorlevel% neq 0 (
    echo [WARNING] Migration had issues (this is OK if no old data exists)
) else (
    echo [OK] Migration completed
)
echo.

REM Step 5: Start backend
echo [5/6] Starting backend server...
start "Backend Server" cmd /k "npm start"
echo [OK] Backend starting... (check the new window)
timeout /t 3 /nobreak >nul
echo.

REM Step 6: Start frontend
echo [6/6] Starting frontend server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"
echo [OK] Frontend starting... (check the new window)
echo.

echo ========================================
echo  SETUP COMPLETE!
echo ========================================
echo.
echo Backend: Check the "Backend Server" window
echo Frontend: Check the "Frontend Server" window
echo.
echo Once both servers are running:
echo   1. Open http://localhost:5173
echo   2. Login to your account
echo   3. Go to Schedule page
echo   4. Add a test class
echo   5. Go to Dashboard
echo   6. Verify class appears in calendar
echo.
echo If classes still don't appear:
echo   - Go to Schedule page
echo   - Add schedule entries again
echo   - They will auto-generate on Dashboard
echo.
echo Troubleshooting:
echo   Run: cd backend
echo   Run: node src/scripts/diagnose.js
echo.
pause
