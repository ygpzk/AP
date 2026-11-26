// Diretta OS: il server (avvio, stop, log, stato, diagnostica).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

namespace DirettaOS
{
    static class ServerCtl
    {
        static string WatchPid
        {
            get { return Path.Combine(Shell.InstallDir, "watch.pid"); }
        }

        static bool ProcessoVivo(int pid, string nome)
        {
            try
            {
                Process p = Process.GetProcessById(pid);
                return !p.HasExited && (nome == null || p.ProcessName.Equals(nome, StringComparison.OrdinalIgnoreCase));
            }
            catch { return false; }
        }

        static int LeggiPid(string file)
        {
            try
            {
                string s = File.ReadAllText(file).Trim();
                int n;
                return Int32.TryParse(s, out n) ? n : 0;
            }
            catch { return 0; }
        }

        public static bool WatcherVivo()
        {
            int pid = LeggiPid(WatchPid);
            return pid > 0 && ProcessoVivo(pid, "DirettaOS");
        }

        public static int Start(bool verboso)
        {
            if (!Shell.Installed())
            {
                Term.Err("Diretta OS non è installato in " + Shell.InstallDir);
                Term.Note("Apri DirettaOS-Setup.exe per installarlo.");
                return 1;
            }
            if (Shell.ServerUp())
            {
                if (verboso)
                {
                    Term.Ok("il server è già acceso: " + Shell.Url);
                    if (!WatcherVivo()) Term.Note("(è acceso ma non c'è il guardiano che lo riavvia: «restart» lo rimette a posto)");
                }
                return 0;
            }
            int porta = Shell.Porta();
            string pid = Shell.ProcessoSuPorta(porta);
            if (pid != null)
            {
                string nome = Shell.NomeProcesso(pid);
                Term.Err("la porta " + porta + " è occupata da " + (nome == "" ? "un altro programma" : nome) + " (PID " + pid + ").");
                Term.Note("Chiudi quel programma, o cambia «porta» in config.json / con «DirettaOS.exe configura».");
                return 1;
            }

            try { if (File.Exists(Shell.StopFlag)) File.Delete(Shell.StopFlag); } catch { }
            if (WatcherVivo())
            {
                // il guardiano c'è già: aspetto che il server torni su da solo
                if (verboso) Term.Step("il guardiano c'è già, aspetto il server…");
            }
            else
            {
                try
                {
                    ProcessStartInfo p = new ProcessStartInfo();
                    p.FileName = Shell.ManagerExe;
                    if (!File.Exists(p.FileName)) p.FileName = Shell.ExePath();
                    p.Arguments = "--watch";
                    p.WorkingDirectory = Shell.InstallDir;
                    p.UseShellExecute = false;
                    p.CreateNoWindow = true;
                    p.WindowStyle = ProcessWindowStyle.Hidden;
                    Process.Start(p);
                }
                catch (Exception e)
                {
                    Term.Err("non riesco ad avviare il guardiano: " + e.Message);
                    return 1;
                }
            }

            for (int i = 0; i < 60; i++)
            {
                Shell.Sleep(300);
                if (Shell.ServerUp())
                {
                    if (verboso)
                    {
                        Term.Ok("server acceso: " + Shell.Url);
                        Term.Note("in Camo/OBS: livello web 1920 × 1080 su " + Shell.Url + "o/tutto");
                        Term.Note("la tv del podcast: " + Shell.UrlTv);
                    }
                    return 0;
                }
            }
            Term.Err("il server non risponde dopo 18 secondi.");
            MostraCoda(12);
            Term.Note("Guarda " + Shell.LogFile + " oppure lancia «DirettaOS.exe doctor».");
            return 1;
        }

