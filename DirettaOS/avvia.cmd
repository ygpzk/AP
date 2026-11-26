@echo off
rem Diretta OS: doppio clic e si apre la regia, http://localhost:2350/. Il server parte da solo all'accensione (attivita'
rem pianificata «Diretta OS», vedi servizio.cmd); se adesso non e' acceso, lo accende. Dopo un aggiornamento: riavvia.cmd.
cd /d "%~dp0"
where node >nul 2>nul || (echo Serve Node.js 20 o piu': https://nodejs.org & pause & exit /b 1)
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 2350 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  schtasks /query /tn "Diretta OS" >nul 2>nul && (schtasks /run /tn "Diretta OS" >nul) || (start "Diretta OS" /min cmd /c servizio.cmd)
  ping -n 4 127.0.0.1 >nul
)
rem la regia si apre in Chromium, col suo profilo (se c'e'); se no, col browser di default
if exist "%LOCALAPPDATA%\Chromium\Application\chrome.exe" (
  call "%~dp0chromium-diretta.cmd"
) else (
  start http://localhost:2350/
)
