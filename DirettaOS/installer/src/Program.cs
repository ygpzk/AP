// Diretta OS: il programma (installer e gestore), un solo .exe.
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace DirettaOS
{
    static class Program
    {
        static int Main(string[] args)
        {
            Term.Init();
            Opzioni o = new Opzioni();
            List<string> pos = new List<string>();
            foreach (string a in args)
            {
                string x = a.ToLowerInvariant();
                if (x == "--silent" || x == "-s" || x == "/silent") o.Silent = true;
                else if (x == "--yes" || x == "-y" || x == "/yes") o.Yes = true;
                else if (x == "--foreground" || x == "-f") o.Foreground = true;
                else if (x == "--purge") o.Purge = true;
                else if (x == "--force") o.Force = true;
                else if (x == "--no-node") o.NoNode = true;
                else if (x == "--portable") o.Portable = true;
                else if (x == "--watch") pos.Add("watch");
                else if (x == "--follow") pos.Add("follow");
                else if (x == "--version" || x == "-v") pos.Add("version");
                else if (x == "--help" || x == "-h") pos.Add("help");
                else if (x.StartsWith("-")) { /* opzione sconosciuta: la ignoro */ }
                else pos.Add(a);
            }
            Term.Silent = o.Silent;

            string cmd = pos.Count > 0 ? pos[0].ToLowerInvariant() : null;
            string a1 = pos.Count > 1 ? pos[1] : null;
            string a2 = pos.Count > 2 ? pos[2] : null;

            try
            {
                if (cmd == null)
                {
                    if (Console.IsInputRedirected) return Commands.Aiuto();
                    return Commands.Menu();
                }
                switch (cmd)
                {
                    case "install":
                    case "installa":
                    case "setup":
                        return Installer.Installa(o, a1);
                    case "start":
                    case "avvia":
                        if (o.Foreground) return ServerCtl.Foreground();
                        return ServerCtl.Start(true);
                    case "stop":
                    case "ferma":
                    case "spegni":
                        return ServerCtl.Stop(true, true);
                    case "restart":
                    case "riavvia":
                        return ServerCtl.Restart(true);
                    case "open":
                    case "apri":
                        if (!Shell.ServerUp()) ServerCtl.Start(true);
                        Shell.Open(Shell.Url);
                        return 0;
                    case "status":
                    case "stato":
                        return ServerCtl.Status();
                    case "logs":
                    case "log":
                        return ServerCtl.Logs(a1 == "--follow" || a1 == "follow" || a1 == "-f");
                    case "doctor":
                    case "diagnostica":
                        return ServerCtl.Doctor();
                    case "config":
                    case "configurazione":
                        if (File.Exists(Path.Combine(Shell.AppDir, "config.json"))) Shell.Open(Path.Combine(Shell.AppDir, "config.json"));
                        else Term.Err("config.json non c'è: installa prima Diretta OS.");
                        return 0;
                    case "configura":
                    case "setup-config":
                        return Installer.Configura(o);
                    case "backup":
                        return Installer.Backup(o);
                    case "extra":
                        return Installer.Extra(o);
                    case "photo":
                    case "foto":
                    case "scatta":
                        return ServerCtl.Photo();
                    case "autostart":
                    case "avvio":
                        if (a1 == "on" || a1 == "si" || a1 == "sì" || a1 == "1") { Shell.Autostart(true); Term.Ok("avvio automatico acceso."); return 0; }
                        if (a1 == "off" || a1 == "no" || a1 == "0") { Shell.Autostart(false); Term.Ok("avvio automatico spento."); return 0; }
                        Term.KeyValue("Avvio automatico", Shell.AutostartOn() ? "acceso" : "spento");
                        Term.Note("autostart on | autostart off");
                        return 0;
                    case "uninstall":
                    case "disinstalla":
                        return Installer.Disinstalla(o);
                    case "commands":
                    case "comandi":
                    case "help":
                    case "aiuto":
                    case "?":
                    case "/?":
                        if (cmd == "help" || cmd == "aiuto" || cmd == "?" || cmd == "/?") return Commands.Aiuto();
                        return Commands.Elenco();
                    case "version":
                    case "versione":
                    case "--version":
                        return Commands.Versione();
                    case "folder":
                    case "cartella":
                        return Commands.Folder();
                    case "guide":
                    case "guida":
                        return Commands.Guide();
                    case "web":
                    case "sito":
                        Shell.Open(Shell.Sito);
                        return 0;
                    case "pieces":
                    case "pezzi":
                        return Commands.Pezzi();
                    case "piece":
                    case "pezzo":
                        return Commands.Piece(a1, a2);
                    case "all":
                    case "tutti":
                        return Commands.Tutti(a1);
                    case "via":
                        return Commands.Via(a1);
                    case "lens":
                    case "lente":
                        return Commands.Lente(a1);
                    case "letto":
                        return Commands.Letto(a1);
                    case "redbull":
                        return Commands.Redbull(a1);
                    case "social":
                        return Commands.Social(a1, a2);
                    case "podcast":
                        return Commands.Podcast(a1);
                    case "tv":
                        return Commands.Tv(a1);
                    case "update":
                    case "aggiorna":
                        if (Shell.Payload) return Installer.Installa(o, a1);
                        Term.Warn("Per aggiornare, scarica il nuovo DirettaOS-Setup.exe da " + Shell.Sito);
                        Term.Note("Aprilo: i tuoi dati, config e stato restano al loro posto.");
                        return 0;
                    case "watch":
                    case "--watch":
                        return ServerCtl.Watch();
                    default:
                        Term.Err("Comando sconosciuto: " + cmd);
                        Console.WriteLine();
                        return Commands.Aiuto();
                }
            }
            catch (Exception e)
            {
                Term.Err("Errore: " + e.Message);
                Term.Note("Rilancia con «DirettaOS.exe doctor» e guarda «DirettaOS.exe logs».");
                return 1;
            }
        }
    }
}
