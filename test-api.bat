@echo off
REM ================================
REM User Management API Test Suite
REM ================================

REM Color codes for output
setlocal enabledelayedexpansion

echo.
echo ================================
echo User Management System Test
echo ================================
echo.

REM Test 1: Server Health Check
echo [TEST 1] Server Health Check...
curl -s http://localhost:3000/ > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo OK - Server is running
) else (
    echo FAILED - Server not responding
    echo Run: npm run dev
    exit /b 1
)
echo.

REM Test 2: Register a User
echo [TEST 2] Register New User...
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Test User\",\"militaryId\":\"NSS-999999\",\"email\":\"test@military.mil\",\"mobile\":\"+1-555-0000\",\"dob\":\"1990-01-01\",\"rank\":\"Colonel\",\"password\":\"Test123\"}" 2>&1 | findstr /C:"success"
echo.

REM Test 3: Get All Users
echo [TEST 3] Get All Users (Admin)...
curl -s http://localhost:3000/api/admin/users 2>&1 | findstr /C:"success"
echo.

REM Test 4: Login
echo [TEST 4] User Login...
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"militaryId\":\"NSS-999999\",\"password\":\"Test123\"}" 2>&1 | findstr /C:"success"
echo.

echo ================================
echo Tests Complete
echo ================================
