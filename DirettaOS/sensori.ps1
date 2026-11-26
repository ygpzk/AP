# Diretta OS: i sensori del pc. Lo avvia server.mjs e legge le righe che escono da qui.
#   K 65,160        i tasti premuti adesso (codici virtuali di Windows), a ogni cambio
#   A {...}         microfoni e uscite audio attivi: nome, muto, picco, predefinito
#   D {...}         iPhone collegato via cavo, Camo Studio aperto
#   P id|tasti|croce|assi   il controller (PS4, DualSense o altro), a ogni cambio; «P -» se non c'è
#   V {"nome":picco}  il livello di ogni microfono, 25 volte al secondo (si muove solo quando un programma lo usa: Discord in chiamata)
#   W n             gli scatti della rotella del mouse (positivi su, negativi giù)
# Non scrive niente su disco e non manda niente fuori: tutto resta fra questo processo e il server locale.

$ErrorActionPreference = 'SilentlyContinue'

Add-Type -Language CSharp -ReferencedAssemblies System.Management -TypeDefinition @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Threading;
using System.Diagnostics;
using System.Management;
using System.Runtime.InteropServices;

namespace Diretta {
  [StructLayout(LayoutKind.Sequential)] public struct PKEY { public Guid fmtid; public int pid; }
  [StructLayout(LayoutKind.Explicit, Size = 24)] public struct PVAR { [FieldOffset(0)] public short vt; [FieldOffset(8)] public IntPtr p; }

  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumerator { }

