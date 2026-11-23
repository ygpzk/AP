# Diretta OS: i componenti veri del pc, una volta sola all'accensione (processore, scheda video, ram, dischi, wi-fi)
# e il resoconto nerd che sta sul muro: date, driver, software, cache, monitor, audio, rete, processi.
# Esce subito: i moduli CIM/Storage/NetAdapter che servono a leggerli sono grandi (circa 150 MB) e non devono restare
# appesi per tutta la diretta. Il giro da 2 volte al secondo sta in macchina.ps1, che così resta leggero.
#   I {...}   i componenti, poi basta (lo legge macchina.mjs)
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

function Quando($d) {
  if ($null -eq $d) { return $null }
  try { return ([datetime]$d).ToString('yyyy-MM-ddTHH:mm:ss') } catch { return $null }
}
function DataBreve($d) {
  if ($null -eq $d) { return $null }
  try {
    $s = [string]$d
    if ($s -match '^\d{8}$') { return ([datetime]::ParseExact($s, 'yyyyMMdd', $null)).ToString('yyyy-MM-dd') }
    return ([datetime]$d).ToString('yyyy-MM-dd')
  } catch { return $null }
}
function MB($percorso) {
  try {
    if (-not (Test-Path $percorso)) { return $null }
    $s = (Get-ChildItem $percorso -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($null -eq $s) { return 0 }
    return [math]::Round($s / 1MB)
  } catch { return $null }
}
function Testo($v) { if ($null -eq $v) { return $null }; $s = [string]$v; if ($s.Trim().Length -eq 0) { return $null }; return $s.Trim() }
function NomeMonitor($n) {
  if ($null -eq $n) { return $null }
  $s = -join ([char[]]$n | Where-Object { [int]$_ -ne 0 })
  return (Testo $s)
}

try {
  $cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
  $gpuInfo = Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Basic|Virtual|Parsec|Remote|Meta|Mirage' } | Select-Object -First 1
  $banchi = @(Get-CimInstance Win32_PhysicalMemory)
  $tipiRam = @{ 20 = 'DDR'; 21 = 'DDR2'; 24 = 'DDR3'; 26 = 'DDR4'; 34 = 'DDR5'; 35 = 'LPDDR5' }
  $ram = @{
    marca = Testo (($banchi | Select-Object -First 1).Manufacturer)
    gb = [math]::Round(($banchi | Measure-Object Capacity -Sum).Sum / 1GB)
    tipo = $tipiRam[[int]($banchi | Select-Object -First 1).SMBIOSMemoryType]
    mhz = ($banchi | Select-Object -First 1).ConfiguredClockSpeed
    mhzMax = ($banchi | Select-Object -First 1).Speed
    banchi = $banchi.Count
    parti = @($banchi | ForEach-Object { Testo $_.PartNumber })
    slot = @($banchi | ForEach-Object { Testo $_.DeviceLocator })
  }
  $dischi = @(Get-PhysicalDisk | ForEach-Object {
    [pscustomobject]@{ n = [int]$_.DeviceId; nome = "$($_.FriendlyName)"; tipo = "$($_.MediaType)"; bus = "$($_.BusType)"; gb = [math]::Round($_.Size / 1e9); salute = "$($_.HealthStatus)"; firmware = "$($_.FirmwareVersion)" }
  })
  $wifi = (Get-NetAdapter -Physical | Where-Object { $_.NdisPhysicalMedium -eq 9 } | Select-Object -First 1)
  $wifiNome = $wifi.InterfaceDescription
  $os = Get-CimInstance Win32_OperatingSystem
  $cs = Get-CimInstance Win32_ComputerSystem
  $bios = Get-CimInstance Win32_BIOS
  $board = Get-CimInstance Win32_BaseBoard
  $volumi = @{}
  foreach ($v in (Get-Volume | Where-Object { $_.DriveLetter })) {
    $volumi["$($v.DriveLetter)"] = @{ etichetta = "$($v.FileSystemLabel)"; fs = "$($v.FileSystem)"; gb = [math]::Round($v.Size / 1GB); libero = [math]::Round($v.SizeRemaining / 1GB) }
  }
  $ssd0 = $dischi | Where-Object { $_.n -eq 0 } | Select-Object -First 1
  if ($ssd0) {
    $c = $volumi['C']
    $volGb = $null; $volLib = $null
    if ($c) { $volGb = $c.gb; $volLib = $c.libero }
    $ssd0 | Add-Member -NotePropertyName volume -NotePropertyValue $volGb -Force
    $ssd0 | Add-Member -NotePropertyName libero -NotePropertyValue $volLib -Force
  }
  $monitors = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID | ForEach-Object {
    [pscustomobject]@{ nome = (NomeMonitor $_.UserFriendlyName); marca = (NomeMonitor $_.ManufacturerName); anno = $_.YearOfManufacture; seriale = (NomeMonitor $_.SerialNumberID) }
  } | Where-Object { $_.nome })
  $audio = @(Get-CimInstance Win32_SoundDevice | ForEach-Object { Testo $_.Name } | Where-Object { $_ } | Sort-Object -Unique)
  $ip = $null
  try { $ip = (Get-NetIPAddress -InterfaceIndex $wifi.ifIndex -AddressFamily IPv4 | Select-Object -First 1).IPAddress } catch {}
  $driver = @(Get-CimInstance Win32_PnPSignedDriver | Where-Object {
    $_.DeviceName -match 'NVIDIA GeForce|Realtek.*Audio|RTL8822|Intel.*RST|Management Engine|Logitech|HP 24f|HP X27|NVIDIA High Definition'
  } | ForEach-Object {
    [pscustomobject]@{ nome = (Testo $_.DeviceName); versione = (Testo $_.DriverVersion); data = (DataBreve $_.DriverDate); fornitore = (Testo $_.Manufacturer) }
  } | Where-Object { $_.nome } | Sort-Object nome, versione -Unique)
  $software = @(
    Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall' |
      ForEach-Object { Get-ItemProperty $_.PSPath } |
      Where-Object { $_.DisplayName -match 'Camo|Discord|Microsoft Edge|NVIDIA|OBS Studio|Steam|Tailscale|Visual Studio Code|Node\.js|HP (Application|Omen|Audio)|OMEN Gaming Hub' } |
      ForEach-Object { [pscustomobject]@{ nome = (Testo $_.DisplayName); versione = (Testo $_.DisplayVersion); data = (DataBreve $_.InstallDate); editore = (Testo $_.Publisher) } } |
      Where-Object { $_.nome } | Sort-Object nome -Unique
  )
  $processi = @(Get-Process | Where-Object { $_.WorkingSet64 -gt 20MB } | Sort-Object WorkingSet64 -Descending | Select-Object -First 8 | ForEach-Object {
    [pscustomobject]@{ nome = $_.ProcessName; mb = [math]::Round($_.WorkingSet64 / 1MB); id = $_.Id }
  })
  $avvio = @(Get-CimInstance Win32_StartupCommand | ForEach-Object { Testo $_.Name } | Where-Object { $_ } | Sort-Object -Unique)
  $memPerf = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
  $cache = @{
    nvidia = MB (Join-Path $env:LOCALAPPDATA 'NVIDIA\DXCache')
    nvidiaGl = MB (Join-Path $env:LOCALAPPDATA 'NVIDIA\GLCache')
    edge = MB (Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\User Data\Default\Cache\Cache_Data')
    discord = MB (Join-Path $env:APPDATA 'discord\Cache')
    windows = if ($memPerf) { [math]::Round([double]$memPerf.CacheBytes / 1MB) } else { $null }
  }
  $gpuNome = (Testo $gpuInfo.Name)
  $report = @{
    adesso = (Quando (Get-Date))
    avvio = (Quando $os.LastBootUpTime)
    sistema = @{
      os = (Testo $os.Caption); versione = (Testo $os.Version); build = (Testo $os.BuildNumber)
      installato = (Quando $os.InstallDate); host = (Testo $cs.Name); sku = (Testo $cs.SystemSKUNumber)
      modello = (Testo $cs.Model); produttore = (Testo $cs.Manufacturer)
      scheda = (Testo $board.Product); schedaMarca = (Testo $board.Manufacturer)
      bios = (Testo $bios.SMBIOSBIOSVersion); biosData = (Quando $bios.ReleaseDate)
      psu = '500 W · 80+ Bronze'
    }
    cpu = @{
      modello = (Testo $cpuInfo.Name); core = $cpuInfo.NumberOfCores; thread = $cpuInfo.NumberOfLogicalProcessors
      l2 = $cpuInfo.L2CacheSize; l3 = $cpuInfo.L3CacheSize; base = $cpuInfo.MaxClockSpeed
      socket = (Testo $cpuInfo.SocketDesignation); famiglia = (Testo $cpuInfo.Description)
      turbo = 4900; tdp = 65; turboW = 180
    }
    gpu = @{
      modello = $gpuNome; vram = 8; cuda = 4864; boost = 1665; tdp = 200
      driver = (Testo $gpuInfo.DriverVersion); driverData = (Quando $gpuInfo.DriverDate)
      risoluzione = if ($gpuInfo.CurrentHorizontalResolution) { "$($gpuInfo.CurrentHorizontalResolution)x$($gpuInfo.CurrentVerticalResolution)" } else { $null }
      hz = $gpuInfo.CurrentRefreshRate
    }
    ram = $ram
    dischi = $dischi
    volumi = $volumi
    monitor = $monitors
    audio = $audio
    rete = @{ nome = (Testo $wifiNome); velocita = (Testo $wifi.LinkSpeed); ip = $ip }
    driver = $driver
    software = $software
    processi = $processi
    avvioProgrammi = $avvio
    cache = $cache
    tv = @{ nome = '[LG] webOS TV QNED756RA'; modello = 'QNED756RA'; ip = '10.1.12.106' }
    secondario = @{ nome = 'Pavillion'; tipo = 'HP Pavilion'; rete = 'Wi-Fi · vista esterna' }
  }
  $out = @{ cpu = (Testo $cpuInfo.Name); gpu = $gpuNome; ram = $ram; dischi = $dischi; wifi = $wifiNome; report = $report }
  [Console]::Out.WriteLine('I ' + (ConvertTo-Json -Compress -Depth 8 $out))
} catch {
  [Console]::Out.WriteLine('I {}')
}
