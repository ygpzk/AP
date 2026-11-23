// Diretta OS: l'installazione, gli extra facoltativi, il backup e la disinstallazione.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

namespace DirettaOS
{
    static class Installer
    {
        public static int Installa(Opzioni o)
        {
            return Installa(o, null);
        }

        public static int Installa(Opzioni o, string cartella)
        {
            Term.Head("Installazione");
            if (!Shell.Payload)
            {
                if (Shell.Installed())
                {
                    Term.Ok("Diretta OS è già installato in " + Shell.InstallDir);
                    Term.Note("Per aggiornarlo, scarica il nuovo DirettaOS-Setup.exe e aprilo: i tuoi dati restano.");
                    return 0;
                }
                Term.Err("Questo è il gestore, non l'installatore.");
                Term.Note("Scarica DirettaOS-Setup.exe da " + Shell.Sito);
                return 1;
            }

            string destinazione = String.IsNullOrEmpty(cartella) ? Shell.DefaultInstallDir : cartella;
            if (!o.Silent)
            {
                destinazione = Term.Ask("Dove lo installo", destinazione);
                if (destinazione.StartsWith("\"") && destinazione.EndsWith("\"") && destinazione.Length > 1)
                    destinazione = destinazione.Substring(1, destinazione.Length - 2);
            }
            try { destinazione = Path.GetFullPath(destinazione); }
            catch { Term.Err("Cartella non valida: " + destinazione); return 1; }
            Shell.UsaCartella(destinazione);

            if (!PreparaNode(o)) return 1;
            ControllaFfmpeg(o, true);

            Term.Head("Copio i file");
            Term.Step("in " + destinazione);
            Directory.CreateDirectory(destinazione);

            // se c'è già un server acceso, lo chiudo con le buone prima di toccare i file
            if (File.Exists(Path.Combine(destinazione, "app", "server.mjs"))) ServerCtl.Stop(true, true);

            string tmp = Path.Combine(Path.GetTempPath(), "direttaos-" + Guid.NewGuid().ToString("N"));
            try
            {
                Directory.CreateDirectory(tmp);
                string zip = Path.Combine(tmp, "payload.zip");
                using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip"))
                {
                    if (s == null) throw new Exception("il pacchetto non c'è");
                    using (FileStream f = File.Create(zip)) s.CopyTo(f);
                }
                Directory.CreateDirectory(Path.Combine(tmp, "estratto"));
                ZipFile.ExtractToDirectory(zip, Path.Combine(tmp, "estratto"));
                string estratto = Path.Combine(tmp, "estratto");
                if (!File.Exists(Path.Combine(estratto, "app", "server.mjs")))
                    throw new Exception("il pacchetto non contiene app\\server.mjs");

                // (la cartella dell'exe può essere un'altra: il gestore va sempre in destinazione)
                Shell.CopiaAlbero(estratto, destinazione, true);
                Term.Ok("file copiati (" + Shell.Mb(Shell.Dimensione(destinazione)) + ")");
            }
            catch (Exception e)
            {
                Term.Err("installazione non riuscita: " + e.Message);
                return 1;
            }
            finally
            {
                try { Directory.Delete(tmp, true); } catch { }
            }

            // il gestore deve stare nella cartella di installazione
            string mio = Shell.ExePath();
            string gestore = Path.Combine(destinazione, "DirettaOS.exe");
            if (!File.Exists(gestore) && File.Exists(mio))
            {
                try { File.Copy(mio, gestore, true); } catch { }
            }

            Shell.CartelleVuote();
            Shell.CreaVbs();

            bool desktop, automatico;
            if (o.Portable) { desktop = false; automatico = false; }
            else if (o.Silent) { desktop = true; automatico = true; }
            else
            {
                desktop = Term.AskYes("Metto la scorciatoia sul Desktop?", true);
                automatico = Term.AskYes("Lo faccio partire insieme a Windows?", true);
            }
            if (!o.Portable)
            {
                Shell.Autostart(automatico);
                Shell.CreaScorciatoie(desktop);
                Shell.RegistraProgramma();
                Term.Ok("scorciatoie nel menu Start" + (desktop ? " e sul Desktop" : ""));
                Term.Ok("voce in App e funzionalità di Windows");
            }
            else Term.Ok("installazione portatile: nessuna scorciatoia, nessun registro");

            // un file di benvenuto con i primi passi
            ScriviLeggimi(destinazione);

            Term.Head("Fatto");
            Term.Ok("Diretta OS è installato in " + destinazione);
            Term.Note("Apri la regia:  " + Path.Combine(destinazione, "DirettaOS.exe") + " start");
            Term.Note("Tutti i comandi: " + Path.Combine(destinazione, "DirettaOS.exe") + " commands");
            Term.Note("La guida: " + Path.Combine(destinazione, "GUIDA-INSTALLAZIONE.md"));

            bool apri = !o.Silent;
            if (!o.Silent) apri = Term.AskYes("Apro la regia adesso?", true);
            if (apri)
            {
                ServerCtl.Start(true);
                Shell.Sleep(800);
                Shell.Open(Shell.Url);
            }
            return 0;
        }

