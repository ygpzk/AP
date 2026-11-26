using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

// PULIZIA-OS: il programma di pulizia dentro lo stesso terminale di MatriciOS (Term.cs e Sfx.cs sono i suoi, uguali).
// Guarda la cartella di un progetto e riferisce (cartelle rigenerabili, moduli che nessuno importa, file di public/ mai
// nominati, doppioni); se glielo chiedi mette tutto da parte in una quarantena dentro il progetto, e la rimette a posto.
// Non cancella mai niente e non esce mai dalla cartella scelta. Un solo .exe, niente da installare.
namespace MatriciOS
{
    class Voce { public string Rel; public long Peso; public bool Cartella; public string Nota; }

    class Esito
    {
        public List<Voce> Rigenerabili = new List<Voce>(), Orfani = new List<Voce>(), Asset = new List<Voce>(), Doppioni = new List<Voce>();
        public int Sorgenti, Raggiunti, File;
        public bool SenzaEntrata;
        public long Recuperabili { get { long t = 0; foreach (Voce v in Rigenerabili) t += v.Peso; foreach (Voce v in Orfani) t += v.Peso; foreach (Voce v in Asset) t += v.Peso; return t; } }
        public int Quanti { get { return Rigenerabili.Count + Orfani.Count + Asset.Count; } }
    }

    static class Motore
    {
        public const string DIR = ".pulizia";
        static readonly string[] SALTA = { "node_modules", ".git", DIR, ".vercel", ".vs", ".idea" };
        static readonly string[] RIGENERABILI = { "dist", "build", ".next", "coverage", ".cache", ".parcel-cache", "node_modules/.vite", "node_modules/.cache" };
        static readonly string[] EST_SORGENTI = { ".js", ".jsx", ".ts", ".tsx", ".mjs" };
        static readonly string[] EST_TESTO = { ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".html", ".htm", ".css", ".scss", ".json", ".svg", ".md", ".webmanifest", ".xml", ".txt", ".vue", ".astro" };
        static readonly string[] SEMPRE = { "index.html", "robots.txt", "sitemap.xml", "favicon.ico", "favicon.png", "favicon.svg", "apple-touch-icon.png", "manifest.webmanifest", "site.webmanifest", "404.html", "cname", "_headers", "_redirects" };

        public static string Peso(long b) { return b >= 1048576 ? (b / 1048576.0).ToString("0.0") + " MB" : (b / 1024.0).ToString("0") + " kB"; }
        static string Rel(string root, string p) { return p.Substring(root.Length).TrimStart('\\', '/').Replace('\\', '/'); }
        static bool In(string[] a, string s) { foreach (string x in a) if (string.Equals(x, s, StringComparison.OrdinalIgnoreCase)) return true; return false; }

        public static long PesoCartella(string dir)
        {
            long t = 0;
            try { foreach (string f in Directory.GetFiles(dir, "*", SearchOption.AllDirectories)) try { t += new FileInfo(f).Length; } catch { } } catch { }
            return t;
        }

        /** Tutti i file del progetto (percorsi relativi con la barra), senza dipendenze, git, quarantena e cartelle rigenerabili. */
        public static List<string> Elenca(string root)
        {
            var l = new List<string>();
            var pila = new Stack<string>(); pila.Push(root);
            while (pila.Count > 0)
            {
                string d = pila.Pop();
                try
                {
                    foreach (string f in Directory.GetFiles(d)) l.Add(Rel(root, f));
                    foreach (string s in Directory.GetDirectories(d))
                    {
                        string nome = Path.GetFileName(s), rel = Rel(root, s);
                        if (In(SALTA, nome) || In(RIGENERABILI, rel) || (nome.StartsWith(".") && nome != ".well-known")) continue;
                        if ((File.GetAttributes(s) & FileAttributes.ReparsePoint) != 0) continue;   // niente collegamenti: non si esce dalla cartella
                        pila.Push(s);
                    }
                }
                catch { }
            }
            l.Sort(StringComparer.OrdinalIgnoreCase);
            return l;
        }

        static string Leggi(string root, string rel) { try { var fi = new FileInfo(Path.Combine(root, rel)); return fi.Length > 4 * 1048576 ? "" : File.ReadAllText(fi.FullName, Encoding.UTF8); } catch { return ""; } }

