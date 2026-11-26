using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

// POSTA-OS: il generatore di email dentro lo stesso terminale di MatriciOS (Term.cs e Sfx.cs sono i suoi, uguali).
// Da appunti disordinati (un file in bozze\ o scritti qui) a un'email HTML autosufficiente, con la versione di testo,
// l'anteprima col tasto «copia email formattata» e il rapporto. Un solo .exe, niente da installare.
namespace MatriciOS
{
    class Profilo { public string Id, Nome, Ruolo, Sito, Contatto; }

    static class Dati
    {
        public static List<Profilo> Profili = new List<Profilo>();
        public static bool Sound = true;
        public static int Speed = 1, Theme = 0, TemaEmail = 0;
        public static string Radice;
        static string FileDati { get { return Path.Combine(Radice, "PostaOS_dati.txt"); } }
        public static string Bozze { get { return Path.Combine(Radice, "bozze"); } }
        public static string Uscita { get { return Path.Combine(Radice, "email"); } }
        public static readonly string[] Temi = { "FINE SETTEMBRE (bianco e nero)", "CARTA (crema, con le grazie)", "NOTTE (scuro)" };

        static int ToInt(string s) { int v; return int.TryParse(s, out v) ? v : 0; }
        public static void Apply() { Sfx.On = Sound; Term.Speed = Speed; Term.Theme = Theme; }

        public static void Load(string radice)
        {
            Radice = radice;
            try
            {
                if (File.Exists(FileDati))
                    foreach (string line in File.ReadAllLines(FileDati, Encoding.UTF8))
                    {
                        int eq = line.IndexOf('=');
                        if (eq < 0 || line.StartsWith("#")) continue;
                        string k = line.Substring(0, eq).Trim(), v = line.Substring(eq + 1).Trim();
                        if (k == "suono") Sound = v != "0";
                        else if (k == "velocita") Speed = Math.Max(0, Math.Min(2, ToInt(v)));
                        else if (k == "colore") Theme = Math.Max(0, Math.Min(3, ToInt(v)));
                        else if (k == "tema") TemaEmail = Math.Max(0, Math.Min(Temi.Length - 1, ToInt(v)));
                        else if (k == "profilo")
                        {
                            string[] p = v.Split('|');
                            if (p.Length >= 2) Profili.Add(new Profilo { Id = p[0], Nome = p[1], Ruolo = p.Length > 2 ? p[2] : "", Sito = p.Length > 3 ? p[3] : "", Contatto = p.Length > 4 ? p[4] : "" });
                        }
                    }
            }
            catch { }
            if (Profili.Count == 0) Profili.Add(new Profilo { Id = "demo", Nome = "pzkko", Ruolo = "Giochi e programmi", Sito = "https://pzkko.it", Contatto = "" });
            Apply();
        }