        public static int Foreground()
        {
            if (!Shell.Installed()) { Term.Err("Diretta OS non è installato."); return 1; }
            if (Shell.ServerUp()) { Term.Err("il server è già acceso: fermalo prima con «DirettaOS.exe stop»."); return 1; }
            string node = Shell.FindNode();
            if (node == null) { Term.Err("Node.js non c'è."); return 1; }
            Term.Ok("server in primo piano: " + Shell.Url);
            Term.Note("Ctrl+C per fermarlo (chiude la webcam con le buone).");
            ProcessStartInfo p = new ProcessStartInfo();
            p.FileName = node;
            p.Arguments = "server.mjs";
            p.WorkingDirectory = Shell.AppDir;
            p.UseShellExecute = false;
            p.CreateNoWindow = true;
            p.RedirectStandardOutput = true;
            p.RedirectStandardError = true;
            Process q = new Process();
            q.StartInfo = p;
            q.OutputDataReceived += delegate (object s, DataReceivedEventArgs e) { if (e.Data != null) { Console.WriteLine("  " + e.Data); Shell.Append(Shell.LogFile, e.Data); } };
            q.ErrorDataReceived += delegate (object s, DataReceivedEventArgs e) { if (e.Data != null) { Console.WriteLine("  " + e.Data); Shell.Append(Shell.LogFile, e.Data); } };
            ConsoleCancelEventHandler stop = delegate (object s, ConsoleCancelEventArgs e)
            {
                e.Cancel = true;
                Term.Warn("chiudo la webcam con le buone…");
                Shell.Post("{\"tipo\":\"spegniti\"}", 3000);
            };
            Console.CancelKeyPress += stop;
            q.Start();
            q.BeginOutputReadLine();
            q.BeginErrorReadLine();
            q.WaitForExit();
            Console.CancelKeyPress -= stop;
            Term.Ok("server fermo.");
            return 0;
        }

        public static int Watch()
        {
            // il guardiano: un processo leggero che tiene su node e lo rifà partire se cade
            if (!Shell.Installed()) return 1;
            try { File.WriteAllText(WatchPid, Process.GetCurrentProcess().Id.ToString()); } catch { }
            string node = Shell.FindNode();
            if (node == null)
            {
                Shell.Append(Shell.LogFile, "guardiano: Node.js non trovato, non posso avviare il server");
                return 1;
            }
            while (!File.Exists(Shell.StopFlag))
            {
                Shell.Append(Shell.LogFile, "server parte (" + node + ")");
                try
                {
                    ProcessStartInfo p = new ProcessStartInfo();
                    p.FileName = "cmd.exe";
                    p.Arguments = "/c \"\"" + node + "\" server.mjs >> \"" + Shell.LogFile + "\" 2>&1\"";
                    p.WorkingDirectory = Shell.AppDir;
                    p.UseShellExecute = false;
                    p.CreateNoWindow = true;
                    p.WindowStyle = ProcessWindowStyle.Hidden;
                    using (Process q = Process.Start(p)) q.WaitForExit();
                    Shell.Append(Shell.LogFile, "il server si è fermato");
                }
                catch (Exception e) { Shell.Append(Shell.LogFile, "guardiano: " + e.Message); }
                if (File.Exists(Shell.StopFlag)) break;
                Shell.Sleep(3000);
            }
            try { if (File.Exists(WatchPid)) File.Delete(WatchPid); } catch { }
            try { if (File.Exists(Shell.StopFlag)) File.Delete(Shell.StopFlag); } catch { }
            return 0;
        }

        public static bool SembraDiretta()
        {
            string s = Shell.StatoJson(2500);
            return s != null && s.IndexOf("\"attivi\"", StringComparison.Ordinal) >= 0;
        }

