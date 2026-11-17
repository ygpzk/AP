using System;
using System.Collections.Generic;
using System.Threading;

namespace MatriciOS
{
    class Stats { public int Perfect, Helped, Wrong, Done; }

    static class Game
    {
        public static int Streak;
        static readonly Random rnd = new Random();

        public static int Pts(int st) { return st == 3 ? 10 : (st == 2 ? 5 : 0); }

        public static string Bar(int v, int max, int w)
        {
            int f = max <= 0 ? 0 : Math.Min(w, v * w / max);
            return new string('█', f) + new string('░', w - f);
        }

        public static List<int> ReviewIds()
        {
            var l = new List<int>();
            for (int i = 0; i < Bank.All.Count; i++) if (Save.St[i] == 1 || Save.St[i] == 2) l.Add(i);
            return l;
        }

        static int FirstUndone()
        {
            for (int i = 0; i < Bank.All.Count; i++) if (Save.St[i] == 0) return i;
            return -1;
        }

        public static void SecStats(int s, out int tot, out int done, out int perf)
        {
            tot = 0; done = 0; perf = 0;
            foreach (Ex e in Bank.All)
            {
                if (e.Sec != s) continue;
                tot++;
                if (Save.St[e.Id] >= 2) done++;
                if (Save.St[e.Id] == 3) perf++;
            }
        }

        static int LessonFor(int sec)
        {
            for (int i = 0; i < Program.Lessons.Count; i++) if (Program.Lessons[i].Sec == sec) return i + 1;
            return 1;
        }

        // =============================================================== LEZIONI
        public static void LessonsMenu()
        {
            int sel = 0;
            while (true)
            {
                var L = Program.Lessons;
                string[] items = new string[L.Count], desc = new string[L.Count];
                char[] hot = new char[L.Count];
                int done = 0;
                for (int i = 0; i < L.Count; i++)
                {
                    if (Save.Les[i]) done++;
                    items[i] = (Save.Les[i] ? "[*] " : "[ ] ") + (i + 1).ToString().PadLeft(2) + ". " + L[i].Title;
                    desc[i] = L[i].Pages.Count + " pagine   //   poi allenati con: " + Bank.SecNames[L[i].Sec - 1];
                    hot[i] = i < 9 ? (char)('1' + i) : ' ';
                }
                Term.Frame("LEZIONI", "LEZIONI STUDIATE: " + done + "/" + L.Count + "      [*] = già studiata", "[↑↓] scegli   [INVIO] apri   [1-9] scorciatoie   [ESC] indietro");
                Term.Put(4, 4, "SCEGLI UNA LEZIONE.  CONSIGLIO: SEGUILE IN ORDINE, DALLA 1 ALLA " + L.Count + ".", Ink.Dim);
                sel = Term.Menu(14, 6, items, desc, hot, sel, 52, 23);
                if (sel < 0) return;
                RunLesson(sel, 0);
            }
        }

        // disegna una pagina; ritorna l'ultima riga usata
        public static int DrawPage(Page pg)
        {
            int y = Term.TOP, last = Term.TOP;
            bool gapped = true;
            Term.BeginType();
            foreach (Block b in pg.B)
            {
                if (b.Row != null)
                {
                    if (!gapped) y++;
                    int h = Term.DrawRow(y, b.Row);
                    last = y + h - 1; y += h + 1; gapped = true;
                    if (!Term.Dry && !Term.Skipping) Thread.Sleep(60);
                    continue;
                }
                if (b.Gap > 0) { y += b.Gap; gapped = true; continue; }
                if (b.Head)
                {
                    if (!gapped) y++;
                    Term.Type(3, y, " " + b.Text + " ", Ink.Bright, true);
                    last = y; y += 2; gapped = true;
                    continue;
                }
                foreach (string line in Term.Wrap(b.Text, 74)) { Term.Type(3, y, line, b.Ink); last = y; y++; }
                gapped = false;
            }
            return last;
        }

