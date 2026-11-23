// Diretta OS: dove stanno le cose, e i ferri del mestiere (processi, HTTP, scorciatoie, registro).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Microsoft.Win32;

namespace DirettaOS
{
    static class Shell
    {
        public const string Nome = "Diretta OS";
        public const string Versione = "1.0.0";
        public const string Publisher = "pzkko";
        public const string Sito = "https://pzkko.it/direttaos/";
        public const string Repo = "https://github.com/ygpzk/AP/tree/main/DirettaOS";

        public static readonly string BaseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
        public static readonly bool Payload = HasPayload();

        static bool HasPayload()
        {
            try
            {
                foreach (string n in Assembly.GetExecutingAssembly().GetManifestResourceNames())
                    if (n == "payload.zip") return true;
            }
            catch { }
            return false;
        }

        public static string DefaultInstallDir
        {
            get
            {
                string p = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Diretta OS");
                return p;
            }
        }

        static string _installDir;
        public static void UsaCartella(string d) { _installDir = d; }

        public static string InstallDir
        {
            get
            {
                if (!String.IsNullOrEmpty(_installDir)) return _installDir;
                // se il gestore è già dentro la sua cartella (app\server.mjs), quella è la casa
                if (File.Exists(Path.Combine(BaseDir, "app", "server.mjs"))) return BaseDir;
                return DefaultInstallDir;
            }
        }

        public static string AppDir { get { return Path.Combine(InstallDir, "app"); } }
        public static string ManagerExe { get { return Path.Combine(InstallDir, "DirettaOS.exe"); } }
        public static string LogFile { get { return Path.Combine(AppDir, "diretta.log"); } }
        public static string StopFlag { get { return Path.Combine(InstallDir, "stop.flag"); } }
        public static string VbsFile { get { return Path.Combine(InstallDir, "avvio-nascosto.vbs"); } }
        public static string GuidaFile { get { return Path.Combine(InstallDir, "GUIDA-INSTALLAZIONE.md"); } }
        public static string LeggimiFile { get { return Path.Combine(InstallDir, "LEGGIMI.txt"); } }

        public static bool Installed()
        {
            return File.Exists(Path.Combine(AppDir, "server.mjs")) && File.Exists(Path.Combine(AppDir, "pubblico", "regia.html"));
        }

        public static bool RunningFromSetup()
        {
            return Payload && !Installed();
        }

        public static string ExePath()
        {
            try { return Process.GetCurrentProcess().MainModule.FileName; }
            catch { return Path.Combine(BaseDir, "DirettaOS.exe"); }
        }

        public static int Porta()
        {
            int p = 2350;
            p = PortaDa(Path.Combine(AppDir, "config.json"), p);
            p = PortaDa(Path.Combine(AppDir, "config.locale.json"), p);
            return p;
        }

        static int PortaDa(string file, int difetto)
        {
            try
            {
                if (!File.Exists(file)) return difetto;
                Match m = Regex.Match(File.ReadAllText(file, Encoding.UTF8), "\"porta\"\\s*:\\s*(\\d{2,5})");
                if (m.Success)
                {
                    int n = Int32.Parse(m.Groups[1].Value);
                    if (n > 0 && n < 65536) return n;
                }
            }
            catch { }
            return difetto;
        }

        public static int PortaTv()
        {
            int p = 2360;
            p = PortaTvDa(Path.Combine(AppDir, "config.json"), p);
            p = PortaTvDa(Path.Combine(AppDir, "config.locale.json"), p);
            return p;
        }

        static int PortaTvDa(string f, int difetto)
        {
            // la tv sta in podcast.tvPorta, non in porta: la leggo a parte
            try
            {
                if (!File.Exists(f)) return difetto;
                Match m = Regex.Match(File.ReadAllText(f, Encoding.UTF8), "\"tvPorta\"\\s*:\\s*(\\d{2,5})");
                if (m.Success)
                {
                    int n = Int32.Parse(m.Groups[1].Value);
                    if (n > 0 && n < 65536) return n;
                }
            }
            catch { }
            return difetto;
        }

        public static string Url { get { return "http://localhost:" + Porta() + "/"; } }
        public static string UrlLocal { get { return "http://127.0.0.1:" + Porta() + "/"; } }
        public static string UrlTv { get { return "http://localhost:" + PortaTv() + "/"; } }

        public static int PortaVista()
        {
            int p = 2371;
            p = PortaVistaDa(Path.Combine(AppDir, "config.json"), p);
            p = PortaVistaDa(Path.Combine(AppDir, "config.locale.json"), p);
            return p;
        }