        public static void Save()
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("# POSTA-OS: opzioni e mittenti (si puo' modificare a mano; un profilo per riga: id|nome|ruolo|sito|contatto)");
                sb.AppendLine("suono=" + (Sound ? "1" : "0"));
                sb.AppendLine("velocita=" + Speed);
                sb.AppendLine("colore=" + Theme);
                sb.AppendLine("tema=" + TemaEmail);
                foreach (Profilo p in Profili) sb.AppendLine("profilo=" + p.Id + "|" + p.Nome + "|" + p.Ruolo + "|" + p.Sito + "|" + p.Contatto);
                File.WriteAllText(FileDati, sb.ToString(), new UTF8Encoding(false));
            }
            catch { }
        }
    }

    // ---------------- dagli appunti all'email ----------------
    class Email
    {
        public string Html, Lite, Testo, Anteprima;
        public int Parole;
    }

    static class Motore
    {
        static string E(string s) { return s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;"); }

        // grassetto, corsivo, codice e link dentro una riga (gia' protetta)
        static string Riga(string s, string link)
        {
            s = E(s);
            s = Regex.Replace(s, @"\*\*(.+?)\*\*", "<strong>$1</strong>");
            s = Regex.Replace(s, @"(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?![\*\w])", "<em>$1</em>");
            s = Regex.Replace(s, @"`([^`]+)`", "<code style=\"font-family:Consolas,monospace;font-size:13px\">$1</code>");
            s = Regex.Replace(s, @"\[([^\]]+)\]\((https?://[^\s)]+)\)", "<a href=\"$2\" style=\"color:" + link + "\">$1</a>");
            return s;
        }
        static string Nudo(string s)
        {
            s = Regex.Replace(s, @"\*\*(.+?)\*\*", "$1");
            s = Regex.Replace(s, @"`([^`]+)`", "$1");
            return Regex.Replace(s, @"\[([^\]]+)\]\((https?://[^\s)]+)\)", "$1 ($2)");
        }

        public static string Slug(string s)
        {
            string n = s.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (char c in n)
            {
                if (c >= 'a' && c <= 'z' || c >= '0' && c <= '9') sb.Append(c);
                else if (c == ' ' || c == '-' || c == '_') { if (sb.Length > 0 && sb[sb.Length - 1] != '-') sb.Append('-'); }
            }
            string r = sb.ToString().Trim('-');
            return r.Length == 0 ? "email" : (r.Length > 40 ? r.Substring(0, 40).Trim('-') : r);
        }

        public static Email Componi(Profilo p, string a, string oggetto, string[] righe, int tema, DateTime quando)
        {
            // i tre temi: sfondo, carta, inchiostro, tenue, riga, carattere, colore dei link, tasto
            string[][] T = {
                new[] { "#ffffff", "#ffffff", "#111111", "#666666", "#111111", "Helvetica,Arial,sans-serif", "#111111", "#111111", "#ffffff" },
                new[] { "#efe6d2", "#fbf6ea", "#2a2218", "#7a6a55", "#2a2218", "Georgia,'Times New Roman',serif", "#7a3b12", "#7a3b12", "#fbf6ea" },
                new[] { "#0d0f12", "#16191e", "#eceff4", "#9aa3b2", "#3a404b", "Helvetica,Arial,sans-serif", "#9fd0ff", "#eceff4", "#0d0f12" },
            };
            string[] t = T[Math.Max(0, Math.Min(T.Length - 1, tema))];
            string bg = t[0], carta = t[1], ink = t[2], tenue = t[3], riga = t[4], font = t[5], link = t[6], tasto = t[7], tastoInk = t[8];
            string P = "margin:0 0 14px;font-size:15px;line-height:1.55;color:" + ink;

            var h = new StringBuilder();   // il corpo in HTML
            var x = new StringBuilder();   // il corpo in testo
            int parole = 0, i = 0;
            Func<string, int> conta = delegate (string s) { return s.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length; };
            while (i < righe.Length)
            {
                string r = righe[i].TrimEnd();
                string s = r.Trim();
                if (s.Length == 0) { i++; continue; }
                Match m;
                if ((m = Regex.Match(s, @"^#{1,3}\s+(.+)$")).Success)
                {
                    h.Append("<h2 style=\"margin:22px 0 10px;font-size:17px;line-height:1.3;color:" + ink + "\">" + Riga(m.Groups[1].Value, link) + "</h2>\n");
                    x.AppendLine().AppendLine(Nudo(m.Groups[1].Value).ToUpperInvariant());
                    parole += conta(m.Groups[1].Value); i++;
                }
                else if (Regex.IsMatch(s, @"^[-*]\s+") || Regex.IsMatch(s, @"^\d+[.)]\s+"))
                {
                    bool num = Regex.IsMatch(s, @"^\d+[.)]\s+");
                    h.Append(num ? "<ol style=\"margin:0 0 14px;padding-left:22px\">\n" : "<ul style=\"margin:0 0 14px;padding-left:20px\">\n");
                    int n = 1;
                    while (i < righe.Length && Regex.IsMatch(righe[i].Trim(), num ? @"^\d+[.)]\s+" : @"^[-*]\s+"))
                    {
                        string voce = Regex.Replace(righe[i].Trim(), num ? @"^\d+[.)]\s+" : @"^[-*]\s+", "");
                        h.Append("<li style=\"margin:0 0 6px;font-size:15px;line-height:1.5;color:" + ink + "\">" + Riga(voce, link) + "</li>\n");
                        x.AppendLine((num ? (n++) + ". " : "- ") + Nudo(voce));
                        parole += conta(voce); i++;
                    }
                    h.Append(num ? "</ol>\n" : "</ul>\n");
                }
                else if (s.StartsWith(">"))
                {
                    string nota = s.TrimStart('>', ' ');
                    h.Append("<p style=\"margin:0 0 14px;padding:2px 0 2px 12px;border-left:3px solid " + riga + ";font-size:15px;line-height:1.5;font-style:italic;color:" + ink + "\">" + Riga(nota, link) + "</p>\n");
                    x.AppendLine("  | " + Nudo(nota));
                    parole += conta(nota); i++;
                }
                else if (s.StartsWith("|") && s.EndsWith("|"))
                {
                    h.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;margin:0 0 14px;border-collapse:collapse\">\n");
                    bool testa = true;
                    while (i < righe.Length && righe[i].Trim().StartsWith("|"))
                    {
                        string rr = righe[i].Trim(); i++;
                        if (Regex.IsMatch(rr, @"^\|[\s:|-]+\|$")) continue;   // la riga dei trattini
                        string[] celle = rr.Trim('|').Split('|');
                        h.Append("<tr>");
                        var xt = new List<string>();
                        foreach (string c in celle)
                        {
                            string cc = c.Trim();
                            h.Append(testa
                                ? "<th align=\"left\" style=\"padding:6px 8px 6px 0;border-bottom:2px solid " + riga + ";font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:" + tenue + "\">" + Riga(cc, link) + "</th>"
                                : "<td style=\"padding:7px 8px 7px 0;border-bottom:1px solid " + tenue + ";font-size:14px;color:" + ink + "\">" + Riga(cc, link) + "</td>");
                            xt.Add(Nudo(cc)); parole += conta(cc);
                        }
                        h.Append("</tr>\n");
                        x.AppendLine(string.Join("  |  ", xt.ToArray()));
                        testa = false;
                    }
                    h.Append("</table>\n");
                }
                else if ((m = Regex.Match(s, @"^\[\[(.+?)\]\]\((https?://[^\s)]+)\)$")).Success)   // [[testo del tasto]](indirizzo)
                {
                    h.Append("<p style=\"margin:4px 0 8px\"><a href=\"" + E(m.Groups[2].Value) + "\" style=\"display:inline-block;padding:10px 16px;background:" + tasto + ";color:" + tastoInk + ";font-size:14px;font-weight:bold;text-decoration:none\">" + E(m.Groups[1].Value) + "</a></p>\n");
                    h.Append("<p style=\"margin:0 0 14px;font-size:12px;color:" + tenue + "\">Link diretto: <a href=\"" + E(m.Groups[2].Value) + "\" style=\"color:" + link + "\">" + E(m.Groups[2].Value) + "</a></p>\n");
                    x.AppendLine(m.Groups[1].Value + ": " + m.Groups[2].Value);
                    i++;
                }
                else
                {
                    var par = new List<string>();
                    while (i < righe.Length && righe[i].Trim().Length > 0 && !Regex.IsMatch(righe[i].Trim(), @"^(#{1,3}\s|[-*]\s|\d+[.)]\s|>|\|)")) { par.Add(righe[i].Trim()); i++; }
                    string testo = string.Join(" ", par.ToArray());
                    h.Append("<p style=\"" + P + "\">" + Riga(testo, link) + "</p>\n");
                    x.AppendLine().AppendLine(Nudo(testo));
                    parole += conta(testo);
                }
            }

            string data = quando.ToString("d MMMM yyyy", new System.Globalization.CultureInfo("it-IT")).ToUpperInvariant();
            string firma = "<p style=\"margin:18px 0 0;font-size:15px;line-height:1.5;color:" + ink + "\">Un caro saluto,<br>" + E(p.Nome) + "</p>";
            string piede = "<p style=\"margin:0 0 2px;font-size:14px;font-weight:bold;color:" + ink + "\">" + E(p.Nome) + "</p>"
                + (p.Ruolo.Length > 0 ? "<p style=\"margin:0 0 6px;font-size:12px;font-weight:bold;color:" + ink + "\">" + E(p.Ruolo) + "</p>" : "")
                + (p.Sito.Length > 0 ? "<p style=\"margin:0 0 4px;font-size:12px\"><a href=\"" + E(p.Sito) + "\" style=\"color:" + link + "\">" + E(Regex.Replace(p.Sito, @"^https?://", "")) + "</a></p>" : "")
                + (p.Contatto.Length > 0 ? "<p style=\"margin:0;font-size:12px;color:" + tenue + "\">" + E(p.Contatto) + "</p>" : "");
            string privacy = "<p style=\"margin:0 0 4px;font-size:10px;font-weight:bold;color:" + tenue + "\">Informativa privacy</p>"
                + "<p style=\"margin:0 0 8px;font-size:10px;line-height:1.5;color:" + tenue + "\">I tuoi dati di contatto sono usati da " + E(p.Nome) + " solo per rispondere a questa conversazione, nel rispetto del Regolamento UE 2016/679. Puoi chiederne in ogni momento la correzione o la cancellazione rispondendo a questa email.</p>"
                + "<p style=\"margin:0 0 4px;font-size:10px;font-weight:bold;color:" + tenue + "\">Avviso di riservatezza</p>"
                + "<p style=\"margin:0;font-size:10px;line-height:1.5;color:" + tenue + "\">Questa email e i suoi allegati sono destinati solo alla persona a cui sono indirizzati. Se l'hai ricevuta per errore, avvisa il mittente e cancellala.</p>";
            string saluto = a.Trim().Length > 0 ? "<p style=\"" + P + "\">Ciao " + E(a.Trim()) + ",</p>\n" : "";

            string dentro = "<p style=\"margin:0 0 6px;font-size:10px;letter-spacing:.14em;color:" + tenue + "\">" + E(p.Id.ToUpperInvariant()) + " · " + data + "</p>\n"
                + "<h1 style=\"margin:0 0 12px;padding:0 0 12px;border-bottom:2px solid " + riga + ";font-size:22px;line-height:1.25;color:" + ink + "\">" + E(oggetto) + "</h1>\n"
                + saluto + h + firma
                + "<div style=\"margin:26px 0 0;padding:16px 0 0;border-top:2px solid " + riga + "\">" + piede + "</div>"
                + "<div style=\"margin:20px 0 0;padding:12px 0 0;border-top:1px solid " + tenue + "\">" + privacy + "</div>";
            Func<string, string> pagina = delegate (string f)
            {
                return "<!doctype html>\n<html lang=\"it\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + E(oggetto) + "</title></head>\n"
                    + "<body style=\"margin:0;padding:0;background:" + bg + "\">\n<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:" + bg + "\"><tr><td align=\"center\" style=\"padding:24px 12px\">\n"
                    + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;max-width:600px;background:" + carta + "\"><tr><td id=\"email\" style=\"padding:28px 28px 26px;font-family:" + f + "\">\n"
                    + dentro + "\n</td></tr></table>\n</td></tr></table>\n</body></html>\n";
            };
            var em = new Email();
            em.Html = pagina(font);
            em.Lite = pagina("Arial,sans-serif");   // senza caratteri particolari: quella consigliata per Gmail
            em.Parole = parole;
            em.Testo = oggetto + "\n" + new string('=', Math.Min(60, oggetto.Length)) + "\n\n" + (a.Trim().Length > 0 ? "Ciao " + a.Trim() + ",\n" : "") + x.ToString().TrimEnd() + "\n\nUn caro saluto,\n" + p.Nome + "\n\n--\n" + p.Nome + (p.Ruolo.Length > 0 ? " · " + p.Ruolo : "") + (p.Sito.Length > 0 ? "\n" + p.Sito : "") + "\n";
            em.Anteprima = em.Html.Replace("<body style=\"margin:0;padding:0;background:" + bg + "\">",
                "<body style=\"margin:0;padding:0;background:" + bg + "\">\n<div style=\"position:sticky;top:0;z-index:9;display:flex;gap:10px;align-items:center;padding:10px 14px;background:#111;color:#fff;font:13px Helvetica,Arial,sans-serif\"><b>POSTA-OS</b><span style=\"opacity:.7\">" + E(oggetto) + "</span>"
                + "<button onclick=\"var r=document.createRange();r.selectNodeContents(document.getElementById('email'));var s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('copy');s.removeAllRanges();this.textContent='COPIATA: incollala nella tua posta'\" style=\"margin-left:auto;padding:8px 12px;border:0;background:#fff;color:#111;font:bold 12px Helvetica,Arial,sans-serif;cursor:pointer\">COPIA EMAIL FORMATTATA</button></div>");
            return em;
        }

        /** Scrive la cartella dell'email e ritorna il suo percorso. */
        public static string Scrivi(string uscita, Profilo p, string a, string oggetto, string[] righe, int tema, string origine)
        {
            DateTime ora = DateTime.Now;
            Email em = Componi(p, a, oggetto, righe, tema, ora);
            string dir = Path.Combine(uscita, ora.ToString("yyyy-MM-dd") + "_" + Slug(oggetto));
            for (int n = 2; Directory.Exists(dir); n++) dir = Path.Combine(uscita, ora.ToString("yyyy-MM-dd") + "_" + Slug(oggetto) + "-" + n);
            Directory.CreateDirectory(dir);
            var utf8 = new UTF8Encoding(false);
            File.WriteAllText(Path.Combine(dir, "email.html"), em.Html, utf8);
            File.WriteAllText(Path.Combine(dir, "email-lite.html"), em.Lite, utf8);
            File.WriteAllText(Path.Combine(dir, "email.txt"), em.Testo.Replace("\n", "\r\n"), utf8);
            File.WriteAllText(Path.Combine(dir, "anteprima.html"), em.Anteprima, utf8);
            var r = new StringBuilder();
            r.AppendLine("EMAIL GENERATA").AppendLine("==============").AppendLine();
            r.AppendLine("Da:       " + p.Nome + " (profilo " + p.Id + ")");
            r.AppendLine("A:        " + (a.Trim().Length > 0 ? a.Trim() : "-"));
            r.AppendLine("Oggetto:  " + oggetto);
            r.AppendLine("Tema:     " + Dati.Temi[Math.Max(0, Math.Min(Dati.Temi.Length - 1, tema))]);
            r.AppendLine("Data:     " + ora.ToString("dd/MM/yyyy HH:mm"));
            r.AppendLine("Origine:  " + origine);
            r.AppendLine("Corpo:    " + em.Parole + " parole · HTML autosufficiente di " + (em.Html.Length / 1024.0).ToString("0.0") + " kB");
            r.AppendLine().AppendLine("FILE").AppendLine("----");
            r.AppendLine("anteprima.html   aprila nel browser e premi COPIA EMAIL FORMATTATA");
            r.AppendLine("email.html       il sorgente HTML completo");
            r.AppendLine("email-lite.html  la stessa email senza caratteri particolari (consigliata per Gmail)");
            r.AppendLine("email.txt        la versione in testo semplice");
            r.AppendLine().AppendLine("COME INVIARLA").AppendLine("-------------");
            r.AppendLine("1. Apri anteprima.html nel browser.");
            r.AppendLine("2. Premi COPIA EMAIL FORMATTATA.");
            r.AppendLine("3. Apri un messaggio nuovo (Yahoo, Proton, Gmail) e incolla con Ctrl+V.");
            r.AppendLine("4. Oggetto: " + oggetto);
            r.AppendLine().AppendLine("Nessun JavaScript e nessun CSS esterno nell'email: il file e' autosufficiente.");
            File.WriteAllText(Path.Combine(dir, "rapporto.txt"), r.ToString(), utf8);
            return dir;
        }
    }

    static class Program
    {
        const string VERS = "POSTA-OS v1.0";
        // le lettere del logo che a Term.Logo mancano (lui ha solo quelle di MATRICI)
        static readonly Dictionary<char, string[]> Glifi = new Dictionary<char, string[]> {
            { 'P', new[] { "#### ", "#   #", "#### ", "#    ", "#    " } }, { 'O', new[] { " ### ", "#   #", "#   #", "#   #", " ### " } },
            { 'S', new[] { " ####", "#    ", " ### ", "    #", "#### " } }, { 'T', new[] { "#####", "  #  ", "  #  ", "  #  ", "  #  " } },
            { 'A', new[] { " ### ", "#   #", "#####", "#   #", "#   #" } },
        };
        static void Logo(int y, string parola)
        {
            int w = parola.Length * 7 - 2, x0 = (Term.FW - w * 2) / 2;
            for (int r = 0; r < 5; r++)
            {
                var sb = new StringBuilder();
                foreach (char c in parola) { foreach (char px in Glifi[c][r]) sb.Append(px == '#' ? "██" : "  "); sb.Append("    "); }
                Term.Put(Math.Max(2, x0), y + r, sb.ToString().TrimEnd(), Ink.Bright);
            }
        }
        static string Stato() { return "MITTENTI: " + Dati.Profili.Count + "    TEMA: " + Dati.Temi[Dati.TemaEmail].Split(' ')[0] + " " + (Dati.Temi[Dati.TemaEmail].Split(' ').Length > 1 && !Dati.Temi[Dati.TemaEmail].Split(' ')[1].StartsWith("(") ? Dati.Temi[Dati.TemaEmail].Split(' ')[1] : "") + "    FATTE: " + Fatte().Length; }
        static string[] Fatte() { try { return Directory.Exists(Dati.Uscita) ? Directory.GetDirectories(Dati.Uscita) : new string[0]; } catch { return new string[0]; } }

        // una riga scritta liberamente (Term.Input accetta solo lettere e cifre: qui serve la punteggiatura)
        static string Chiedi(int x, int y, int max, string prima)
        {
            Term.Flush();
            string s = prima ?? "";
            while (true)
            {
                string vista = s.Length > max ? s.Substring(s.Length - max) : s;
                Term.Put(x, y, "> " + vista, Ink.Bright);
                Term.Set(Ink.Bright, true); Term.Out(" ");
                Term.Set(Ink.Norm); Term.Out(new string(' ', Math.Max(1, max - vista.Length + 1)));
                ConsoleKeyInfo k = Console.ReadKey(true);
                if (k.Key == ConsoleKey.Escape) return null;
                if (k.Key == ConsoleKey.Enter) { Term.Put(x, y, "> " + vista + new string(' ', Math.Max(1, max - vista.Length + 2)), Ink.Bright); return s.Trim(); }
                if (k.Key == ConsoleKey.Backspace) { if (s.Length > 0) { s = s.Substring(0, s.Length - 1); Sfx.Play("key"); } continue; }
                if (!char.IsControl(k.KeyChar) && s.Length < 400) { s += k.KeyChar; Sfx.Play("key"); }
            }
        }

        static void Avvio()
        {
            Term.Clear();
            Term.BeginType();
            Term.Type(4, 2, "POSTA-OS (TM)   //   UFFICIO POSTALE DA TERMINALE   //   v1.0", Ink.Bright);
            Term.Type(4, 3, "COPYRIGHT 2026  -  STESSO SISTEMA DI MATRICI-OS", Ink.Dim);
            string[] passi = { "AVVIO SISTEMA", "CARICAMENTO MITTENTI", "CARICAMENTO TEMI", "CONTROLLO CARTELLA BOZZE", "CONTROLLO CARTELLA EMAIL" };
            for (int i = 0; i < passi.Length; i++)
            {
                Term.Type(4, 5 + i, "> " + passi[i] + " " + new string('.', 40 - passi[i].Length) + " OK", Ink.Norm);
                if (!Term.Skipping) Thread.Sleep(90);
            }
            Term.Type(4, 11, "> MITTENTI: " + Dati.Profili.Count + "    BOZZE: " + Bozze().Length + "    EMAIL FATTE: " + Fatte().Length, Ink.Bright);
            Term.BlinkWait(20, "[ PREMI UN TASTO PER ENTRARE ]");
        }
        static string[] Bozze()
        {
            try
            {
                if (!Directory.Exists(Dati.Bozze)) return new string[0];
                var l = new List<string>();
                foreach (string f in Directory.GetFiles(Dati.Bozze)) if (f.EndsWith(".md", StringComparison.OrdinalIgnoreCase) || f.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)) l.Add(f);
                return l.ToArray();
            }
            catch { return new string[0]; }
        }

        static void Nuova()
        {
            // 1. il mittente
            var nomi = new List<string>();
            foreach (Profilo p in Dati.Profili) nomi.Add(p.Id.ToUpperInvariant() + "  " + p.Nome);
            Term.Frame("NUOVA EMAIL  //  1 DI 4  //  CHI SCRIVE", Stato(), "[↑↓] scegli   [INVIO] conferma   [ESC] indietro");
            Term.Put(4, 4, "Scegli il mittente:", Ink.Norm);
            int ip = Term.Menu(6, 6, nomi.ToArray(), null, null, 0, 50, 0);
            if (ip < 0) return;
            Profilo prof = Dati.Profili[ip];
            // 2. destinatario e oggetto
            Term.Frame("NUOVA EMAIL  //  2 DI 4  //  A CHI E DI COSA", Stato(), "[INVIO] conferma   [ESC] annulla");
            Term.Put(4, 5, "A chi scrivi? (il nome per il saluto; vuoto = nessun saluto)", Ink.Norm);
            string a = Chiedi(4, 7, 60, null); if (a == null) return;
            Term.Put(4, 10, "Oggetto dell'email:", Ink.Norm);
            string oggetto = null;
            while (oggetto == null || oggetto.Length == 0) { oggetto = Chiedi(4, 12, 66, null); if (oggetto == null) return; if (oggetto.Length == 0) Sfx.Play("deny"); }
            // 3. il materiale
            string[] bozze = Bozze();
            var voci = new List<string>(); voci.Add("[S] SCRIVI QUI GLI APPUNTI");
            foreach (string f in bozze) voci.Add("    " + Path.GetFileName(f));
            Term.Frame("NUOVA EMAIL  //  3 DI 4  //  IL MATERIALE", Stato(), "[↑↓] scegli   [INVIO] conferma   [ESC] annulla");
            Term.Put(4, 4, "Da dove prendo gli appunti? (i file .md e .txt della cartella bozze\\)", Ink.Norm);
            int im = Term.Menu(6, 6, voci.ToArray(), null, null, 0, 60, 0);
            if (im < 0) return;
            string[] righe; string origine;
            if (im == 0)
            {
                var l = new List<string>();
                Term.Frame("NUOVA EMAIL  //  GLI APPUNTI", Stato(), "[INVIO] riga nuova   riga vuota due volte = finito   [ESC] annulla");
                Term.Put(4, 4, "Scrivi una riga per volta.  # titolo   - elenco   1. passi   > nota   **forte**", Ink.Dim);
                Term.Put(4, 5, "| a | b | tabella     [[testo del tasto]](https://indirizzo)", Ink.Dim);
                int vuote = 0;
                while (true)
                {
                    int y0 = Math.Max(0, l.Count - 12);
                    Term.ClearRows(7, 21);
                    for (int i = y0; i < l.Count; i++) Term.Put(4, 7 + i - y0, Term.Pad(l[i].Length > 70 ? l[i].Substring(0, 70) : l[i], 70), Ink.Norm);
                    string r = Chiedi(4, 22, 68, null);
                    if (r == null) return;
                    if (r.Length == 0) { if (++vuote >= 2 || l.Count == 0) break; l.Add(""); continue; }
                    vuote = 0; l.Add(r);
                }
                if (l.Count == 0) return;
                righe = l.ToArray(); origine = "scritto nel terminale";
            }
            else { righe = File.ReadAllLines(bozze[im - 1], Encoding.UTF8); origine = "bozze\\" + Path.GetFileName(bozze[im - 1]); }
            // 4. fatto
            string dir = Motore.Scrivi(Dati.Uscita, prof, a, oggetto, righe, Dati.TemaEmail, origine);
            Sfx.Play("select");
            Fatta(dir);
        }

        static void Apri(string cosa) { try { Process.Start(new ProcessStartInfo(cosa) { UseShellExecute = true }); } catch { Sfx.Play("deny"); } }

        static void Fatta(string dir)
        {
            int sel = 0;
            while (true)
            {
                Term.Frame("EMAIL PRONTA", Stato(), "[↑↓] scegli   [INVIO] conferma   [ESC] torna al menù");
                Term.Put(4, 4, "READY", Ink.Bright, true);
                Term.Put(11, 4, Path.GetFileName(dir), Ink.Bright);
                int y = 6;
                try { foreach (string r in File.ReadAllLines(Path.Combine(dir, "rapporto.txt"), Encoding.UTF8)) { if (y > 15) break; if (r.Trim().Length == 0 || r.StartsWith("=") || r.StartsWith("EMAIL")) continue; if (r.StartsWith("FILE")) break; Term.Put(4, y++, Term.Pad(r.Length > 72 ? r.Substring(0, 72) : r, 72), Ink.Norm); } } catch { }
                string[] voci = { "[1] APRI L'ANTEPRIMA NEL BROWSER", "[2] APRI LA CARTELLA", "[3] LEGGI IL RAPPORTO", "[0] TORNA AL MENÙ" };
                string[] desc = { "Si apre anteprima.html: premi COPIA EMAIL FORMATTATA e incolla nella posta", "email.html, email-lite.html, email.txt, anteprima.html, rapporto.txt", "Il rapporto della generazione, in Blocco note", "Fatto" };
                sel = Term.Menu(6, 17, voci, desc, new[] { '1', '2', '3', '0' }, sel, 44, 23);
                if (sel == 0) Apri(Path.Combine(dir, "anteprima.html"));
                else if (sel == 1) Apri(dir);
                else if (sel == 2) Apri(Path.Combine(dir, "rapporto.txt"));
                else return;
            }
        }

        static void Archivio()
        {
            while (true)
            {
                string[] d = Fatte();
                Array.Sort(d); Array.Reverse(d);
                Term.Frame("EMAIL FATTE", Stato(), "[↑↓] scegli   [INVIO] apri   [ESC] indietro");
                if (d.Length == 0) { Term.Center(11, "Ancora nessuna email. Fanne una da NUOVA EMAIL.", Ink.Dim); Term.Wait(); return; }
                var voci = new List<string>();
                for (int i = 0; i < d.Length && i < 16; i++) voci.Add(Path.GetFileName(d[i]));
                int s = Term.Menu(6, 5, voci.ToArray(), null, null, 0, 64, 0);
                if (s < 0) return;
                Fatta(d[s]);
            }
        }

        static void Mittenti()
        {
            while (true)
            {
                var voci = new List<string>();
                foreach (Profilo p in Dati.Profili) voci.Add(Term.Pad(p.Id.ToUpperInvariant(), 10) + Term.Pad(p.Nome, 22) + p.Sito);
                voci.Add("[+] NUOVO MITTENTE");
                Term.Frame("MITTENTI", Stato(), "[↑↓] scegli   [INVIO] modifica o aggiungi   [ESC] indietro");
                Term.Put(4, 4, "Chi firma le email. I dati restano nel file PostaOS_dati.txt accanto al programma.", Ink.Dim);
                int s = Term.Menu(6, 6, voci.ToArray(), null, null, 0, 66, 0);
                if (s < 0) return;
                Profilo pr = s < Dati.Profili.Count ? Dati.Profili[s] : new Profilo { Id = "", Nome = "", Ruolo = "", Sito = "", Contatto = "" };
                Term.Frame(s < Dati.Profili.Count ? "MITTENTE  //  " + pr.Id.ToUpperInvariant() : "NUOVO MITTENTE", Stato(), "[INVIO] conferma ogni riga   [ESC] annulla");
                string[] et = { "Sigla (una parola, es. lavoro):", "Nome che firma:", "Ruolo o riga sotto il nome:", "Sito (https://...):", "Contatto in fondo (facoltativo):" };
                string[] val = { pr.Id, pr.Nome, pr.Ruolo, pr.Sito, pr.Contatto };
                bool annulla = false;
                for (int i = 0; i < et.Length; i++)
                {
                    Term.Put(4, 4 + i * 4, et[i], Ink.Norm);
                    string v = Chiedi(4, 5 + i * 4, 60, val[i]);
                    if (v == null) { annulla = true; break; }
                    val[i] = v.Replace("|", "/");
                }
                if (annulla || val[0].Length == 0 || val[1].Length == 0) continue;
                pr.Id = Motore.Slug(val[0]); pr.Nome = val[1]; pr.Ruolo = val[2]; pr.Sito = val[3]; pr.Contatto = val[4];
                if (s >= Dati.Profili.Count) Dati.Profili.Add(pr);
                Dati.Save();
            }
        }

        static void Opzioni()
        {
            int sel = 0;
            while (true)
            {
                string[] vel = { "LENTA", "NORMALE", "IMMEDIATA" };
                string[] voci = {
                    "[1] TEMA DELL'EMAIL: " + Dati.Temi[Dati.TemaEmail], "[2] COLORE DEL TERMINALE: " + Term.ThemeNames[Dati.Theme],
                    "[3] SUONO: " + (Dati.Sound ? "ACCESO" : "SPENTO"), "[4] VELOCITÀ DEL TESTO: " + vel[Dati.Speed], "[0] INDIETRO" };
                Term.Frame("OPZIONI", Stato(), "[↑↓] scegli   [INVIO] cambia   [ESC] indietro");
                sel = Term.Menu(8, 6, voci, null, new[] { '1', '2', '3', '4', '0' }, sel, 60, 0);
                if (sel == 0) Dati.TemaEmail = (Dati.TemaEmail + 1) % Dati.Temi.Length;
                else if (sel == 1) Dati.Theme = (Dati.Theme + 1) % Term.ThemeNames.Length;
                else if (sel == 2) Dati.Sound = !Dati.Sound;
                else if (sel == 3) Dati.Speed = (Dati.Speed + 1) % 3;
                else { Dati.Save(); return; }
                Dati.Apply(); Dati.Save();
            }
        }

        static void Comandi()
        {
            Term.Frame("COMANDI", Stato(), "[un tasto] indietro");
            string[] r = {
                "↑ ↓        scegli una voce            INVIO     conferma",
                "1-5        scorciatoie del menù       ESC       torna indietro",
                "",
                "COME SI SCRIVONO GLI APPUNTI (in bozze\\ o nel terminale):",
                "  # Titolo                un titolo di sezione",
                "  - voce   oppure  1. passo   elenchi puntati e numerati",
                "  > nota                  una nota in corsivo, con la riga a sinistra",
                "  | a | b |               una tabella (la prima riga sono le intestazioni)",
                "  **forte**  *corsivo*  `codice`  [testo](https://indirizzo)",
                "  [[Apri il sito]](https://indirizzo)     un tasto con il link sotto",
                "",
                "Ogni email finisce in email\\AAAA-MM-GG_oggetto\\ con l'anteprima da cui copiarla,",
                "la versione leggera per Gmail, quella di testo e il rapporto.",
            };
            for (int i = 0; i < r.Length; i++) Term.Put(4, 5 + i, r[i], i == 3 ? Ink.Bright : Ink.Norm);
            Term.Wait();
        }

        static void Menu()
        {
            int sel = 0;
            while (true)
            {
                string[] voci = { "[1] NUOVA EMAIL", "[2] EMAIL FATTE (" + Fatte().Length + ")", "[3] MITTENTI", "[4] OPZIONI", "[5] COMANDI", "[0] ESCI" };
                string[] desc = {
                    "Dagli appunti a un'email HTML pronta da incollare nella posta",
                    "Riapri un'email già fatta: anteprima, cartella, rapporto",
                    "Chi firma: nome, ruolo, sito",
                    "Tema dell'email, colore del terminale, suono, velocità",
                    "La tastiera e come si scrivono gli appunti",
                    "Spegni il terminale (è già tutto salvato)" };
                Term.Frame(VERS, Stato(), "[↑↓] scegli   [INVIO] conferma   [1-5] scorciatoie   [0] esci");
                Logo(4, "POSTA");
                Term.Center(10, "- O S -    UFFICIO POSTALE DA TERMINALE  //  DAGLI APPUNTI ALL'EMAIL", Ink.Dim);
                sel = Term.Menu(26, 13, voci, desc, new[] { '1', '2', '3', '4', '5', '0' }, sel, 30, 22);
                switch (sel)
                {
                    case 0: Nuova(); break;
                    case 1: Archivio(); break;
                    case 2: Mittenti(); break;
                    case 3: Opzioni(); break;
                    case 4: Comandi(); break;
                    default: return;
                }
                if (sel < 0) sel = 5;
            }
        }

        static int SelfTest()
        {
            string tmp = Path.Combine(Path.GetTempPath(), "PostaOS_prova_" + Guid.NewGuid().ToString("N").Substring(0, 8));
            int ok = 0, tot = 0;
            Action<string, bool> prova = delegate (string nome, bool v) { tot++; if (v) ok++; Console.WriteLine((v ? "  OK  " : "  NO  ") + nome); };
            try
            {
                var p = new Profilo { Id = "demo", Nome = "pzkko", Ruolo = "Giochi e programmi", Sito = "https://pzkko.it", Contatto = "" };
                string[] righe = { "Venerdì sera facciamo il **torneo di Parole**.", "", "# Il programma", "1. ore 21:00, si entra", "2. ore 21:15, primo girone", "", "| Girone | Lettere |", "|---|---|", "| Praticante | 5 |", "", "> Niente dizionario aperto di fianco.", "", "[[Apri pzkko.it]](https://pzkko.it)", "- uno <b>non</b> passa" };
                string dir = Motore.Scrivi(tmp, p, "Mario Rossi", "Torneo di Parole, venerdì sera", righe, 0, "prova");
                string html = File.ReadAllText(Path.Combine(dir, "email.html"), Encoding.UTF8);
                prova("la cartella porta data e oggetto", Path.GetFileName(dir).EndsWith("_torneo-di-parole-venerdi-sera"));
                prova("i cinque file ci sono", File.Exists(Path.Combine(dir, "email-lite.html")) && File.Exists(Path.Combine(dir, "email.txt")) && File.Exists(Path.Combine(dir, "anteprima.html")) && File.Exists(Path.Combine(dir, "rapporto.txt")));
                prova("titolo, grassetto ed elenco numerato", html.Contains("<h2") && html.Contains("<strong>torneo di Parole</strong>") && html.Contains("<ol"));
                prova("la tabella ha intestazioni e celle", html.Contains("<th") && html.Contains(">Praticante<"));
                prova("la nota e il tasto col link diretto", html.Contains("border-left:3px") && html.Contains("Link diretto:") && html.Contains("href=\"https://pzkko.it\""));
                prova("l'HTML degli appunti resta testo", html.Contains("&lt;b&gt;non&lt;/b&gt;") && !html.Contains("<b>non</b>"));
                prova("nessuno script e nessun foglio esterno nell'email", !html.Contains("<script") && !html.Contains("<link"));
                prova("saluto, firma e informativa", html.Contains("Ciao Mario Rossi,") && html.Contains("Un caro saluto,") && html.Contains("Informativa privacy"));
                prova("l'anteprima ha il tasto per copiarla", File.ReadAllText(Path.Combine(dir, "anteprima.html")).Contains("COPIA EMAIL FORMATTATA"));
                string txt = File.ReadAllText(Path.Combine(dir, "email.txt"), Encoding.UTF8);
                prova("il testo semplice non ha i tag dell'email", !txt.Contains("<p") && !txt.Contains("<strong") && txt.Contains("IL PROGRAMMA") && txt.Contains("1. ore 21:00"));
            }
            catch (Exception e) { Console.WriteLine("  ERRORE " + e.Message); }
            finally { try { if (Directory.Exists(tmp)) Directory.Delete(tmp, true); } catch { } }
            Console.WriteLine(ok == tot && tot > 0 ? "SELFTEST OK: " + ok + "/" + tot + " prove" : "SELFTEST FALLITO: " + ok + "/" + tot);
            return ok == tot && tot > 0 ? 0 : 1;
        }

        static int Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "--selftest") return SelfTest();
            Dati.Load(AppDomain.CurrentDomain.BaseDirectory);
            try { Directory.CreateDirectory(Dati.Bozze); Directory.CreateDirectory(Dati.Uscita); } catch { }
            Term.Init();
            try { Avvio(); Menu(); }
            finally { Dati.Save(); Term.Restore(); }
            return 0;
        }
    }
}
