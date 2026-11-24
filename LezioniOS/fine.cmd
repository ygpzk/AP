@echo off
rem Fine lezione: ferma la registrazione. La trascrizione finisce l'audio rimasto, poi la lezione si sviluppa da sola
rem (lavagna pulita, audio in Opus) e compare in Galleria. E' il collegamento «Fine lezione» sul desktop.
cd /d "%~dp0"
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:2380/api/azione' -ContentType 'application/json' -Body '{\"tipo\":\"ferma\"}' -TimeoutSec 8; if ($r.ok) { 'Lezione fermata: la trovi in Galleria appena e'' sviluppata.' } else { $r.errore } } catch { 'Lezioni OS non risponde (e'' acceso?).' }"
call "%~dp0avvia.cmd" #galleria
