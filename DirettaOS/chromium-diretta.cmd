@echo off
rem Apre la regia di Diretta OS in Chromium, con un profilo suo (non tocca il Chromium normale).
rem Il server deve essere acceso: se non lo e', usa avvia.cmd.
setlocal
set "CHROME=%LOCALAPPDATA%\Chromium\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chromium non c'e': installalo con: winget install --id Hibbiki.Chromium --exact
  pause
  exit /b 1
)
start "" "%CHROME%" ^
  --user-data-dir="%~dp0cache\chromium-profilo" ^
  --no-first-run --no-default-browser-check ^
  --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling ^
  --app="http://localhost:2350/" --window-size=1500,950
