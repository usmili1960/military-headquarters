@echo off
REM Start the Military Headquarters Server on port 3000
cd /d "%~dp0"
echo Starting Military Headquarters Server on port 3000...
node server/app.js
pause