        public static int Stop(bool verboso, bool soloDiretta)
        {
            bool acceso = Shell.ServerUp();
            if (acceso && soloDiretta && !SembraDiretta())
            {
                Term.Err("sulla porta " + Shell.Porta() + " risponde qualcosa che non è Diretta OS: non lo tocco.");
                return 1;
            }
            if (!acceso && !WatcherVivo())
            {
                try { if (File.Exists(Shell.StopFlag)) File.Delete(Shell.StopFlag); } catch { }
                if (verboso) Term.Ok("era già spento.");
                return 0;
            }

            int porta = Shell.Porta();
            string pid = Shell.ProcessoSuPorta(porta);
            if (pid != null && soloDiretta)
            {
                string nome = Shell.NomeProcesso(pid);
                if (nome != "node" && nome != "DirettaOS")
                {
                    Term.Err("sulla porta " + porta + " c'è " + nome + " (PID " + pid + "): non lo tocco.");
                    return 1;
                }
            }

            try { File.WriteAllText(Shell.StopFlag, Shell.Data() + " stop richiesto\r\n"); } catch { }
            if (acceso)
            {
                if (verboso) Term.Step("chiedo al server di chiudere la webcam con le buone…");
                Shell.Post("{\"tipo\":\"spegniti\"}", 4000);
            }
            for (int i = 0; i < 48; i++)
            {
                Shell.Sleep(250);
                if (!Shell.ServerUp() && !Shell.PortaOccupata(porta)) break;
            }
            if (Shell.ServerUp() || Shell.PortaOccupata(porta))
            {
                string p2 = Shell.ProcessoSuPorta(porta);
                if (p2 != null)
                {
                    string nome = Shell.NomeProcesso(p2);
                    if (nome == "node" || nome == "DirettaOS")
                    {
                        if (verboso) Term.Warn("non si è chiuso da solo: lo chiudo di forza (PID " + p2 + ").");
                        Shell.TaskKill(p2);
                    }
                    else
                    {
                        Term.Err("la porta " + porta + " è di " + nome + ": non lo tocco.");
                        return 1;
                    }
                }
            }
            // il guardiano esce da solo quando vede stop.flag; se è rimasto, lo chiudo
            int w = LeggiPid(WatchPid);
            if (w > 0 && ProcessoVivo(w, "DirettaOS"))
            {
                Shell.Sleep(1500);
                if (ProcessoVivo(w, "DirettaOS")) Shell.TaskKill(w.ToString());
            }
            try { if (File.Exists(WatchPid)) File.Delete(WatchPid); } catch { }
            try { if (File.Exists(Shell.StopFlag)) File.Delete(Shell.StopFlag); } catch { }
            if (verboso) Term.Ok("server fermo.");
            return 0;
        }

        public static int Restart(bool verboso)
        {
            Term.Step("fermo…");
            int r = Stop(verboso, true);
            if (r != 0) return r;
            Shell.Sleep(500);
            Term.Step("riavvio…");
            return Start(verboso);
        }

        public static int Status()
        {
            Term.Head("Stato");
            Term.KeyValue("Installazione", Shell.Installed() ? Shell.InstallDir : "non installato");
            Term.KeyValue("Node.js", Shell.NodeVersion() == null ? "non trovato" : Shell.NodeVersion() + "  (" + Shell.FindNode() + ")");
            string ff = Shell.FindFfmpeg();
            Term.KeyValue("ffmpeg", ff == null ? "non trovato (facoltativo)" : ff);
            Term.KeyValue("Porta", Shell.Porta().ToString());
            Term.KeyValue("Server", Shell.ServerUp() ? "acceso" : "spento");
            Term.KeyValue("Regia", Shell.Url);
            Term.KeyValue("TV del podcast", Shell.UrlTv);
            string ip = Shell.IpLocale();
            Term.KeyValue("Vista esterna", (ip == null ? "porta " + Shell.PortaVista() : "https://" + ip + ":" + Shell.PortaVista() + "/"));
            Term.KeyValue("Avvio con Windows", Shell.AutostartOn() ? "sì" : "no");
            Term.KeyValue("Guardiano", WatcherVivo() ? "acceso" : "spento");
            string pid = Shell.ProcessoSuPorta(Shell.Porta());
            if (pid != null) Term.KeyValue("Processo", (Shell.NomeProcesso(pid) == "" ? "?" : Shell.NomeProcesso(pid)) + "  (PID " + pid + ")");
            string stato = Shell.ServerUp() ? Shell.StatoJson(2500) : null;
            if (stato != null)
            {
                List<string> accesi = PezziAccesi(stato);
                if (accesi.Count > 0) Term.KeyValue("Pezzi accesi", String.Join(", ", accesi.ToArray()));
                Term.KeyValue("Fotogrammi", Fps(stato));
            }
            if (!Shell.Installed()) Term.Note("Apri DirettaOS-Setup.exe per installarlo.");
            else if (!Shell.ServerUp()) Term.Note("Avvialo con: DirettaOS.exe start");
            return 0;
        }

