// Diretta OS: le persone, per far passare il corpo davanti a quello che è appeso ai muri. Legge dal suo standard
// input, uno dopo l'altro, un'intestazione di 11 byte, i riquadri dei pezzi in sovrimpressione e un fotogramma RGB 640 × 360:
//   int16 x, int16 y, int16 larghezza, int16 altezza (la faccia, nella foto 640 × 360), 1 byte (1 = c'è la faccia),
//   1 byte (quanti riquadri), poi 8 byte per riquadro (int16 x, y, larghezza, altezza, sempre nella 640 × 360),
//   poi 640 × 360 × 3 byte di RGB.
// I riquadri sono i pezzi già disegnati da Camo: lì il modello non deve cercare persone (la vista esterna ha una
// persona dentro, un meme può averla): si azzera la sua maschera lì, e ci pensa la testa/busto stimati dalla faccia.
// Per ognuno risponde con una maschera 480 × 270 a 1 bit per pixel (1 = persona), impacchettata una riga dopo l'altra,
// 60 byte per riga: la usa l'occhio per dire alle pagine dove sei tu.
// Il modello è MediaPipe Selfie Segmentation (Apache 2.0), convertito in opset 9 perché Windows ML di Windows 10 non
// legge gli opset nuovi. Alla maschera del modello si aggiunge la testa e il busto stimati dalla faccia: così, quando la
// finestra della vista esterna ti copre la testa, il buco nella finestra c'è lo stesso (il modello da solo, sotto una
// sovrimpressione grande, ti perde).
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using Windows.AI.MachineLearning;

static class Persone
{
  const int W = 640, H = 360, N = W * H;
  const int MW = 256, MH = 256, MN = MW * MH;
  const int OW = 480, OH = 270, ON = OW * OH, RIGA = OW / 8, TESTA = 11, MAXRIQUADRI = 80;
  static readonly long[] Forma = { 1, 3, MH, MW };
  static readonly long[] FormaUscita = { 1, 1, MH, MW };

  static bool Leggi(Stream s, byte[] b, int n)
  {
    int letti = 0;
    while (letti < n)
    {
      int r = s.Read(b, letti, n - letti);
      if (r <= 0) return false;
      letti += r;
    }
    return true;
  }

  static float Alpha(IReadOnlyList<float> v, double x, double y)
  {
    if (x < 0) x = 0; if (y < 0) y = 0;
    if (x > MW - 1.001) x = MW - 1.001;
    if (y > MH - 1.001) y = MH - 1.001;
    int x0 = (int)x, y0 = (int)y;
    double tx = x - x0, ty = y - y0;
    int i = y0 * MW + x0;
    double a = v[i] * (1 - tx) + v[i + 1] * tx;
    double b = v[i + MW] * (1 - tx) + v[i + MW + 1] * tx;
    return (float)(a * (1 - ty) + b * ty);
  }

  // la testa (un ovale) e il busto (un trapezio) stimati dalla faccia, nella maschera 480 × 270
  static void Capsula(byte[] m, double fx0, double fy0, double fw0, double fh0)
  {
    double fx = fx0 * OW / W, fy = fy0 * OH / H, fw = fw0 * OW / W, fh = fh0 * OH / H;
    if (!(fw > 3) || !(fh > 3)) return;
    double cx = fx + fw / 2, cy = fy + fh / 2;
    // testa: appena più larga della faccia, alta fino a sopra i capelli
    double rx = fw * 0.56, ry = fh * 0.76, hx = cx, hy = cy + fh * 0.04;
    int x0 = Math.Max(0, (int)Math.Floor(hx - rx)), x1 = Math.Min(OW - 1, (int)Math.Ceiling(hx + rx));
    int y0 = Math.Max(0, (int)Math.Floor(hy - ry)), y1 = Math.Min(OH - 1, (int)Math.Ceiling(hy + ry));
    for (int y = y0; y <= y1; y++)
      for (int x = x0; x <= x1; x++)
      {
        double dx = (x - hx) / rx, dy = (y - hy) / ry;
        if (dx * dx + dy * dy <= 1) m[y * OW + x] = 1;
      }
    // il collo e il busto, dal mento in giù, un po' più stretti in fondo
    double top = fy + fh * 1.02, bot = Math.Min(OH - 1, fy + fh * 4.4);
    if (bot <= top) return;
    double sopra = fw * 1.12, sotto = fw * 0.98;
    for (int y = (int)Math.Ceiling(top); y <= (int)bot; y++)
    {
      double k = (y - top) / (bot - top), meta = sopra + (sotto - sopra) * k;
      int a = Math.Max(0, (int)Math.Floor(cx - meta)), b = Math.Min(OW - 1, (int)Math.Ceiling(cx + meta));
      for (int x = a; x <= b; x++) m[y * OW + x] = 1;
    }
  }

