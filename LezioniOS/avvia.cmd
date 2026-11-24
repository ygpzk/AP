@echo off
rem Lezioni OS: doppio clic e si apre la regia, http://localhost:2380/. Se il server non e' acceso lo accende
rem (dall'attivita' pianificata «Lezioni OS» se c'e', vedi installa.ps1 -Avvio; se no in una finestra ridotta a icona).
rem Dopo un aggiornamento: riavvia.cmd.
cd /d "%~dp0"
where node >nul 2>nul || (echo Serve Node.js 20 o piu': https://nodejs.org & pause & exit /b 1)
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 2380 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  schtasks /query /tn "Lezioni OS" >nul 2>nul && (schtasks /run /tn "Lezioni OS" >nul) || (start "Lezioni OS" /min cmd /c servizio.cmd)
  ping -n 4 127.0.0.1 >nul
)
rem la regia si apre in Chromium come un programma (se c'e'); se no in Edge, se no nel browser di default
if exist "%LOCALAPPDATA%\Chromium\Application\chrome.exe" (
  start "" "%LOCALAPPDATA%\Chromium\Application\chrome.exe" --user-data-dir="%~dp0cache\chromium-profilo" --no-first-run --no-default-browser-check --app="http://localhost:2380/%~1" --window-size=1500,950
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:2380/%~1" --window-size=1500,950
) else (
  start http://localhost:2380/%~1
)