        static bool PreparaNode(Opzioni o)
        {
            int n = Shell.NodeMaggiore();
            if (n >= 20)
            {
                Term.Ok("Node.js " + Shell.NodeVersion() + " (" + Shell.FindNode() + ")");
                return true;
            }
            if (n < 0) Term.Warn("Node.js non c'è: serve la versione 20 o più nuova.");
            else Term.Warn("Node.js " + Shell.NodeVersion() + " è troppo vecchio: serve la 20 o più nuova.");

            if (o.Silent || o.NoNode)
            {
                Term.Note("Installalo da https://nodejs.org (LTS), poi rilancia questo programma.");
                return false;
            }
            if (!Term.AskYes("Lo installo adesso con winget?", true))
            {
                Term.Note("Installalo da https://nodejs.org (LTS), poi rilancia questo programma.");
                return false;
            }
            Term.Step("winget install OpenJS.NodeJS.LTS");
            int r = Shell.Esegui("winget", "install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements", Shell.BaseDir);
            if (r != 0)
            {
                Term.Err("winget non ce l'ha fatta (codice " + r + ").");
                Term.Note("Apri https://nodejs.org, scarica la LTS e installala; poi rilancia.");
                return false;
            }
            Shell.Sleep(2500);
            if (Shell.NodeMaggiore() < 20)
            {
                Term.Err("Node.js non si vede ancora. Chiudi e riapri il terminale, poi rilancia.");
                return false;
            }
            Term.Ok("Node.js " + Shell.NodeVersion());
            return true;
        }

        static void ControllaFfmpeg(Opzioni o, bool proponi)
        {
            string f = Shell.FindFfmpeg();
            if (f != null) { Term.Ok("ffmpeg (" + f + ")"); return; }
            Term.Warn("ffmpeg non c'è: la webcam, la lente e i volti non funzionano. Il resto sì.");
            if (!proponi || o.Silent || o.NoNode) return;
            if (!Term.AskYes("Lo installo adesso con winget (Gyan.FFmpeg)?", true)) return;
            int r = Shell.Esegui("winget", "install --id Gyan.FFmpeg -e --silent --accept-package-agreements --accept-source-agreements", Shell.BaseDir);
            if (r == 0) Term.Ok("ffmpeg installato (riapri il terminale se non lo vede)");
            else Term.Warn("ffmpeg non installato: puoi farlo dopo con «DirettaOS.exe extra».");
        }