  // un pixel di dilatazione: la maschera arriva un attimo dopo il corpo, e un filo più larga non lascia scoperto il bordo
  static void Dilata(byte[] da, byte[] a)
  {
    Array.Copy(da, a, ON);
    for (int y = 1; y < OH - 1; y++)
      for (int x = 1; x < OW - 1; x++)
        if (da[y * OW + x] == 0 && (da[y * OW + x - 1] != 0 || da[y * OW + x + 1] != 0 || da[(y - 1) * OW + x] != 0 || da[(y + 1) * OW + x] != 0))
          a[y * OW + x] = 1;
  }

  static int Main(string[] args)
  {
    if (args.Length < 1) { Console.WriteLine("NO modello"); return 1; }
    LearningModelSession sessione;
    try
    {
      var rete = LearningModel.LoadFromFilePath(args[0]);
      sessione = new LearningModelSession(rete, new LearningModelDevice(LearningModelDeviceKind.Cpu));
    }
    catch (Exception e) { Console.WriteLine("NO " + e.Message); return 1; }

    var entra = Console.OpenStandardInput();
    var esce = Console.OpenStandardOutput();
    var testa = new byte[TESTA];
    var riquadri = new byte[MAXRIQUADRI * 8];
    var foto = new byte[N * 3];
    var f = new float[3 * MN];
    var uscita = new byte[ON];
    var dil = new byte[ON];
    var righe = new byte[RIGA * OH];
    var alpha = new float[MN];
    var leg = new LearningModelBinding(sessione);
    var alphas = TensorFloat.Create(FormaUscita);
    leg.Bind("alphas", alphas);
    TensorFloat prima = null;
    Console.Out.WriteLine("PRONTO"); Console.Out.Flush();
    int giro = 0;
    try
    {
      while (true)
      {
        if (!Leggi(entra, testa, TESTA)) return 0;
        int nRiquadri = Math.Min(MAXRIQUADRI, (int)testa[10]);
        if (nRiquadri > 0 && !Leggi(entra, riquadri, nRiquadri * 8)) return 0;
        if (!Leggi(entra, foto, foto.Length)) return 0;
        // 640 × 360 → 256 × 256, in RGB a piani (quello che vuole il modello)
        for (int y = 0; y < MH; y++)
        {
          double sy = (y + 0.5) * H / MH - 0.5;
          int y0 = (int)Math.Floor(sy); double ty = sy - y0;
          int ya = Math.Max(0, Math.Min(H - 1, y0)), yb = Math.Max(0, Math.Min(H - 1, y0 + 1));
          for (int x = 0; x < MW; x++)
          {
            double sx = (x + 0.5) * W / MW - 0.5;
            int x0 = (int)Math.Floor(sx); double tx = sx - x0;
            int xa = Math.Max(0, Math.Min(W - 1, x0)), xb = Math.Max(0, Math.Min(W - 1, x0 + 1));
            int i00 = (ya * W + xa) * 3, i10 = (ya * W + xb) * 3, i01 = (yb * W + xa) * 3, i11 = (yb * W + xb) * 3;
            double r = (foto[i00] * (1 - tx) + foto[i10] * tx) * (1 - ty) + (foto[i01] * (1 - tx) + foto[i11] * tx) * ty;
            double g = (foto[i00 + 1] * (1 - tx) + foto[i10 + 1] * tx) * (1 - ty) + (foto[i01 + 1] * (1 - tx) + foto[i11 + 1] * tx) * ty;
            double b = (foto[i00 + 2] * (1 - tx) + foto[i10 + 2] * tx) * (1 - ty) + (foto[i01 + 2] * (1 - tx) + foto[i11 + 2] * tx) * ty;
            int p = y * MW + x;
            f[p] = (float)(r / 255.0); f[MN + p] = (float)(g / 255.0); f[2 * MN + p] = (float)(b / 255.0);
          }
        }
        TensorFloat ora = null;
        try
        {
          ora = TensorFloat.CreateFromArray(Forma, f);
          leg.Bind("pixel_values", ora);
          sessione.Evaluate(leg, "v");
          if (prima != null) prima.Dispose();
          prima = ora;
          // (la vista del tensore è WinRT: leggerla pixel per pixel nel giro sotto costava secondi; la si copia una volta)
          var vista = alphas.GetAsVectorView();
          for (int i = 0; i < MN; i++) alpha[i] = vista[i];
          Array.Clear(uscita, 0, ON);
          for (int y = 0; y < OH; y++)
          {
            double ay = (y + 0.5) * MH / OH - 0.5;
            for (int x = 0; x < OW; x++)
            {
              double ax = (x + 0.5) * MW / OW - 0.5;
              if (Alpha(alpha, ax, ay) >= 0.45f) uscita[y * OW + x] = 1;
            }
          }
          // i pezzi in sovrimpressione non sono persone: dentro i loro riquadri la maschera del modello si azzera
          // (la vista esterna ha una persona dentro; un meme può averla). Testa e busto, dopo, rimettono la persona vera.
          for (int r = 0; r < nRiquadri; r++)
          {
            int rx = BitConverter.ToInt16(riquadri, r * 8), ry = BitConverter.ToInt16(riquadri, r * 8 + 2);
            int rw = BitConverter.ToInt16(riquadri, r * 8 + 4), rh = BitConverter.ToInt16(riquadri, r * 8 + 6);
            int rx1 = rx + Math.Max(0, rw), ry1 = ry + Math.Max(0, rh);
            int x0 = Math.Max(0, (int)Math.Floor(rx * (double)OW / W)), x1 = Math.Min(OW - 1, (int)Math.Ceiling(rx1 * (double)OW / W));
            int y0 = Math.Max(0, (int)Math.Floor(ry * (double)OH / H)), y1 = Math.Min(OH - 1, (int)Math.Ceiling(ry1 * (double)OH / H));
            for (int y = y0; y <= y1; y++)
              for (int x = x0; x <= x1; x++) uscita[y * OW + x] = 0;
          }
          // (la persona sta in una fascia attorno alla faccia: il tavolo e il muro ai lati non c'entrano)
          int fx = BitConverter.ToInt16(testa, 0), fy = BitConverter.ToInt16(testa, 2);
          int fw = BitConverter.ToInt16(testa, 4), fh = BitConverter.ToInt16(testa, 6);
          if (testa[8] == 1 && fw > 4 && fh > 4)
          {
            double cx = (fx + fw / 2.0) * OW / W, cy = fy * (double)OH / H;
            double fwo = fw * (double)OW / W, fho = fh * (double)OH / H;
            int xa = Math.Max(0, (int)Math.Floor(cx - fwo * 1.9)), xb = Math.Min(OW - 1, (int)Math.Ceiling(cx + fwo * 1.9));
            int ya = Math.Max(0, (int)Math.Floor(cy - fho * 0.7));
            for (int y = 0; y < OH; y++)
              for (int x = 0; x < OW; x++)
                if (x < xa || x > xb || y < ya) uscita[y * OW + x] = 0;
            Capsula(uscita, fx, fy, fw, fh);
          }
          Dilata(uscita, dil);
          // impacchetta: 1 = persona, bit 7 per il pixel più a sinistra di ogni byte
          Array.Clear(righe, 0, righe.Length);
          for (int y = 0; y < OH; y++)
            for (int x = 0; x < OW; x++)
              if (dil[y * OW + x] != 0) righe[y * RIGA + (x >> 3)] |= (byte)(1 << (7 - (x & 7)));
          esce.Write(righe, 0, righe.Length); esce.Flush();
        }
        catch (Exception e)
        {
          Console.Error.WriteLine("ERR " + e.GetType().Name + " " + e.Message);
          if (ora != null) ora.Dispose();
          // (una foto andata storta non deve fermare l'occhio: manda una maschera vuota)
          Array.Clear(righe, 0, righe.Length);
          esce.Write(righe, 0, righe.Length); esce.Flush();
        }
        if ((++giro % 300) == 0) { GC.Collect(); GC.WaitForPendingFinalizers(); }
      }
    }
    finally
    {
      if (prima != null) prima.Dispose();
      alphas.Dispose();
    }
  }
}
