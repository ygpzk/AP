using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;

namespace MatriciOS
{
    // Salvataggio automatico in un file di testo accanto al programma (portatile: va anche da chiavetta USB)
    static class Save
    {
        public static int[] St = new int[100];       // 0 mai fatto, 1 sbagliato, 2 giusto con aiuto, 3 perfetto
        public static bool[] Les = new bool[11];
        public static int BestStreak, BestChallenge;
        public static string Name = "";
        public static bool Sound = true;
        public static int Speed = 1, Theme = 0;
        public static string PathUsed;

        public static void Apply() { Sfx.On = Sound; Term.Speed = Speed; Term.Theme = Theme; }

        static int ToInt(string s) { int v; return int.TryParse(s, out v) ? v : 0; }

        public static void Load()
        {
            PathUsed = FindPath();
            try
            {
                if (PathUsed != null && File.Exists(PathUsed))
                {
                    foreach (string line in File.ReadAllLines(PathUsed, Encoding.UTF8))
                    {
                        int eq = line.IndexOf('=');
                        if (eq < 0 || line.StartsWith("#")) continue;
                        string k = line.Substring(0, eq).Trim(), v = line.Substring(eq + 1).Trim();
                        switch (k)
                        {
                            case "nome": Name = v; break;
                            case "suono": Sound = v != "0"; break;
                            case "velocita": Speed = Math.Max(0, Math.Min(2, ToInt(v))); break;
                            case "colore": Theme = Math.Max(0, Math.Min(3, ToInt(v))); break;
                            case "serie": BestStreak = ToInt(v); break;
                            case "sfida": BestChallenge = ToInt(v); break;
                            case "esercizi":
                                {
                                    string[] p = v.Split(',');
                                    for (int i = 0; i < p.Length && i < St.Length; i++) St[i] = Math.Max(0, Math.Min(3, ToInt(p[i])));
                                    break;
                                }
                            case "lezioni":
                                {
                                    string[] p = v.Split(',');
                                    for (int i = 0; i < p.Length && i < Les.Length; i++) Les[i] = p[i].Trim() == "1";
                                    break;
                                }
                        }
                    }
                }
            }
            catch { }
            Apply();
        }

