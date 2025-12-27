@echo off
REM College Organizer - Quick Start Script for Windows

echo.
echo 🎓 College Organizer - Setup Script
echo ====================================
echo.

REM Backend setup
echo 📦 Setting up Backend...
cd backend
if not exist ".env" (
    echo Creating .env from template...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your MongoDB URI and JWT_SECRET
)

echo Installing backend dependencies...
call npm install

if %errorlevel% equ 0 (
    echo ✅ Backend setup complete
) else (
    echo ❌ Backend setup failed
    pause
    exit /b 1
)

REM Return to root
cd ..

REM Frontend setup
echo.
echo 🎨 Setting up Frontend...
cd frontend
if not exist ".env" (
    echo Creating .env from template...
    copy .env.example .env
)

echo Installing frontend dependencies...
call npm install

if %errorlevel% equ 0 (
    echo ✅ Frontend setup complete
) else (
    echo ❌ Frontend setup failed
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Edit backend\.env with your MongoDB connection string
echo 2. Open two terminals and run:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo 3. Visit: http://localhost:3000
echo.
echo To seed demo data:
echo   cd backend
echo   npm run seed
echo.
pause
