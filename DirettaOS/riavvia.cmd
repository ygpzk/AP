@echo off
rem Riavvia Diretta OS (dopo un aggiornamento): chiude il server che risponde sulla porta 2350, con tutto quello che ha
rem acceso (ffmpeg, i sensori, i volti); il servizio lo rifa' partire da solo in tre secondi, col codice nuovo.
rem Prima gli chiede di chiudersi con le buone: la webcam «Camo» va chiusa per bene, perche' chiuderla di colpo mandava
rem il PC in schermata blu (il driver di Camo, 21 Nov 2026). Solo se dopo 12 secondi e' ancora acceso lo chiude di forza.
rem Se il servizio non c'e', lo accende. Poi ricarica i livelli in Camo.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 2350 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if (-not $c) { 'Diretta OS non era acceso.'; exit } $id = $c.OwningProcess; $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $id); if (-not ($p.Name -eq 'node.exe' -and $p.CommandLine -like '*server.mjs*')) { 'Sulla porta 2350 c''e'' un altro programma (' + $p.Name + '): non lo tocco.'; exit } $ok = $false; try { $r = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:2350/api/azione' -ContentType 'application/json' -Body (ConvertTo-Json @{ tipo = 'spegniti' }) -TimeoutSec 3; $ok = [bool]$r.ok } catch {} if ($ok) { 'Diretta OS chiude la webcam con le buone...'; $fino = (Get-Date).AddSeconds(12); while ((Get-Date) -lt $fino -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) { Start-Sleep -Milliseconds 300 } } if (Get-Process -Id $id -ErrorAction SilentlyContinue) { taskkill /PID $id /T /F | Out-Null; 'Diretta OS chiuso di forza: riparte da solo fra tre secondi.' } else { 'Diretta OS chiuso con le buone: riparte da solo fra tre secondi.' }"
schtasks /query /tn "Diretta OS" >nul 2>nul && schtasks /run /tn "Diretta OS" >nul
ping -n 8 127.0.0.1 >nul
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 2350 -State Listen -ErrorAction SilentlyContinue) { 'Diretta OS e'' di nuovo acceso. Ricarica i livelli in Camo.' } else { 'Non e'' ripartito: guarda diretta.log' }"
pause
