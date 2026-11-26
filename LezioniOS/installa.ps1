# Lezioni OS - installazione (o aggiornamento) su questo PC.
#
#   powershell -ExecutionPolicy Bypass -File installa.ps1 [-Avvio] [-SoloCollegamenti]
#
# 1. controlla Node.js (20 o piu') e ffmpeg;
# 2. crea (o aggiorna) in %LOCALAPPDATA%\Lezioni\venv un Python 3.12 tutto suo con le librerie di motore\requisiti.txt
#    (con uv, che prende se non c'e'); con una scheda video NVIDIA anche quelle di requisiti-gpu.txt;
# 3. scarica i modelli che servono subito: Whisper large-v3 (o small senza scheda video) e Robust Video Matting;
#    gli altri si scaricano dalla regia, vista Modelli;
# 4. lancia motore\controlla.py e dice cosa ha trovato;
# 5. mette sul desktop i collegamenti "Lezioni OS", "Lezione" e "Fine lezione".
# Con -Avvio registra anche l'attivita' pianificata "Lezioni OS": il server parte quando entri in Windows, senza
# finestre (serve all'avvio automatico dall'orario). Per toglierla: schtasks /delete /tn "Lezioni OS" /f
# Con -SoloCollegamenti rifa' solo i collegamenti sul desktop.
# Il Python di sistema non viene toccato. Per togliere tutto: cancella %LOCALAPPDATA%\Lezioni e i tre collegamenti
# (le lezioni registrate restano dove sono).
param([switch]$Avvio, [switch]$SoloCollegamenti)

$ErrorActionPreference = 'Stop'
$qui = $PSScriptRoot
$casa = Join-Path $env:LOCALAPPDATA 'Lezioni'
$py = Join-Path $casa 'venv\Scripts\python.exe'

function Collegamento($nome, $bersaglio, $icona, $descrizione) {
    $sh = New-Object -ComObject WScript.Shell
    $l = $sh.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) "$nome.lnk"))
    $l.TargetPath = Join-Path $env:SystemRoot 'System32\cmd.exe'
    $l.Arguments = "/c `"$bersaglio`""
    $l.WorkingDirectory = $qui
    $l.WindowStyle = 7  # ridotta a icona: la finestra nera non si vede
    $l.IconLocation = $icona
    $l.Description = $descrizione
    $l.Save()
    Write-Host "collegamento sul desktop: $nome"
}
function Collegamenti {
    Collegamento 'Lezioni OS' (Join-Path $qui 'avvia.cmd') (Join-Path $qui 'lezione.ico') 'La regia delle lezioni'
    Collegamento 'Lezione' (Join-Path $qui 'lezione.cmd') (Join-Path $qui 'lezione.ico') 'Avvia la registrazione della lezione'
    Collegamento 'Fine lezione' (Join-Path $qui 'fine.cmd') (Join-Path $qui 'fine.ico') 'Ferma la registrazione della lezione'
}
if ($SoloCollegamenti) { Collegamenti; exit 0 }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Serve Node.js 20 o piu'': https://nodejs.org' -ForegroundColor Yellow; exit 1 }
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { Write-Host 'Manca ffmpeg (serve per l''audio in Opus): winget install Gyan.FFmpeg' -ForegroundColor Yellow }

$uv = (Get-Command uv -ErrorAction SilentlyContinue).Source
if (-not $uv) { $uv = Join-Path $env:USERPROFILE '.local\bin\uv.exe' }
if (-not (Test-Path $uv)) {
    Write-Host 'Prendo uv (nella cartella utente, senza permessi da amministratore)...'
    Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
}
New-Item -ItemType Directory -Force $casa, (Join-Path $casa 'modelli') | Out-Null
if (-not (Test-Path $py)) { & $uv venv --python 3.12 --seed (Join-Path $casa 'venv') }
$gpu = [bool](Get-Command nvidia-smi -ErrorAction SilentlyContinue)
$req = @('-r', (Join-Path $qui 'motore\requisiti.txt'), '-r', (Join-Path $qui ('motore\requisiti-' + $(if ($gpu) { 'gpu' } else { 'cpu' }) + '.txt')))
if ($env:ANTHROPIC_API_KEY) { $req += @('-r', (Join-Path $qui 'motore\requisiti-claude.txt')) }
& $uv pip install --python $py @req
if ($gpu) { & $uv pip uninstall --python $py onnxruntime 2>$null }  # resta solo quello per GPU: insieme si pestano

$env:PYTHONUTF8 = '1'
Push-Location (Join-Path $qui 'motore')
try {
    Write-Host 'Scarico i modelli che servono subito (la prima volta: qualche GB)...'
    & $py -c "from faster_whisper import download_model; import ctranslate2; download_model('large-v3' if ctranslate2.get_cuda_device_count() else 'small')"
    if (-not (Test-Path (Join-Path $casa 'modelli\rvm_mobilenetv3_fp32.onnx'))) { & $py modelli.py scarica rvm }
    & $py modelli.py scarica silero-vad
    & $py controlla.py
} finally { Pop-Location }

Collegamenti
if ($Avvio) {
    schtasks /create /f /tn 'Lezioni OS' /sc onlogon /rl limited /tr "wscript.exe `"$(Join-Path $qui 'servizio.vbs')`"" | Out-Null
    Write-Host 'Attivita'' pianificata "Lezioni OS": il server parte quando entri in Windows.'
    schtasks /run /tn 'Lezioni OS' | Out-Null
}
Write-Host 'Fatto. "Lezioni OS" sul desktop apre la regia: http://localhost:2380/' -ForegroundColor Green
