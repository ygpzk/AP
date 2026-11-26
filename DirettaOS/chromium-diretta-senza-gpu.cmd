@echo off
rem Come chromium-diretta.cmd, ma con l'accelerazione GPU spenta davvero (Chromium usa il software).
rem La regia e le pagine della regia perdono un po' di fluidita'; per il livello di Camo vedi il README.
setlocal
set "CHROME=%LOCALAPPDATA%\Chromium\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chromium non c'e': installalo con: winget install --id Hibbiki.Chromium --exact
  pause
  exit /b 1
)
start "" "%CHROME%" ^
  --user-data-dir="%~dp0cache\chromium-profilo-senza-gpu" ^
  --no-first-run --no-default-browser-check ^
  --disable-gpu --disable-gpu-compositing ^
  --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling ^
  --app="http://localhost:2350/" --window-size=1500,950
