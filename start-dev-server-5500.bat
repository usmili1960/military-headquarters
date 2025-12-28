@echo off
REM Start the static file server on port 5500
REM Make sure the main server (port 3000) is already running!
cd /d "%~dp0"
echo Starting Development Server on port 5500...
echo Make sure the main server on port 3000 is running!
npm run serve-5500
pause