        static readonly Regex IMPORT = new Regex(@"(?:import|export)\s[^'"";]*?from\s*['""]([^'""]+)['""]|import\s*['""]([^'""]+)['""]|import\(\s*['""]([^'""]+)['""]\s*\)|require\(\s*['""]([^'""]+)['""]\s*\)", RegexOptions.Compiled);
        static readonly Regex SCRIPT = new Regex(@"<script[^>]*\ssrc\s*=\s*['""]([^'""]+)['""]", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        static string Risolvi(HashSet<string> file, string da, string spec)
        {
            string b;
            if (spec.StartsWith("/")) b = spec.TrimStart('/');
            else if (spec.StartsWith(".")) { string dir = da.Contains("/") ? da.Substring(0, da.LastIndexOf('/')) : ""; b = Normalizza(dir + "/" + spec); }
            else if (spec.StartsWith("@/")) b = "src/" + spec.Substring(2);
            else return null;   // un pacchetto: non è un file del progetto
            b = b.Split('?')[0].Split('#')[0];
            if (file.Contains(b)) return b;
            foreach (string e in EST_SORGENTI) if (file.Contains(b + e)) return b + e;
            foreach (string e in EST_SORGENTI) if (file.Contains(b + "/index" + e)) return b + "/index" + e;
            // «./cosa.js» scritto per un file .ts (TypeScript lo permette)
            if (b.EndsWith(".js")) foreach (string e in new[] { ".ts", ".tsx" }) if (file.Contains(b.Substring(0, b.Length - 3) + e)) return b.Substring(0, b.Length - 3) + e;
            return null;
        }
        static string Normalizza(string p)
        {
            var parti = new List<string>();
            foreach (string s in p.Split('/')) { if (s == "" || s == ".") continue; if (s == "..") { if (parti.Count > 0) parti.RemoveAt(parti.Count - 1); } else parti.Add(s); }
            return string.Join("/", parti.ToArray());
        }

        public static Esito Analizza(string root, string[] protetti)
        {
            var e = new Esito();
            List<string> tutti = Elenca(root);
            e.File = tutti.Count;
            var insieme = new HashSet<string>(tutti, StringComparer.OrdinalIgnoreCase);
            Func<string, bool> protetto = delegate (string rel) { foreach (string p in protetti) if (p.Length > 0 && rel.StartsWith(p.Trim('/') + "/", StringComparison.OrdinalIgnoreCase)) return true; return false; };

            // 1. le cartelle che si rifanno da sole
            foreach (string r in RIGENERABILI)
            {
                string d = Path.Combine(root, r.Replace('/', Path.DirectorySeparatorChar));
                if (Directory.Exists(d)) e.Rigenerabili.Add(new Voce { Rel = r, Cartella = true, Peso = PesoCartella(d), Nota = "si rifà con la build" });
            }

            // 2. i moduli di src/ che nessuno importa, partendo dalle entrate (gli script di index.html, src/main.*, src/index.*)
            var sorgenti = new List<string>();
            foreach (string f in tutti) if (f.StartsWith("src/", StringComparison.OrdinalIgnoreCase) && In(EST_SORGENTI, Path.GetExtension(f)) && !f.EndsWith(".d.ts")) sorgenti.Add(f);
            e.Sorgenti = sorgenti.Count;
            var coda = new Queue<string>();
            var visti = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            Action<string> entra = delegate (string f) { if (f != null && visti.Add(f)) coda.Enqueue(f); };
            foreach (string f in tutti)
                if (f.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
                    foreach (Match m in SCRIPT.Matches(Leggi(root, f))) entra(Risolvi(insieme, f, m.Groups[1].Value.StartsWith("/") || m.Groups[1].Value.StartsWith(".") ? m.Groups[1].Value : "./" + m.Groups[1].Value));
            foreach (string n in new[] { "src/main", "src/index" }) foreach (string x in EST_SORGENTI) if (insieme.Contains(n + x)) entra(n + x);
            e.SenzaEntrata = coda.Count == 0;
            while (coda.Count > 0)
            {
                string f = coda.Dequeue();
                if (!In(EST_SORGENTI, Path.GetExtension(f))) continue;
                foreach (Match m in IMPORT.Matches(Leggi(root, f)))
                    for (int g = 1; g <= 4; g++) if (m.Groups[g].Success) entra(Risolvi(insieme, f, m.Groups[g].Value));
            }
            if (!e.SenzaEntrata)
                foreach (string f in sorgenti)
                {
                    if (visti.Contains(f)) { e.Raggiunti++; continue; }
                    if (protetto(f) || Regex.IsMatch(f, @"\.(test|spec|config|stories)\.[a-z]+$|/__tests__/")) continue;
                    e.Orfani.Add(new Voce { Rel = f, Peso = new FileInfo(Path.Combine(root, f)).Length, Nota = "nessuno lo importa" });
                }

            // 3. i file di public/ che nessun testo del progetto nomina
            var testo = new StringBuilder();
            foreach (string f in tutti) if (In(EST_TESTO, Path.GetExtension(f))) testo.Append(Leggi(root, f)).Append('\n');
            string tutto = testo.ToString();
            foreach (string f in tutti)
            {
                if (!f.StartsWith("public/", StringComparison.OrdinalIgnoreCase) || protetto(f)) continue;
                string nome = Path.GetFileName(f);
                if (In(SEMPRE, nome) || f.Contains("/.well-known/") || nome.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) continue;
                // il nome intero, oppure senza estensione dentro un indirizzo (i nomi costruiti: `${nome}.webp`)
                if (tutto.IndexOf(nome, StringComparison.OrdinalIgnoreCase) >= 0) continue;
                e.Asset.Add(new Voce { Rel = f, Peso = new FileInfo(Path.Combine(root, f)).Length, Nota = "nessun file lo nomina" });
            }

            // 4. i doppioni (stesso contenuto): si dicono e basta, non si spostano
            var perPeso = new Dictionary<long, List<string>>();
            foreach (string f in tutti)
            {
                long p; try { p = new FileInfo(Path.Combine(root, f)).Length; } catch { continue; }
                if (p < 1024) continue;
                if (!perPeso.ContainsKey(p)) perPeso[p] = new List<string>();
                perPeso[p].Add(f);
            }
            using (SHA1 sha = SHA1.Create())
                foreach (var kv in perPeso)
                {
                    if (kv.Value.Count < 2) continue;
                    var perImpronta = new Dictionary<string, string>();
                    foreach (string f in kv.Value)
                    {
                        string h; try { h = Convert.ToBase64String(sha.ComputeHash(File.ReadAllBytes(Path.Combine(root, f)))); } catch { continue; }
                        if (perImpronta.ContainsKey(h)) e.Doppioni.Add(new Voce { Rel = f, Peso = kv.Key, Nota = "= " + perImpronta[h] });
                        else perImpronta[h] = f;
                    }
                }
            return e;
        }

        // ---------------- la quarantena ----------------
        public static string Quarantene(string root) { return Path.Combine(Path.Combine(root, DIR), "quarantena"); }

        /** Mette da parte tutto quello che l'analisi ha trovato (non i doppioni). Ritorna la cartella della quarantena. */
        public static string MettiDaParte(string root, Esito e)
        {
            string q = Path.Combine(Quarantene(root), DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss"));
            Directory.CreateDirectory(q);
            var elenco = new List<string>();
            var voci = new List<Voce>(); voci.AddRange(e.Rigenerabili); voci.AddRange(e.Orfani); voci.AddRange(e.Asset);
            foreach (Voce v in voci)
            {
                string da = Path.Combine(root, v.Rel.Replace('/', Path.DirectorySeparatorChar)), a = Path.Combine(q, v.Rel.Replace('/', Path.DirectorySeparatorChar));
                if (!Path.GetFullPath(da).StartsWith(Path.GetFullPath(root).TrimEnd('\\') + "\\", StringComparison.OrdinalIgnoreCase)) continue;   // mai fuori dal progetto
                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(a));
                    if (v.Cartella) Directory.Move(da, a); else File.Move(da, a);
                    elenco.Add((v.Cartella ? "D|" : "F|") + v.Rel + "|" + v.Peso);
                }
                catch { }
            }
            File.WriteAllLines(Path.Combine(q, "elenco.txt"), elenco.ToArray(), new UTF8Encoding(false));
            // la quarantena non va nel repository
            try
            {
                string gi = Path.Combine(root, ".gitignore");
                if (File.Exists(gi) && File.ReadAllText(gi).IndexOf(DIR + "/", StringComparison.Ordinal) < 0)
                    File.AppendAllText(gi, "\n# La quarantena del programma di pulizia\n" + DIR + "/\n");
            }
            catch { }
            return q;
        }

        public static string[] Elenco(string root)
        {
            try { string q = Quarantene(root); if (!Directory.Exists(q)) return new string[0]; string[] d = Directory.GetDirectories(q); Array.Sort(d); Array.Reverse(d); return d; }
            catch { return new string[0]; }
        }

        /** Rimette a posto una quarantena: ritorna quanti pezzi sono tornati (e quanti no, perché al loro posto c'è già altro). */
        public static int Ripristina(string root, string q, out int saltati)
        {
            int tornati = 0; saltati = 0;
            string el = Path.Combine(q, "elenco.txt");
            if (!File.Exists(el)) return 0;
            var restano = new List<string>();
            foreach (string riga in File.ReadAllLines(el, Encoding.UTF8))
            {
                string[] p = riga.Split('|');
                if (p.Length < 2) continue;
                string da = Path.Combine(q, p[1].Replace('/', Path.DirectorySeparatorChar)), a = Path.Combine(root, p[1].Replace('/', Path.DirectorySeparatorChar));
                try
                {
                    if (File.Exists(a) || Directory.Exists(a)) { saltati++; restano.Add(riga); continue; }
                    Directory.CreateDirectory(Path.GetDirectoryName(a));
                    if (p[0] == "D") Directory.Move(da, a); else File.Move(da, a);
                    tornati++;
                }
                catch { saltati++; restano.Add(riga); }
            }
            try { if (restano.Count == 0) Directory.Delete(q, true); else File.WriteAllLines(el, restano.ToArray(), new UTF8Encoding(false)); } catch { }
            return tornati;
        }

        // ---------------- le prove di sicurezza: un progettino finto in una cartella temporanea ----------------
        public static List<KeyValuePair<string, bool>> Prove()
        {
            var r = new List<KeyValuePair<string, bool>>();
            Action<string, bool> prova = delegate (string n, bool v) { r.Add(new KeyValuePair<string, bool>(n, v)); };
            string t = Path.Combine(Path.GetTempPath(), "PuliziaOS_prova_" + Guid.NewGuid().ToString("N").Substring(0, 8));
            try
            {
                Action<string, string> scrivi = delegate (string rel, string c) { string p = Path.Combine(t, rel.Replace('/', '\\')); Directory.CreateDirectory(Path.GetDirectoryName(p)); File.WriteAllText(p, c); };
                scrivi("index.html", "<!doctype html><script type=\"module\" src=\"/src/main.js\"></script>");
                scrivi("src/main.js", "import { a } from './usato.js'\nimport('./pigro')\nconst logo = '/logo.svg'\n");
                scrivi("src/usato.js", "export const a = 1\n");
                scrivi("src/pigro/index.js", "export default 2\n");
                scrivi("src/orfano.js", "export const vecchio = true\n");
                scrivi("public/logo.svg", "<svg xmlns='http://www.w3.org/2000/svg'/>");
                scrivi("public/vecchio.png", new string('x', 3000));
                scrivi("public/emoji/faccina.png", new string('e', 2000));
                scrivi("public/sfondo.bin", new string('s', 5000));
                scrivi("public/sfondo-copia.bin", new string('s', 5000));
                scrivi("dist/index.html", "ok");
                scrivi(".gitignore", "node_modules/\n");
                Esito e = Analizza(t, new[] { "public/emoji" });
                Func<List<Voce>, string, bool> ha = delegate (List<Voce> l, string rel) { foreach (Voce v in l) if (v.Rel == rel) return true; return false; };
                prova("riconosce un modulo che nessuno importa", ha(e.Orfani, "src/orfano.js"));
                prova("lascia stare un modulo che qualcuno importa", !ha(e.Orfani, "src/usato.js") && !ha(e.Orfani, "src/pigro/index.js") && !ha(e.Orfani, "src/main.js"));
                prova("trova un file di public/ che nessuno nomina", ha(e.Asset, "public/vecchio.png"));
                prova("lascia stare un file che il codice nomina", !ha(e.Asset, "public/logo.svg"));
                prova("protegge le cartelle protette (public/emoji)", !ha(e.Asset, "public/emoji/faccina.png"));
                prova("vede i doppioni e non li sposta", e.Doppioni.Count == 1 && e.Doppioni[0].Nota.StartsWith("= public/sfondo"));
                prova("vede la cartella che si rifà con la build", ha(e.Rigenerabili, "dist"));
                byte[] prima = File.ReadAllBytes(Path.Combine(t, "src\\orfano.js"));
                string q = MettiDaParte(t, e);
                bool via = !File.Exists(Path.Combine(t, "src\\orfano.js")) && !File.Exists(Path.Combine(t, "public\\vecchio.png")) && !Directory.Exists(Path.Combine(t, "dist")) && File.Exists(Path.Combine(t, "src\\usato.js"));
                prova("mette da parte dentro il progetto, senza cancellare", via && q.StartsWith(t, StringComparison.OrdinalIgnoreCase) && File.Exists(Path.Combine(q, "src\\orfano.js")));
                prova("tiene la quarantena fuori dal repository (.gitignore)", File.ReadAllText(Path.Combine(t, ".gitignore")).Contains(DIR + "/"));
                int saltati; int tornati = Ripristina(t, q, out saltati);
                byte[] dopo = File.Exists(Path.Combine(t, "src\\orfano.js")) ? File.ReadAllBytes(Path.Combine(t, "src\\orfano.js")) : new byte[0];
                bool uguale = prima.Length == dopo.Length; for (int i = 0; uguale && i < prima.Length; i++) if (prima[i] != dopo[i]) uguale = false;
                prova("rimette a posto, byte per byte", tornati == e.Quanti && saltati == 0 && uguale && Directory.Exists(Path.Combine(t, "dist")) && !Directory.Exists(q));
            }
            catch (Exception ex) { prova("le prove si sono rotte: " + ex.Message, false); }
            finally { try { if (Directory.Exists(t)) Directory.Delete(t, true); } catch { } }
            return r;
        }
    }

