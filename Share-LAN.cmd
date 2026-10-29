@echo off
setlocal
cd /d "%~dp0frontend"
if not exist "dist\index.html" (
  call npm.cmd run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Starting SwitchDesk for other computers on your network.
echo Leave this window open while sharing.
call npm.cmd run share
echo.
echo Sharing has stopped. Press any key to close this window.
pause >nul
