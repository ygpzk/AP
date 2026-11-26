@echo off
rem Lezioni OS come servizio: il server sempre acceso (serve all'avvio automatico dall'orario), rifatto partire da solo
rem se si ferma. riavvia.cmd lo chiude e dopo tre secondi e' di nuovo su, col codice nuovo. Una lezione in registrazione
rem non si ferma: registratore e trascrittore vivono da soli, e il server quando torna li riprende.
rem Quello che scrive il server finisce in lezioni.log (si ricomincia a ogni accensione).
cd /d "%~dp0"
echo %date% %time% servizio partito> lezioni.log
:giro
node server.mjs >> lezioni.log 2>&1
echo %date% %time% il server si e' fermato: riparto fra 3 secondi>> lezioni.log
rem (ping al posto di timeout: senza finestra timeout non funziona)
ping -n 4 127.0.0.1 >nul
goto giro