        static void ScriviLeggimi(string destinazione)
        {
            string exe = Path.Combine(destinazione, "DirettaOS.exe");
            string s =
                "DIRETTA OS v" + Shell.Versione + "\r\n" +
                "=================\r\n\r\n" +
                "La regia delle sovrimpressioni per le dirette. Il server ascolta solo su questo PC\r\n" +
                "(127.0.0.1) e la regia si apre nel browser.\r\n\r\n" +
                "PRIMI PASSI\r\n" +
                "  1. Doppio clic su " + exe + "\r\n" +
                "  2. «Avvia» (oppure: DirettaOS.exe start)\r\n" +
                "  3. «Apri la regia» (oppure: DirettaOS.exe open)\r\n" +
                "  4. In Camo Studio o OBS aggiungi un livello web 1920 × 1080:\r\n" +
                "       http://localhost:" + Shell.Porta() + "/o/tutto\r\n\r\n" +
                "COMANDI\r\n" +
                "  DirettaOS.exe                    menu\r\n" +
                "  DirettaOS.exe start              avvia il server in background\r\n" +
                "  DirettaOS.exe start --foreground avvia e mostra i log\r\n" +
                "  DirettaOS.exe stop               chiude con le buone (webcam compresa)\r\n" +
                "  DirettaOS.exe restart            riavvia\r\n" +
                "  DirettaOS.exe open               apre la regia nel browser\r\n" +
                "  DirettaOS.exe status             stato del server\r\n" +
                "  DirettaOS.exe commands           tutti i comandi e gli indirizzi\r\n" +
                "  DirettaOS.exe doctor             diagnostica\r\n" +
                "  DirettaOS.exe config             apre config.json\r\n" +
                "  DirettaOS.exe configura          porta, città, microfono, cuffie, Camo\r\n" +
                "  DirettaOS.exe logs --follow      log dal vivo\r\n" +
                "  DirettaOS.exe backup             salva config, stato e foto\r\n" +
                "  DirettaOS.exe extra              scarica modello volti e foto di tastiera/mouse/pad\r\n" +
                "  DirettaOS.exe photo              scatta la foto della stanza da Camo\r\n" +
                "  DirettaOS.exe autostart on|off   avvio con Windows\r\n" +
                "  DirettaOS.exe uninstall          disinstalla (i dati si possono tenere)\r\n\r\n" +
                "CARTELLE\r\n" +
                "  programma: " + destinazione + "\r\n" +
                "  dati:      " + Path.Combine(destinazione, "app") + "\r\n" +
                "  log:       " + Path.Combine(destinazione, "app", "diretta.log") + "\r\n\r\n" +
                "La guida completa è in GUIDA-INSTALLAZIONE.md; online: " + Shell.Sito + "\r\n";
            try { File.WriteAllText(Path.Combine(destinazione, "LEGGIMI.txt"), s, Encoding.UTF8); } catch { }
        }

        // ── gli extra facoltativi ───────────────────────────────────────────────
        public static int Extra(Opzioni o)
        {
            Term.Head("Extra facoltativi");
            Term.Note("Sono le cose che non posso ridistribuire nel pacchetto: il modello dei volti");
            Term.Note("(MIT, 1,2 MB) e le foto ufficiali di Logitech e Sony. Vengono dai loro indirizzi.");
            Term.Note("Servono per Giugnoh che segue la testa e per /o/tasti. Il resto funziona lo stesso.");
            Term.Note("Il vecchio modello delle persone (Apache 2.0) è ancora in modelli\\persone, ma non serve più.");
            Shell.CartelleVuote();
            bool qualcosa = false;

            string modello = Path.Combine(Shell.AppDir, "modelli", "volti-rfb-320.onnx");
            if (!File.Exists(modello) || o.Force)
            {
                Term.Step("modello dei volti (MIT)…");
                if (Scarica("https://raw.githubusercontent.com/Linzaer/Ultra-Light-Fast-Generic-Face-Detector-1MB/master/models/onnx/version-RFB-320.onnx", modello))
                { Term.Ok("modelli\\volti-rfb-320.onnx"); qualcosa = true; }
                else Term.Warn("non scaricato: " + modello);
            }
            else Term.Ok("modello dei volti già presente");

            string ff = Shell.FindFfmpeg();
            if (ff == null)
            {
                Term.Warn("ffmpeg non c'è: le foto si possono scaricare, ma non ritagliare.");
                Term.Note("Installa ffmpeg con winget, poi rilancia «DirettaOS.exe extra».");
            }

            Foto(ff, "tastiera.png", "https://resource.logitechg.com/w_1400,c_limit,q_auto,f_png/d_transparent.gif/content/dam/gaming/en/products/g413-se/g413-se-gallery-4.png", "crop=1294:440:46:283", o, ref qualcosa);
            Foto(ff, "mouse.png", "https://resource.logitechg.com/w_1400,c_limit,q_auto,f_png/d_transparent.gif/content/dam/gaming/en/non-braid/hyjal-g502-hero/2025/g502-hero-mouse-top-angle-gallery-1.png", "crop=552:1066:420:31", o, ref qualcosa);
            Foto(ff, "pad.png", "https://gmedia.playstation.com/is/image/SIEPDC/DualsenseController-White01-16x9-01-28feb26$en?wid=1400&fmt=png-alpha", "crop=836:574:283:116", o, ref qualcosa);

            if (qualcosa) Term.Ok("extra pronti.");
            else Term.Note("niente da fare.");
            Term.Note("Le foto della stanza (riferimenti\\05.jpg e 10.jpg) le fai con «DirettaOS.exe photo».");
            return 0;
        }

