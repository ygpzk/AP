// Diretta OS: il terminale dell'installer e del gestore (colori, domande, tabelle).
using System;
using System.Text;

namespace DirettaOS
{
    static class Term
    {
        public static bool Color = true;
        public static bool Silent = false;

        public static void Init()
        {
            try { Console.OutputEncoding = Encoding.UTF8; } catch { }
            try { Console.Title = "Diretta OS"; } catch { }
            Color = !Console.IsOutputRedirected && Environment.GetEnvironmentVariable("NO_COLOR") == null;
        }

        static void C(ConsoleColor c) { if (Color) Console.ForegroundColor = c; }
        static void R() { if (Color) Console.ResetColor(); }

        public static void Head(string s)
        {
            Console.WriteLine();
            C(ConsoleColor.DarkGray); Console.Write("  "); R();
            C(ConsoleColor.Green); Console.WriteLine(s); R();
        }

        public static void Step(string s)
        {
            C(ConsoleColor.DarkGray); Console.Write("  > "); R();
            Console.WriteLine(s);
        }

        public static void Ok(string s)
        {
            C(ConsoleColor.Green); Console.Write("  OK  "); R();
            Console.WriteLine(s);
        }

        public static void Warn(string s)
        {
            C(ConsoleColor.Yellow); Console.Write("  !!  "); R();
            Console.WriteLine(s);
        }

        public static void Err(string s)
        {
            C(ConsoleColor.Red); Console.Write("  XX  "); R();
            Console.WriteLine(s);
        }

        public static void Note(string s)
        {
            C(ConsoleColor.DarkGray); Console.WriteLine("      " + s); R();
        }

        public static void Dim(string s)
        {
            C(ConsoleColor.DarkGray); Console.WriteLine("  " + s); R();
        }

        public static void Plain(string s) { Console.WriteLine("  " + s); }

        public static void Banner(string versione, bool setup)
        {
            Console.WriteLine();
            if (Color) Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("   ____  _                _        _    ____  _____");
            Console.WriteLine("  |  _ \\(_)_ __ ___  ___| |_ __ _/ _ \\ / ___||  _ \\");
            Console.WriteLine("  | | | | | '__/ _ \\/ _ \\ __/ _` | | | |\\___ \\| |_) |");
            Console.WriteLine("  | |_| | | | |  __/  __/ || (_| | |_| | ___) |  _ <");
            Console.WriteLine("  |____/|_|_|  \\___|\\___|\\__\\__,_|\\___/ |____/|_| \\_\\");
            if (Color) Console.ForegroundColor = ConsoleColor.Magenta;
            Console.WriteLine("  la regia delle sovrimpressioni  ·  v" + versione);
            R();
            C(ConsoleColor.DarkGray);
            Console.WriteLine("  " + (setup ? "installer" : "gestore") + "  ·  Windows 10/11  ·  tutto sul tuo PC, niente cloud");
            R();
            Console.WriteLine();
        }

        public static string Ask(string domanda, string difetto)
        {
            if (Silent) return difetto;
            C(ConsoleColor.White);
            Console.Write("  " + domanda);
            if (!String.IsNullOrEmpty(difetto)) { C(ConsoleColor.DarkGray); Console.Write(" [" + difetto + "]"); R(); }
            C(ConsoleColor.White); Console.Write(": "); R();
            string s = Console.ReadLine();
            if (s == null || s.Trim().Length == 0) return difetto;
            return s.Trim();
        }

        public static bool AskYes(string domanda, bool difetto)
        {
            if (Silent) return difetto;
            string s = Ask(domanda + (difetto ? " (S/n)" : " (s/N)"), "");
            if (s.Length == 0) return difetto;
            s = s.ToLowerInvariant();
            return s == "s" || s == "si" || s == "sì" || s == "y" || s == "yes" || s == "true" || s == "1";
        }

        public static bool AskWord(string domanda, string parola)
        {
            if (Silent) return true;
            C(ConsoleColor.Yellow);
            Console.Write("  " + domanda + " (scrivi " + parola + "): ");
            R();
            string s = Console.ReadLine();
            return s != null && s.Trim().ToUpperInvariant() == parola.ToUpperInvariant();
        }

        public static void Pause()
        {
            if (Silent) return;
            Console.WriteLine();
            C(ConsoleColor.DarkGray);
            Console.Write("  premi Invio per continuare…");
            R();
            Console.ReadLine();
        }

        public static void Line()
        {
            C(ConsoleColor.DarkGray);
            Console.WriteLine("  " + new string('-', 66));
            R();
        }

        public static void KeyValue(string k, string v)
        {
            C(ConsoleColor.DarkGray);
            Console.Write("  " + k.PadRight(19));
            R();
            Console.WriteLine(v);
        }

        public static void Colored(string s, ConsoleColor c)
        {
            C(c); Console.Write(s); R();
        }
    }
}
