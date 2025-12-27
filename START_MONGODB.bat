@echo off
echo ========================================
echo   STARTING MONGODB SERVICE
echo ========================================
echo.

echo Attempting to start MongoDB service...
echo.

net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS! MongoDB is now running.
    echo.
    goto :continue
)

net start "MongoDB Server" >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS! MongoDB Server is now running.
    echo.
    goto :continue
)

echo WARNING: Could not start MongoDB automatically.
echo.
echo Please start MongoDB manually:
echo.
echo METHOD 1 - Windows Services:
echo   1. Press Windows + R
echo   2. Type: services.msc
echo   3. Press Enter
echo   4. Find "MongoDB" or "MongoDB Server"
echo   5. Right-click and select "Start"
echo.
echo METHOD 2 - Command Prompt (as Admin):
echo   1. Right-click Command Prompt
echo   2. Select "Run as administrator"
echo   3. Type: net start MongoDB
echo.
echo If MongoDB is not installed:
echo   Download from: https://www.mongodb.com/try/download/community
echo.
pause
exit /b 1

:continue
echo MongoDB is running successfully!
echo.
echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo 1. Run: test_and_fix.js to generate data
echo 2. Start backend: npm start
echo 3. Start frontend: npm run dev
echo 4. Open browser: http://localhost:5173
echo.
echo Run these commands in the 'backend' folder:
echo   cd backend
echo   node test_and_fix.js
echo   npm start
echo.
pause
