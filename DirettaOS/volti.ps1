# Diretta OS: i volti. Gira Ultra-Light Face Detector (modelli/volti-rfb-320.onnx, licenza MIT, ~1 MB) con Windows ML,
# che c'è già in Windows 10: niente da installare. A differenza del riconoscimento dei volti di Windows vede anche le
# facce girate, inclinate o che guardano giù verso la tastiera.
# Dal server (stdin) arrivano ritagli RGB 320 × 240, uno dopo l'altro; per ognuno risponde una riga:
#   F x1,y1,x2,y2,p;x1,y1,x2,y2,p…   i volti trovati, in frazioni del ritaglio (0–1), p = quanto è sicuro
# All'avvio scrive PRONTO; se Windows ML o il modello mancano scrive NO e si ferma.
param([string]$Modello = (Join-Path $PSScriptRoot 'modelli\volti-rfb-320.onnx'), [double]$Soglia = 0.7)
$ErrorActionPreference = 'Stop'
$W = 320; $H = 240

Add-Type -Language CSharp -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Text;
using System.Globalization;
public static class Volti {
  // RGB a byte → tensore 1×3×H×W, (v − 127) / 128 come nell'allenamento
  public static float[] Tensore(byte[] rgb, int w, int h) {
    int n = w * h; var f = new float[3 * n];
    for (int i = 0; i < n; i++) { f[i] = (rgb[3 * i] - 127f) / 128f; f[n + i] = (rgb[3 * i + 1] - 127f) / 128f; f[2 * n + i] = (rgb[3 * i + 2] - 127f) / 128f; }
    return f;
  }
  // punteggi [N,2] e riquadri [N,4] (già in angoli 0–1) → i volti sopra soglia, senza doppioni.
  // (arrivano come object: PowerShell non sa passare i vettori di Windows ML come liste, C# sì)
  public static string Trova(object opu, object ori, double soglia) {
    var pu = (IReadOnlyList<float>)opu; var ri = (IReadOnlyList<float>)ori;
    int n = pu.Count / 2; var tutti = new List<double[]>();
    for (int i = 0; i < n; i++) { double p = pu[2 * i + 1]; if (p >= soglia) tutti.Add(new double[] { ri[4 * i], ri[4 * i + 1], ri[4 * i + 2], ri[4 * i + 3], p }); }
    tutti.Sort((a, b) => b[4].CompareTo(a[4]));
    var presi = new List<double[]>();
    foreach (var a in tutti) {
      bool doppio = false;
      foreach (var b in presi) {
        double ix = Math.Max(0, Math.Min(a[2], b[2]) - Math.Max(a[0], b[0])), iy = Math.Max(0, Math.Min(a[3], b[3]) - Math.Max(a[1], b[1]));
        double inter = ix * iy, uni = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
        if (uni > 0 && inter / uni > 0.3) { doppio = true; break; }
      }
      if (!doppio) presi.Add(a);
      if (presi.Count >= 6) break;
    }
    var s = new StringBuilder("F ");
    foreach (var a in presi) s.Append(string.Format(CultureInfo.InvariantCulture, "{0:0.####},{1:0.####},{2:0.####},{3:0.####},{4:0.###};", a[0], a[1], a[2], a[3], a[4]));
    return s.ToString();
  }
}
'@

try {
  $null = [Windows.AI.MachineLearning.LearningModel, Windows.AI.MachineLearning, ContentType = WindowsRuntime]
  $null = [Windows.AI.MachineLearning.LearningModelSession, Windows.AI.MachineLearning, ContentType = WindowsRuntime]
  $null = [Windows.AI.MachineLearning.LearningModelBinding, Windows.AI.MachineLearning, ContentType = WindowsRuntime]
  $null = [Windows.AI.MachineLearning.TensorFloat, Windows.AI.MachineLearning, ContentType = WindowsRuntime]
  # (in PowerShell i nomi non badano alle maiuscole: $rete, non $modello, se no si mangia il parametro $Modello)
  $rete = [Windows.AI.MachineLearning.LearningModel]::LoadFromFilePath($Modello)
  $dispositivo = [Windows.AI.MachineLearning.LearningModelDevice]::new([Windows.AI.MachineLearning.LearningModelDeviceKind]::Cpu)
  $sessione = [Windows.AI.MachineLearning.LearningModelSession]::new($rete, $dispositivo)
} catch { [Console]::Out.WriteLine('NO ' + $_.Exception.Message); [Console]::Out.Flush(); exit 1 }

$entra = [Console]::OpenStandardInput()
$N = $W * $H * 3
$buf = New-Object byte[] $N
$forma = [long[]]@(1, 3, $H, $W)
$giro = 0
[Console]::Out.WriteLine('PRONTO'); [Console]::Out.Flush()
while ($true) {
  $letti = 0
  while ($letti -lt $N) { $r = $entra.Read($buf, $letti, $N - $letti); if ($r -le 0) { exit 0 }; $letti += $r }
  try {
    # (le uscite si preparano prima e si legano: PowerShell non sa leggere il dizionario Outputs di Windows ML)
    $leg = [Windows.AI.MachineLearning.LearningModelBinding]::new($sessione)
    $punti = [Windows.AI.MachineLearning.TensorFloat]::Create([long[]]@(1, 4420, 2))
    $riquadri = [Windows.AI.MachineLearning.TensorFloat]::Create([long[]]@(1, 4420, 4))
    $leg.Bind('input', [Windows.AI.MachineLearning.TensorFloat]::CreateFromArray($forma, [Volti]::Tensore($buf, $W, $H)))
    $leg.Bind('scores', $punti); $leg.Bind('boxes', $riquadri)
    $null = $sessione.Evaluate($leg, 'v')
    $riga = [Volti]::Trova([object]$punti.GetAsVectorView(), [object]$riquadri.GetAsVectorView(), $Soglia)
  } catch { $riga = 'F ' }
  [Console]::Out.WriteLine($riga); [Console]::Out.Flush()
  # (i tensori di ogni fotogramma sono grandi: ogni 300 fotogrammi, circa 75 secondi a 4 al secondo, una pulita)
  if ((++$giro % 300) -eq 0) { [System.GC]::Collect() }
}