        static void Foto(string ff, string nome, string url, string crop, Opzioni o, ref bool qualcosa)
        {
            string fuori = Path.Combine(Shell.AppDir, "foto", nome);
            if (File.Exists(fuori) && !o.Force) { Term.Ok("foto\\" + nome + " già presente"); return; }
            if (ff == null) return;
            string tmp = Path.Combine(Path.GetTempPath(), "direttaos-" + nome + "-" + Guid.NewGuid().ToString("N") + ".png");
            Term.Step("foto " + nome + "…");
            if (!Scarica(url, tmp)) { Term.Warn("non scaricata: " + nome); return; }
            int r = Shell.Esegui(ff, "-y -i \"" + tmp + "\" -vf \"" + crop + "\" \"" + fuori + "\"", Shell.AppDir);
            try { File.Delete(tmp); } catch { }
            if (r == 0 && File.Exists(fuori)) { Term.Ok("foto\\" + nome); qualcosa = true; }
            else Term.Warn("ffmpeg non è riuscito a ritagliare " + nome);
        }

        static bool Scarica(string url, string file)
        {
            try
            {
                // .NET Framework usa TLS 1.0 di default: GitHub e i CDN vogliono TLS 1.2
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                string dir = Path.GetDirectoryName(file);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                using (WebClient w = new WebClient())
                {
                    w.Headers.Add("User-Agent", "Mozilla/5.0 DirettaOS/" + Shell.Versione);
                    w.DownloadFile(url, file);
                }
                return File.Exists(file) && new FileInfo(file).Length > 1000;
            }
            catch (Exception e) { Term.Warn(e.Message); return false; }
        }

