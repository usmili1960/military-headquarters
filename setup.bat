@echo off
REM Military Headquarters Website - Windows Setup Script

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   Military Headquarters Website - Windows Setup Script         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please download and install Node.js from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js detected: %NODE_VERSION%
echo ✅ NPM detected: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
) else (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║             Setup Complete! Ready to Start Server             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo To start the server, run:
echo   npm start
echo.
echo Then open your browser to: http://localhost:3000
echo.
echo For development with auto-reload:
echo   npm run dev
echo.
pause
