// Diretta OS: i comandi, gli indirizzi e il menu.
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace DirettaOS
{
    class Opzioni
    {
        public bool Silent, Yes, Foreground, Purge, Force, NoNode, Portable;
    }

    static class Commands
    {
        public static int Versione()
        {
            Console.WriteLine("Diretta OS " + Shell.Versione + (Shell.Payload ? "  (installer)" : "  (gestore)"));
            Console.WriteLine("Windows 10/11 · Node 20+ · PowerShell · ffmpeg (facoltativo)");
            Console.WriteLine(Shell.Sito);
            return 0;
        }

        public static int Aiuto()
        {
            Term.Banner(Shell.Versione, Shell.RunningFromSetup());
            Console.WriteLine("  Uso: DirettaOS.exe <comando> [opzioni]");
            Console.WriteLine();
            Term.Head("Installazione e server");
            Comando("install [cartella]", "installa o aggiorna (solo DirettaOS-Setup.exe)");
            Comando("install --silent --portable", "niente domande, niente scorciatoie né registro");
            Comando("start", "avvia il server in background");
            Comando("start --foreground", "avvia il server e mostra i log nel terminale");
            Comando("stop", "ferma il server, chiudendo la webcam con le buone");
            Comando("restart", "ferma e riavvia (dopo un aggiornamento)");
            Comando("open", "apre la regia nel browser");
            Comando("status", "stato, porta, processo e pezzi accesi");
            Comando("logs [--follow]", "le ultime righe di diretta.log, o il log dal vivo");
            Comando("doctor", "diagnostica: Node, ffmpeg, porte, webcam, foto e modelli");
            Comando("config", "apre config.json nel Blocco note");
            Comando("configura", "porta, città, microfono, cuffie e nome della webcam");
            Comando("backup", "salva config, stato, foto e modelli in Documenti");
            Comando("extra", "scarica modello volti e foto di tastiera, mouse e pad");
            Comando("photo, shot", "scatta la foto della stanza dalla webcam Camo");
            Comando("autostart on|off", "accende o spegne l'avvio con Windows");
            Comando("uninstall [--purge]", "disinstalla; senza --purge i dati restano in Documenti");
            Comando("version", "versione");
            Console.WriteLine();
            Term.Head("La regia, dal terminale");
            Comando("pieces", "elenca i pezzi e quali sono accesi");
            Comando("piece <nome> on|off", "accende o spegne un pezzo");
            Comando("all on|off", "tutti i pezzi (tranne quelli del PC e del podcast)");
            Comando("via <scena>", "accende un «torno subito»");
            Comando("lens auto|05|10", "forza la lente 0,5× o 1,0×, o torna automatica");
            Comando("letto HH:MM", "cambia l'ora del letto");
            Comando("redbull +1|-1|0", "cambia il contatore delle Red Bull di oggi");
            Comando("social <rete> <numero|->", "scrive un numero (o toglie quello scritto a mano)");
            Comando("podcast inizia|argomento|fine|chiudi|riprendi", "Giugnoh's Cast");
            Comando("tv podcast|logo|ora|nome|parla|testo|meteo", "cambia la schermata della TV");
            Comando("piece esterna on|off", "la webcam di un portatile in Wi-Fi");
            Console.WriteLine();
            Term.Head("Altro");
            Comando("commands", "tutti i comandi e tutti gli indirizzi");
            Comando("folder", "apre la cartella di installazione");
            Comando("guide", "apre la guida locale");
            Comando("web", "apre la guida sul sito");
            Console.WriteLine();
            Term.Note("Opzioni: --silent (niente domande), --yes (conferma), --foreground, --purge.");
            return 0;
        }

        static void Comando(string c, string dice)
        {
            int w = Math.Max(38, c.Length + 2);
            Term.Colored("  " + c.PadRight(w), ConsoleColor.White);
            Console.WriteLine(dice);
        }

        static void Indirizzo(string c, string dice)
        {
            string u = c == "/" ? Shell.Url : Shell.Url.TrimEnd('/') + c;
            int w = Math.Max(52, u.Length + 2);
            Term.Colored("  " + u.PadRight(w), ConsoleColor.Green);
            Console.WriteLine(dice);
        }

        public static int Elenco()
        {
            Term.Banner(Shell.Versione, Shell.RunningFromSetup());
            Console.WriteLine("  TUTTI I COMANDI");
            Term.Step("Ogni comando si può scrivere: " + Shell.ManagerExe + " <comando>");
            Console.WriteLine();
            Term.Head("Server e installazione");
            Comando("start", "avvia il server in background (guardiano compreso)");
            Comando("start --foreground", "avvia con i log nel terminale (Ctrl+C per fermare)");
            Comando("stop", "chiude tutto con le buone, webcam compresa");
            Comando("restart", "riavvia dopo un aggiornamento");
            Comando("open", "apre " + Shell.Url);
            Comando("status", "stato e pezzi accesi");
            Comando("logs --follow", "log dal vivo");
            Comando("doctor", "diagnostica completa");
            Comando("config / configura", "config.json / porta, città e dispositivi");
            Comando("backup / extra / photo", "backup / scarica extra / scatta la foto della stanza");
            Comando("autostart on|off", "avvio automatico con Windows");
            Comando("uninstall [--purge]", "disinstalla");
            Console.WriteLine();
            Term.Head("La regia, dal terminale");
            Comando("pieces", "i pezzi e il loro stato");
            Comando("piece <nome> on|off", "accende o spegne un pezzo");
            Comando("all on|off", "tutti insieme");
            Comando("via <scena>", "legna, pipi, bere, mangiare, lattina, telefono, spacco, sistemo, riavvio");
            Comando("lens auto|05|10", "lente della webcam");
            Comando("letto HH:MM", "ora del letto");
            Comando("redbull +1|-1|0", "Red Bull di oggi");
            Comando("social <rete> <numero|->", "instagram, tiktok, youtube, twitch…");
            Comando("podcast inizia|argomento|fine|chiudi|riprendi", "Giugnoh's Cast");
            Comando("tv podcast|logo|ora|nome|parla|testo|meteo", "la schermata sulla TV");
            Console.WriteLine();
            Term.Head("Tutti gli indirizzi (su questo PC)");
            Indirizzo("/", "la regia (anteprima, scheda, torno subito, podcast)");
            Indirizzo("/o/tutto", "tutti i pezzi in una pagina sola (la più leggera)");
            Console.WriteLine();
            Term.Step("I pezzi, uno per uno:");
            Indirizzo("/o/cornice", "il bordo che gira");
            Indirizzo("/o/nome", "il nome animato, sopra la testa");
            Indirizzo("/o/spie", "microfono, cuffie, telefono");
            Indirizzo("/o/conto", "quanto manca al letto");
            Indirizzo("/o/meteo", "il tempo e gli animali");
            Indirizzo("/o/tasti", "tastiera, mouse e controller (anche ?solo=pad o ?solo=tastiera)");
            Indirizzo("/o/meme", "i meme di pzkko");
            Indirizzo("/o/adv", "i progetti di pzkko.it");
            Indirizzo("/o/adigeo", "«lui è Adigeo»");
            Indirizzo("/o/redbull", "le Red Bull di oggi");
            Indirizzo("/o/social", "i follower");
            Indirizzo("/o/puff", "il cartellino della puff");
            Indirizzo("/o/bandiera", "la bandiera appesa al muro");
            Console.WriteLine();
            Term.Step("I «torno subito»:");
            Indirizzo("/o/legna", "la stufa");
            Indirizzo("/o/pipi", "il bosco");
            Indirizzo("/o/bere", "qualcosa da bere");
            Indirizzo("/o/mangiare", "qualcosa da mangiare");
            Indirizzo("/o/lattina", "una Red Bull");
            Indirizzo("/o/telefono", "al telefono");
            Indirizzo("/o/spacco", "spacco la legna");
            Indirizzo("/o/sistemo", "sistemo la postazione");
            Indirizzo("/o/riavvio", "riavvio il pc");
            Console.WriteLine();
            Term.Step("I pezzi del PC (uno per uno):");
            Indirizzo("/o/app", "le app aperte");
            Indirizzo("/o/cpu", "il processore");
            Indirizzo("/o/gpu", "la scheda video");
            Indirizzo("/o/ram", "la memoria");
            Indirizzo("/o/ssd", "l'SSD");
            Indirizzo("/o/hdd", "il disco a piatti");
            Indirizzo("/o/temp", "la temperatura (?di=gpu per la scheda video)");
            Indirizzo("/o/wifi", "la velocità del wi-fi");
            Console.WriteLine();
            Term.Step("Podcast e TV:");
            Indirizzo("/o/argomento", "l'argomento a caso");
            Indirizzo("/o/fine", "la fine puntata");
            Indirizzo("/tv", "la TV 4K, anche dal browser del PC");
            Indirizzo("/muri.html", "i muri: appendere i pezzi in prospettiva");
            Indirizzo("/dualsense.html", "il DualSense da solo, grande");
            Console.WriteLine();
            Term.Step("Per provare le scene senza essere via:");
            Indirizzo("/via/prova.html?scena=bosco&ora=22:30&meteo=nebbia&gradi=4&t=20", "scena, ora, meteo, gradi, secondi");
            Console.WriteLine();
            Term.Head("La vista esterna (webcam di un altro PC in Wi-Fi)");
            string ip = Shell.IpLocale();
            Term.Note("In regia: «collega un portatile». Sul portatile apri https://" + (ip ?? "<ip-del-pc>") + ":" + Shell.PortaVista() + "/");
            Term.Note("Accetta l’avviso del certificato (è fatto in casa), scrivi il codice che vedi in regia e consenti la webcam.");
            Term.Note("Il codice vale 10 minuti e una volta; un portatile alla volta. Poi il pezzo «esterna» si accende dalla regia.");
            Console.WriteLine();
            Term.Head("Da mettere in Camo Studio o OBS");
            Term.Note("Livello web / sorgente browser: 1920 × 1080, " + Shell.Url + "o/tutto");
            Term.Note("Un livello solo: ogni livello in più è un browser intero che gira.");
            Term.Note("La TV è un altro apparecchio: " + Shell.UrlTv + " (sulla rete, porta " + Shell.PortaTv() + ")");
            Term.Note("La regia: " + Shell.Url);
            return 0;
        }

        public static int Folder()
        {
            if (!Directory.Exists(Shell.InstallDir)) { Term.Err("La cartella non c'è: " + Shell.InstallDir); return 1; }
            Shell.OpenFolder(Shell.InstallDir);
            return 0;
        }

        public static int Guide()
        {
            if (File.Exists(Shell.GuidaFile)) { Shell.OpenText(Shell.GuidaFile); return 0; }
            Shell.Open(Shell.Sito);
            return 0;
        }

        // ── azioni della regia ──────────────────────────────────────────────────
        public static int Pezzi()
        {
            if (!Shell.ServerUp()) { Term.Err("il server è spento: DirettaOS.exe start"); return 1; }
            string json = Shell.StatoJson(3000);
            if (json == null) { Term.Err("non riesco a leggere lo stato."); return 1; }
            try
            {
                System.Web.Script.Serialization.JavaScriptSerializer ser = new System.Web.Script.Serialization.JavaScriptSerializer();
                Dictionary<string, object> d = ser.DeserializeObject(json) as Dictionary<string, object>;
                Dictionary<string, object> a = d["attivi"] as Dictionary<string, object>;
                Term.Head("Pezzi");
                foreach (KeyValuePair<string, object> k in a)
                {
                    bool su = k.Value is bool && (bool)k.Value;
                    Term.Colored("  " + (su ? "●" : "○") + " ", su ? ConsoleColor.Green : ConsoleColor.DarkGray);
                    Console.WriteLine(k.Key.PadRight(18) + (su ? "acceso" : "spento"));
                }
                return 0;
            }
            catch (Exception e) { Term.Err(e.Message); return 1; }
        }

        public static int Piece(string nome, string su)
        {
            if (String.IsNullOrEmpty(nome)) { Term.Err("Manca il nome del pezzo: piece <nome> on|off"); return 1; }
            bool? stato = su == null ? (bool?)null : (su == "on" || su == "1" || su == "si" || su == "sì" || su == "true");
            string json = "{\"tipo\":\"pezzo\",\"nome\":\"" + nome.Replace("\"", "") + "\"" + (stato.HasValue ? ",\"su\":" + (stato.Value ? "true" : "false") : "") + "}";
            return Manda(json, "pezzo " + nome + (stato.HasValue ? (stato.Value ? " acceso" : " spento") : " cambiato"));
        }

        public static int Tutti(string su)
        {
            bool on = su == null || su == "on" || su == "1" || su == "si" || su == "sì";
            return Manda("{\"tipo\":\"tutti\",\"su\":" + (on ? "true" : "false") + "}", on ? "tutti i pezzi accesi" : "tutti i pezzi spenti");
        }

        public static int Via(string scena)
        {
            if (String.IsNullOrEmpty(scena)) { Term.Err("Manca la scena: via legna|pipi|bere|mangiare|lattina|telefono|spacco|sistemo|riavvio"); return 1; }
            return Manda("{\"tipo\":\"pezzo\",\"nome\":\"" + scena.Replace("\"", "") + "\",\"su\":true}", "via: " + scena);
        }

        public static int Lente(string modo)
        {
            if (modo != "auto" && modo != "05" && modo != "10") { Term.Err("lente: auto, 05 o 10"); return 1; }
            return Manda("{\"tipo\":\"lente\",\"modo\":\"" + modo + "\"}", "lente " + modo);
        }

        public static int Letto(string ora)
        {
            if (String.IsNullOrEmpty(ora) || !System.Text.RegularExpressions.Regex.IsMatch(ora, "^([01]?\\d|2[0-3]):[0-5]\\d$")) { Term.Err("letto: HH:MM"); return 1; }
            return Manda("{\"tipo\":\"letto\",\"ora\":\"" + ora + "\"}", "a letto fra: " + ora);
        }

        public static int Redbull(string d)
        {
            int n;
            if (d == null || !Int32.TryParse(d, out n) || (n != -1 && n != 0 && n != 1)) { Term.Err("redbull: +1, -1 o 0"); return 1; }
            return Manda("{\"tipo\":\"redbull\",\"d\":" + n + "}", "Red Bull: " + (n > 0 ? "+1" : n.ToString()));
        }

        public static int Social(string rete, string n)
        {
            if (String.IsNullOrEmpty(rete)) { Term.Err("social <rete> <numero|->"); return 1; }
            string val = (n == null || n == "-" || n == "") ? "null" : n;
            return Manda("{\"tipo\":\"social\",\"rete\":\"" + rete.Replace("\"", "") + "\",\"n\":" + val + "}", "social " + rete + ": " + (val == "null" ? "automatico" : val));
        }

        public static int Podcast(string cosa)
        {
            if (String.IsNullOrEmpty(cosa)) { Term.Err("podcast inizia|argomento|fine|chiudi|riprendi"); return 1; }
            return Manda("{\"tipo\":\"podcast\",\"cosa\":\"" + cosa.Replace("\"", "") + "\"}", "podcast: " + cosa);
        }

        public static int Tv(string schermo)
        {
            if (String.IsNullOrEmpty(schermo)) { Term.Err("tv podcast|logo|ora|nome|parla|testo|meteo"); return 1; }
            return Manda("{\"tipo\":\"podcast\",\"schermo\":\"" + schermo.Replace("\"", "") + "\"}", "TV: " + schermo);
        }

        static int Manda(string json, string cosa)
        {
            if (!Shell.ServerUp()) { Term.Err("il server è spento: DirettaOS.exe start"); return 1; }
            if (Shell.Post(json, 4000)) { Term.Ok(cosa); return 0; }
            Term.Err("il server non ha accettato il comando: " + json);
            return 1;
        }

        // ── menu ────────────────────────────────────────────────────────────────
        public static int Menu()
        {
            while (true)
            {
                if (Term.Color) { try { Console.Clear(); } catch { } }
                Term.Banner(Shell.Versione, Shell.RunningFromSetup());
                if (Shell.Installed())
                {
                    Term.KeyValue("Installazione", Shell.InstallDir);
                    Term.KeyValue("Server", Shell.ServerUp() ? "acceso · " + Shell.Url : "spento");
                    Term.KeyValue("Avvio con Windows", Shell.AutostartOn() ? "sì" : "no");
                }
                else
                {
                    Term.Warn("Diretta OS non è ancora installato su questo PC.");
                    if (Shell.Payload) Term.Note("Scegli 1 per installarlo: ci pensa il pacchetto dentro questo .exe.");
                }
                Console.WriteLine();
                if (Shell.Payload) Term.Plain("1  Installa / aggiorna");
                Term.Plain("2  Avvia il server");
                Term.Plain("3  Apri la regia");
                Term.Plain("4  Ferma il server");
                Term.Plain("5  Stato");
                Term.Plain("6  Comandi e indirizzi");
                Term.Plain("7  Diagnostica");
                Term.Plain("8  Configurazione");
                Term.Plain("9  Log");
                Term.Plain("10  Backup");
                Term.Plain("11  Extra (modello volti, foto tastiera/mouse/pad)");
                Term.Plain("12  Avvio automatico on/off");
                Term.Plain("13  Disinstalla");
                Term.Plain("0  Esci");
                Console.WriteLine();
                string s = Term.Ask("Scegli", "0");
                int n;
                if (!Int32.TryParse(s, out n)) n = -1;
                Opzioni o = new Opzioni();
                switch (n)
                {
                    case 1: if (Shell.Payload) Installer.Installa(o); else Commands.Aiuto(); break;
                    case 2: ServerCtl.Start(true); break;
                    case 3: if (Shell.ServerUp() || ServerCtl.Start(true) == 0) Shell.Open(Shell.Url); break;
                    case 4: ServerCtl.Stop(true, true); break;
                    case 5: ServerCtl.Status(); break;
                    case 6: Commands.Elenco(); break;
                    case 7: ServerCtl.Doctor(); break;
                    case 8: Installer.Configura(o); break;
                    case 9: ServerCtl.Logs(false); break;
                    case 10: Installer.Backup(o); break;
                    case 11: Installer.Extra(o); break;
                    case 12: Shell.Autostart(!Shell.AutostartOn()); Term.Ok("avvio automatico: " + (Shell.AutostartOn() ? "acceso" : "spento")); break;
                    case 13: Installer.Disinstalla(o); break;
                    case 0: return 0;
                    default: Term.Warn("Scelta non valida."); break;
                }
                Term.Pause();
            }
        }
    }
}