        static string FindPath()
        {
            const string file = "MatriciOS_salvataggio.txt";
            try
            {
                string p = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, file);
                if (CanWrite(p)) return p;
            }
            catch { }
            try
            {
                string d = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "MatriciOS");
                Directory.CreateDirectory(d);
                return Path.Combine(d, file);
            }
            catch { return null; }
        }

        static bool CanWrite(string p)
        {
            try { using (new FileStream(p, FileMode.OpenOrCreate, FileAccess.ReadWrite)) { } return true; }
            catch { return false; }
        }

        public static void Write()
        {
            if (PathUsed == null) return;
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("# MATRICI-OS - salvataggio automatico. Cancella questo file per ricominciare da zero.");
                sb.AppendLine("nome=" + Name);
                sb.AppendLine("suono=" + (Sound ? 1 : 0));
                sb.AppendLine("velocita=" + Speed);
                sb.AppendLine("colore=" + Theme);
                sb.AppendLine("serie=" + BestStreak);
                sb.AppendLine("sfida=" + BestChallenge);
                var e = new StringBuilder();
                for (int i = 0; i < St.Length; i++) { if (i > 0) e.Append(','); e.Append(St[i]); }
                sb.AppendLine("esercizi=" + e);
                var l = new StringBuilder();
                for (int i = 0; i < Les.Length; i++) { if (i > 0) l.Append(','); l.Append(Les[i] ? 1 : 0); }
                sb.AppendLine("lezioni=" + l);
                File.WriteAllText(PathUsed, sb.ToString(), new UTF8Encoding(false));
            }
            catch { }
        }

        public static int Xp() { int x = 0; foreach (int s in St) x += Game.Pts(s); return x; }
        public static int Done() { int n = 0; foreach (int s in St) if (s >= 2) n++; return n; }

        static readonly int[] RankXp = { 0, 100, 250, 450, 700, 900 };
        static readonly string[] RankName = { "RECLUTA", "APPRENDISTA", "TECNICO", "ESPERTO", "SPECIALISTA", "MAESTRO DELLE MATRICI" };

        public static string Rank(int xp)
        {
            string r = RankName[0];
            for (int i = 0; i < RankXp.Length; i++) if (xp >= RankXp[i]) r = RankName[i];
            return r;
        }

        public static string NextRank(int xp)
        {
            for (int i = 0; i < RankXp.Length; i++)
                if (xp < RankXp[i]) return "PROSSIMO RANGO: " + RankName[i] + " tra " + (RankXp[i] - xp) + " XP";
            return "HAI RAGGIUNTO IL RANGO MASSIMO!";
        }

        public static void Reset()
        {
            St = new int[100]; Les = new bool[11]; BestStreak = 0; BestChallenge = 0;
            Write();
        }
    }

    static class Program
    {
        public static List<Lesson> Lessons;

        static int Main(string[] args)
        {
            try
            {
                Bank.Build();
                Lessons = LessonBank.Build();
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERRORE NEI CONTENUTI: " + ex.Message);
                return 1;
            }
            if (args.Length > 0 && args[0] == "--selftest") return SelfTest(args.Length > 1 && args[1] == "--dump");

            Term.Init();
            Sfx.Init();
            Save.Load();
            try
            {
                if (args.Length >= 2 && args[0] == "--ex")
                {
                    Term.Speed = 2; if (Save.Name == "") Save.Name = "TEST";
                    Game.RunList(new List<int> { int.Parse(args[1]) - 1 }, "TEST", false);
                }
                else if (args.Length >= 2 && args[0] == "--lez")
                {
                    Term.Speed = 2; if (Save.Name == "") Save.Name = "TEST";
                    Game.RunLesson(int.Parse(args[1]) - 1, args.Length > 2 ? int.Parse(args[2]) - 1 : 0);
                }
                else
                {
                    Boot();
                    MainMenu();
                }
            }
            catch (Exception ex)
            {
                Term.Restore();
                Console.WriteLine("Si è verificato un errore: " + ex.Message);
                Console.WriteLine("Premi un tasto per chiudere.");
                try { Console.ReadKey(true); } catch { }
                return 1;
            }
            Shutdown();
            return 0;
        }

        public static string StatusLine()
        {
            int xp = Save.Xp();
            return "UTENTE: " + Save.Name + "    XP: " + xp + "    RANGO: " + Save.Rank(xp) + "    RISOLTI: " + Save.Done() + "/" + Bank.All.Count;
        }

        static string Dots(string s) { return s + " " + new string('.', Math.Max(3, 48 - s.Length)) + " OK"; }

        // ------------------------------------------------------------- AVVIO
        static void Boot()
        {
            Term.Clear();
            Sfx.Play("boot");
            Thread.Sleep(350);
            Term.BeginType();
            string[] lines = {
                "MATRICI-OS (TM)   //   TERMINALE DIDATTICO   //   v1.0",
                "COPYRIGHT 2026  -  LABORATORIO DI ALGEBRA LINEARE",
                "",
                Dots("> AVVIO SISTEMA"),
                Dots("> TEST MEMORIA 64K RAM"),
                Dots("> CARICAMENTO MODULO MATRICI"),
                Dots("> CARICAMENTO " + Lessons.Count + " LEZIONI"),
                Dots("> CARICAMENTO " + Bank.All.Count + " ESERCIZI"),
                Dots("> LETTURA PROFILO STUDENTE"),
            };
            int y = 2;
            foreach (string s in lines)
            {
                Term.Type(4, y, s, y < 4 ? Ink.Bright : Ink.Norm);
                y++;
                if (!Term.Skipping) Thread.Sleep(60);
            }
            y++;
            if (Save.Name == "")
            {
                Term.Type(4, y++, "> NUOVO UTENTE RILEVATO.", Ink.Bright);
                Term.Type(4, y++, "> INSERISCI IL TUO NOME E PREMI INVIO:", Ink.Bright);
                string n = Term.Input(6, y++, 14, true);
                n = (n ?? "").Trim().ToUpperInvariant();
                Save.Name = n.Length == 0 ? "STUDENTE" : n;
                Save.Write();
                Sfx.Play("select");
                y++;
            }
            Term.BeginType();
            Term.Type(4, y++, "> ACCESSO CONSENTITO.  BENVENUTO, " + Save.Name + ".", Ink.Bright);
            Term.Type(4, y++, "  XP: " + Save.Xp() + "    RANGO: " + Save.Rank(Save.Xp()) + "    RISOLTI: " + Save.Done() + "/" + Bank.All.Count, Ink.Norm);
            Term.BlinkWait(Math.Max(y + 2, 22), "[ PREMI UN TASTO PER ENTRARE ]");
            Sfx.Play("select");
        }

        static void Shutdown()
        {
            Term.Clear();
            Sfx.Play("off");
            Term.Center(13, "SPEGNIMENTO TERMINALE IN CORSO...", Ink.Norm);
            Term.Center(15, "Progressi salvati. A presto, " + Save.Name + "!", Ink.Dim);
            Thread.Sleep(900);
            Term.Restore();
        }

        // ------------------------------------------------------------- MENÙ PRINCIPALE
        static void MainMenu()
        {
            int sel = 0;
            while (true)
            {
                int rev = Game.ReviewIds().Count;
                string[] items = {
                    "[1] LEZIONI", "[2] ESERCIZI", "[3] SFIDA RAPIDA", "[4] RIPASSO ERRORI (" + rev + ")",
                    "[5] PROGRESSI", "[6] OPZIONI", "[7] COMANDI", "[0] ESCI"
                };
                string[] desc = {
                    "Impara le matrici da zero, passo dopo passo (" + Lessons.Count + " lezioni)",
                    "100 esercizi base divisi per argomento",
                    "10 domande a caso: quante ne fai perfette?",
                    rev == 0 ? "Nessun errore da ripassare" : "Rifai i " + rev + " esercizi sbagliati o risolti con l'aiuto",
                    "Punti, rango e percentuale completata",
                    "Suono, colore del terminale, velocità del testo",
                    "Come si usa la tastiera in questo programma",
                    "Spegni il terminale (i progressi sono già salvati)"
                };
                char[] hot = { '1', '2', '3', '4', '5', '6', '7', '0' };
                Term.Frame("MATRICI-OS v1.0", StatusLine(), "[↑↓] scegli   [INVIO] conferma   [1-7] scorciatoie   [0] esci");
                Term.Logo(4, "MATRICI");
                Term.Center(10, "- O S -    TERMINALE DIDATTICO  //  IMPARA LE MATRICI", Ink.Dim);
                sel = Term.Menu(26, 12, items, desc, hot, sel, 30, 22);
                switch (sel)
                {
                    case 0: Game.LessonsMenu(); break;
                    case 1: Game.ExercisesMenu(); break;
                    case 2: Game.Challenge(); break;
                    case 3: Game.Review(); break;
                    case 4: Progress(); break;
                    case 5: Options(); break;
                    case 6: Guide(); break;
                    default:
                        if (ConfirmExit()) return;
                        sel = 7;
                        break;
                }
            }
        }

        static bool ConfirmExit()
        {
            Term.ClearRows(22, 22);
            Term.Center(22, " VUOI DAVVERO SPEGNERE IL TERMINALE?   [S] sì    [N] no ", Ink.Bright, true);
            ConsoleKeyInfo k = Term.Wait();
            return k.Key == ConsoleKey.S || k.Key == ConsoleKey.Y || k.Key == ConsoleKey.Enter || k.Key == ConsoleKey.D0;
        }

        // ------------------------------------------------------------- PROGRESSI
        static void Progress()
        {
            while (true)
            {
                int xp = Save.Xp();
                Term.Frame("PROGRESSI", StatusLine(), "[R] azzera tutti i progressi   [ESC] indietro");
                Term.Put(4, 4, "STUDENTE: " + Save.Name + "      RANGO: " + Save.Rank(xp) + "      XP: " + xp + " / 1000", Ink.Bright);
                Term.Put(4, 5, Save.NextRank(xp), Ink.Dim);
                Term.Put(4, 7, "SEZIONE                          RISOLTI                 PERFETTI", Ink.Dim);
                for (int s = 1; s <= Bank.SecNames.Length; s++)
                {
                    int tot, done, perf; Game.SecStats(s, out tot, out done, out perf);
                    string row = s.ToString().PadLeft(2) + ". " + Term.Pad(Bank.SecNames[s - 1], 28) + " " + Game.Bar(done, tot, 12)
                        + " " + (done + "/" + tot).PadLeft(5) + "      " + (perf + "/" + tot).PadLeft(5);
                    Term.Put(4, 7 + s, row, done == tot ? Ink.Bright : Ink.Norm);
                }
                int les = 0; foreach (bool b in Save.Les) if (b) les++;
                int all = Save.Done();
                Term.Put(4, 19, "TOTALE ESERCIZI   " + Game.Bar(all, Bank.All.Count, 30) + "  " + all + "/" + Bank.All.Count, Ink.Bright);
                Term.Put(4, 20, "LEZIONI STUDIATE  " + Game.Bar(les, Lessons.Count, 30) + "  " + les + "/" + Lessons.Count, Ink.Norm);
                Term.Put(4, 22, "MIGLIOR SERIE DI RISPOSTE PERFETTE: " + Save.BestStreak + "      RECORD SFIDA RAPIDA: " + Save.BestChallenge + "/10", Ink.Norm);
                Term.Put(4, 24, "Salvataggio: " + (Save.PathUsed ?? "non disponibile"), Ink.Dim);
                ConsoleKeyInfo k = Term.Wait();
                if (k.Key == ConsoleKey.R)
                {
                    Term.ClearRows(24, 24);
                    Term.Center(24, " AZZERARE TUTTO? NON SI PUÒ ANNULLARE.  [S] sì   [N] no ", Ink.Bright, true);
                    Sfx.Play("deny");
                    ConsoleKeyInfo c = Term.Wait();
                    if (c.Key == ConsoleKey.S) { Save.Reset(); Game.Streak = 0; Sfx.Play("off"); }
                    continue;
                }
                return;
            }
        }

        // ------------------------------------------------------------- OPZIONI
        static void Options()
        {
            int sel = 0;
            string[] speeds = { "LENTA", "NORMALE", "ISTANTANEA" };
            while (true)
            {
                Term.Frame("OPZIONI", StatusLine(), "[↑↓] scegli   [←→] o [INVIO] cambia   [ESC] indietro");
                string[] items = {
                    "SUONO ................. " + (Save.Sound ? "ACCESO" : "SPENTO"),
                    "VELOCITÀ DEL TESTO .... " + speeds[Save.Speed],
                    "COLORE DEL TERMINALE .. " + Term.ThemeNames[Save.Theme],
                    "PROVA I SUONI",
                    "CAMBIA NOME UTENTE .... " + Save.Name,
                };
                for (int i = 0; i < items.Length; i++) Term.DrawItem(18, 7 + i * 2, items[i], i == sel, 46);
                Term.Center(20, "Le opzioni vengono salvate automaticamente.", Ink.Dim);
                if (!Term.Vt) Term.Center(22, "(colori semplificati: questa console non supporta i colori a 24 bit)", Ink.Dim);
                ConsoleKeyInfo k = Term.Wait();
                int dir = 0;
                switch (k.Key)
                {
                    case ConsoleKey.UpArrow: case ConsoleKey.W: sel = (sel + items.Length - 1) % items.Length; Sfx.Play("move"); continue;
                    case ConsoleKey.DownArrow: case ConsoleKey.S: sel = (sel + 1) % items.Length; Sfx.Play("move"); continue;
                    case ConsoleKey.Escape: case ConsoleKey.Backspace: Save.Write(); return;
                    case ConsoleKey.LeftArrow: case ConsoleKey.A: dir = -1; break;
                    case ConsoleKey.RightArrow: case ConsoleKey.D: case ConsoleKey.Enter: case ConsoleKey.Spacebar: dir = 1; break;
                }
                if (dir == 0) continue;
                switch (sel)
                {
                    case 0: Save.Sound = !Save.Sound; break;
                    case 1: Save.Speed = (Save.Speed + 3 + dir) % 3; break;
                    case 2: Save.Theme = (Save.Theme + 4 + dir) % 4; break;
                    case 3:
                        Save.Apply();
                        Sfx.Play("ok"); Thread.Sleep(500); Sfx.Play("bad"); Thread.Sleep(550); Sfx.Play("hint"); Thread.Sleep(400); Sfx.Play("win");
                        continue;
                    case 4:
                        Term.ClearRows(15, 15);
                        Term.Put(20, 16, "NUOVO NOME (poi INVIO):", Ink.Bright);
                        string n = Term.Input(44, 16, 14, true);
                        if (!string.IsNullOrEmpty(n)) Save.Name = n.ToUpperInvariant();
                        break;
                }
                Save.Apply();
                Save.Write();
                Sfx.Play("select");
            }
        }

        // ------------------------------------------------------------- COMANDI
        static void Guide()
        {
            Term.Frame("COMANDI", StatusLine(), "[un tasto qualsiasi] torna al menù");
            string[] g = {
                "#NEI MENÙ",
                "[↑] [↓]  oppure  [W] [S] ............ muoverti",
                "[INVIO] ............................. conferma",
                "[1] ... [9]  [0] .................... scorciatoie",
                "[ESC] ............................... indietro",
                "#NELLE LEZIONI",
                "[→] o [INVIO] avanti    [←] indietro    un tasto salta l'animazione",
                "#NEGLI ESERCIZI",
                "[A] [B] [C] [D]  oppure  [1]-[4] .... risposta a scelta multipla",
                "[V] [F] ............................. vero / falso",
                "7  oppure  -3  + [INVIO] ............ risposte numeriche",
                "2x3  + [INVIO] ...................... dimensioni (righe x colonne)",
                "2 3  + [INVIO] ...................... posizioni (riga colonna)",
                "[H] ................................. aiuto",
                "#PUNTI",
                "10 XP risposta perfetta  -  5 XP con aiuto o al secondo tentativo",
                "Hai 2 tentativi (1 sola possibilità nelle domande SÌ/NO e VERO/FALSO).",
            };
            int y = 4;
            foreach (string s in g)
            {
                if (s.StartsWith("#")) { if (y > 4) y++; Term.Put(4, y++, " " + s.Substring(1) + " ", Ink.Bright, true); }
                else Term.Put(6, y++, s, Ink.Norm);
            }
            Term.Wait();
        }

        // ------------------------------------------------------------- AUTOTEST
        static int SelfTest(bool dump)
        {
            try { Console.OutputEncoding = new UTF8Encoding(false); } catch { }
            Term.Dry = true;
            int err = 0;
            Console.WriteLine("Esercizi: " + Bank.All.Count + "   Lezioni: " + Lessons.Count);
            var per = new int[Bank.SecNames.Length + 1];
            foreach (Ex e in Bank.All) per[e.Sec]++;
            for (int s = 1; s < per.Length; s++) Console.WriteLine("  sezione " + s + " (" + Bank.SecNames[s - 1] + "): " + per[s]);
            if (Bank.All.Count != 100) { Console.WriteLine("ERRORE: gli esercizi non sono 100"); err++; }
            foreach (Ex e in Bank.All)
            {
                string tag = "#" + (e.Id + 1) + " ";
                if (e.Kind == QK.Choice)
                {
                    if (e.Correct < 0 || e.Correct >= e.Opts.Length) { Console.WriteLine(tag + "indice risposta non valido"); err++; }
                }
                else if (e.Check(e.Ans) != 1) { Console.WriteLine(tag + "la risposta canonica non passa il controllo: " + e.Ans); err++; }
                int h = Game.Measure(e);
                if (h > Term.BOTTOM + 1) { Console.WriteLine(tag + "troppo alto: " + h); err++; }
                if (e.Show != null && Term.RowWidth(e.Show) > 74) { Console.WriteLine(tag + "troppo largo"); err++; }
                string lab = " SBAGLIATO.  LA RISPOSTA GIUSTA È: " + e.AnsText() + " ";
                if (lab.Length > 74) { Console.WriteLine(tag + "etichetta troppo lunga"); err++; }
                foreach (string l in Term.Wrap(e.Q, 74)) if (l.Length > 74) { Console.WriteLine(tag + "parola troppo lunga"); err++; }
                if (dump)
                {
                    Console.WriteLine();
                    Console.WriteLine(tag + "[sez " + e.Sec + ", " + e.Kind + ", h=" + h + "] " + e.Q);
                    if (e.Show != null)
                        foreach (object o in e.Show)
                        {
                            MatSpec m = o as MatSpec;
                            if (m == null) { Console.WriteLine("    op: '" + o + "'"); continue; }
                            var sb = new StringBuilder("    " + m.Label + " = ");
                            for (int r = 0; r < m.Cells.GetLength(0); r++)
                            {
                                if (r > 0) sb.Append(" / ");
                                for (int c = 0; c < m.Cells.GetLength(1); c++) sb.Append((c > 0 ? " " : "") + m.Cells[r, c]);
                            }
                            Console.WriteLine(sb);
                        }
                    if (e.Opts != null) Console.WriteLine("    opzioni: " + string.Join(" | ", e.Opts));
                    Console.WriteLine("    RISPOSTA: " + e.AnsText());
                    Console.WriteLine("    aiuto: " + e.Hint);
                    Console.WriteLine("    perché: " + e.Why);
                }
            }
            for (int i = 0; i < Lessons.Count; i++)
                for (int p = 0; p < Lessons[i].Pages.Count; p++)
                {
                    int last = Game.DrawPage(Lessons[i].Pages[p]);
                    foreach (Block b in Lessons[i].Pages[p].B)
                        if (b.Row != null && Term.RowWidth(b.Row) > 76) { Console.WriteLine("Lezione " + (i + 1) + " pag " + (p + 1) + ": matrici troppo larghe"); err++; }
                    if (dump) Console.WriteLine("Lezione " + (i + 1) + " pag " + (p + 1) + ": ultima riga " + last);
                    if (last > Term.BOTTOM) { Console.WriteLine("Lezione " + (i + 1) + " pag " + (p + 1) + ": troppo lunga (riga " + last + ")"); err++; }
                }
            Console.WriteLine(err == 0 ? "AUTOTEST OK" : "ERRORI: " + err);
            return err;
        }
    }
}
