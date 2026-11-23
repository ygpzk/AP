// Diretta OS: generato dalla parte C# di macchina.ps1. Se cambi quella, rigenera questo file (o cancella cache/macchina.exe).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace Diretta {
  [ComImport, Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IShellItem {
    void BindToHandler(IntPtr pbc, [MarshalAs(UnmanagedType.LPStruct)] Guid bhid, [MarshalAs(UnmanagedType.LPStruct)] Guid riid, out IntPtr ppv);
    void GetParent(out IShellItem ppsi);
    void GetDisplayName(uint sigdn, out IntPtr name);
    void GetAttributes(uint mask, out uint attr);
    void Compare(IShellItem psi, uint hint, out int order);
  }
  [StructLayout(LayoutKind.Sequential)] public struct SIZE { public int cx; public int cy; }
  [ComImport, Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IShellItemImageFactory { [PreserveSig] int GetImage(SIZE size, int flags, out IntPtr hbm); }

  public static class Macchina {
    static readonly CultureInfo INV = CultureInfo.InvariantCulture;

    // â”€â”€ i contatori di Windows (PDH, coi nomi inglesi: vanno su Windows in qualunque lingua) â”€â”€
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)] static extern int PdhOpenQuery(string src, IntPtr user, out IntPtr q);
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)] static extern int PdhAddEnglishCounter(IntPtr q, string path, IntPtr user, out IntPtr c);
    [DllImport("pdh.dll")] static extern int PdhCollectQueryData(IntPtr q);
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)] static extern int PdhGetFormattedCounterArray(IntPtr c, uint fmt, ref uint size, out uint count, IntPtr buf);
    static IntPtr q, cCpu, cDisco, cTemp;

    static Dictionary<string, double> Leggi(IntPtr c) {
      var d = new Dictionary<string, double>();
      uint size = 0, n;
      PdhGetFormattedCounterArray(c, 0x200, ref size, out n, IntPtr.Zero);
      if (size == 0) return d;
      IntPtr buf = Marshal.AllocHGlobal((int)size);
      try {
        if (PdhGetFormattedCounterArray(c, 0x200, ref size, out n, buf) != 0) return d;
        int passo = IntPtr.Size == 8 ? 24 : 16, val = IntPtr.Size == 8 ? 16 : 8, st = IntPtr.Size;
        for (int k = 0; k < n; k++) {
          IntPtr it = new IntPtr(buf.ToInt64() + k * passo);
          int stato = Marshal.ReadInt32(new IntPtr(it.ToInt64() + st));
          if (stato != 0 && stato != 1) continue;
          d[Marshal.PtrToStringUni(Marshal.ReadIntPtr(it))] = BitConverter.Int64BitsToDouble(Marshal.ReadInt64(new IntPtr(it.ToInt64() + val)));
        }
      } finally { Marshal.FreeHGlobal(buf); }
      return d;
    }

    [StructLayout(LayoutKind.Sequential)] class MEM { public uint dwLength = 64; public uint load; public ulong tot, liberi, a, b, c, d, e; }
    [DllImport("kernel32.dll")] static extern bool GlobalMemoryStatusEx([In, Out] MEM m);

    static string Misura() {
      PdhCollectQueryData(q);
      var sb = new StringBuilder("{");
      var cpu = Leggi(cCpu);
      double tot = 0; cpu.TryGetValue("_Total", out tot);
      sb.Append("\"cpu\":").Append(Math.Min(100, Math.Max(0, tot)).ToString("0.0", INV));
      // ogni thread, in ordine (gruppo, numero)
      var fili = new SortedDictionary<int, double>();
      foreach (var kv in cpu) {
        string[] p = kv.Key.Split(',');
        int g, i;
        if (p.Length == 2 && int.TryParse(p[0], out g) && int.TryParse(p[1], out i)) fili[g * 1000 + i] = kv.Value;
      }
      sb.Append(",\"fili\":[");
      bool primo = true;
      foreach (var v in fili.Values) { if (!primo) sb.Append(','); primo = false; sb.Append(Math.Round(Math.Min(100, Math.Max(0, v)))); }
      sb.Append(']');
      var m = new MEM();
      if (GlobalMemoryStatusEx(m) && m.tot > 0) sb.Append(",\"ram\":").Append((100.0 * (m.tot - m.liberi) / m.tot).ToString("0.0", INV));
      // i dischi: attivitÃ  = 100 âˆ’ tempo a riposo (Ã¨ la Â«Percentuale di attivitÃ Â» di Gestione attivitÃ )
      sb.Append(",\"dischi\":{");
      primo = true;
      foreach (var kv in Leggi(cDisco)) {
        string n = kv.Key.Split(' ')[0];
        int x;
        if (!int.TryParse(n, out x)) continue;
        if (!primo) sb.Append(','); primo = false;
        sb.Append('"').Append(x).Append("\":").Append(Math.Min(100, Math.Max(0, 100 - kv.Value)).ToString("0.0", INV));
      }
      sb.Append('}');
      // la temperatura: la zona termica piÃ¹ calda (decimi di kelvin). Sui desktop Intel Ã¨ quella del processore
      double t = 0;
      foreach (var kv in Leggi(cTemp)) t = Math.Max(t, kv.Value / 10.0 - 273.15);
      if (t > 5 && t < 130) sb.Append(",\"temp\":").Append(t.ToString("0.0", INV));
      return sb.Append('}').ToString();
    }

    // â”€â”€ le finestre: come Alt+Tab, una per programma â”€â”€
    delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
    [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint cmd);
    [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
    [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern IntPtr MonitorFromWindow(IntPtr h, uint f);
    [DllImport("user32.dll")] static extern bool GetMonitorInfo(IntPtr m, ref MONITORINFO mi);
    [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out int v, int size);
    [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint acc, bool inh, uint pid);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern bool QueryFullProcessImageName(IntPtr h, int f, StringBuilder s, ref int n);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern int GetApplicationUserModelId(IntPtr h, ref int n, StringBuilder s);
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int l, t, r, b; }
    [StructLayout(LayoutKind.Sequential)] struct MONITORINFO { public int cbSize; public RECT mon, work; public uint flags; }

    static readonly HashSet<string> FUORI = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
      "textinputhost.exe", "shellexperiencehost.exe", "searchhost.exe", "searchapp.exe", "startmenuexperiencehost.exe", "lockapp.exe",
      "applicationframehost.exe", "systemsettingsbroker.exe", "gamebar.exe", "gamebarftserver.exe", "nvidia share.exe", "nvcontainer.exe"
    };
    static readonly HashSet<string> CLASSI = new HashSet<string>(StringComparer.Ordinal) { "Progman", "WorkerW", "Shell_TrayWnd", "Shell_SecondaryTrayWnd", "Windows.UI.Core.CoreWindow" };

    class App { public string chiave, exe, aumid; public bool fg, intero, giu; }
    static readonly Dictionary<string, string[]> conosciute = new Dictionary<string, string[]>(); // chiave â†’ [id, nome]

    static string Percorso(uint pid, out string aumid) {
      aumid = null;
      IntPtr h = OpenProcess(0x1000, false, pid);
      if (h == IntPtr.Zero) return null;
      try {
        var s = new StringBuilder(1024); int n = s.Capacity;
        string p = QueryFullProcessImageName(h, 0, s, ref n) ? s.ToString() : null;
        var a = new StringBuilder(512); int na = a.Capacity;
        if (GetApplicationUserModelId(h, ref na, a) == 0) aumid = a.ToString();
        return p;
      } finally { CloseHandle(h); }
    }

    static string Finestre(string cartella) {
      var viste = new List<IntPtr>();
      EnumWindows((h, l) => { viste.Add(h); return true; }, IntPtr.Zero);
      IntPtr davanti = GetForegroundWindow();
      var app = new List<App>();
      var idx = new Dictionary<string, App>();
      var cls = new StringBuilder(256);
      foreach (IntPtr h in viste) {
        if (!IsWindowVisible(h) || GetWindow(h, 4) != IntPtr.Zero) continue;
        int ex = GetWindowLong(h, -20);
        if ((ex & 0x40000) == 0 && ((ex & 0x80) != 0 || (ex & 0x08000000) != 0)) continue; // finestre strumento, overlay
        int nascosta;
        if (DwmGetWindowAttribute(h, 14, out nascosta, 4) == 0 && nascosta != 0) continue; // Â«cloakedÂ»: app sospese, altri desktop
        if (GetWindowTextLength(h) == 0) continue;
        cls.Clear(); GetClassName(h, cls, cls.Capacity);
        string classe = cls.ToString();
        if (CLASSI.Contains(classe)) continue;
        uint pid; GetWindowThreadProcessId(h, out pid);
        if (classe == "ApplicationFrameWindow") {
          // un'app dello Store: il programma vero Ã¨ la finestra figlia
          uint figlio = 0, mio = pid;
          EnumChildWindows(h, (c, l) => { uint p; GetWindowThreadProcessId(c, out p); if (p != mio) { figlio = p; return false; } return true; }, IntPtr.Zero);
          if (figlio == 0) continue;
          pid = figlio;
        }
        string aumid, exe = Percorso(pid, out aumid);
        if (exe == null || FUORI.Contains(Path.GetFileName(exe))) continue;
        string chiave = aumid ?? exe.ToLowerInvariant();
        App a;
        if (!idx.TryGetValue(chiave, out a)) { a = new App { chiave = chiave, exe = exe, aumid = aumid, giu = true }; idx[chiave] = a; app.Add(a); }
        if (h == davanti) {
          a.fg = true;
          RECT r; MONITORINFO mi = new MONITORINFO(); mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
          if (GetWindowRect(h, out r) && GetMonitorInfo(MonitorFromWindow(h, 2), ref mi))
            a.intero = r.l <= mi.mon.l && r.t <= mi.mon.t && r.r >= mi.mon.r && r.b >= mi.mon.b;
        }
        if (!IsIconic(h)) a.giu = false;
      }
      var sb = new StringBuilder("[");
      bool primo = true;
      foreach (App a in app) {
        string[] noto;
        if (!conosciute.TryGetValue(a.chiave, out noto)) {
          noto = new string[] { Firma(a.chiave), Nome(a) };
          try { Icona(a, Path.Combine(cartella, noto[0] + ".png")); } catch (Exception) { }
          conosciute[a.chiave] = noto;
        }
        if (!primo) sb.Append(','); primo = false;
        sb.Append("{\"id\":\"").Append(noto[0]).Append("\",\"nome\":").Append(Js(noto[1])).Append(",\"exe\":").Append(Js(a.exe))
          .Append(",\"fg\":").Append(a.fg ? "true" : "false").Append(",\"intero\":").Append(a.intero ? "true" : "false")
          .Append(",\"giu\":").Append(a.giu ? "true" : "false").Append(",\"icona\":").Append(File.Exists(Path.Combine(cartella, noto[0] + ".png")) ? "true" : "false").Append('}');
      }
      return sb.Append(']').ToString();
    }

    static string Js(string s) {
      if (s == null) return "null";
      var b = new StringBuilder("\"");
      foreach (char c in s) { if (c == '"' || c == '\\') b.Append('\\').Append(c); else if (c < 32) b.Append(' '); else b.Append(c); }
      return b.Append('"').ToString();
    }
    static string Firma(string s) {
      uint h = 2166136261;
      foreach (char c in s) { h ^= c; h *= 16777619; }
      return h.ToString("x8");
    }
    static string Nome(App a) {
      try {
        if (a.aumid != null) {
          IShellItem it = Voce("shell:AppsFolder\\" + a.aumid);
          IntPtr p; it.GetDisplayName(0, out p);
          string n = Marshal.PtrToStringUni(p); Marshal.FreeCoTaskMem(p); Marshal.ReleaseComObject(it);
          if (!string.IsNullOrEmpty(n)) return n;
        }
        var v = FileVersionInfo.GetVersionInfo(a.exe);
        string d = (v.FileDescription ?? "").Trim();
        if (d.Length > 1 && d.Length <= 40) return d;
        if (!string.IsNullOrEmpty(v.ProductName)) return v.ProductName.Trim();
      } catch (Exception) { }
      return Path.GetFileNameWithoutExtension(a.exe);
    }

    // â”€â”€ le icone: quella grande di Windows (256 px), ritagliata dei bordi vuoti, salvata quadrata a 192 px â”€â”€
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    static extern void SHCreateItemFromParsingName([MarshalAs(UnmanagedType.LPWStr)] string path, IntPtr pbc, [MarshalAs(UnmanagedType.LPStruct)] Guid riid, [MarshalAs(UnmanagedType.Interface)] out IShellItem item);
    [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr h);
    [StructLayout(LayoutKind.Sequential)] struct BITMAP { public int bmType, bmWidth, bmHeight, bmWidthBytes; public ushort bmPlanes, bmBitsPixel; public IntPtr bmBits; }
    [StructLayout(LayoutKind.Sequential)] struct BIH { public uint biSize; public int biWidth, biHeight; public ushort biPlanes, biBitCount; public uint biCompression, biSizeImage; public int biX, biY; public uint biClrUsed, biClrImportant; }
    [StructLayout(LayoutKind.Sequential)] struct DIBSECTION { public BITMAP bm; public BIH bih; public uint f0, f1, f2; public IntPtr sezione; public uint scarto; }
    [DllImport("gdi32.dll", EntryPoint = "GetObject")] static extern int GetObjectDib(IntPtr h, int n, ref DIBSECTION ds);

    static IShellItem Voce(string p) { IShellItem it; SHCreateItemFromParsingName(p, IntPtr.Zero, typeof(IShellItem).GUID, out it); return it; }

    static void Icona(App a, string file) {
      if (File.Exists(file)) return;
      Bitmap b = null;
      try {
        IShellItem it = Voce(a.aumid != null ? "shell:AppsFolder\\" + a.aumid : a.exe);
        var f = (IShellItemImageFactory)it;
        IntPtr hb;
        SIZE sz = new SIZE { cx = 256, cy = 256 };
        if (f.GetImage(sz, 0x4, out hb) == 0 && hb != IntPtr.Zero) { b = DaHbitmap(hb); DeleteObject(hb); }
        Marshal.ReleaseComObject(it);
      } catch (Exception) { }
      if (b == null) { using (Icon i = Icon.ExtractAssociatedIcon(a.exe)) b = i.ToBitmap(); }
      using (b) Salva(b, file);
    }

    static Bitmap DaHbitmap(IntPtr hb) {
      var ds = new DIBSECTION();
      if (GetObjectDib(hb, Marshal.SizeOf(typeof(DIBSECTION)), ref ds) == 0 || ds.bm.bmBits == IntPtr.Zero || ds.bm.bmBitsPixel != 32) return Image.FromHbitmap(hb);
      int w = ds.bm.bmWidth, h = ds.bm.bmHeight, passo = ds.bm.bmWidthBytes;
      bool dallAlto = ds.bih.biHeight < 0;
      var righe = new byte[h][];
      bool alfa = false;
      for (int y = 0; y < h; y++) {
        righe[y] = new byte[w * 4];
        Marshal.Copy(new IntPtr(ds.bm.bmBits.ToInt64() + (long)(dallAlto ? y : h - 1 - y) * passo), righe[y], 0, w * 4);
        for (int x = 3; x < w * 4 && !alfa; x += 4) if (righe[y][x] != 0) alfa = true;
      }
      var b = new Bitmap(w, h, alfa ? PixelFormat.Format32bppPArgb : PixelFormat.Format32bppRgb);
      var d = b.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, b.PixelFormat);
      for (int y = 0; y < h; y++) Marshal.Copy(righe[y], 0, new IntPtr(d.Scan0.ToInt64() + (long)y * d.Stride), w * 4);
      b.UnlockBits(d);
      return b;
    }

    static void Salva(Bitmap b, string file) {
      // il pezzo pieno: i bordi trasparenti via (le icone piccole arrivano centrate su una tela grande)
      int x0 = b.Width, y0 = b.Height, x1 = -1, y1 = -1;
      using (var a = new Bitmap(b.Width, b.Height, PixelFormat.Format32bppArgb)) {
        using (var g = Graphics.FromImage(a)) g.DrawImage(b, 0, 0, b.Width, b.Height);
        var d = a.LockBits(new Rectangle(0, 0, a.Width, a.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var px = new byte[d.Stride * a.Height];
        Marshal.Copy(d.Scan0, px, 0, px.Length);
        a.UnlockBits(d);
        for (int y = 0; y < a.Height; y++) for (int x = 0; x < a.Width; x++) if (px[y * d.Stride + x * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return;
        int lato = Math.Max(x1 - x0 + 1, y1 - y0 + 1), cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;
        var fonte = new Rectangle(cx - lato / 2, cy - lato / 2, lato, lato);
        using (var o = new Bitmap(192, 192, PixelFormat.Format32bppArgb)) {
          using (var g = Graphics.FromImage(o)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic; g.PixelOffsetMode = PixelOffsetMode.HighQuality; g.SmoothingMode = SmoothingMode.HighQuality;
            g.Clear(Color.Transparent);
            g.DrawImage(a, new Rectangle(0, 0, 192, 192), fonte, GraphicsUnit.Pixel);
          }
          o.Save(file + ".tmp", ImageFormat.Png);
        }
      }
      if (File.Exists(file)) File.Delete(file);
      File.Move(file + ".tmp", file);
    }

    // â”€â”€ il giro: misure ogni 500 ms, finestre ogni secondo, e se il server non c'Ã¨ piÃ¹ si chiude â”€â”€
    public static void Giro(string cartella, int padre) {
      Directory.CreateDirectory(cartella);
      PdhOpenQuery(null, IntPtr.Zero, out q);
      PdhAddEnglishCounter(q, @"\Processor Information(*)\% Processor Utility", IntPtr.Zero, out cCpu);
      PdhAddEnglishCounter(q, @"\PhysicalDisk(*)\% Idle Time", IntPtr.Zero, out cDisco);
      PdhAddEnglishCounter(q, @"\Thermal Zone Information(*)\High Precision Temperature", IntPtr.Zero, out cTemp);
      PdhCollectQueryData(q);
      string firma = null; int n = 0;
      var orologio = Stopwatch.StartNew();
      while (true) {
        long prossimo = (n + 1) * 500L;
        try { Console.Out.WriteLine("M " + Misura()); } catch (Exception) { }
        if (n % 2 == 0) {
          try { string w = Finestre(cartella); if (w != firma) { firma = w; Console.Out.WriteLine("W " + w); } } catch (Exception) { }
        }
        if (n % 10 == 0 && padre > 0) { try { Process.GetProcessById(padre); } catch (Exception) { Environment.Exit(0); } }
        n++;
        long resta = prossimo - orologio.ElapsedMilliseconds;
        Thread.Sleep((int)Math.Max(5, Math.Min(500, resta)));
      }
    }
  }
}
namespace Diretta
{
  public static class Program
  {
    public static void Main(string[] args)
    {
      Console.OutputEncoding = System.Text.Encoding.UTF8;
      Macchina.Giro(args.Length > 0 ? args[0] : "cache/app", args.Length > 1 ? int.Parse(args[1]) : 0);
    }
  }
}

