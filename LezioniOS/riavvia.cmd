@echo off
rem Riavvia Lezioni OS (dopo un aggiornamento): chiede al server sulla porta 2380 di chiudersi; il servizio lo rifa'
rem partire da solo in tre secondi, col codice nuovo. Se il servizio non c'e', lo accende. Una lezione in registrazione
rem va avanti: il server nuovo la riprende.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 2380 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if (-not $c) { 'Lezioni OS non era acceso.'; exit } $id = $c.OwningProcess; $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $id); if (-not ($p.Name -eq 'node.exe' -and $p.CommandLine -like '*server.mjs*')) { 'Sulla porta 2380 c''e'' un altro programma (' + $p.Name + '): non lo tocco.'; exit } try { Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:2380/api/azione' -ContentType 'application/json' -Body (ConvertTo-Json @{ tipo = 'spegniti' }) -TimeoutSec 3 | Out-Null } catch {} $fino = (Get-Date).AddSeconds(6); while ((Get-Date) -lt $fino -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) { Start-Sleep -Milliseconds 300 } if (Get-Process -Id $id -ErrorAction SilentlyContinue) { Stop-Process -Id $id -Force; 'Lezioni OS chiuso di forza.' } else { 'Lezioni OS chiuso.' }"
ping -n 5 127.0.0.1 >nul
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 2380 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  schtasks /query /tn "Lezioni OS" >nul 2>nul && (schtasks /run /tn "Lezioni OS" >nul) || (start "Lezioni OS" /min cmd /c servizio.cmd)
  ping -n 5 127.0.0.1 >nul
)
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 2380 -State Listen -ErrorAction SilentlyContinue) { 'Lezioni OS e'' acceso: http://localhost:2380/' } else { 'Non e'' ripartito: guarda lezioni.log' }"
