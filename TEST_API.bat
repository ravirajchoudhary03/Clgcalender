@echo off
echo ========================================
echo  API ENDPOINT VERIFICATION
echo ========================================
echo.

echo Testing backend endpoints...
echo.

echo [1] Testing root endpoint...
curl -s http://localhost:5001/ 2>nul
if %errorlevel% equ 0 (
    echo.
    echo     ✅ Backend is running
) else (
    echo     ❌ Backend is NOT running
    echo     Run RESTART_BACKEND.bat first
    pause
    exit /b 1
)
echo.

echo [2] Testing login...
curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}" > temp_token.txt 2>nul
echo.
type temp_token.txt
echo.

for /f "tokens=2 delims=:" %%a in ('type temp_token.txt ^| findstr /C:"token"') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN:,=%
set TOKEN=%TOKEN: =%

if not defined TOKEN (
    echo     ❌ Login failed
    del temp_token.txt 2>nul
    pause
    exit /b 1
)
echo     ✅ Login successful
echo.

echo [3] Testing subjects endpoint...
curl -s http://localhost:5001/api/attendance/subjects -H "Authorization: Bearer %TOKEN%" 2>nul
echo.
echo     ✅ Subjects endpoint working
echo.

echo [4] Testing week classes endpoint (THE IMPORTANT ONE!)...
curl -s "http://localhost:5001/api/attendance/classes/week?weekOffset=0" -H "Authorization: Bearer %TOKEN%" 2>nul
echo.
echo.

del temp_token.txt 2>nul

echo ========================================
echo  TEST COMPLETE
echo ========================================
echo.
echo If you see "Cannot GET" error above, the backend
echo needs to be restarted with the new code.
echo.
echo Run: RESTART_BACKEND.bat
echo.
pause
