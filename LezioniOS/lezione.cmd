@echo off
rem Lezione: accende Lezioni OS se serve, avvia la registrazione e apre la regia. E' il collegamento «Lezione» sul desktop.
rem La materia e' quella dell'orario in quel momento (o quella scelta nella regia).
cd /d "%~dp0"
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 2380 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  schtasks /query /tn "Lezioni OS" >nul 2>nul && (schtasks /run /tn "Lezioni OS" >nul) || (start "Lezioni OS" /min cmd /c servizio.cmd)
  ping -n 4 127.0.0.1 >nul
)
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:2380/api/azione' -ContentType 'application/json' -Body '{\"tipo\":\"avvia\"}' -TimeoutSec 8; if ($r.ok) { 'Lezione in registrazione: ' + $r.id } else { $r.errore } } catch { 'Lezioni OS non risponde: guarda lezioni.log' }"
call "%~dp0avvia.cmd"