        public static int Photo()
        {
            if (!Shell.Installed()) { Term.Err("Diretta OS non è installato."); return 1; }
            if (!Shell.ServerUp())
            {
                Term.Step("il server è spento: lo accendo…");
                if (Start(true) != 0) return 1;
            }
            Term.Step("scatto la foto della stanza dalla webcam «Camo»…");
            try
            {
                HttpWebRequest r = (HttpWebRequest)WebRequest.Create(Shell.UrlLocal + "api/foto");
                r.Method = "POST";
                r.ContentLength = 0;
                r.Timeout = 35000;
                r.ReadWriteTimeout = 35000;
                r.Proxy = null;
                using (HttpWebResponse x = (HttpWebResponse)r.GetResponse())
                using (StreamReader sr = new StreamReader(x.GetResponseStream(), Encoding.UTF8))
                {
                    string s = sr.ReadToEnd();
                    if (s.IndexOf("\"ok\":true", StringComparison.Ordinal) >= 0)
                    {
                        Term.Ok("foto scattata: " + Path.Combine(Shell.AppDir, "riferimenti", "05.jpg") + " / 10.jpg");
                        return 0;
                    }
                    Term.Warn("non l'ha scattata: " + s);
                    Term.Note("Apri Camo Studio, scegli la lente (0,5× o 1,0×) e riprova.");
                    return 1;
                }
            }
            catch (Exception e)
            {
                Term.Err("foto non riuscita: " + e.Message);
                Term.Note("La webcam deve essere libera e Camo deve avere l'immagine del telefono.");
                return 1;
            }
        }