    static class Dati
    {
        public static bool Sound = true;
        public static int Speed = 1, Theme = 0;
        public static string Radice, Cartella = "";
        public static List<string> Protetti = new List<string>();
        static string FileDati { get { return Path.Combine(Radice, "PuliziaOS_dati.txt"); } }
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
                        else if (k == "cartella") Cartella = v;
                        else if (k == "protetta" && v.Length > 0) Protetti.Add(v.Replace('\\', '/').Trim('/'));
                    }
            }
            catch { }
            if (Cartella.Length == 0 || !Directory.Exists(Cartella)) Cartella = radice.TrimEnd('\\');
            Apply();
        }
        public static void Save()
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("# PULIZIA-OS: opzioni (si puo' modificare a mano; una riga «protetta=public/cartella» per ogni cartella da non toccare)");
                sb.AppendLine("suono=" + (Sound ? "1" : "0")); sb.AppendLine("velocita=" + Speed); sb.AppendLine("colore=" + Theme); sb.AppendLine("cartella=" + Cartella);
                foreach (string p in Protetti) sb.AppendLine("protetta=" + p);
                File.WriteAllText(FileDati, sb.ToString(), new UTF8Encoding(false));
            }
            catch { }
        }
    }

    static class Program
    {
        const string VERS = "PULIZIA-OS v1.0";
        static readonly Dictionary<char, string[]> Glifi = new Dictionary<char, string[]> {
            { 'P', new[] { "#### ", "#   #", "#### ", "#    ", "#    " } }, { 'U', new[] { "#   #", "#   #", "#   #", "#   #", " ### " } },
            { 'L', new[] { "#    ", "#    ", "#    ", "#    ", "#####" } }, { 'I', new[] { "###", " # ", " # ", " # ", "###" } },
            { 'Z', new[] { "#####", "   # ", "  #  ", " #   ", "#####" } }, { 'A', new[] { " ### ", "#   #", "#####", "#   #", "#   #" } },
        };
        static void Logo(int y, string parola)
        {
            var righe = new string[5];
            for (int r = 0; r < 5; r++) { var sb = new StringBuilder(); foreach (char c in parola) { foreach (char px in Glifi[c][r]) sb.Append(px == '#' ? "██" : "  "); sb.Append("  "); } righe[r] = sb.ToString().TrimEnd(); }
            int w = 0; foreach (string s in righe) w = Math.Max(w, s.Length);
            for (int r = 0; r < 5; r++) Term.Put(Math.Max(2, (Term.FW - w) / 2), y + r, righe[r], Ink.Bright);
        }
        static string Corto(string s, int n) { return s.Length <= n ? s : "…" + s.Substring(s.Length - n + 1); }
        static string Stato() { return "CARTELLA: " + Corto(Dati.Cartella, 44) + "    QUARANTENE: " + Motore.Elenco(Dati.Cartella).Length; }

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
                if (k.Key == ConsoleKey.Enter) return s.Trim();
                if (k.Key == ConsoleKey.Backspace) { if (s.Length > 0) { s = s.Substring(0, s.Length - 1); Sfx.Play("key"); } continue; }
                if (!char.IsControl(k.KeyChar) && s.Length < 240) { s += k.KeyChar; Sfx.Play("key"); }
            }
        }

        // un elenco lungo, a pagine
        static void Sfoglia(string titolo, List<KeyValuePair<string, Ink>> righe, string piede)
        {
            int da = 0, alte = Term.BOTTOM - Term.TOP;
            while (true)
            {
                Term.Frame(titolo, Stato(), piede + (righe.Count > alte ? "   [↑↓] scorri" : ""));
                for (int i = 0; i < alte && da + i < righe.Count; i++) Term.Put(3, Term.TOP + i, Term.Pad(righe[da + i].Key.Length > 74 ? righe[da + i].Key.Substring(0, 74) : righe[da + i].Key, 74), righe[da + i].Value);
                ConsoleKey k = Term.Wait().Key;
                if (k == ConsoleKey.DownArrow || k == ConsoleKey.PageDown) da = Math.Min(Math.Max(0, righe.Count - alte), da + (k == ConsoleKey.PageDown ? alte : 3));
                else if (k == ConsoleKey.UpArrow || k == ConsoleKey.PageUp) da = Math.Max(0, da - (k == ConsoleKey.PageUp ? alte : 3));
                else return;
            }
        }

        static List<KeyValuePair<string, Ink>> Rapporto(Esito e)
        {
            var l = new List<KeyValuePair<string, Ink>>();
            Action<string, Ink> r = delegate (string s, Ink i) { l.Add(new KeyValuePair<string, Ink>(s, i)); };
            Action<string, List<Voce>, string> sez = delegate (string nome, List<Voce> voci, string vuoto)
            {
                long t = 0; foreach (Voce v in voci) t += v.Peso;
                r("· " + nome + ": " + (voci.Count == 0 ? vuoto : voci.Count + " (" + Motore.Peso(t) + ")"), voci.Count == 0 ? Ink.Dim : Ink.Bright);
                foreach (Voce v in voci) r("    " + Term.Pad(Corto(v.Rel, 38), 39) + Term.Pad(Motore.Peso(v.Peso), 8) + Corto(v.Nota, 23), Ink.Norm);
            };
            r("SPORCO TROVATO   (" + e.File + " file guardati, " + e.Raggiunti + " moduli su " + e.Sorgenti + " raggiunti dalle entrate)", Ink.Bright);
            r("", Ink.Dim);
            sez("Rigenerabili", e.Rigenerabili, "niente");
            if (e.SenzaEntrata) r("· Moduli orfani in src/: non cerco (nessuna entrata: index.html, src/main.*, src/index.*)", Ink.Dim);
            else sez("Moduli orfani in src/", e.Orfani, "niente");
            sez("File mai nominati in public/", e.Asset, "niente");
            sez("File doppi (solo detti, non si spostano)", e.Doppioni, "niente");
            r("", Ink.Dim);
            r(e.Quanti == 0 ? "È già pulito: niente da mettere da parte." : "Recuperabili " + Motore.Peso(e.Recuperabili) + " in " + e.Quanti + " pezzi. Per procedere: PULISCI dal menù.", Ink.Bright);
            return l;
        }

        static Esito Guarda()
        {
            Term.Frame("ANALISI", Stato(), "guardo e basta: non tocco niente");
            Term.Center(12, "STO GUARDANDO LA CARTELLA…", Ink.Bright);
            Term.Flush();
            return Motore.Analizza(Dati.Cartella, Dati.Protetti.ToArray());
        }

        static void Pulisci()
        {
            Esito e = Guarda();
            if (e.Quanti == 0) { Sfoglia("PULISCI", Rapporto(e), "[un tasto] indietro"); return; }
            Sfoglia("PULISCI  //  QUESTO È QUELLO CHE METTEREI DA PARTE", Rapporto(e), "[un tasto] avanti");
            Term.Frame("PULISCI  //  CONFERMA", Stato(), "[INVIO] conferma   [ESC] annulla");
            Term.Put(4, 6, "Sposto " + e.Quanti + " pezzi (" + Motore.Peso(e.Recuperabili) + ") in " + Motore.DIR + "\\quarantena\\ dentro il progetto.", Ink.Norm);
            Term.Put(4, 7, "Non cancello niente: RIPRISTINA rimette tutto dov'era.", Ink.Norm);
            Term.Put(4, 10, "Per confermare scrivi PULISCI:", Ink.Bright);
            string s = Chiedi(4, 12, 20, null);
            if (s == null || s.ToUpperInvariant() != "PULISCI") { Sfx.Play("deny"); return; }
            string q = Motore.MettiDaParte(Dati.Cartella, e);
            Sfx.Play("select");
            Term.Frame("PULITO", Stato(), "[un tasto] torna al menù");
            Term.Put(4, 6, "FATTO", Ink.Bright, true);
            Term.Put(11, 6, e.Quanti + " pezzi messi da parte (" + Motore.Peso(e.Recuperabili) + ")", Ink.Bright);
            Term.Put(4, 8, "Quarantena: " + Corto(q, 60), Ink.Norm);
            Term.Put(4, 10, "Adesso prova il progetto (la build, le pagine). Se manca qualcosa: RIPRISTINA.", Ink.Norm);
            Term.Wait();
        }

        static void Quarantene(bool ripristina)
        {
            string[] q = Motore.Elenco(Dati.Cartella);
            Term.Frame(ripristina ? "RIPRISTINA" : "QUARANTENE", Stato(), q.Length == 0 ? "[un tasto] indietro" : "[↑↓] scegli   [INVIO] " + (ripristina ? "rimetti a posto" : "guarda") + "   [ESC] indietro");
            if (q.Length == 0) { Term.Center(11, "Nessuna quarantena: non c'è niente da rimettere a posto.", Ink.Dim); Term.Wait(); return; }
            var voci = new List<string>();
            for (int i = 0; i < q.Length && i < 16; i++)
            {
                int n = 0; try { n = File.ReadAllLines(Path.Combine(q[i], "elenco.txt")).Length; } catch { }
                voci.Add(Term.Pad(Path.GetFileName(q[i]), 24) + Term.Pad(n + " pezzi", 12) + Motore.Peso(Motore.PesoCartella(q[i])));
            }
            int s = Term.Menu(6, 5, voci.ToArray(), null, null, 0, 60, 0);
            if (s < 0) return;
            if (!ripristina)
            {
                var l = new List<KeyValuePair<string, Ink>>();
                try { foreach (string r in File.ReadAllLines(Path.Combine(q[s], "elenco.txt"), Encoding.UTF8)) { string[] p = r.Split('|'); if (p.Length > 1) l.Add(new KeyValuePair<string, Ink>((p[0] == "D" ? "[cartella] " : "           ") + p[1], Ink.Norm)); } } catch { }
                Sfoglia("QUARANTENA  //  " + Path.GetFileName(q[s]), l, "[un tasto] indietro");
                return;
            }
            int saltati; int tornati = Motore.Ripristina(Dati.Cartella, q[s], out saltati);
            Sfx.Play("select");
            Term.Frame("RIPRISTINATO", Stato(), "[un tasto] torna al menù");
            Term.Put(4, 6, tornati + " pezzi sono tornati al loro posto.", Ink.Bright);
            if (saltati > 0) Term.Put(4, 8, saltati + " non li ho rimessi: al loro posto adesso c'è già un altro file (restano in quarantena).", Ink.Norm);
            Term.Wait();
        }

        static void ProveSchermo()
        {
            Term.Frame("PROVE DI SICUREZZA", Stato(), "le faccio su un progettino finto, in una cartella temporanea");
            Term.Flush();
            var r = Motore.Prove();
            int ok = 0, y = 5;
            Term.BeginType();
            foreach (var kv in r) { Term.Type(4, y++, (kv.Value ? "[OK] " : "[NO] ") + kv.Key, kv.Value ? Ink.Norm : Ink.Bright, !kv.Value); if (kv.Value) ok++; }
            Term.Put(4, y + 1, ok == r.Count ? "Tutte e " + r.Count + " le prove passate." : "ATTENZIONE: " + (r.Count - ok) + " prove fallite. Non usare PULISCI.", Ink.Bright);
            Term.Footer("[un tasto] indietro");
            Term.Wait();
        }

        static void Cartella()
        {
            Term.Frame("CARTELLA", Stato(), "[INVIO] conferma   [ESC] annulla");
            Term.Put(4, 5, "La cartella del progetto da guardare (quella con index.html, src\\ e public\\).", Ink.Norm);
            Term.Put(4, 6, "Puoi incollare il percorso. Adesso:", Ink.Dim);
            Term.Put(4, 7, Corto(Dati.Cartella, 72), Ink.Bright);
            string s = Chiedi(4, 10, 70, null);
            if (s == null || s.Length == 0) return;
            s = s.Trim('"');
            if (!Directory.Exists(s)) { Sfx.Play("deny"); Term.Put(4, 13, "Questa cartella non esiste.", Ink.Bright, true); Term.Wait(); return; }
            Dati.Cartella = Path.GetFullPath(s).TrimEnd('\\'); Dati.Save();
        }

        static void Opzioni()
        {
            int sel = 0;
            while (true)
            {
                string[] vel = { "LENTA", "NORMALE", "IMMEDIATA" };
                string[] voci = { "[1] COLORE DEL TERMINALE: " + Term.ThemeNames[Dati.Theme], "[2] SUONO: " + (Dati.Sound ? "ACCESO" : "SPENTO"), "[3] VELOCITÀ DEL TESTO: " + vel[Dati.Speed], "[0] INDIETRO" };
                Term.Frame("OPZIONI", Stato(), "[↑↓] scegli   [INVIO] cambia   [ESC] indietro");
                Term.Put(4, 14, "Cartelle protette (" + Dati.Protetti.Count + "): si scrivono in PuliziaOS_dati.txt, una riga «protetta=public/cartella».", Ink.Dim);
                Term.Put(4, 15, "Servono per i file chiamati con un nome costruito, che nessun testo nomina per intero.", Ink.Dim);
                sel = Term.Menu(8, 6, voci, null, new[] { '1', '2', '3', '0' }, sel, 60, 0);
                if (sel == 0) Dati.Theme = (Dati.Theme + 1) % Term.ThemeNames.Length;
                else if (sel == 1) Dati.Sound = !Dati.Sound;
                else if (sel == 2) Dati.Speed = (Dati.Speed + 1) % 3;
                else { Dati.Save(); return; }
                Dati.Apply(); Dati.Save();
            }
        }

        static void Avvio()
        {
            Term.Clear();
            Term.BeginType();
            Term.Type(4, 2, "PULIZIA-OS (TM)   //   IMPRESA DI PULIZIE DA TERMINALE   //   v1.0", Ink.Bright);
            Term.Type(4, 3, "COPYRIGHT 2026  -  STESSO SISTEMA DI MATRICI-OS", Ink.Dim);
            string[] passi = { "AVVIO SISTEMA", "CONTROLLO CARTELLA DEL PROGETTO", "CARICAMENTO CARTELLE PROTETTE", "CONTROLLO QUARANTENE", "GUANTI E SECCHIO" };
            for (int i = 0; i < passi.Length; i++) { Term.Type(4, 5 + i, "> " + passi[i] + " " + new string('.', 40 - passi[i].Length) + " OK", Ink.Norm); if (!Term.Skipping) Thread.Sleep(90); }
            Term.Type(4, 11, "> REGOLA DELLA CASA: PRIMA GUARDO, POI CHIEDO, E NON BUTTO VIA NIENTE.", Ink.Bright);
            Term.BlinkWait(20, "[ PREMI UN TASTO PER ENTRARE ]");
        }

        static void Menu()
        {
            int sel = 0;
            while (true)
            {
                string[] voci = { "[1] ANALISI", "[2] PULISCI", "[3] QUARANTENE (" + Motore.Elenco(Dati.Cartella).Length + ")", "[4] RIPRISTINA", "[5] PROVE", "[6] CARTELLA", "[7] OPZIONI", "[0] ESCI" };
                string[] desc = {
                    "Guarda e riferisce, non tocca niente",
                    "Mette da parte lo sporco in una quarantena dentro il progetto",
                    "Quello che è stato messo da parte, e quando",
                    "Rimette a posto una quarantena, pezzo per pezzo",
                    "Le prove di sicurezza, su un progettino finto",
                    "Scegli il progetto da guardare",
                    "Colore del terminale, suono, velocità, cartelle protette",
                    "Spegni il terminale" };
                Term.Frame(VERS, Stato(), "[↑↓] scegli   [INVIO] conferma   [1-7] scorciatoie   [0] esci");
                Logo(4, "PULIZIA");
                Term.Center(10, "- O S -    PRIMA GUARDA E RIFERISCE, POI PULISCE, E SE SERVE RIMETTE A POSTO", Ink.Dim);
                sel = Term.Menu(26, 12, voci, desc, new[] { '1', '2', '3', '4', '5', '6', '7', '0' }, sel, 30, 22);
                switch (sel)
                {
                    case 0: Sfoglia("ANALISI", Rapporto(Guarda()), "[un tasto] indietro"); break;
                    case 1: Pulisci(); break;
                    case 2: Quarantene(false); break;
                    case 3: Quarantene(true); break;
                    case 4: ProveSchermo(); break;
                    case 5: Cartella(); break;
                    case 6: Opzioni(); break;
                    default: return;
                }
            }
        }

        static int Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "--selftest")
            {
                var r = Motore.Prove(); int ok = 0;
                foreach (var kv in r) { Console.WriteLine((kv.Value ? "  OK  " : "  NO  ") + kv.Key); if (kv.Value) ok++; }
                Console.WriteLine(ok == r.Count && ok > 0 ? "SELFTEST OK: " + ok + "/" + r.Count + " prove" : "SELFTEST FALLITO: " + ok + "/" + r.Count);
                return ok == r.Count && ok > 0 ? 0 : 1;
            }
            Dati.Load(AppDomain.CurrentDomain.BaseDirectory);
            if (args.Length > 0 && Directory.Exists(args[0])) Dati.Cartella = Path.GetFullPath(args[0]).TrimEnd('\\');
            Term.Init();
            try { Avvio(); Menu(); }
            finally { Dati.Save(); Term.Restore(); }
            return 0;
        }
    }
}
