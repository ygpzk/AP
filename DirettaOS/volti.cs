// Diretta OS: i volti, senza PowerShell. Legge ritagli RGB 320 × 240 dallo standard input, uno dopo l'altro, e per
// ognuno risponde con una riga:
//   F x1,y1,x2,y2,p;x1,y1,x2,y2,p…   i volti trovati, in frazioni del ritaglio (0–1), p = quanto è sicuro
// All'avvio scrive PRONTO; se Windows ML o il modello mancano scrive NO e si ferma.
// Si compila una volta sola con csc (strumenti/compila-volti.mjs o occhio.mjs): è lo stesso modello ONNX di volti.ps1,
// Ultra-Light Face Detector (MIT), con Windows ML che c'è già in Windows 10. Rispetto a PowerShell: niente interprete,
// niente Add-Type a ogni avvio, metà memoria (la CPU del modello è la stessa).
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using Windows.AI.MachineLearning;

static class Volti
{
  const int W = 320, H = 240, N = W * H;
  static readonly CultureInfo INV = CultureInfo.InvariantCulture;

  static int Main(string[] args)
  {
    if (args.Length < 1) { Console.WriteLine("NO modello"); return 1; }
    double soglia = args.Length > 1 ? double.Parse(args[1], INV) : 0.6;
    LearningModelSession sessione;
    try
    {
      var rete = LearningModel.LoadFromFilePath(args[0]);
      sessione = new LearningModelSession(rete, new LearningModelDevice(LearningModelDeviceKind.Cpu));
    }
    catch (Exception e)
    {
      Console.WriteLine("NO " + e.Message);
      return 1;
    }

    var entra = Console.OpenStandardInput();
    var buf = new byte[N * 3];
    var f = new float[N * 3];
    var forma = new long[] { 1, 3, H, W };
    // binding e uscite una volta sola; si ricrea solo il tensore d'ingresso, e si chiude quello di prima
    var leg = new LearningModelBinding(sessione);
    var punti = TensorFloat.Create(new long[] { 1, 4420, 2 });
    var riquadri = TensorFloat.Create(new long[] { 1, 4420, 4 });
    leg.Bind("scores", punti);
    leg.Bind("boxes", riquadri);
    TensorFloat prima = null;
    int giro = 0;
    Console.Out.WriteLine("PRONTO"); Console.Out.Flush();
    try
    {
      while (true)
      {
        int letti = 0;
        while (letti < buf.Length)
        {
          int r = entra.Read(buf, letti, buf.Length - letti);
          if (r <= 0) return 0;
          letti += r;
        }
        for (int i = 0; i < N; i++)
        {
          f[i] = (buf[3 * i] - 127f) / 128f;
          f[N + i] = (buf[3 * i + 1] - 127f) / 128f;
          f[2 * N + i] = (buf[3 * i + 2] - 127f) / 128f;
        }
        string riga;
        TensorFloat ora = null;
        try
        {
          ora = TensorFloat.CreateFromArray(forma, f);
          leg.Bind("input", ora);
          sessione.Evaluate(leg, "v");
          // (il binding non ha più il tensore di prima: si può chiudere; senza, la memoria nativa cresceva a ogni foto)
          if (prima != null) prima.Dispose();
          prima = ora;
          riga = Trova(punti.GetAsVectorView(), riquadri.GetAsVectorView(), soglia);
        }
        catch (Exception)
        {
          if (ora != null) ora.Dispose();
          riga = "F ";
        }
        Console.Out.WriteLine(riga); Console.Out.Flush();
        if ((++giro % 300) == 0) { GC.Collect(); GC.WaitForPendingFinalizers(); }
      }
    }
    finally
    {
      if (prima != null) prima.Dispose();
      punti.Dispose();
      riquadri.Dispose();
    }
  }

  // punteggi [N,2] e riquadri [N,4] (già in angoli 0–1) → i volti sopra soglia, senza doppioni
  static string Trova(IReadOnlyList<float> pu, IReadOnlyList<float> ri, double soglia)
  {
    int n = pu.Count / 2;
    var tutti = new List<double[]>();
    for (int i = 0; i < n; i++)
    {
      double p = pu[2 * i + 1];
      if (p >= soglia) tutti.Add(new double[] { ri[4 * i], ri[4 * i + 1], ri[4 * i + 2], ri[4 * i + 3], p });
    }
    tutti.Sort((a, b) => b[4].CompareTo(a[4]));
    var presi = new List<double[]>();
    foreach (var a in tutti)
    {
      bool doppio = false;
      foreach (var b in presi)
      {
        double ix = Math.Max(0, Math.Min(a[2], b[2]) - Math.Max(a[0], b[0]));
        double iy = Math.Max(0, Math.Min(a[3], b[3]) - Math.Max(a[1], b[1]));
        double inter = ix * iy;
        double uni = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
        if (uni > 0 && inter / uni > 0.3) { doppio = true; break; }
      }
      if (!doppio) presi.Add(a);
      if (presi.Count >= 6) break;
    }
    var s = new StringBuilder("F ");
    foreach (var a in presi)
      s.Append(string.Format(INV, "{0:0.####},{1:0.####},{2:0.####},{3:0.####},{4:0.###};", a[0], a[1], a[2], a[3], a[4]));
    return s.ToString();
  }
}
