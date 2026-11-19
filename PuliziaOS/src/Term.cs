using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace MatriciOS
{
    enum Ink { Dim = 1, Norm = 2, Bright = 3 }

    // Una matrice da disegnare: etichetta, celle (testo), evidenziazione, indici riga/colonna
    class MatSpec
    {
        public string Label;
        public string[,] Cells;
        public Func<int, int, int> Hl;   // 0 normale, 1 inverso, 2 brillante, 3 spento
        public bool Idx;
        public MatSpec(string label, string[,] cells, Func<int, int, int> hl, bool idx)
        { Label = label; Cells = cells; Hl = hl; Idx = idx; }
    }

    static class Term
    {
        [DllImport("kernel32.dll")] static extern IntPtr GetStdHandle(int n);
        [DllImport("kernel32.dll")] static extern bool GetConsoleMode(IntPtr h, out uint m);
        [DllImport("kernel32.dll")] static extern bool SetConsoleMode(IntPtr h, uint m);

        public const int FW = 80, FH = 29;      // cornice: 80 colonne x 29 righe
        public const int TOP = 4, BOTTOM = 25;  // area contenuti
        public const string HINT = "\u0001";
        const string ESC = "\u001b";

        public static bool Vt, Dry;
        public static int Theme = 0, Speed = 1;
        static int ox;
        static bool skip;
        public static bool Skipping { get { return skip || Speed >= 2; } }

        public static readonly string[] ThemeNames = { "VERDE FOSFORI", "AMBRA", "BLU GHIACCIO", "BIANCO CARTA" };
        // sfondo, spento, normale, brillante
        static readonly int[,] Pal = {
            { 0x041009, 0x1D7A3A, 0x33FF77, 0xC8FFDA },
            { 0x120B02, 0x8C5A0E, 0xFFB000, 0xFFE3A3 },
            { 0x030A14, 0x22608C, 0x55C8FF, 0xD5F1FF },
            { 0x101010, 0x707070, 0xD6D6D6, 0xFFFFFF },
        };
        static readonly ConsoleColor[,] Fb = {
            { ConsoleColor.Black, ConsoleColor.DarkGreen, ConsoleColor.Green, ConsoleColor.White },
            { ConsoleColor.Black, ConsoleColor.DarkYellow, ConsoleColor.Yellow, ConsoleColor.White },
            { ConsoleColor.Black, ConsoleColor.DarkCyan, ConsoleColor.Cyan, ConsoleColor.White },
            { ConsoleColor.Black, ConsoleColor.DarkGray, ConsoleColor.Gray, ConsoleColor.White },
        };

        public static void Init()
        {
            try { Console.OutputEncoding = new UTF8Encoding(false); } catch { }
            try
            {
                IntPtr h = GetStdHandle(-11);
                uint m;
                if (GetConsoleMode(h, out m)) Vt = SetConsoleMode(h, m | 0x0004);
            }
            catch { Vt = false; }
            try { Console.Title = "MATRICI-OS  //  Terminale didattico sulle matrici"; } catch { }
            try
            {
                int w = 82, hh = 30;
                if (w <= Console.LargestWindowWidth && hh <= Console.LargestWindowHeight)
                {
                    Console.SetWindowSize(Math.Min(w, Console.WindowWidth), Math.Min(hh, Console.WindowHeight));
                    Console.SetBufferSize(w, hh);
                    Console.SetWindowSize(w, hh);
                }
            }
            catch { }
            try { Console.CursorVisible = false; } catch { }
        }

        public static void Restore()
        {
            try
            {
                if (Vt) Console.Write(ESC + "[0m");
                Console.ResetColor();
                Console.Clear();
                Console.CursorVisible = true;
            }
            catch { }
        }

        // ---------------- primitive ----------------
        public static void Out(string s) { if (!Dry) Console.Write(s); }

        static string Rgb(int c) { return ((c >> 16) & 255) + ";" + ((c >> 8) & 255) + ";" + (c & 255); }

        public static void Set(Ink ink, bool inv = false)
        {
            if (Dry) return;
            int fi = (int)ink;
            if (Vt)
            {
                int fg = Pal[Theme, fi], bg = Pal[Theme, 0];
                if (inv) { int t = fg; fg = bg; bg = t; }
                Console.Write(ESC + "[38;2;" + Rgb(fg) + "m" + ESC + "[48;2;" + Rgb(bg) + "m");
            }
            else
            {
                ConsoleColor f = Fb[Theme, fi], b = Fb[Theme, 0];
                if (inv) { ConsoleColor t = f; f = b; b = t; }
                Console.ForegroundColor = f; Console.BackgroundColor = b;
            }
        }

        public static void Clear()
        {
            if (Dry) return;
            Set(Ink.Norm);
            if (Vt) Console.Write(ESC + "[H" + ESC + "[2J" + ESC + "[3J");
            else Console.Clear();
            try { ox = Math.Max(0, (Console.WindowWidth - FW) / 2); } catch { ox = 0; }
        }

        public static void At(int x, int y)
        {
            if (Dry) return;
            if (Vt) Console.Write(ESC + "[" + (y + 1) + ";" + (ox + x + 1) + "H");
            else { try { Console.SetCursorPosition(ox + x, Console.WindowTop + y); } catch { } }
        }

        public static void Put(int x, int y, string s, Ink ink, bool inv = false)
        {
            if (Dry) return;
            At(x, y); Set(ink, inv); Console.Write(s);
        }

        public static void Center(int y, string s, Ink ink, bool inv = false)
        {
            Put(Math.Max(1, (FW - s.Length) / 2), y, s, ink, inv);
        }

        public static string Pad(string s, int w)
        {
            if (s.Length >= w) return s.Substring(0, w);
            return s + new string(' ', w - s.Length);
        }

        public static void ClearRows(int y0, int y1)
        {
            for (int y = y0; y <= y1; y++) Put(1, y, new string(' ', FW - 2), Ink.Norm);
        }

        public static void Flush()
        {
            if (Dry) return;
            try { while (Console.KeyAvailable) Console.ReadKey(true); } catch { }
        }

        public static ConsoleKeyInfo Wait()
        {
            Flush();
            return Console.ReadKey(true);
        }

        public static ConsoleKeyInfo BlinkWait(int y, string text)
        {
            Flush();
            bool on = true; int t = 0;
            while (!Console.KeyAvailable)
            {
                if (t % 10 == 0) { Center(y, text, Ink.Norm, on); on = !on; }
                Thread.Sleep(50); t++;
            }
            ConsoleKeyInfo k = Console.ReadKey(true);
            Center(y, text, Ink.Norm, false);
            return k;
        }

        // ---------------- cornice stile terminale ----------------
        public static void Frame(string title, string status, string footer)
        {
            Clear();
            string h = new string('═', FW - 2), s = new string('─', FW - 2);
            Put(0, 0, "╔" + h + "╗", Ink.Dim);
            for (int y = 1; y < FH - 1; y++) { Put(0, y, "║", Ink.Dim); Put(FW - 1, y, "║", Ink.Dim); }
            Put(0, 2, "╟" + s + "╢", Ink.Dim);
            Put(0, FH - 3, "╟" + s + "╢", Ink.Dim);
            Put(0, FH - 1, "╚" + h + "╝", Ink.Dim);
            if (title != null) Put(3, 0, " " + title + " ", Ink.Bright);
            if (status != null) Put(2, 1, Pad(status, FW - 4), Ink.Norm);
            if (footer != null) Footer(footer);
        }

        public static void Footer(string f) { Put(2, FH - 2, Pad(f, FW - 4), Ink.Dim); }

        // ---------------- testo a macchina da scrivere ----------------
        public static void BeginType() { Flush(); skip = Speed >= 2; }

        public static void Type(int x, int y, string s, Ink ink, bool inv = false)
        {
            if (Dry) return;
            At(x, y); Set(ink, inv);
            if (skip || Speed >= 2) { Console.Write(s); return; }
            int chunk = Speed == 0 ? 1 : 2, d = Speed == 0 ? 22 : 10;
            for (int i = 0; i < s.Length; i += chunk)
            {
                string part = s.Substring(i, Math.Min(chunk, s.Length - i));
                Console.Write(part);
                if (part.Trim().Length > 0) Sfx.Tick();
                if (Console.KeyAvailable)
                {
                    Console.ReadKey(true); skip = true;
                    if (i + chunk < s.Length) Console.Write(s.Substring(i + chunk));
                    return;
                }
                Thread.Sleep(d);
            }
        }

        public static List<string> Wrap(string text, int width)
        {
            var lines = new List<string>();
            foreach (string para in text.Split('\n'))
            {
                string line = "";
                foreach (string w in para.Split(' '))
                {
                    if (w.Length == 0) continue;
                    if (line.Length == 0) line = w;
                    else if (line.Length + 1 + w.Length <= width) line += " " + w;
                    else { lines.Add(line); line = w; }
                }
                lines.Add(line);
            }
            return lines;
        }

        // ---------------- logo a blocchi ----------------
        static readonly Dictionary<char, string[]> G = new Dictionary<char, string[]> {
            { 'M', new[] { "#   #", "## ##", "# # #", "#   #", "#   #" } },
            { 'A', new[] { " ### ", "#   #", "#####", "#   #", "#   #" } },
            { 'T', new[] { "#####", "  #  ", "  #  ", "  #  ", "  #  " } },
            { 'R', new[] { "#### ", "#   #", "#### ", "#  # ", "#   #" } },
            { 'I', new[] { "###", " # ", " # ", " # ", "###" } },
            { 'C', new[] { " ####", "#    ", "#    ", "#    ", " ####" } },
        };

        public static void Logo(int y, string word)
        {
            for (int r = 0; r < 5; r++)
            {
                var sb = new StringBuilder();
                foreach (char ch in word) { sb.Append(G[ch][r].Replace('#', '█')); sb.Append("  "); }
                sb.Length -= 2;
                Center(y + r, sb.ToString(), Ink.Norm);
            }
        }

        // ---------------- matrici ----------------
        static int CellW(MatSpec m)
        {
            int cw = 1;
            foreach (string s in m.Cells) if (s.Length > cw) cw = s.Length;
            return cw;
        }

        static int LeftW(MatSpec m)
        {
            if (m.Idx) return 3;
            return string.IsNullOrEmpty(m.Label) ? 0 : m.Label.Length + 3;
        }

        static int Inner(MatSpec m)
        {
            int cols = m.Cells.GetLength(1);
            return 2 + cols * CellW(m) + (cols - 1) * 2;
        }

        public static int MatW(MatSpec m) { return LeftW(m) + Inner(m) + 2; }
        public static int MatH(MatSpec m) { return m.Cells.GetLength(0) + 2 + (m.Idx ? 1 : 0); }

        public static void DrawMat(int x, int y, MatSpec m)
        {
            int rows = m.Cells.GetLength(0), cols = m.Cells.GetLength(1);
            int cw = CellW(m), L = LeftW(m), inner = Inner(m);
            int y0 = y;
            if (m.Idx)
            {
                if (!string.IsNullOrEmpty(m.Label)) Put(x, y, m.Label, Ink.Bright);
                for (int c = 0; c < cols; c++)
                {
                    string n = (c + 1).ToString();
                    int cx = x + L + 2 + c * (cw + 2) + cw - n.Length;
                    Put(cx, y, n, Ink.Dim);
                }
                y0 = y + 1;
            }
            string sp = new string(' ', inner);
            Put(x + L, y0, "┌" + sp + "┐", Ink.Norm);
            for (int r = 0; r < rows; r++)
            {
                int yy = y0 + 1 + r;
                if (m.Idx) Put(x, yy, (r + 1).ToString().PadLeft(2), Ink.Dim);
                Put(x + L, yy, "│" + sp + "│", Ink.Norm);
                for (int c = 0; c < cols; c++)
                {
                    string v = m.Cells[r, c].PadLeft(cw);
                    int cx = x + L + 2 + c * (cw + 2);
                    int h = m.Hl == null ? 0 : m.Hl(r, c);
                    if (h == 1) Put(cx - 1, yy, " " + v + " ", Ink.Bright, true);
                    else Put(cx, yy, v, h == 2 ? Ink.Bright : (h == 3 ? Ink.Dim : Ink.Norm));
                }
            }
            Put(x + L, y0 + rows + 1, "└" + sp + "┘", Ink.Norm);
            if (!m.Idx && L > 0) Put(x, y0 + 1 + rows / 2, m.Label + " =", Ink.Bright);
        }

        // Disegna in riga (centrate) matrici e operatori; ritorna l'altezza usata
        public static int DrawRow(int y, object[] items)
        {
            int total = 0, maxTop = 0, maxBody = 0;
            foreach (object o in items)
            {
                MatSpec m = o as MatSpec;
                if (m != null)
                {
                    total += MatW(m);
                    if (m.Idx) maxTop = 1;
                    maxBody = Math.Max(maxBody, m.Cells.GetLength(0) + 2);
                }
                else total += o.ToString().Length;
            }
            int x = Math.Max(2, (FW - total) / 2);
            foreach (object o in items)
            {
                MatSpec m = o as MatSpec;
                if (m != null)
                {
                    int body = m.Cells.GetLength(0) + 2;
                    int yy = y + maxTop - (m.Idx ? 1 : 0) + (maxBody - body) / 2;
                    DrawMat(x, yy, m);
                    x += MatW(m);
                }
                else
                {
                    string t = o.ToString();
                    Put(x, y + maxTop + maxBody / 2, t, Ink.Bright);
                    x += t.Length;
                }
            }
            return maxTop + maxBody;
        }

        public static int RowWidth(object[] items)
        {
            int total = 0;
            foreach (object o in items)
            {
                MatSpec m = o as MatSpec;
                total += m != null ? MatW(m) : o.ToString().Length;
            }
            return total;
        }

        // ---------------- menù ----------------
        public static void DrawItem(int x, int y, string text, bool on, int width)
        {
            if (on) Put(x, y, Pad("► " + text, width), Ink.Bright, true);
            else Put(x, y, Pad("  " + text, width), Ink.Norm);
        }

        public static int Menu(int x, int y, string[] items, string[] desc, char[] hot, int sel, int width, int descY)
        {
            Flush();
            if (sel < 0 || sel >= items.Length) sel = 0;
            int last = -1;
            while (true)
            {
                if (last != sel)
                {
                    for (int i = 0; i < items.Length; i++) DrawItem(x, y + i, items[i], i == sel, width);
                    if (desc != null) { ClearRows(descY, descY); Center(descY, desc[sel], Ink.Dim); }
                    last = sel;
                }
                ConsoleKeyInfo k = Console.ReadKey(true);
                switch (k.Key)
                {
                    case ConsoleKey.UpArrow: case ConsoleKey.W:
                        sel = (sel + items.Length - 1) % items.Length; Sfx.Play("move"); continue;
                    case ConsoleKey.DownArrow: case ConsoleKey.S:
                        sel = (sel + 1) % items.Length; Sfx.Play("move"); continue;
                    case ConsoleKey.Enter: case ConsoleKey.Spacebar: case ConsoleKey.RightArrow:
                        Sfx.Play("select"); return sel;
                    case ConsoleKey.Escape: case ConsoleKey.Backspace: case ConsoleKey.LeftArrow:
                        Sfx.Play("key"); return -1;
                }
                if (hot != null)
                {
                    char c = char.ToUpperInvariant(k.KeyChar);
                    for (int i = 0; i < hot.Length; i++)
                    {
                        if (hot[i] != ' ' && c == hot[i])
                        {
                            sel = i;
                            for (int j = 0; j < items.Length; j++) DrawItem(x, y + j, items[j], j == sel, width);
                            Sfx.Play("select");
                            return i;
                        }
                    }
                }
            }
        }

        // ---------------- risposte a scelta multipla ----------------
        // stato: 0 normale, 1 selezionata, 2 giusta, 3 scartata/sbagliata
        static void DrawOpt(int x, int y, int i, string text, int state, int width)
        {
            string t = "[" + (char)('A' + i) + "] " + text;
            switch (state)
            {
                case 1: Put(x, y, Pad("► " + t, width), Ink.Bright, true); break;
                case 2: Put(x, y, Pad("► " + t + "     ◄ GIUSTA", width), Ink.Bright, true); break;
                case 3: Put(x, y, Pad("  " + t + "     ◄ NO", width), Ink.Dim); break;
                default: Put(x, y, Pad("  " + t, width), Ink.Norm); break;
            }
        }

        // ritorna indice scelto, -1 = ESC, -2 = aiuto
        public static int Choose(int x, int y, string[] opts, bool[] off, int width)
        {
            Flush();
            int n = opts.Length, sel = 0;
            while (sel < n - 1 && off[sel]) sel++;
            bool vf = n == 2 && opts[0] == "VERO";
            while (true)
            {
                for (int i = 0; i < n; i++) DrawOpt(x, y + i, i, opts[i], off[i] ? 3 : (i == sel ? 1 : 0), width);
                ConsoleKeyInfo k = Console.ReadKey(true);
                int pick = -1;
                switch (k.Key)
                {
                    case ConsoleKey.UpArrow: case ConsoleKey.W:
                        do { sel = (sel + n - 1) % n; } while (off[sel]);
                        Sfx.Play("move"); continue;
                    case ConsoleKey.DownArrow: case ConsoleKey.S:
                        do { sel = (sel + 1) % n; } while (off[sel]);
                        Sfx.Play("move"); continue;
                    case ConsoleKey.Enter: case ConsoleKey.Spacebar: pick = sel; break;
                    case ConsoleKey.Escape: return -1;
                    case ConsoleKey.H: return -2;
                }
                if (pick < 0)
                {
                    char c = char.ToUpperInvariant(k.KeyChar);
                    if (vf && c == 'V') pick = 0;
                    else if (vf && c == 'F') pick = 1;
                    else if (c >= 'A' && c < 'A' + n) pick = c - 'A';
                    else if (c >= '1' && c < '1' + n) pick = c - '1';
                }
                if (pick < 0) continue;
                if (off[pick]) { Sfx.Play("deny"); continue; }
                sel = pick;
                for (int i = 0; i < n; i++) DrawOpt(x, y + i, i, opts[i], off[i] ? 3 : (i == sel ? 1 : 0), width);
                return pick;
            }
        }

        public static void MarkChoice(int x, int y, string[] opts, int correct, bool[] off, int width)
        {
            for (int i = 0; i < opts.Length; i++)
                DrawOpt(x, y + i, i, opts[i], i == correct ? 2 : (off[i] ? 3 : 0), width);
        }

        // ---------------- input testo ----------------
        // ritorna il testo, null = ESC, HINT = aiuto
        public static string Input(int x, int y, int max, bool letters)
        {
            Flush();
            string s = "";
            try { Console.CursorVisible = false; } catch { }
            while (true)
            {
                Put(x, y, "> " + s, Ink.Bright);
                Set(Ink.Bright, true); Out(" ");
                Set(Ink.Norm); Out(new string(' ', Math.Max(1, max - s.Length + 1)));
                ConsoleKeyInfo k = Console.ReadKey(true);
                if (k.Key == ConsoleKey.Escape) return null;
                if (k.Key == ConsoleKey.Enter)
                {
                    if (s.Trim().Length > 0 || letters)
                    {
                        Put(x, y, "> " + s + new string(' ', max - s.Length + 2), Ink.Bright);
                        return s.Trim();
                    }
                    Sfx.Play("deny"); continue;
                }
                if (k.Key == ConsoleKey.Backspace)
                {
                    if (s.Length > 0) { s = s.Substring(0, s.Length - 1); Sfx.Play("key"); }
                    continue;
                }
                char c = k.KeyChar;
                if (!letters && (c == 'h' || c == 'H' || c == '?')) return HINT;
                bool ok = letters
                    ? (char.IsLetterOrDigit(c) || c == ' ' || c == '.' || c == '-' || c == '_')
                    : (char.IsDigit(c) || "-+ xX*,;×".IndexOf(c) >= 0);
                if (ok && s.Length < max) { s += c; Sfx.Play("key"); }
                else if (c != '\0') Sfx.Play("deny");
            }
        }
    }
}