        // ── configurazione ──────────────────────────────────────────────────────
        public static int Configura(Opzioni o)
        {
            Term.Head("Configurazione");
            if (!Shell.Installed()) { Term.Err("Diretta OS non è installato."); return 1; }
            string f = Path.Combine(Shell.AppDir, "config.locale.json");
            int porta = Shell.Porta();
            int tvPorta = Shell.PortaTv();
            int vistaPorta = Shell.PortaVista();
            string citta = "Mantova";
            string lat = "45.1564", lon = "10.7914";
            string mic = "Yeti", cuffie = "Turtle Beach|Stealth|Cuffie|Headset", camo = "Camo";
            // (i valori di partenza li prendo da config.json, se ci sono)
            try
            {
                string c = File.ReadAllText(Path.Combine(Shell.AppDir, "config.json"), Encoding.UTF8);
                Match m = Regex.Match(c, "\"nome\"\\s*:\\s*\"([^\"]*)\""); if (m.Success) citta = m.Groups[1].Value;
                m = Regex.Match(c, "\"lat\"\\s*:\\s*([-0-9.]+)"); if (m.Success) lat = m.Groups[1].Value;
                m = Regex.Match(c, "\"lon\"\\s*:\\s*([-0-9.]+)"); if (m.Success) lon = m.Groups[1].Value;
                m = Regex.Match(c, "\"mic\"\\s*:\\s*\"([^\"]*)\""); if (m.Success) mic = m.Groups[1].Value;
                m = Regex.Match(c, "\"cuffie\"\\s*:\\s*\"([^\"]*)\""); if (m.Success) cuffie = m.Groups[1].Value;
                m = Regex.Match(c, "\"camo\"\\s*:\\s*\"([^\"]*)\""); if (m.Success) camo = m.Groups[1].Value;
                m = Regex.Match(c, "\"tvPorta\"\\s*:\\s*(\\d{2,5})"); if (m.Success) tvPorta = Int32.Parse(m.Groups[1].Value);
            }
            catch { }
            Term.Note("Invio lascia il valore fra parentesi. Le modifiche finiscono in config.locale.json,");
            Term.Note("così un aggiornamento non le cancella.");
            string p = Term.Ask("Porta del server", porta.ToString());
            int np;
            if (!Int32.TryParse(p, out np) || np < 1 || np > 65535) np = porta;
            string pt = Term.Ask("Porta della TV del podcast", tvPorta.ToString());
            int npt;
            if (!Int32.TryParse(pt, out npt) || npt < 1 || npt > 65535) npt = tvPorta;
            string pv = Term.Ask("Porta della vista esterna (webcam in Wi-Fi)", vistaPorta.ToString());
            int npv;
            if (!Int32.TryParse(pv, out npv) || npv < 1 || npv > 65535) npv = vistaPorta;
            string ci = Term.Ask("Città del meteo", citta);
            string la = Term.Ask("Latitudine", lat);
            string lo = Term.Ask("Longitudine", lon);
            string mi = Term.Ask("Microfono (parte del nome)", mic);
            string cu = Term.Ask("Cuffie (parte del nome)", cuffie);
            string ca = Term.Ask("Webcam virtuale di Camo", camo);
            string json = "{\r\n" +
                "  \"porta\": " + np + ",\r\n" +
                "  \"podcast\": { \"tvPorta\": " + npt + " },\r\n" +
                "  \"esterna\": { \"porta\": " + npv + " },\r\n" +
                "  \"meteo\": { \"nome\": " + J(ci) + ", \"lat\": " + JNum(la) + ", \"lon\": " + JNum(lo) + " },\r\n" +
                "  \"mic\": " + J(mi) + ",\r\n" +
                "  \"cuffie\": " + J(cu) + ",\r\n" +
                "  \"camo\": " + J(ca) + "\r\n" +
                "}\r\n";
            try
            {
                File.WriteAllText(f, json, new UTF8Encoding(false));
                Term.Ok("scritto " + f);
                Term.Note("Riavvia il server per applicare: DirettaOS.exe restart");
            }
            catch (Exception e) { Term.Err(e.Message); return 1; }
            return 0;
        }

        static string J(string s)
        {
            if (s == null) s = "";
            return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ") + "\"";
        }

        static string JNum(string s)
        {
            double d;
            if (Double.TryParse(s.Replace(',', '.'), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out d))
                return d.ToString(System.Globalization.CultureInfo.InvariantCulture);
            return "0";
        }

