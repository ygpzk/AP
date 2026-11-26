# Diretta OS: apre la porta 2360 (la pagina della tv) alle reti locali, senza aprirla a Internet.
# Va eseguito come amministratore (UAC). Si può rilanciare: se la regola c'è già, non la duplica.
$ErrorActionPreference = 'Stop'
$nome = 'Diretta OS TV (porta 2360)'
$regola = Get-NetFirewallRule -DisplayName $nome -ErrorAction SilentlyContinue
if (-not $regola) {
  New-NetFirewallRule -DisplayName $nome -Direction Inbound -Action Allow -Protocol TCP -LocalPort 2360 `
    -Profile Private, Public -RemoteAddress LocalSubnet -Description 'La pagina della tv di Diretta OS, solo dalla rete locale'
  Write-Host "Regola creata: $nome"
} else {
  Write-Host "Regola già presente: $nome"
}
Get-NetFirewallRule -DisplayName $nome | Format-List DisplayName,Enabled,Direction,Action,Profile
