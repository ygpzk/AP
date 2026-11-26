@echo off
rem Diretta OS come servizio: lo fa partire Windows all'accensione (attivita' pianificata «Diretta OS», senza finestre)
rem e lo rifa' partire da solo se si ferma. riavvia.cmd lo chiude e dopo tre secondi e' di nuovo su, col codice nuovo.
rem Quello che scrive il server finisce in diretta.log (si ricomincia a ogni accensione).
cd /d "%~dp0"
echo %date% %time% servizio partito> diretta.log
:giro
node server.mjs >> diretta.log 2>&1
echo %date% %time% il server si e' fermato: riparto fra 3 secondi>> diretta.log
rem (ping al posto di timeout: senza finestra timeout non funziona)
ping -n 4 127.0.0.1 >nul
goto giro
