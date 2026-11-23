@echo off
chcp 65001 > nul
title VitaCare - Trinh Khoi Chay Tu Dong 1-Click
cd /d "%~dp0"

echo ===================================================================
echo             HE THONG QUAN LY SUC KHOE VITACARE
echo                  (Tu dong mo Backend + Mobile)
echo ===================================================================
echo.

set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
set EMULATOR="%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"

REM 1. Kiem tra may ao Android
echo [1/4] Kiem tra may ao Android...
%ADB% devices | findstr "emulator" > nul
if errorlevel 1 goto START_EMULATOR
echo    -^> May ao Android dang hoat dong.
goto CHECK_BACKEND

:START_EMULATOR
echo    -^> Dang bat may ao Android...
start "" %EMULATOR% -avd Medium_Phone
echo    -^> Dang cho may ao khoi dong...
%ADB% wait-for-device

:CHECK_BACKEND
REM Danh thuc va mo khoa may ao
%ADB% shell input keyevent 224 > nul 2>&1
%ADB% shell input keyevent 82 > nul 2>&1

REM 2. Kiem tra Backend API (Cong 3000)
echo.
echo [2/4] Kiem tra Backend API Cong 3000...
netstat -ano | findstr ":3000" | findstr "LISTENING" > nul
if errorlevel 1 (
    echo    -^> Dang khoi dong Backend NestJS...
    start "VitaCare Backend (Port 3000)" cmd /k "pnpm --filter api start:dev"
    ping 127.0.0.1 -n 6 > nul
) else (
    echo    -^> Backend dang chay san sang.
)
REM 3. Kiem tra Metro Bundler Mobile (Cong 8081)
echo.
echo [3/4] Kiem tra Metro Bundler Mobile Cong 8081...
netstat -ano | findstr ":8081" | findstr "LISTENING" > nul
if errorlevel 1 (
    echo    -^> Dang khoi dong Metro Bundler...
    start "VitaCare Metro (Port 8081)" cmd /k "cd apps\mobile && npx expo start --port 8081"
    ping 127.0.0.1 -n 6 > nul
) else (
    echo    -^> Metro Bundler dang chay san sang.
)
REM 4. Anh xa cong va mo ung dung tren may ao
echo.
echo [4/4] Ket noi cong mang va mo giao dien VitaCare...
%ADB% reverse tcp:8081 tcp:8081 > nul 2>&1
%ADB% reverse tcp:3000 tcp:3000 > nul 2>&1
%ADB% shell am start -n host.exp.exponent/.LauncherActivity > nul 2>&1`r`nping 127.0.0.1 -n 2 > nul`r`n%ADB% shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" > nul 2>&1

echo.
echo ===================================================================
echo  [HOAN TAT] Ung dung VitaCare da mo tren may ao Android!
echo  Ban co the bat dau su dung va kiem thu tinh nang ngay bay gio.
echo ===================================================================
echo.
ping 127.0.0.1 -n 6 > nul
pause