  [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IMMDeviceEnumerator {
    [PreserveSig] int EnumAudioEndpoints(int flow, int mask, out IMMDeviceCollection col);
    [PreserveSig] int GetDefaultAudioEndpoint(int flow, int role, out IMMDevice dev);
  }
  [ComImport, Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IMMDeviceCollection {
    [PreserveSig] int GetCount(out int n);
    [PreserveSig] int Item(int i, out IMMDevice dev);
  }
  [ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IMMDevice {
    [PreserveSig] int Activate(ref Guid iid, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o);
    [PreserveSig] int OpenPropertyStore(int access, out IPropertyStore store);
    [PreserveSig] int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    [PreserveSig] int GetState(out int state);
  }
  [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IPropertyStore {
    [PreserveSig] int GetCount(out int n);
    [PreserveSig] int GetAt(int i, out PKEY k);
    [PreserveSig] int GetValue(ref PKEY k, out PVAR v);
  }
  // i primi undici metodi non servono: tengono solo il posto nella tabella, fino a SetMute e GetMute
  [ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IAudioEndpointVolume {
    [PreserveSig] int P0(); [PreserveSig] int P1(); [PreserveSig] int P2(); [PreserveSig] int P3(); [PreserveSig] int P4(); [PreserveSig] int P5();
    [PreserveSig] int GetMasterVolumeLevelScalar(out float livello);
    [PreserveSig] int P7(); [PreserveSig] int P8(); [PreserveSig] int P9(); [PreserveSig] int P10();
    [PreserveSig] int SetMute(int muto, IntPtr ctx);
    [PreserveSig] int GetMute(out int muto);
  }
  [ComImport, Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IAudioMeterInformation {
    [PreserveSig] int GetPeakValue(out float picco);
  }

  public static class Sens {
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);
    [DllImport("ole32.dll")] static extern int PropVariantClear(ref PVAR v);
    [DllImport("user32.dll")] static extern IntPtr SetWindowsHookEx(int id, Gancio fn, IntPtr mod, uint thread);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr h, int n, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] static extern int GetMessage(out MSG m, IntPtr h, uint a, uint b);
    [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string nome);
    public delegate IntPtr Gancio(int n, IntPtr w, IntPtr l);
    [StructLayout(LayoutKind.Sequential)] public struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam, lParam; public uint time; public int x, y; }
    [StructLayout(LayoutKind.Sequential)] public struct MOUSE { public int x, y; public uint dati, flags, time; public IntPtr extra; }
    static Gancio gancio = Rotella; // tenuto qui, sennò il garbage collector se lo porta via
    static int scatti = 0;

    // la rotella non passa da GetAsyncKeyState: serve il gancio di Windows sul mouse. Qui conta e basta: stampa il giro veloce,
    // così il gancio risponde subito e Windows non lo stacca.
    static IntPtr Rotella(int n, IntPtr w, IntPtr l) {
      if (n >= 0 && (int)w == 0x020A) {
        MOUSE m = (MOUSE)Marshal.PtrToStructure(l, typeof(MOUSE));
        short d = (short)((m.dati >> 16) & 0xffff);
        Interlocked.Add(ref scatti, d > 0 ? 1 : -1);
      }
      return CallNextHookEx(IntPtr.Zero, n, w, l);
    }
    static void GiroRotella() {
      SetWindowsHookEx(14, gancio, GetModuleHandle(null), 0);
      MSG m; while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0) { }
    }

    // i misuratori dei microfoni, tenuti da parte: rifatti ogni tre secondi, letti ogni 40 ms
    static List<KeyValuePair<string, IAudioMeterInformation>> metri = new List<KeyValuePair<string, IAudioMeterInformation>>();
    static void Metri(IMMDeviceEnumerator en) {
      foreach (KeyValuePair<string, IAudioMeterInformation> v in metri) Marshal.ReleaseComObject(v.Value);
      metri.Clear();
      IMMDeviceCollection col;
      if (en.EnumAudioEndpoints(1, 1, out col) != 0 || col == null) return;
      int n; col.GetCount(out n);
      PKEY nomeK = new PKEY(); nomeK.fmtid = new Guid("A45C254E-DF1C-4EFD-8020-67D146A850E0"); nomeK.pid = 14;
      Guid metId = typeof(IAudioMeterInformation).GUID;
      for (int i = 0; i < n; i++) {
        IMMDevice d; if (col.Item(i, out d) != 0 || d == null) continue;
        string nome = "";
        IPropertyStore st;
        if (d.OpenPropertyStore(0, out st) == 0 && st != null) {
          PVAR v; if (st.GetValue(ref nomeK, out v) == 0) { if (v.vt == 31 && v.p != IntPtr.Zero) nome = Marshal.PtrToStringUni(v.p); PropVariantClear(ref v); }
          Marshal.ReleaseComObject(st);
        }
        object o;
        if (d.Activate(ref metId, 23, IntPtr.Zero, out o) == 0 && o != null) metri.Add(new KeyValuePair<string, IAudioMeterInformation>(nome, (IAudioMeterInformation)o));
        Marshal.ReleaseComObject(d);
      }
      Marshal.ReleaseComObject(col);
    }
    static string Livelli() {
      StringBuilder b = new StringBuilder("{");
      foreach (KeyValuePair<string, IAudioMeterInformation> v in metri) {
        float p = 0; v.Value.GetPeakValue(out p);
        if (b.Length > 1) b.Append(',');
        b.Append('"').Append(Esc(v.Key)).Append("\":").Append(p.ToString("0.000", System.Globalization.CultureInfo.InvariantCulture));
      }
      return b.Append('}').ToString();
    }

    static string Esc(string s) {
      if (s == null) return "";
      StringBuilder b = new StringBuilder();
      foreach (char c in s) { if (c == '"' || c == '\\') { b.Append('\\'); b.Append(c); } else if (c < 32) b.Append(' '); else b.Append(c); }
      return b.ToString();
    }

    static string Tasti() {
      StringBuilder b = new StringBuilder();
      for (int i = 1; i < 255; i++) {
        if (i >= 16 && i <= 18) continue; // shift, ctrl e alt generici: arrivano già come sinistro e destro
        if ((GetAsyncKeyState(i) & 0x8000) != 0) { if (b.Length > 0) b.Append(','); b.Append(i); }
      }
      return b.ToString();
    }

    static string IdDi(IMMDeviceEnumerator en, int flow, int ruolo) {
      IMMDevice d; string id = "";
      if (en.GetDefaultAudioEndpoint(flow, ruolo, out d) == 0 && d != null) { d.GetId(out id); Marshal.ReleaseComObject(d); }
      return id == null ? "" : id;
    }

    static string Lista(IMMDeviceEnumerator en, int flow) {
      string pred = IdDi(en, flow, 0), com = IdDi(en, flow, 2);
      IMMDeviceCollection col;
      if (en.EnumAudioEndpoints(flow, 1, out col) != 0 || col == null) return "[]";
      int n; col.GetCount(out n);
      StringBuilder b = new StringBuilder("[");
      PKEY nomeK = new PKEY(); nomeK.fmtid = new Guid("A45C254E-DF1C-4EFD-8020-67D146A850E0"); nomeK.pid = 14;
      Guid volId = typeof(IAudioEndpointVolume).GUID, metId = typeof(IAudioMeterInformation).GUID;
      for (int i = 0; i < n; i++) {
        IMMDevice d; if (col.Item(i, out d) != 0 || d == null) continue;
        string id; d.GetId(out id);
        string nome = "";
        IPropertyStore st;
        if (d.OpenPropertyStore(0, out st) == 0 && st != null) {
          PVAR v; if (st.GetValue(ref nomeK, out v) == 0) { if (v.vt == 31 && v.p != IntPtr.Zero) nome = Marshal.PtrToStringUni(v.p); PropVariantClear(ref v); }
          Marshal.ReleaseComObject(st);
        }
        int muto = 0; float vol = 0, picco = 0; object o;
        if (d.Activate(ref volId, 23, IntPtr.Zero, out o) == 0 && o != null) { IAudioEndpointVolume ev = (IAudioEndpointVolume)o; ev.GetMute(out muto); ev.GetMasterVolumeLevelScalar(out vol); Marshal.ReleaseComObject(o); }
        if (d.Activate(ref metId, 23, IntPtr.Zero, out o) == 0 && o != null) { ((IAudioMeterInformation)o).GetPeakValue(out picco); Marshal.ReleaseComObject(o); }
        if (b.Length > 1) b.Append(',');
        b.Append("{\"n\":\"").Append(Esc(nome)).Append("\",\"m\":").Append(muto != 0 ? "true" : "false")
         .Append(",\"v\":").Append(vol.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture))
         .Append(",\"p\":").Append(picco.ToString("0.000", System.Globalization.CultureInfo.InvariantCulture))
         .Append(",\"d\":").Append(id == pred ? "true" : "false").Append(",\"c\":").Append(id == com ? "true" : "false").Append("}");
        Marshal.ReleaseComObject(d);
      }
      Marshal.ReleaseComObject(col);
      return b.Append("]").ToString();
    }

    static void GiroVeloce() {
      IMMDeviceEnumerator en = null;
      string prima = null; int ultimoAudio = 0, ultimiMetri = -99999, ultimoLivello = 0, ultimoGc = 0;
      while (true) {
        try {
          string k = Tasti();
          if (k != prima) { prima = k; Console.Out.WriteLine("K " + k); }
          int ora = Environment.TickCount;
          if (ora - ultimoAudio > 1000 || ora < ultimoAudio) {
            ultimoAudio = ora;
            if (en == null) en = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
            Console.Out.WriteLine("A {\"cap\":" + Lista(en, 1) + ",\"ren\":" + Lista(en, 0) + "}");
          }
          if (en != null && (ora - ultimiMetri > 3000 || ora < ultimiMetri)) { ultimiMetri = ora; Metri(en); }
          if (ora - ultimoLivello >= 40 || ora < ultimoLivello) { ultimoLivello = ora; if (metri.Count > 0) Console.Out.WriteLine("V " + Livelli()); }
          int r = Interlocked.Exchange(ref scatti, 0);
          if (r != 0) Console.Out.WriteLine("W " + r);
          // (una volta al minuto: le stringhe e gli oggetti COM di ogni giro, se no il processo cresce e basta)
          if (ora - ultimoGc > 60000 || ora < ultimoGc) { ultimoGc = ora; GC.Collect(); }
        } catch (Exception) { en = null; metri.Clear(); }
        Thread.Sleep(8);
      }
    }

    static void GiroLento() {
      while (true) {
        try {
          bool iphone = false;
          using (ManagementObjectSearcher s = new ManagementObjectSearcher("SELECT Name FROM Win32_PnPEntity WHERE Name = 'Apple iPhone' OR Name = 'Apple Mobile Device USB Composite Device' OR Name = 'Apple Mobile Device USB Device'"))
          using (ManagementObjectCollection r = s.Get()) { iphone = r.Count > 0; }
          bool camo = Process.GetProcessesByName("CamoStudio").Length > 0;
          Console.Out.WriteLine("D {\"iphone\":" + (iphone ? "true" : "false") + ",\"camo\":" + (camo ? "true" : "false") + "}");
        } catch (Exception) { }
        Thread.Sleep(3000);
      }
    }

    public static void Avvia() {
      Thread a = new Thread(GiroVeloce); a.IsBackground = true; a.Start();
      Thread b = new Thread(GiroLento); b.IsBackground = true; b.Start();
      Thread c = new Thread(GiroRotella); c.IsBackground = true; c.Start();
    }
  }
}
'@

[Diretta.Sens]::Avvia()

# il controller: Windows.Gaming.Input legge qualunque gamepad (il PS4 e il DualSense senza programmi in mezzo)
$null = [Windows.Gaming.Input.RawGameController, Windows.Gaming.Input, ContentType = WindowsRuntime]
$uscita = [Console]::Out
$c = $null; $prima = ''; $giro = 0
while ($true) {
  if (($giro % 90) -eq 0) {
    $lista = [Windows.Gaming.Input.RawGameController]::RawGameControllers
    if ($lista.Count -gt 0) {
      if (-not $c -or $c.NonRoamableId -ne $lista[0].NonRoamableId) {
        $c = $lista[0]
        $b = New-Object 'bool[]' $c.ButtonCount
        $s = New-Object 'Windows.Gaming.Input.GameControllerSwitchPosition[]' $c.SwitchCount
        $a = New-Object 'double[]' $c.AxisCount
        $id = '{0:X4}:{1:X4}' -f $c.HardwareVendorId, $c.HardwareProductId
      }
    } else { $c = $null }
  }
  if ($c) {
    $null = $c.GetCurrentReading($b, $s, $a)
    $riga = 'P ' + $id + '|' + (($b | ForEach-Object { [int]$_ }) -join '') + '|' + (($s | ForEach-Object { [int]$_ }) -join ',') + '|' + (($a | ForEach-Object { ([math]::Round($_ * 25) / 25).ToString('0.00', [Globalization.CultureInfo]::InvariantCulture) }) -join ',')
  } else { $riga = 'P -' }
  if ($riga -ne $prima) { $prima = $riga; $uscita.WriteLine($riga) }
  Start-Sleep -Milliseconds 16
  $giro++
}
