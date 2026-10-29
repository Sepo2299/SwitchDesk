@echo off
setlocal
cd /d "%~dp0frontend"
echo Opening SwitchDesk internet sharing.
echo Leave this window open while others use your internet link.
call npm.cmd run share:internet
echo.
echo Internet sharing has stopped. Press any key to close this window.
pause >nul