        public static int Logs(bool follow)
        {
            Term.Head("Log");
            if (!File.Exists(Shell.LogFile)) { Term.Warn("non c'è ancora: " + Shell.LogFile); return 0; }
            MostraCoda(40);
            if (!follow) return 0;
            Term.Note("seguo il log; Ctrl+C per uscire.");
            long pos = new FileInfo(Shell.LogFile).Length;
            try
            {
                while (true)
                {
                    Shell.Sleep(500);
                    using (FileStream f = new FileStream(Shell.LogFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    {
                        if (f.Length < pos) pos = 0;
                        f.Seek(pos, SeekOrigin.Begin);
                        using (StreamReader sr = new StreamReader(f, Encoding.UTF8))
                        {
                            string s;
                            while ((s = sr.ReadLine()) != null) Console.WriteLine("  " + s);
                        }
                        pos = f.Position;
                    }
                }
            }
            catch (Exception e) { Term.Err(e.Message); return 1; }
        }

        static void MostraCoda(int righe)
        {
            try
            {
                string[] tutte = File.ReadAllLines(Shell.LogFile, Encoding.UTF8);
                int da = Math.Max(0, tutte.Length - righe);
                for (int i = da; i < tutte.Length; i++) { Term.Colored("  ", ConsoleColor.DarkGray); Console.WriteLine(tutte[i]); }
            }
            catch { }
        }

        // ── diagnostica ─────────────────────────────────────────────────────────
        static int errori;
        static void Check(string nome, bool ok, string dice, bool errore)
        {
            if (ok) { Term.Colored("  [ OK ] ", ConsoleColor.Green); Console.WriteLine(nome + (dice == "" ? "" : " — " + dice)); }
            else
            {
                Term.Colored(errore ? "  [ XX ] " : "  [ !! ] ", errore ? ConsoleColor.Red : ConsoleColor.Yellow);
                Console.WriteLine(nome + (dice == "" ? "" : " — " + dice));
                if (errore) errori++;
            }
        }

        public static int Doctor()
        {
            Term.Head("Diagnostica");
            errori = 0;
            Check("Windows", true, Shell.WindowsName() + (Environment.Is64BitOperatingSystem ? " · 64 bit" : " · 32 bit"), false);
            Check("Cartella", Shell.Installed(), Shell.Installed() ? Shell.InstallDir : "non installato", true);
            if (Shell.Installed())
            {
                Check("server.mjs", File.Exists(Path.Combine(Shell.AppDir, "server.mjs")), "", true);
                Check("regia", File.Exists(Path.Combine(Shell.AppDir, "pubblico", "regia.html")), "", true);
                Check("caratteri", Directory.Exists(Path.Combine(Shell.InstallDir, "pzkko.it", "public", "fonts")), "", true);
                Check("oggetti (art)", Directory.Exists(Path.Combine(Shell.InstallDir, "pzkko.it", "public", "art")), "", true);
                Check("PowerShell", Shell.PowerShell(), "serve per tasti, sensori e volti", false);
            }
            int n = Shell.NodeMaggiore();
            Check("Node.js 20+", n >= 20, Shell.NodeVersion() == null ? "non trovato: https://nodejs.org" : Shell.NodeVersion(), true);
            string ff = Shell.FindFfmpeg();
            Check("ffmpeg", ff != null, ff == null ? "facoltativo: senza, niente webcam, lente e volti" : ff, false);

            if (Shell.Installed())
            {
                int porta = Shell.Porta();
                string pid = Shell.ProcessoSuPorta(porta);
                bool nostro = pid == null || Shell.NomeProcesso(pid) == "node" || Shell.NomeProcesso(pid) == "DirettaOS";
                Check("porta " + porta, nostro, pid == null ? "libera" : "in uso da " + Shell.NomeProcesso(pid) + " (PID " + pid + ")", !nostro);
                int vp = Shell.PortaVista();
                string vpid = Shell.ProcessoSuPorta(vp);
                bool vnostro = vpid == null || Shell.NomeProcesso(vpid) == "node" || Shell.NomeProcesso(vpid) == "DirettaOS";
                Check("vista esterna " + vp, vnostro, vpid == null ? "libera" : "in uso da " + Shell.NomeProcesso(vpid), !vnostro);
                Check("server", Shell.ServerUp(), Shell.ServerUp() ? Shell.Url : "spento: DirettaOS.exe start", false);
                Check("avvio automatico", Shell.AutostartOn(), Shell.AutostartOn() ? "sì" : "no: DirettaOS.exe autostart on", false);
                Check("guardiano", WatcherVivo(), WatcherVivo() ? "acceso" : "spento", false);

                string rif = Path.Combine(Shell.AppDir, "riferimenti");
                Check("foto stanza 0,5×", File.Exists(Path.Combine(rif, "05.jpg")), "facoltativa: DirettaOS.exe photo", false);
                Check("foto stanza 1,0×", File.Exists(Path.Combine(rif, "10.jpg")), "facoltativa: DirettaOS.exe photo", false);
                Check("modello volti", File.Exists(Path.Combine(Shell.AppDir, "modelli", "volti-rfb-320.onnx")), "facoltativo: DirettaOS.exe extra", false);
                Check("foto tastiera/mouse/pad", File.Exists(Path.Combine(Shell.AppDir, "foto", "tastiera.png")) && File.Exists(Path.Combine(Shell.AppDir, "foto", "mouse.png")), "facoltative: DirettaOS.exe extra", false);

                string camo = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Reincubate", "Camo");
                Check("Camo Studio", Directory.Exists(camo), Directory.Exists(camo) ? camo : "non trovato (serve per la webcam)", false);
                try
                {
                    string prova = Path.Combine(Shell.AppDir, ".prova-scrittura");
                    File.WriteAllText(prova, "ok");
                    File.Delete(prova);
                    Check("permessi di scrittura", true, "ok", false);
                }
                catch { Check("permessi di scrittura", false, "non posso scrivere in " + Shell.AppDir, true); }
            }

            Console.WriteLine();
            if (errori == 0) Term.Ok("Tutto a posto. Se qualcosa non va, guarda i log con «DirettaOS.exe logs --follow».");
            else Term.Warn(errori + " cose da sistemare: segui i suggerimenti qui sopra.");
            return errori == 0 ? 0 : 2;
        }

        static List<string> PezziAccesi(string json)
        {
            List<string> list = new List<string>();
            try
            {
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> d = ser.DeserializeObject(json) as Dictionary<string, object>;
                if (d == null) return list;
                Dictionary<string, object> a = d.ContainsKey("attivi") ? d["attivi"] as Dictionary<string, object> : null;
                if (a == null) return list;
                foreach (KeyValuePair<string, object> k in a)
                    if (k.Value is bool && (bool)k.Value) list.Add(k.Key);
            }
            catch { }
            return list;
        }

        static string Fps(string json)
        {
            try
            {
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> d = ser.DeserializeObject(json) as Dictionary<string, object>;
                if (d == null) return "";
                if (d.ContainsKey("occhio") && d["occhio"] is Dictionary<string, object>)
                {
                    Dictionary<string, object> o = d["occhio"] as Dictionary<string, object>;
                    if (o.ContainsKey("fps")) return o["fps"] + " foto/s (occhio)";
                }
            }
            catch { }
            return "";
        }
    }
}

