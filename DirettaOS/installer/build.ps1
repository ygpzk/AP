# Diretta OS: ricompila il gestore e crea DirettaOS-Setup.exe con tutto dentro.
# Uso: powershell -ExecutionPolicy Bypass -File installer\build.ps1
param(
  [switch]$NoSetup,
  [switch]$NoSite
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$repo = Split-Path $root -Parent
$site = Join-Path $repo 'pzkko.it'
$build = Join-Path $PSScriptRoot 'build'
$payload = Join-Path $build 'payload'
$app = Join-Path $payload 'app'
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (!(Test-Path $csc)) { throw "Compilatore C# non trovato: serve .NET Framework 4.x (c'e' in Windows 10/11)." }
$ico = Join-Path $PSScriptRoot 'DirettaOS.ico'
if (!(Test-Path $ico)) { throw 'Manca installer\DirettaOS.ico' }

Write-Host 'Diretta OS: compilo il gestore...' -ForegroundColor Green
if (Test-Path $build) { Remove-Item $build -Recurse -Force }
New-Item -ItemType Directory -Force -Path $build, $payload, $app | Out-Null

$refs = @('/r:System.IO.Compression.dll', '/r:System.IO.Compression.FileSystem.dll', '/r:System.Web.Extensions.dll')
$src = @(Get-ChildItem (Join-Path $PSScriptRoot 'src') -Filter '*.cs' | ForEach-Object { $_.FullName })
& $csc /nologo /target:exe /optimize+ /codepage:65001 "/win32icon:$ico" "/out:$(Join-Path $build 'DirettaOS.exe')" @refs @src
if ($LASTEXITCODE -ne 0) { throw 'Compilazione del gestore non riuscita.' }
& (Join-Path $build 'DirettaOS.exe') version

Write-Host 'Diretta OS: preparo il pacchetto...' -ForegroundColor Green
Copy-Item (Join-Path $build 'DirettaOS.exe') (Join-Path $payload 'DirettaOS.exe') -Force

# il codice e le pagine del progetto
$files = @()
$files += Get-ChildItem $root -File | Where-Object {
  $_.Extension -in @('.mjs', '.ps1', '.cmd', '.cs') -or $_.Name -in @('config.json', 'README.md', 'cornice.gif', 'giugnoh.gif')
}
foreach ($f in $files) { Copy-Item $f.FullName (Join-Path $app $f.Name) -Force }
Copy-Item (Join-Path $root 'GUIDA-INSTALLAZIONE.md') (Join-Path $payload 'GUIDA-INSTALLAZIONE.md') -Force
foreach ($d in @('pubblico', 'strumenti')) {
  $s = Join-Path $root $d
  if (Test-Path $s) { Copy-Item $s (Join-Path $app $d) -Recurse -Force }
}

# caratteri e oggetti veri del sito: servono alle pagine (il sito non c'e', sul PC)
if (!$NoSite) {
  # server.mjs cerca ../pzkko.it/public rispetto ad app\: va accanto ad app, non dentro
  $sito = Join-Path $payload 'pzkko.it\public'
  New-Item -ItemType Directory -Force -Path (Join-Path $sito 'assets') | Out-Null
  Copy-Item (Join-Path $site 'public\fonts') (Join-Path $sito 'fonts') -Recurse -Force
  Copy-Item (Join-Path $site 'public\art') (Join-Path $sito 'art') -Recurse -Force
  Copy-Item (Join-Path $site 'public\assets\config.js') (Join-Path $sito 'assets\config.js') -Force
  Copy-Item (Join-Path $site 'public\assets\icons.js') (Join-Path $sito 'assets\icons.js') -Force
}

# le cartelle che l'installer crea vuote (qui restano vuote: i dati sono tuoi)
foreach ($d in @('riferimenti', 'foto', 'modelli', 'cache', 'cache\app', 'impara', 'copie')) {
  New-Item -ItemType Directory -Force -Path (Join-Path $app $d) | Out-Null
}
# (le cartelle vuote non entrano nello zip: l'installer le ricrea)

$leggimi = @'
DIRETTA OS: i primi passi

1. DirettaOS.exe start
2. DirettaOS.exe open
3. In Camo Studio o OBS: livello web 1920 x 1080 su http://localhost:2350/o/tutto

Tutti i comandi: DirettaOS.exe commands
La guida: GUIDA-INSTALLAZIONE.md
'@
Set-Content -Path (Join-Path $payload 'LEGGIMI.txt') -Value $leggimi -Encoding UTF8

$zip = Join-Path $build 'payload.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
$voci = Get-ChildItem $payload -Force | ForEach-Object { $_.FullName }
Compress-Archive -Path $voci -DestinationPath $zip -CompressionLevel Optimal
Write-Host ("Pacchetto: {0:N1} MB" -f ((Get-Item $zip).Length / 1MB)) -ForegroundColor Green

if ($NoSetup) {
  Write-Host 'Fatto (solo gestore e pacchetto, senza setup).' -ForegroundColor Green
  exit 0
}

Write-Host 'Diretta OS: compilo il setup con il pacchetto dentro...' -ForegroundColor Green
$setup = Join-Path $build 'DirettaOS-Setup.exe'
& $csc /nologo /target:exe /optimize+ /codepage:65001 "/win32icon:$ico" "/out:$setup" "/resource:$zip,payload.zip" @refs @src
if ($LASTEXITCODE -ne 0) { throw 'Compilazione del setup non riuscita.' }
& $setup version

$dest = Join-Path $site 'public\direttaos'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item $setup (Join-Path $dest 'DirettaOS-Setup.exe') -Force
Write-Host ("Setup: {0:N1} MB" -f ((Get-Item $setup).Length / 1MB)) -ForegroundColor Green
Write-Host ('Copiato in ' + (Join-Path $dest 'DirettaOS-Setup.exe')) -ForegroundColor Green