        // ── backup e disinstallazione ───────────────────────────────────────────
        public static int Backup(Opzioni o)
        {
            Term.Head("Backup");
            if (!Shell.Installed()) { Term.Err("Diretta OS non è installato."); return 1; }
            string docs = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Diretta OS");
            Directory.CreateDirectory(docs);
            string quando = DateTime.Now.ToString("yyyy-MM-dd-HHmm");
            string zip = Path.Combine(docs, "backup-" + quando + ".zip");
            string tmp = Path.Combine(Path.GetTempPath(), "direttaos-backup-" + Guid.NewGuid().ToString("N"));
            try
            {
                Directory.CreateDirectory(tmp);
                string[] file = { "config.json", "config.locale.json", "stato.json", "stato-prova.json", "diretta.log" };
                foreach (string f in file)
                {
                    string s = Path.Combine(Shell.AppDir, f);
                    if (File.Exists(s)) File.Copy(s, Path.Combine(tmp, f), true);
                }
                string[] dir = { "riferimenti", "foto", "modelli", "impara", "copie" };
                foreach (string d in dir)
                {
                    string s = Path.Combine(Shell.AppDir, d);
                    if (Directory.Exists(s)) Copia(s, Path.Combine(tmp, d));
                }
                if (File.Exists(zip)) File.Delete(zip);
                ZipFile.CreateFromDirectory(tmp, zip);
                Term.Ok("salvato " + zip + " (" + Shell.Mb(new FileInfo(zip).Length) + ")");
                if (!o.Silent && Term.AskYes("Apro la cartella dei backup?", false)) Shell.OpenFolder(docs);
                return 0;
            }
            catch (Exception e) { Term.Err(e.Message); return 1; }
            finally { try { Directory.Delete(tmp, true); } catch { } }
        }

        static void Copia(string src, string dst)
        {
            Directory.CreateDirectory(dst);
            foreach (string d in Directory.GetDirectories(src, "*", SearchOption.AllDirectories))
                Directory.CreateDirectory(Path.Combine(dst, d.Substring(src.Length).TrimStart('\\')));
            foreach (string f in Directory.GetFiles(src, "*", SearchOption.AllDirectories))
                File.Copy(f, Path.Combine(dst, f.Substring(src.Length).TrimStart('\\')), true);
        }

        public static int Disinstalla(Opzioni o)
        {
            Term.Head("Disinstallazione");
            if (!Shell.Installed())
            {
                Term.Warn("Diretta OS non risulta installato in " + Shell.InstallDir);
                return 0;
            }
            Term.Note("Il server verrà fermato, le scorciatoie tolte e l'avvio automatico spento.");
            if (!o.Yes && !Term.AskWord("Sei sicuro? I tuoi dati possono restare in Documenti", "SI")) return 0;

            ServerCtl.Stop(true, true);
            Shell.Autostart(false);
            Shell.TogliScorciatoie();
            Shell.TogliProgramma();

            if (!o.Purge)
            {
                string docs = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Diretta OS");
                string dove = Path.Combine(docs, "backup-uninstall-" + DateTime.Now.ToString("yyyy-MM-dd-HHmm"));
                Directory.CreateDirectory(dove);
                string[] file = { "config.json", "config.locale.json", "stato.json", "stato-prova.json", "diretta.log" };
                foreach (string f in file)
                {
                    string s = Path.Combine(Shell.AppDir, f);
                    if (File.Exists(s)) { try { File.Copy(s, Path.Combine(dove, f), true); } catch { } }
                }
                string[] dir = { "riferimenti", "foto", "modelli", "impara", "copie" };
                foreach (string d in dir)
                {
                    string s = Path.Combine(Shell.AppDir, d);
                    if (Directory.Exists(s)) { try { Copia(s, Path.Combine(dove, d)); } catch { } }
                }
                Term.Ok("i tuoi dati sono in " + dove);
            }
            else Term.Warn("i tuoi dati vengono cancellati (--purge)");

            Term.Ok("scorciatoie e voce di Windows tolte");
            string cartella = Shell.InstallDir;
            try
            {
                ProcessStartInfo p = Shell.Cmd("ping -n 2 127.0.0.1 >nul & rmdir /s /q \"" + cartella + "\"", Path.GetTempPath());
                System.Diagnostics.Process.Start(p);
            }
            catch { }
            Term.Ok("fatto. La cartella sparisce fra un attimo.");
            return 0;
        }
    }
}