        static int PortaVistaDa(string f, int difetto)
        {
            try
            {
                if (!File.Exists(f)) return difetto;
                string s = File.ReadAllText(f, Encoding.UTF8);
                int i = s.IndexOf("\"esterna\"", StringComparison.Ordinal);
                if (i < 0) return difetto;
                string pezzo = s.Substring(i, Math.Min(300, s.Length - i));
                Match m = Regex.Match(pezzo, "\"porta\"\\s*:\\s*(\\d{2,5})");
                if (m.Success)
                {
                    int n = Int32.Parse(m.Groups[1].Value);
                    if (n > 0 && n < 65536) return n;
                }
            }
            catch { }
            return difetto;
        }

        public static string IpLocale()
        {
            try
            {
                string migliore = null;
                int punti = -1;
                foreach (IPAddress a in Dns.GetHostAddresses(Dns.GetHostName()))
                {
                    if (a.AddressFamily != AddressFamily.InterNetwork) continue;
                    string s = a.ToString();
                    if (s.StartsWith("127.") || s.StartsWith("169.254.")) continue;
                    string[] q = s.Split('.');
                    int p = 50;
                    if (q.Length == 4)
                    {
                        int b = Int32.Parse(q[0]);
                        int c = Int32.Parse(q[1]);
                        if (b == 192 && c == 168) p = 100; // la Wi-Fi di casa, di solito
                        else if (b == 10) p = 80;
                        else if (b == 172 && c >= 16 && c <= 31) p = 70;
                        else if (b == 100 && c >= 64 && c <= 127) p = 20; // Tailscale
                        else p = 40;
                    }
                    if (p > punti) { punti = p; migliore = s; }
                }
                return migliore;
            }
            catch { }
            return null;
        }

        // ── processi ────────────────────────────────────────────────────────────
        public static ProcessStartInfo Cmd(string comando, string dir)
        {
            ProcessStartInfo p = new ProcessStartInfo();
            p.FileName = "cmd.exe";
            p.Arguments = "/c " + comando;
            p.WorkingDirectory = dir;
            p.UseShellExecute = false;
            p.CreateNoWindow = true;
            p.WindowStyle = ProcessWindowStyle.Hidden;
            return p;
        }

        public static string Cattura(string exe, string argomenti, string dir, int ms)
        {
            try
            {
                ProcessStartInfo p = new ProcessStartInfo();
                p.FileName = exe;
                p.Arguments = argomenti;
                p.WorkingDirectory = dir;
                p.UseShellExecute = false;
                p.CreateNoWindow = true;
                p.RedirectStandardOutput = true;
                p.RedirectStandardError = true;
                using (Process q = Process.Start(p))
                {
                    string s = q.StandardOutput.ReadToEnd();
                    if (String.IsNullOrEmpty(s)) s = q.StandardError.ReadToEnd();
                    if (!q.WaitForExit(ms)) { try { q.Kill(); } catch { } }
                    return s == null ? "" : s.Trim();
                }
            }
            catch { return ""; }
        }

        public static int Esegui(string exe, string argomenti, string dir)
        {
            try
            {
                ProcessStartInfo p = new ProcessStartInfo();
                p.FileName = exe;
                p.Arguments = argomenti;
                p.WorkingDirectory = dir;
                p.UseShellExecute = false;
                p.CreateNoWindow = true;
                p.RedirectStandardOutput = true;
                p.RedirectStandardError = true;
                using (Process q = Process.Start(p))
                {
                    q.StandardOutput.ReadToEnd();
                    q.StandardError.ReadToEnd();
                    q.WaitForExit();
                    return q.ExitCode;
                }
            }
            catch { return -1; }
        }

        public static string FindNode()
        {
            string s = Cattura("cmd.exe", "/c where node", BaseDir, 4000);
            if (!String.IsNullOrEmpty(s))
            {
                foreach (string r in s.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    string t = r.Trim();
                    if (t.Length > 0 && File.Exists(t)) return t;
                }
            }
            string[] prova = new string[] {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "nodejs", "node.exe")
            };
            foreach (string f in prova) if (File.Exists(f)) return f;
            return null;
        }

        public static string NodeVersion()
        {
            string n = FindNode();
            if (n == null) return null;
            string s = Cattura(n, "--version", BaseDir, 5000);
            return s.Trim();
        }