        public static void RunLesson(int li, int startPage)
        {
            var all = Program.Lessons;
            int p = startPage;
            while (true)
            {
                Lesson L = all[li];
                int n = L.Pages.Count;
                if (p >= n)
                {
                    Save.Les[li] = true; Save.Write();
                    int tot, done, perf; SecStats(L.Sec, out tot, out done, out perf);
                    bool hasNext = li + 1 < all.Count;
                    Term.Frame("LEZIONE " + (li + 1) + "  //  COMPLETATA", Program.StatusLine(),
                        "[INVIO] esercizi   " + (hasNext ? "[→] lezione successiva   " : "") + "[←] rivedi   [ESC] lezioni");
                    Sfx.Play("win");
                    Term.Center(6, " LEZIONE COMPLETATA ", Ink.Bright, true);
                    Term.Center(8, L.Title, Ink.Norm);
                    Term.Center(11, "Ora mettiti alla prova con gli esercizi di questa sezione:", Ink.Norm);
                    Term.Center(12, Bank.SecNames[L.Sec - 1] + "   (" + done + "/" + tot + " già risolti)", Ink.Bright);
                    Term.Put(20, 15, "[INVIO]   ALLENATI ADESSO", Ink.Norm);
                    if (hasNext) Term.Put(20, 16, "[→]       PASSA ALLA LEZIONE " + (li + 2) + ": " + all[li + 1].Title, Ink.Norm);
                    Term.Put(20, 17, "[←]       RILEGGI L'ULTIMA PAGINA", Ink.Norm);
                    Term.Put(20, 18, "[ESC]     TORNA ALLE LEZIONI", Ink.Norm);
                    while (true)
                    {
                        ConsoleKeyInfo k = Term.Wait();
                        if (k.Key == ConsoleKey.Enter || k.Key == ConsoleKey.Spacebar) { Sfx.Play("select"); RunSection(L.Sec); return; }
                        if (k.Key == ConsoleKey.RightArrow && hasNext) { Sfx.Play("page"); li++; p = 0; break; }
                        if (k.Key == ConsoleKey.LeftArrow) { Sfx.Play("page"); p = n - 1; break; }
                        if (k.Key == ConsoleKey.Escape) return;
                    }
                    continue;
                }
                string dots = "";
                for (int i = 0; i < n; i++) dots += i <= p ? "■ " : "□ ";
                Term.Frame("LEZIONE " + (li + 1) + " DI " + all.Count + "  //  " + L.Title,
                    "PAGINA " + (p + 1) + " DI " + n + "     " + dots,
                    "[→] o [INVIO] avanti   [←] indietro   [ESC] menù lezioni");
                DrawPage(L.Pages[p]);
                while (true)
                {
                    ConsoleKeyInfo k = Term.Wait();
                    if (k.Key == ConsoleKey.RightArrow || k.Key == ConsoleKey.Enter || k.Key == ConsoleKey.Spacebar || k.Key == ConsoleKey.D)
                    { Sfx.Play("page"); p++; break; }
                    if ((k.Key == ConsoleKey.LeftArrow || k.Key == ConsoleKey.A) && p > 0) { Sfx.Play("page"); p--; break; }
                    if (k.Key == ConsoleKey.Escape) return;
                }
            }
        }

        // =============================================================== ESERCIZI
        public static void ExercisesMenu()
        {
            int sel = 0;
            while (true)
            {
                int ns = Bank.SecNames.Length;
                string[] items = new string[ns + 1], desc = new string[ns + 1];
                char[] hot = new char[ns + 1];
                int next = FirstUndone();
                items[0] = "TUTTI E " + Bank.All.Count + " IN ORDINE";
                desc[0] = next < 0 ? "Hai risposto a tutto! Si ricomincia dal n. 1" : "Riprendi dall'esercizio n. " + (next + 1);
                hot[0] = '0';
                for (int s = 1; s <= ns; s++)
                {
                    int tot, done, perf; SecStats(s, out tot, out done, out perf);
                    items[s] = s.ToString().PadLeft(2) + ". " + Term.Pad(Bank.SecNames[s - 1], 27) + " " + Bar(done, tot, 10) + " " + done.ToString().PadLeft(2) + "/" + tot;
                    desc[s] = "Perfetti: " + perf + "/" + tot + "    //    lezione da studiare prima: n. " + LessonFor(s);
                    hot[s] = s <= 9 ? (char)('0' + s) : ' ';
                }
                Term.Frame("ESERCIZI", Program.StatusLine(), "[↑↓] scegli   [INVIO] inizia   [0-9] scorciatoie   [ESC] indietro");
                Term.Put(4, 4, "100 ESERCIZI BASE IN 10 SEZIONI.  LA BARRA MOSTRA QUELLI GIÀ RISOLTI.", Ink.Dim);
                sel = Term.Menu(12, 6, items, desc, hot, sel, 56, 23);
                if (sel < 0) return;
                if (sel == 0)
                {
                    int st = next < 0 ? 0 : next;
                    var ids = new List<int>();
                    for (int i = st; i < Bank.All.Count; i++) ids.Add(i);
                    RunList(ids, "ESERCIZI  //  TUTTI IN ORDINE", false);
                }
                else RunSection(sel);
            }
        }

        public static void RunSection(int sec)
        {
            var ids = new List<int>();
            foreach (Ex e in Bank.All) if (e.Sec == sec) ids.Add(e.Id);
            RunList(ids, "SEZ. " + sec + "  //  " + Bank.SecNames[sec - 1], false);
        }

        public static void Challenge()
        {
            var pool = new List<int>();
            for (int i = 0; i < Bank.All.Count; i++) pool.Add(i);
            var ids = new List<int>();
            for (int k = 0; k < 10 && pool.Count > 0; k++)
            {
                int j = rnd.Next(pool.Count);
                ids.Add(pool[j]); pool.RemoveAt(j);
            }
            RunList(ids, "SFIDA RAPIDA", true);
        }

        public static void Review()
        {
            var ids = ReviewIds();
            if (ids.Count == 0)
            {
                Term.Frame("RIPASSO ERRORI", Program.StatusLine(), "[un tasto qualsiasi] torna al menù");
                Term.Center(10, " NESSUN ERRORE DA RIPASSARE! ", Ink.Bright, true);
                Term.Center(13, "Qui finiscono gli esercizi sbagliati o risolti con l'aiuto.", Ink.Norm);
                Term.Center(14, "Quando li rifai senza errori, escono dalla lista.", Ink.Norm);
                Sfx.Play("select");
                Term.Wait();
                return;
            }
            RunList(ids, "RIPASSO ERRORI", false);
        }

        public static void RunList(List<int> ids, string title, bool challenge)
        {
            var st = new Stats();
            for (int k = 0; k < ids.Count; k++)
            {
                if (!PlayOne(Bank.All[ids[k]], k, ids.Count, title, st)) break;
            }
            if (st.Done > 0) Summary(title, st, challenge, ids.Count);
        }

        static void Feedback(int y, string label, string text, bool good)
        {
            Term.ClearRows(y, Term.BOTTOM);
            Term.Put(3, y, label, good ? Ink.Bright : Ink.Norm, true);
            int yy = y + 1;
            foreach (string l in Term.Wrap(text, 74))
            {
                if (yy > Term.BOTTOM) break;
                Term.Put(3, yy++, l, Ink.Norm);
            }
        }

        // altezza necessaria (per il controllo automatico dell'impaginazione)
        public static int Measure(Ex e)
        {
            int y = Term.TOP + Term.Wrap(e.Q, 74).Count;
            if (e.Show != null) y += 1 + Term.DrawRow(0, e.Show);
            y++;
            int fbY = y + (e.Kind == QK.Choice ? e.Opts.Length : 2) + 1;
            int lines = Math.Max(Term.Wrap(e.Why, 74).Count, Term.Wrap("Suggerimento: " + e.Hint, 74).Count);
            return fbY + lines;
        }