        public static int NodeMaggiore()
        {
            string v = NodeVersion();
            if (v == null) return -1;
            Match m = Regex.Match(v, "(\\d+)\\.");
            return m.Success ? Int32.Parse(m.Groups[1].Value) : -1;
        }

        public static string FindFfmpeg()
        {
            string s = Cattura("cmd.exe", "/c where ffmpeg", BaseDir, 4000);
            if (!String.IsNullOrEmpty(s))
            {
                foreach (string r in s.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    string t = r.Trim();
                    if (t.Length > 0 && File.Exists(t)) return t;
                }
            }
            string[] prova = new string[] {
                @"C:\ffmpeg\bin\ffmpeg.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft", "WinGet", "Links", "ffmpeg.exe")
            };
            foreach (string f in prova) if (File.Exists(f)) return f;
            return null;
        }

        public static bool PowerShell()
        {
            return File.Exists(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe"));
        }

        public static string WindowsName()
        {
            try
            {
                using (RegistryKey k = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion", false))
                {
                    if (k != null)
                    {
                        object v = k.GetValue("ProductName");
                        if (v != null)
                        {
                            string s = v.ToString();
                            if (s.IndexOf("Windows 10", StringComparison.OrdinalIgnoreCase) >= 0) return "Windows 10";
                            if (s.IndexOf("Windows 11", StringComparison.OrdinalIgnoreCase) >= 0) return "Windows 11";
                            if (!String.IsNullOrEmpty(s)) return s;
                        }
                    }
                }
            }
            catch { }
            return "Windows";
        }

        public static string ProcessoSuPorta(int porta)
        {
            string s = Cattura("netstat", "-ano -p TCP", BaseDir, 5000);
            foreach (string r in s.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string t = r.Trim();
                if (t.IndexOf(":" + porta, StringComparison.Ordinal) < 0) continue;
                if (t.IndexOf("LISTEN", StringComparison.OrdinalIgnoreCase) < 0) continue;
                string[] pezzi = Regex.Split(t, "\\s+");
                if (pezzi.Length >= 5) return pezzi[pezzi.Length - 1];
            }
            return null;
        }

        public static string NomeProcesso(string pid)
        {
            try { return Process.GetProcessById(Int32.Parse(pid)).ProcessName; }
            catch { return ""; }
        }

        public static void TaskKill(string pid)
        {
            Esegui(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "taskkill.exe"), "/PID " + pid + " /T /F", BaseDir);
        }

        public static bool PortaOccupata(int porta)
        {
            return ProcessoSuPorta(porta) != null;
        }

        // ── HTTP ────────────────────────────────────────────────────────────────
        public static bool ServerUp()
        {
            try
            {
                HttpWebRequest r = (HttpWebRequest)WebRequest.Create(UrlLocal);
                r.Method = "GET";
                r.Timeout = 1500;
                r.ReadWriteTimeout = 1500;
                r.Proxy = null;
                r.AllowAutoRedirect = false;
                using (HttpWebResponse x = (HttpWebResponse)r.GetResponse())
                    return (int)x.StatusCode >= 200 && (int)x.StatusCode < 400;
            }
            catch { return false; }
        }

        public static bool Post(string json, int ms)
        {
            try
            {
                byte[] b = Encoding.UTF8.GetBytes(json);
                HttpWebRequest r = (HttpWebRequest)WebRequest.Create(UrlLocal + "api/azione");
                r.Method = "POST";
                r.ContentType = "application/json";
                r.ContentLength = b.Length;
                r.Timeout = ms;
                r.ReadWriteTimeout = ms;
                r.Proxy = null;
                using (Stream s = r.GetRequestStream()) s.Write(b, 0, b.Length);
                using (HttpWebResponse x = (HttpWebResponse)r.GetResponse())
                    return (int)x.StatusCode == 200;
            }
            catch { return false; }
        }

        public static string StatoJson(int ms)
        {
            try
            {
                HttpWebRequest r = (HttpWebRequest)WebRequest.Create(UrlLocal + "api/flusso");
                r.Method = "GET";
                r.Timeout = ms;
                r.ReadWriteTimeout = ms;
                r.Proxy = null;
                r.Accept = "text/event-stream";
                using (HttpWebResponse x = (HttpWebResponse)r.GetResponse())
                using (StreamReader sr = new StreamReader(x.GetResponseStream(), Encoding.UTF8))
                {
                    for (int i = 0; i < 80; i++)
                    {
                        string riga = sr.ReadLine();
                        if (riga == null) break;
                        if (riga.StartsWith("data: ", StringComparison.Ordinal)) return riga.Substring(6);
                    }
                }
            }
            catch { }
            return null;
        }

        // ── registro, scorciatoie, cartelle ─────────────────────────────────────
        public static void Open(string cosa)
        {
            try
            {
                ProcessStartInfo p = new ProcessStartInfo(cosa);
                p.UseShellExecute = true;
                Process.Start(p);
            }
            catch (Exception e) { Term.Err("non riesco ad aprire " + cosa + ": " + e.Message); }
        }

        public static void OpenFolder(string path)
        {
            try
            {
                ProcessStartInfo p = new ProcessStartInfo("explorer.exe", "\"" + path + "\"");
                p.UseShellExecute = true;
                Process.Start(p);
            }
            catch { }
        }

        public static void OpenText(string path)
        {
            try
            {
                ProcessStartInfo p = new ProcessStartInfo("notepad.exe", "\"" + path + "\"");
                p.UseShellExecute = true;
                Process.Start(p);
            }
            catch { Open(path); }
        }

        public static void Shortcut(string lnk, string target, string args, string desc, string icon)
        {
            try
            {
                string dir = Path.GetDirectoryName(lnk);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                Type t = Type.GetTypeFromProgID("WScript.Shell");
                if (t == null) return;
                object shell = Activator.CreateInstance(t);
                object sc = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { lnk });
                Type st = sc.GetType();
                st.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { target });
                st.InvokeMember("Arguments", BindingFlags.SetProperty, null, sc, new object[] { args });
                st.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { Path.GetDirectoryName(target) });
                st.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { desc });
                st.InvokeMember("IconLocation", BindingFlags.SetProperty, null, sc, new object[] { icon });
                st.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
            }
            catch { }
        }

        public static string StartMenu
        {
            get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Diretta OS"); }
        }

        public static string DesktopLnk
        {
            get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Diretta OS.lnk"); }
        }

        public static void CreaScorciatoie(bool desktop)
        {
            string exe = ManagerExe;
            string icon = exe + ",0";
            Shortcut(Path.Combine(StartMenu, "Diretta OS.lnk"), exe, "", "La regia delle sovrimpressioni", icon);
            Shortcut(Path.Combine(StartMenu, "Comandi e indirizzi.lnk"), exe, "commands", "Tutti i comandi di Diretta OS", icon);
            Shortcut(Path.Combine(StartMenu, "Guida all'installazione.lnk"), "notepad.exe", "\"" + GuidaFile + "\"", "La guida di Diretta OS", "notepad.exe,0");
            Shortcut(Path.Combine(StartMenu, "Disinstalla Diretta OS.lnk"), exe, "uninstall", "Togli Diretta OS dal PC", icon);
            if (desktop) Shortcut(DesktopLnk, exe, "", "La regia delle sovrimpressioni", icon);
        }

        public static void TogliScorciatoie()
        {
            try { if (File.Exists(DesktopLnk)) File.Delete(DesktopLnk); } catch { }
            try { if (Directory.Exists(StartMenu)) Directory.Delete(StartMenu, true); } catch { }
        }

        public static void RegistraProgramma()
        {
            try
            {
                using (RegistryKey k = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\DirettaOS"))
                {
                    if (k == null) return;
                    k.SetValue("DisplayName", Nome);
                    k.SetValue("DisplayVersion", Versione);
                    k.SetValue("Publisher", Publisher);
                    k.SetValue("DisplayIcon", ManagerExe + ",0");
                    k.SetValue("InstallLocation", InstallDir);
                    k.SetValue("UninstallString", "\"" + ManagerExe + "\" uninstall");
                    k.SetValue("QuietUninstallString", "\"" + ManagerExe + "\" uninstall --yes");
                    k.SetValue("NoModify", 1, RegistryValueKind.DWord);
                    k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    long mb = 1;
                    try
                    {
                        long n = 0;
                        foreach (string f in Directory.GetFiles(InstallDir, "*", SearchOption.AllDirectories)) n += new FileInfo(f).Length;
                        mb = Math.Max(1, n / (1024 * 1024));
                    }
                    catch { }
                    k.SetValue("EstimatedSize", (int)mb, RegistryValueKind.DWord);
                }
            }
            catch { }
        }

        public static void TogliProgramma()
        {
            try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\DirettaOS", false); } catch { }
        }

        public static string AutostartValue
        {
            get
            {
                try
                {
                    using (RegistryKey k = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", false))
                    {
                        if (k == null) return null;
                        object v = k.GetValue("Diretta OS");
                        return v == null ? null : v.ToString();
                    }
                }
                catch { return null; }
            }
        }

        public static void CreaVbs()
        {
            string vbs =
                "Set fso = CreateObject(\"Scripting.FileSystemObject\")\r\n" +
                "Set sh = CreateObject(\"WScript.Shell\")\r\n" +
                "base = fso.GetParentFolderName(WScript.ScriptFullName)\r\n" +
                "sh.Run \"\"\"\" & base & \"\\DirettaOS.exe\"\" --start --silent\", 0, False\r\n";
            File.WriteAllText(VbsFile, vbs, Encoding.Default);
        }

        public static void Autostart(bool on)
        {
            try
            {
                using (RegistryKey k = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run"))
                {
                    if (on)
                    {
                        CreaVbs();
                        k.SetValue("Diretta OS", "\"wscript.exe\" \"" + VbsFile + "\"");
                    }
                    else k.DeleteValue("Diretta OS", false);
                }
            }
            catch (Exception e) { Term.Warn("avvio automatico: " + e.Message); }
        }

        public static bool AutostartOn() { return AutostartValue != null; }

        public static void ApriCartella()
        {
            if (Directory.Exists(InstallDir)) OpenFolder(InstallDir);
        }

        public static string Data()
        {
            return DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        }

        public static void Append(string file, string riga)
        {
            try { File.AppendAllText(file, Data() + " " + riga + "\r\n", Encoding.UTF8); } catch { }
        }

        public static bool FileUguali(string a, string b)
        {
            try
            {
                FileInfo x = new FileInfo(a), y = new FileInfo(b);
                if (x.Length != y.Length) return false;
                using (FileStream fa = File.OpenRead(a)) using (FileStream fb = File.OpenRead(b))
                {
                    int ca, cb;
                    do
                    {
                        ca = fa.ReadByte(); cb = fb.ReadByte();
                        if (ca != cb) return false;
                    } while (ca != -1);
                }
                return true;
            }
            catch { return false; }
        }

        public static void CopiaAlbero(string src, string dst, bool conserva)
        {
            Directory.CreateDirectory(dst);
            foreach (string d in Directory.GetDirectories(src, "*", SearchOption.AllDirectories))
            {
                string rel = d.Substring(src.Length).TrimStart('\\');
                Directory.CreateDirectory(Path.Combine(dst, rel));
            }
            foreach (string f in Directory.GetFiles(src, "*", SearchOption.AllDirectories))
            {
                string rel = f.Substring(src.Length).TrimStart('\\');
                string to = Path.Combine(dst, rel);
                string rd = Path.GetDirectoryName(to);
                if (!Directory.Exists(rd)) Directory.CreateDirectory(rd);
                if (conserva && Conservare(rel) && File.Exists(to))
                {
                    if (String.Equals(rel, "app\\config.json", StringComparison.OrdinalIgnoreCase) && !FileUguali(f, to))
                        File.Copy(f, to + ".nuovo", true);
                    continue;
                }
                File.Copy(f, to, true);
            }
        }

        public static bool Conservare(string rel)
        {
            string r = rel.Replace('/', '\\').ToLowerInvariant();
            if (r == "app\\config.json") return true;
            if (r == "app\\config.locale.json") return true;
            if (r == "app\\stato.json" || r == "app\\stato-prova.json") return true;
            if (r == "app\\diretta.log" || r == "app\\bevo.log" || r == "app\\sito.log" || r == "app\\sito.err.log") return true;
            string[] cartelle = { "app\\riferimenti\\", "app\\foto\\", "app\\modelli\\", "app\\cache\\", "app\\impara\\", "app\\copie\\" };
            foreach (string c in cartelle) if (r.StartsWith(c, StringComparison.Ordinal)) return true;
            return false;
        }

        public static void CartelleVuote()
        {
            string[] d = { "riferimenti", "foto", "modelli", "cache", "impara", "copie", "cache\\app" };
            foreach (string x in d)
            {
                try { Directory.CreateDirectory(Path.Combine(AppDir, x)); } catch { }
            }
        }

        public static long Dimensione(string dir)
        {
            long n = 0;
            try { foreach (string f in Directory.GetFiles(dir, "*", SearchOption.AllDirectories)) n += new FileInfo(f).Length; } catch { }
            return n;
        }

        public static string Mb(long n) { return String.Format("{0:N1} MB", n / 1024.0 / 1024.0); }

        public static void Sleep(int ms) { Thread.Sleep(ms); }
    }
}