        static bool PlayOne(Ex e, int k, int total, string title, Stats st)
        {
            bool choice = e.Kind == QK.Choice;
            bool vf = choice && e.Opts[0] == "VERO";
            string footer = vf ? "[V] vero   [F] falso   [H] aiuto   [ESC] menù"
                : choice ? "[A-D] rispondi   oppure [↑↓] + [INVIO]   [H] aiuto   [ESC] menù"
                : "scrivi la risposta + [INVIO]   [H] aiuto   [ESC] menù";
            string status = "ESERCIZIO N. " + (e.Id + 1).ToString("000") + "     DOMANDA " + (k + 1) + " DI " + total
                + "     XP " + Save.Xp() + "     SERIE " + Streak;
            Term.Frame(title, status, footer);

            int y = Term.TOP;
            Term.BeginType();
            foreach (string line in Term.Wrap(e.Q, 74)) { Term.Type(3, y, line, Ink.Bright); y++; }
            int matY = -1;
            if (e.Show != null) { y++; matY = y; y += Term.DrawRow(y, e.Show); }
            y++;
            int ansY = y;
            int nOpt = choice ? e.Opts.Length : 0;
            int fbY = ansY + (choice ? nOpt : 2) + 1;
            bool[] off = new bool[nOpt];
            int maxAtt = (choice && nOpt <= 2) ? 1 : 2;
            int att = 0;
            bool help = false, right = false;
            if (!choice) Term.Put(5, ansY + 1, e.FormatNote(), Ink.Dim);

            while (true)
            {
                bool ok;
                if (choice)
                {
                    int r = Term.Choose(5, ansY, e.Opts, off, 60);
                    if (r == -1) return false;
                    if (r == -2) { Sfx.Play("hint"); help = true; Feedback(fbY, " AIUTO ", e.Hint + "   (con l'aiuto la domanda vale 5 XP)", false); continue; }
                    ok = r == e.Correct;
                    if (!ok) off[r] = true;
                }
                else
                {
                    string s = Term.Input(3, ansY, 12, false);
                    if (s == null) return false;
                    if (s == Term.HINT) { Sfx.Play("hint"); help = true; Feedback(fbY, " AIUTO ", e.Hint + "   (con l'aiuto la domanda vale 5 XP)", false); continue; }
                    int c = e.Check(s);
                    if (c < 0) { Sfx.Play("deny"); Feedback(fbY, " FORMATO NON VALIDO ", e.FormatNote(), false); continue; }
                    ok = c == 1;
                }
                att++;
                if (ok) { right = true; break; }
                if (att >= maxAtt) break;
                Sfx.Play("bad");
                Feedback(fbY, " NON È GIUSTO: RIPROVA! ", "Suggerimento: " + e.Hint, false);
            }

            int result = right ? ((att == 1 && !help) ? 3 : 2) : 1;
            int old = Save.St[e.Id];
            int gain = Math.Max(0, Pts(result) - Pts(old));
            if (result > old) Save.St[e.Id] = result;
            st.Done++;
            if (result == 3) { st.Perfect++; Streak++; if (Streak > Save.BestStreak) Save.BestStreak = Streak; }
            else { Streak = 0; if (result == 2) st.Helped++; else st.Wrong++; }
            Save.Write();

            if (e.Sol != null && matY >= 0) Term.DrawRow(matY, e.Sol);
            if (choice) Term.MarkChoice(5, ansY, e.Opts, e.Correct, off, 60);
            string label;
            if (result == 3) label = " ESATTO! " + (gain > 0 ? "+" + gain + " XP " : "");
            else if (result == 2) label = " GIUSTO! " + (gain > 0 ? "+" + gain + " XP " : "") + "(con aiuto) ";
            else label = " SBAGLIATO.  LA RISPOSTA GIUSTA È: " + e.AnsText() + " ";
            bool streakMsg = result == 3 && Streak % 5 == 0;
            if (streakMsg) label += "  >> SERIE DI " + Streak + " PERFETTE! << ";
            Sfx.Play(right ? (streakMsg ? "streak" : "ok") : "bad");
            Feedback(fbY, label, e.Why, right);
            Term.Footer(k + 1 < total ? "[INVIO] prossimo esercizio   [ESC] torna al menù" : "[INVIO] vedi il risultato");
            ConsoleKeyInfo key = Term.Wait();
            return key.Key != ConsoleKey.Escape || k + 1 >= total;
        }

        static void Summary(string title, Stats st, bool challenge, int planned)
        {
            int n = st.Done;
            int pct = n == 0 ? 0 : (st.Perfect * 10 + st.Helped * 5) * 100 / (n * 10);
            bool rec = false;
            if (challenge && n == planned && st.Perfect > Save.BestChallenge) { Save.BestChallenge = st.Perfect; rec = true; Save.Write(); }
            Term.Frame(title + "  //  RISULTATO", Program.StatusLine(), "[INVIO] continua");
            Term.Center(5, " SESSIONE COMPLETATA ", Ink.Bright, true);
            int x = 24;
            Term.Put(x, 8, "ESERCIZI SVOLTI ............. " + n, Ink.Norm);
            Term.Put(x, 9, "PERFETTI (10 XP) ............ " + st.Perfect, Ink.Norm);
            Term.Put(x, 10, "GIUSTI CON AIUTO (5 XP) ..... " + st.Helped, Ink.Norm);
            Term.Put(x, 11, "SBAGLIATI ................... " + st.Wrong, Ink.Norm);
            Term.Put(x, 13, "PUNTEGGIO  " + Bar(pct, 100, 20) + "  " + pct + "%", Ink.Bright);
            string msg = pct >= 90 ? "ECCELLENTE! Sei pronto per l'argomento successivo."
                : pct >= 60 ? "BUON LAVORO! Con RIPASSO ERRORI sistemi quelli sbagliati."
                : "NIENTE PANICO: rileggi la lezione e riprova, migliorerai!";
            Term.Center(16, msg, Ink.Norm);
            if (rec) Term.Center(18, " NUOVO RECORD NELLA SFIDA RAPIDA: " + st.Perfect + "/" + planned + " PERFETTE ", Ink.Bright, true);
            Term.Center(21, "XP TOTALI: " + Save.Xp() + "      RANGO: " + Save.Rank(Save.Xp()), Ink.Bright);
            Sfx.Play(pct >= 60 ? "win" : "bad");
            Thread.Sleep(300);
            while (true)
            {
                ConsoleKeyInfo k = Term.Wait();
                if (k.Key == ConsoleKey.Enter || k.Key == ConsoleKey.Escape || k.Key == ConsoleKey.Spacebar) break;
            }
        }
    }
}
