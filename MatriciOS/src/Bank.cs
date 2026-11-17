using System;
using System.Collections.Generic;

namespace MatriciOS
{
    enum QK { Choice, Int, Dim, Pos }

    class Ex
    {
        public int Id, Sec;
        public string Q;
        public object[] Show, Sol;
        public QK Kind;
        public string[] Opts;
        public int Correct = -1;
        public string Ans, Hint, Why;

        public string FormatNote()
        {
            switch (Kind)
            {
                case QK.Dim: return "Scrivi RIGHE x COLONNE (esempio: 2x3) e premi INVIO.";
                case QK.Pos: return "Scrivi RIGA spazio COLONNA (esempio: 2 3) e premi INVIO.";
                default: return "Scrivi un numero intero (esempio: 7 oppure -3) e premi INVIO.";
            }
        }

        public string AnsText()
        {
            int a, b;
            switch (Kind)
            {
                case QK.Choice: return Opts[Correct];
                case QK.Dim: Bank.TryTwo(Ans, out a, out b); return a + " × " + b;
                case QK.Pos: Bank.TryTwo(Ans, out a, out b); return "riga " + a + ", colonna " + b;
                default: return Ans;
            }
        }

        // 1 giusta, 0 sbagliata, -1 formato non valido
        public int Check(string s)
        {
            if (Kind == QK.Int)
            {
                int v;
                string t = s.Replace(" ", "").Replace("+", "");
                if (!int.TryParse(t, out v)) return -1;
                return v.ToString() == Ans ? 1 : 0;
            }
            int a, b, x, y;
            if (!Bank.TryTwo(s, out a, out b)) return -1;
            Bank.TryTwo(Ans, out x, out y);
            return (a == x && b == y) ? 1 : 0;
        }
    }

    static class Bank
    {
        public static List<Ex> All = new List<Ex>();
        public static readonly string[] SecNames = {
            "RIGHE, COLONNE, DIMENSIONE",
            "POSIZIONE DEGLI ELEMENTI",
            "TIPI DI MATRICI (FORMA)",
            "DIAGONALI E TRACCIA",
            "QUADRATE SPECIALI",
            "UGUAGLIANZA",
            "TRASPOSTA",
            "SOMMA E DIFFERENZA",
            "PRODOTTO PER SCALARE",
            "PRODOTTO RIGHE PER COLONNE",
        };
        static int sec;

        public static bool TryTwo(string s, out int a, out int b)
        {
            string t = s.ToLowerInvariant().Replace("×", " ").Replace("x", " ").Replace("*", " ")
                        .Replace(",", " ").Replace(";", " ");
            string[] p = t.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (p.Length == 2 && int.TryParse(p[0], out a) && int.TryParse(p[1], out b)) return true;
            if (p.Length == 1 && p[0].Length == 2 && char.IsDigit(p[0][0]) && char.IsDigit(p[0][1]))
            { a = p[0][0] - '0'; b = p[0][1] - '0'; return true; }
            a = 0; b = 0; return false;
        }

        // ------------------------------------------------ utilità
        static Ex Add(Ex e) { e.Sec = sec; e.Id = All.Count; All.Add(e); return e; }
        static MatSpec Mt(string l, int[,] a) { return new MatSpec(l, Mx.S(a), null, false); }
        static MatSpec Mt(string l, int[,] a, Func<int, int, int> h) { return new MatSpec(l, Mx.S(a), h, false); }
        static MatSpec MtI(string l, int[,] a, Func<int, int, int> h) { return new MatSpec(l, Mx.S(a), h, true); }
        static object[] One(MatSpec m) { return new object[] { m }; }
        static string F(int v) { return v < 0 ? "(" + v + ")" : v.ToString(); }
        static int R(int[,] a) { return a.GetLength(0); }
        static int C(int[,] a) { return a.GetLength(1); }
        static string Righe(int n) { return n + (n == 1 ? " riga" : " righe"); }
        static string Colonne(int n) { return n + (n == 1 ? " colonna" : " colonne"); }

        // ------------------------------------------------ costruttori di esercizi
        static void Num(string q, object[] show, int ans, string hint, string why, object[] sol = null)
        { Add(new Ex { Kind = QK.Int, Q = q, Show = show, Ans = ans.ToString(), Hint = hint, Why = why, Sol = sol }); }

        static void Choice(string q, object[] show, string[] opts, int correct, string hint, string why)
        { Add(new Ex { Kind = QK.Choice, Q = q, Show = show, Opts = opts, Correct = correct, Hint = hint, Why = why }); }

        static void TF(string q, object[] show, bool val, string hint, string why)
        { Choice("VERO o FALSO?  " + q, show, new[] { "VERO", "FALSO" }, val ? 0 : 1, hint, why); }

        static void YN(string q, object[] show, bool val, string hint, string why)
        { Choice(q, show, new[] { "SÌ", "NO" }, val ? 0 : 1, hint, why); }

        static void Dim(int[,] a)
        {
            Add(new Ex {
                Kind = QK.Dim, Q = "Che DIMENSIONE ha la matrice A?", Show = One(Mt("A", a)),
                Ans = R(a) + "x" + C(a),
                Hint = "Conta prima le RIGHE (file orizzontali), poi le COLONNE (file verticali). Si scrive righe x colonne.",
                Why = "A ha " + Righe(R(a)) + " e " + Colonne(C(a)) + ": è una matrice " + R(a) + " × " + C(a) + "."
            });
        }

        static void Rows(int[,] a)
        {
            Num("Quante RIGHE ha la matrice A?", One(Mt("A", a)), R(a),
                "Le righe sono le file ORIZZONTALI: contale dall'alto verso il basso.",
                "A ha " + Righe(R(a)) + " (e " + Colonne(C(a)) + ").",
                One(Mt("A", a, (r, c) => r == 0 ? 1 : 0)));
        }

        static void Cols(int[,] a)
        {
            Num("Quante COLONNE ha la matrice A?", One(Mt("A", a)), C(a),
                "Le colonne sono le file VERTICALI: contale da sinistra verso destra.",
                "A ha " + Colonne(C(a)) + " (e " + Righe(R(a)) + ").",
                One(Mt("A", a, (r, c) => c == 0 ? 1 : 0)));
        }

        static void Count(int[,] a)
        {
            Num("Quanti ELEMENTI contiene in tutto la matrice A?", One(Mt("A", a)), R(a) * C(a),
                "Puoi contarli uno per uno, oppure fare: numero di righe × numero di colonne.",
                Righe(R(a)) + " × " + Colonne(C(a)) + " = " + (R(a) * C(a)) + " elementi.");
        }

        static void Elem(int[,] a, int i, int j, bool idx)
        {
            int v = a[i - 1, j - 1];
            string n = "a" + i + j;
            Func<int, int, int> hl = (r, c) => (r == i - 1 && c == j - 1) ? 1 : ((r == i - 1 || c == j - 1) ? 2 : 0);
            Num("Quanto vale l'elemento " + n + " della matrice A?",
                One(idx ? MtI("A", a, null) : Mt("A", a)), v,
                n + " vuol dire RIGA " + i + ", COLONNA " + j + ". Scendi alla riga " + i + ", poi vai a destra fino alla colonna " + j + ".",
                "La riga " + i + " e la colonna " + j + " si incrociano sul numero " + v + ": " + n + " = " + v + ".",
                One(idx ? MtI("A", a, hl) : Mt("A", a, hl)));
        }

        static void Pos(int[,] a, int v, bool idx)
        {
            int fi = -1, fj = -1, cnt = 0;
            for (int r = 0; r < R(a); r++)
                for (int c = 0; c < C(a); c++)
                    if (a[r, c] == v) { fi = r; fj = c; cnt++; }
            if (cnt != 1) throw new Exception("Pos: il numero " + v + " non è unico");
            int i = fi + 1, j = fj + 1;
            Func<int, int, int> hl = (r, c) => (r == fi && c == fj) ? 1 : 0;
            Add(new Ex {
                Kind = QK.Pos, Q = "In quale POSIZIONE si trova il numero " + v + "? Indica la sua RIGA e la sua COLONNA.",
                Show = One(idx ? MtI("A", a, null) : Mt("A", a)), Ans = i + " " + j,
                Hint = "Trova il " + v + ". In che riga è (contando dall'alto)? In che colonna è (contando da sinistra)? Scrivi prima la riga.",
                Why = "Il " + v + " è in riga " + i + " e colonna " + j + ": è l'elemento a" + i + j + ".",
                Sol = One(idx ? MtI("A", a, hl) : Mt("A", a, hl))
            });
        }

        // ---------- riconoscimento tipi (la risposta giusta è calcolata) ----------
        static readonly string[] Priority = {
            "NULLA", "IDENTITÀ", "SCALARE", "DIAGONALE", "TRIANG. SUPERIORE", "TRIANG. INFERIORE",
            "SIMMETRICA", "RIGA", "COLONNA", "QUADRATA", "RETTANGOLARE"
        };

        static bool Is(string k, int[,] a)
        {
            int m = R(a), n = C(a);
            bool sq = m == n;
            switch (k)
            {
                case "RIGA": return m == 1;
                case "COLONNA": return n == 1;
                case "QUADRATA": return sq;
                case "RETTANGOLARE": return !sq;
                case "NULLA":
                    foreach (int v in a) if (v != 0) return false;
                    return true;
                case "TRIANG. SUPERIORE":
                    if (!sq) return false;
                    for (int r = 0; r < m; r++) for (int c = 0; c < r; c++) if (a[r, c] != 0) return false;
                    return true;
                case "TRIANG. INFERIORE":
                    if (!sq) return false;
                    for (int r = 0; r < m; r++) for (int c = r + 1; c < n; c++) if (a[r, c] != 0) return false;
                    return true;
                case "DIAGONALE": return Is("TRIANG. SUPERIORE", a) && Is("TRIANG. INFERIORE", a);
                case "SCALARE":
                    if (!Is("DIAGONALE", a)) return false;
                    for (int r = 1; r < m; r++) if (a[r, r] != a[0, 0]) return false;
                    return true;
                case "IDENTITÀ": return Is("SCALARE", a) && a[0, 0] == 1;
                case "SIMMETRICA":
                    if (!sq) return false;
                    for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) if (a[r, c] != a[c, r]) return false;
                    return true;
            }
            throw new Exception("Tipo sconosciuto: " + k);
        }

        static string WhyType(string k, int[,] a)
        {
            switch (k)
            {
                case "RIGA": return "A ha una sola riga (è " + R(a) + " × " + C(a) + "): è una matrice RIGA.";
                case "COLONNA": return "A ha una sola colonna (è " + R(a) + " × " + C(a) + "): è una matrice COLONNA.";
                case "QUADRATA": return "A ha " + Righe(R(a)) + " e " + Colonne(C(a)) + ": righe = colonne, quindi è QUADRATA.";
                case "RETTANGOLARE": return "A ha " + Righe(R(a)) + " e " + Colonne(C(a)) + ": sono numeri diversi, quindi è RETTANGOLARE.";
                case "NULLA": return "Tutti gli elementi di A sono 0: è la matrice NULLA (il nome più preciso).";
                case "IDENTITÀ": return "Sulla diagonale principale ci sono tutti 1 e fuori solo zeri: è la matrice IDENTITÀ.";
                case "SCALARE": return "Fuori dalla diagonale solo zeri, e sulla diagonale numeri tutti uguali (ma non 1): è SCALARE.";
                case "DIAGONALE": return "Fuori dalla diagonale principale ci sono solo zeri, ma i numeri sulla diagonale non sono tutti uguali: è DIAGONALE.";
                case "TRIANG. SUPERIORE": return "SOTTO la diagonale principale ci sono solo zeri: è TRIANGOLARE SUPERIORE.";
                case "TRIANG. INFERIORE": return "SOPRA la diagonale principale ci sono solo zeri: è TRIANGOLARE INFERIORE.";
                case "SIMMETRICA": return "Gli elementi sono uguali a specchio rispetto alla diagonale (aij = aji): è SIMMETRICA.";
                default: return "Nessuno dei nomi proposti va bene: non ci sono zeri sopra o sotto la diagonale e non è simmetrica.";
            }
        }

        static Func<int, int, int> HlType(string k)
        {
            switch (k)
            {
                case "TRIANG. SUPERIORE": return (r, c) => r > c ? 1 : 0;
                case "TRIANG. INFERIORE": return (r, c) => r < c ? 1 : 0;
                case "DIAGONALE": case "SCALARE": case "IDENTITÀ": return (r, c) => r == c ? 1 : 0;
                case "SIMMETRICA": return (r, c) => r == c ? 0 : 2;
                default: return null;
            }
        }

        static void Type(int[,] a, params string[] opts)
        {
            int correct = -1;
            foreach (string k in Priority)
            {
                int ix = Array.IndexOf(opts, k);
                if (ix >= 0 && Is(k, a)) { correct = ix; break; }
            }
            int none = Array.IndexOf(opts, "NESSUNA DI QUESTE");
            if (correct < 0 && none >= 0) correct = none;
            if (correct < 0) throw new Exception("Type: nessuna risposta giusta");
            bool special = false;
            foreach (string o in opts) if (o.Contains("TRIANG") || o == "DIAGONALE" || o == "SIMMETRICA" || o == "SCALARE" || o == "IDENTITÀ") special = true;
            string k2 = opts[correct];
            Func<int, int, int> hl = HlType(k2);
            Add(new Ex {
                Kind = QK.Choice, Q = "Che TIPO di matrice è A? Scegli il nome PIÙ PRECISO.",
                Show = One(Mt("A", a)), Opts = opts, Correct = correct,
                Hint = special
                    ? "Guarda dove sono gli zeri: sopra, sotto o fuori dalla diagonale principale? Poi guarda i numeri sulla diagonale."
                    : "Conta righe e colonne. Una sola riga? Una sola colonna? Righe = colonne? Sono tutti zeri?",
                Why = WhyType(k2, a),
                Sol = hl == null ? null : One(Mt("A", a, hl))
            });
        }

        static void Trace(int[,] a)
        {
            int s = 0; string expr = "";
            for (int i = 0; i < R(a); i++) { s += a[i, i]; expr += (i > 0 ? " + " : "") + F(a[i, i]); }
            Num("Calcola la TRACCIA di A, cioè la somma degli elementi della diagonale principale.",
                One(Mt("A", a)), s,
                "La diagonale principale va dall'angolo in alto a sinistra a quello in basso a destra. Somma i suoi numeri.",
                "tr(A) = " + expr + " = " + s,
                One(Mt("A", a, (r, c) => r == c ? 1 : 0)));
        }

        static void SecSum(int[,] a)
        {
            int n = R(a), s = 0; string expr = "";
            for (int i = 0; i < n; i++) { s += a[i, n - 1 - i]; expr += (i > 0 ? " + " : "") + F(a[i, n - 1 - i]); }
            Num("Calcola la SOMMA degli elementi della DIAGONALE SECONDARIA di A.",
                One(Mt("A", a)), s,
                "La diagonale secondaria va dall'angolo in ALTO a DESTRA a quello in BASSO a SINISTRA.",
                "Diagonale secondaria: " + expr + " = " + s,
                One(Mt("A", a, (r, c) => r + c == n - 1 ? 1 : 0)));
        }

        static void TransDim(int[,] a)
        {
            Add(new Ex {
                Kind = QK.Dim, Q = "Che DIMENSIONE ha la trasposta A^T?", Show = One(Mt("A", a)),
                Ans = C(a) + "x" + R(a),
                Hint = "Nella trasposta righe e colonne si scambiano: se A è m × n, allora A^T è n × m.",
                Why = "A è " + R(a) + " × " + C(a) + ", quindi A^T è " + C(a) + " × " + R(a) + "."
            });
        }

        static void TransElem(int[,] a, int i, int j)
        {
            int v = a[j - 1, i - 1];
            Num("Quanto vale l'elemento (A^T)" + i + j + " della trasposta di A?",
                One(MtI("A", a, null)), v,
                "(A^T)ij = aji : scambia i due numeri e cerca l'elemento a" + j + i + " nella matrice A.",
                "(A^T)" + i + j + " = a" + j + i + " = " + v + "  (riga " + j + ", colonna " + i + " di A).",
                One(MtI("A", a, (r, c) => r == j - 1 && c == i - 1 ? 1 : 0)));
        }

        static void SumElem(int[,] a, int[,] b, int i, int j, bool minus, string lb = "B")
        {
            int x = a[i - 1, j - 1], y = b[i - 1, j - 1];
            int v = minus ? x - y : x + y;
            string op = minus ? "-" : "+";
            Func<int, int, int> hl = (r, c) => r == i - 1 && c == j - 1 ? 1 : 0;
            Num("Calcola l'elemento in RIGA " + i + ", COLONNA " + j + " di  A " + op + " " + lb + ".",
                new object[] { Mt("A", a), "      ", Mt(lb, b) }, v,
                "Prendi l'elemento in riga " + i + ", colonna " + j + " di A e quello nella STESSA posizione di " + lb + ", poi " + (minus ? "sottrai." : "somma."),
                x + " " + op + " " + F(y) + " = " + v,
                new object[] { Mt("A", a, hl), "      ", Mt(lb, b, hl) });
        }

        static void ScalElem(int k, int[,] a, int i, int j)
        {
            int x = a[i - 1, j - 1], v = k * x;
            Num("Calcola l'elemento in RIGA " + i + ", COLONNA " + j + " di  " + k + " · A.",
                new object[] { k + " · ", Mt("A", a) }, v,
                "Moltiplica per " + k + " l'elemento di A che sta in riga " + i + ", colonna " + j + ".",
                F(k) + " · " + F(x) + " = " + v,
                new object[] { k + " · ", Mt("A", a, (r, c) => r == i - 1 && c == j - 1 ? 1 : 0) });
        }

        static void ProdElem(int[,] a, int[,] b, int i, int j)
        {
            int s = 0; string e1 = "", e2 = "";
            for (int t = 0; t < C(a); t++)
            {
                int p = a[i - 1, t] * b[t, j - 1];
                s += p;
                e1 += (t > 0 ? " + " : "") + F(a[i - 1, t]) + "·" + F(b[t, j - 1]);
                e2 += (t > 0 ? " + " : "") + F(p);
            }
            Num("Sia C = A · B. Calcola l'elemento c" + i + j + "  (RIGA " + i + " di A per COLONNA " + j + " di B).",
                new object[] { Mt("A", a), "      ", Mt("B", b) }, s,
                "Moltiplica a coppie: il 1° numero della riga con il 1° della colonna, il 2° con il 2°... poi somma i risultati.",
                "c" + i + j + " = " + e1 + " = " + e2 + " = " + s,
                new object[] { Mt("A", a, (r, c) => r == i - 1 ? 1 : 0), "      ", Mt("B", b, (r, c) => c == j - 1 ? 1 : 0) });
        }

        // ================================================================ I 100 ESERCIZI
        public static void Build()
        {
            All.Clear();
            object[] none = null;

            // ---------------- 1. RIGHE, COLONNE, DIMENSIONE (10)
            sec = 1;
            int[,] a1 = Mx.I("3 1 4/1 5 9");
            Rows(a1);
            Cols(a1);
            Dim(Mx.I("2 7/0 4/6 1"));
            Dim(Mx.I("5 8 2 9"));
            Dim(Mx.I("1/0/3"));
            Count(Mx.I("1 2 3/4 5 6/7 8 9"));
            Num("Una matrice ha dimensione 2 × 5. Quante RIGHE ha?", none, 2,
                "Nella dimensione il PRIMO numero indica le righe, il secondo le colonne.",
                "In 2 × 5 il primo numero è 2: la matrice ha 2 righe (e 5 colonne).");
            Choice("Una matrice ha 4 righe e 2 colonne. Qual è la sua DIMENSIONE?", none,
                new[] { "2 × 4", "4 × 2", "4 × 4", "8" }, 1,
                "Si scrive sempre prima il numero delle righe, poi quello delle colonne.",
                "Prima le righe, poi le colonne: 4 × 2.");
            Num("Una matrice 3 × 4 quanti ELEMENTI contiene in tutto?", none, 12,
                "Il numero di elementi è righe × colonne.",
                "3 righe × 4 colonne = 12 elementi.");
            Dim(Mx.I("0 -2 5 1/3 3 7 -4"));

            // ---------------- 2. POSIZIONE DEGLI ELEMENTI (15)
            sec = 2;
            int[,] p1 = Mx.I("5 8 1/4 9 7");
            int[,] p2 = Mx.I("2 -3 6/0 11 4/7 1 -5");
            int[,] p3 = Mx.I("10 20 30 40/50 60 70 80/90 15 25 35");
            Elem(p1, 1, 2, true);
            Elem(p1, 2, 3, true);
            Elem(p1, 2, 1, false);
            Elem(p2, 3, 1, true);
            Elem(p2, 1, 3, false);
            Elem(p2, 3, 3, false);
            Pos(p1, 9, true);
            Pos(p2, 4, false);
            Pos(p2, 1, false);
            Choice("Quale elemento è EVIDENZIATO nella matrice A?",
                One(Mt("A", p2, (r, c) => r == 1 && c == 0 ? 1 : 0)),
                new[] { "a12", "a21", "a22", "a11" }, 1,
                "Il primo numero è la RIGA, il secondo è la COLONNA.",
                "L'elemento evidenziato è in riga 2, colonna 1: è a21.");
            TF("Nella matrice A l'elemento a12 vale 4.", One(Mt("A", p1)), false,
                "a12 = riga 1, colonna 2. Non confondere riga e colonna!",
                "a12 è in riga 1, colonna 2 e vale 8. Il 4 è a21 (riga 2, colonna 1).");
            Elem(p3, 3, 4, false);
            Elem(p3, 2, 4, false);
            Pos(p3, 15, false);
            Num("Calcola  a12 + a21  nella matrice A.", One(Mt("A", p3)), p3[0, 1] + p3[1, 0],
                "Trova a12 (riga 1, colonna 2) e a21 (riga 2, colonna 1), poi sommali.",
                "a12 = " + p3[0, 1] + ", a21 = " + p3[1, 0] + ": la somma è " + (p3[0, 1] + p3[1, 0]) + ".",
                One(Mt("A", p3, (r, c) => (r == 0 && c == 1) || (r == 1 && c == 0) ? 1 : 0)));

            // ---------------- 3. TIPI DI MATRICI - FORMA (15)
            sec = 3;
            Type(Mx.I("4 7 1"), "RIGA", "COLONNA", "QUADRATA", "NULLA");
            Type(Mx.I("2/9/5"), "RIGA", "COLONNA", "QUADRATA", "NULLA");
            Type(Mx.I("1 2/3 4"), "RIGA", "COLONNA", "QUADRATA", "RETTANGOLARE");
            Type(Mx.I("1 2 3/4 5 6"), "RIGA", "COLONNA", "QUADRATA", "RETTANGOLARE");
            Type(Mx.I("0 0/0 0/0 0"), "COLONNA", "QUADRATA", "NULLA", "RIGA");
            Type(Mx.I("3 -1 0/2 2 8/0 5 1"), "RETTANGOLARE", "QUADRATA", "NULLA", "RIGA");
            Type(Mx.I("0 1 0 0"), "NULLA", "RIGA", "COLONNA", "QUADRATA");
            Type(Mx.I("7/0/-3/1"), "RIGA", "COLONNA", "QUADRATA", "NULLA");
            Type(Mx.I("5 6/7 8/9 0"), "QUADRATA", "RETTANGOLARE", "COLONNA", "NULLA");
            TF("Una matrice quadrata ha lo stesso numero di righe e di colonne.", none, true,
                "Pensa a un quadrato: i lati sono tutti uguali.",
                "Esatto: in una matrice quadrata righe = colonne (n × n).");
            TF("Una matrice 1 × 5 è una matrice COLONNA.", none, false,
                "Il primo numero indica le righe: quante righe ha una 1 × 5?",
                "Una 1 × 5 ha 1 riga e 5 colonne: è una matrice RIGA.");
            TF("Una matrice nulla deve essere per forza quadrata.", none, false,
                "Nulla vuol dire solo che tutti gli elementi sono zero.",
                "Falso: una matrice nulla può avere qualsiasi dimensione, ad esempio 2 × 3.");
            Choice("Quale di queste dimensioni è di una matrice QUADRATA?", none,
                new[] { "2 × 3", "3 × 3", "1 × 3", "3 × 1" }, 1,
                "Quadrata vuol dire righe = colonne.",
                "Solo 3 × 3 ha lo stesso numero di righe e di colonne.");
            Choice("Quale di queste dimensioni è di una matrice COLONNA?", none,
                new[] { "1 × 4", "4 × 4", "4 × 1", "2 × 2" }, 2,
                "Una matrice colonna ha UNA SOLA colonna: il secondo numero deve essere 1.",
                "4 × 1 vuol dire 4 righe e 1 colonna: è una matrice COLONNA.");
            Num("Una matrice QUADRATA di ordine 4 quanti elementi ha?", none, 16,
                "Ordine 4 vuol dire 4 × 4.",
                "4 × 4 = 16 elementi.");

            // ---------------- 4. DIAGONALI E TRACCIA (10)
            sec = 4;
            int[,] d1 = Mx.I("2 5 1/0 3 8/4 6 -1");
            int[,] d3 = Mx.I("1 2 3 4/5 6 7 8/9 10 11 12/13 14 15 16");
            Choice("Quali numeri formano la DIAGONALE PRINCIPALE di A?", One(Mt("A", d1)),
                new[] { "2, 3, -1", "1, 3, 4", "2, 5, 1", "4, 6, -1" }, 0,
                "La diagonale principale parte dall'angolo in ALTO a SINISTRA.",
                "Diagonale principale: a11 = 2, a22 = 3, a33 = -1.");
            Choice("Quali numeri formano la DIAGONALE SECONDARIA di A?", One(Mt("A", d1)),
                new[] { "2, 3, -1", "2, 5, 1", "1, 3, 4", "5, 3, 6" }, 2,
                "La diagonale secondaria parte dall'angolo in ALTO a DESTRA.",
                "Diagonale secondaria: a13 = 1, a22 = 3, a31 = 4.");
            Trace(d1);
            Trace(Mx.I("7 0/3 -2"));
            Trace(d3);
            SecSum(d3);
            TF("La diagonale principale esiste solo nelle matrici quadrate.", none, true,
                "Prova a immaginare la diagonale di una matrice 2 × 3: arriva in un angolo?",
                "Vero: solo nelle quadrate la diagonale va esattamente da un angolo all'altro.");
            Choice("Quale di questi elementi sta sulla DIAGONALE PRINCIPALE?", none,
                new[] { "a12", "a33", "a31", "a23" }, 1,
                "Sulla diagonale principale riga e colonna sono uguali.",
                "a33 ha riga = colonna = 3: sta sulla diagonale principale.");
            Choice("In una matrice 3 × 3, quale di questi elementi sta sulla DIAGONALE SECONDARIA?", none,
                new[] { "a11", "a13", "a32", "a33" }, 1,
                "Nella secondaria di una 3 × 3 riga + colonna fa sempre 4.",
                "a13: 1 + 3 = 4, è l'angolo in alto a destra della diagonale secondaria.");
            Trace(Mx.I("-3 8 1/2 -4 6/9 0 10"));

            // ---------------- 5. QUADRATE SPECIALI (15)
            sec = 5;
            Type(Mx.I("1 0 0/0 1 0/0 0 1"), "DIAGONALE", "IDENTITÀ", "SCALARE", "TRIANG. SUPERIORE");
            Type(Mx.I("3 5 2/0 1 4/0 0 6"), "TRIANG. SUPERIORE", "TRIANG. INFERIORE", "DIAGONALE", "SIMMETRICA");
            Type(Mx.I("2 0 0/7 1 0/3 5 4"), "TRIANG. SUPERIORE", "TRIANG. INFERIORE", "IDENTITÀ", "SIMMETRICA");
            Type(Mx.I("4 0 0/0 -2 0/0 0 7"), "SCALARE", "IDENTITÀ", "DIAGONALE", "SIMMETRICA");
            Type(Mx.I("5 0/0 5"), "IDENTITÀ", "SCALARE", "TRIANG. INFERIORE", "NESSUNA DI QUESTE");
            Type(Mx.I("1 7 3/7 2 5/3 5 0"), "SIMMETRICA", "DIAGONALE", "TRIANG. SUPERIORE", "IDENTITÀ");
            Type(Mx.I("1 2/3 4"), "SIMMETRICA", "DIAGONALE", "TRIANG. SUPERIORE", "NESSUNA DI QUESTE");
            Type(Mx.I("2 0 0/0 2 0/0 0 2"), "DIAGONALE", "SCALARE", "IDENTITÀ", "SIMMETRICA");
            Type(Mx.I("0 4 -1/4 3 8/-1 8 6"), "SIMMETRICA", "TRIANG. INFERIORE", "SCALARE", "NESSUNA DI QUESTE");
            Type(Mx.I("6 1/0 3"), "TRIANG. SUPERIORE", "TRIANG. INFERIORE", "DIAGONALE", "SIMMETRICA");
            Type(Mx.I("9 0/4 2"), "TRIANG. SUPERIORE", "TRIANG. INFERIORE", "SCALARE", "SIMMETRICA");
            Type(Mx.I("1 0 0/0 1 0/0 0 3"), "IDENTITÀ", "SCALARE", "DIAGONALE", "NESSUNA DI QUESTE");
            TF("La matrice identità è un tipo particolare di matrice diagonale.", none, true,
                "Com'è fatta l'identità fuori dalla diagonale?",
                "Vero: l'identità ha solo zeri fuori dalla diagonale, quindi è diagonale (con tutti 1).");
            TF("In una matrice triangolare SUPERIORE gli zeri stanno SOPRA la diagonale principale.", none, false,
                "\"Superiore\" indica dove stanno i NUMERI, non gli zeri.",
                "Falso: nella triangolare superiore gli zeri stanno SOTTO la diagonale.");
            Num("Quanti 1 ci sono nella matrice identità I4 (cioè 4 × 4)?", none, 4,
                "L'identità ha gli 1 solo sulla diagonale principale.",
                "La diagonale di una 4 × 4 ha 4 elementi, tutti uguali a 1: quindi 4.");

            // ---------------- 6. UGUAGLIANZA (5)
            sec = 6;
            YN("Le matrici A e B sono UGUALI?", new object[] { Mt("A", Mx.I("1 2/3 4")), "      ", Mt("B", Mx.I("1 2/3 4")) }, true,
                "Controlla la dimensione e poi ogni posizione.",
                "Stessa dimensione (2 × 2) e stessi numeri negli stessi posti: sono uguali.");
            YN("Le matrici A e B sono UGUALI?", new object[] { Mt("A", Mx.I("1 2/3 4")), "      ", Mt("B", Mx.I("1 3/2 4")) }, false,
                "Confronta posizione per posizione: a12 con b12, a21 con b21...",
                "a12 = 2 ma b12 = 3: i numeri sono in posti diversi, quindi NON sono uguali.");
            YN("Le matrici A e B sono UGUALI?", new object[] { Mt("A", Mx.I("1 2 3")), "      ", Mt("B", Mx.I("1/2/3")) }, false,
                "Prima di tutto: hanno la stessa dimensione?",
                "A è 1 × 3 e B è 3 × 1: dimensioni diverse, quindi NON sono uguali.");
            Num("Le due matrici sono UGUALI. Quanto vale x?",
                new object[] { new MatSpec("", Mx.S("x 2/3 4"), null, false), "   =   ", Mt("", Mx.I("5 2/3 4")) }, 5,
                "Se sono uguali, la x è uguale al numero che sta nella stessa posizione nell'altra matrice.",
                "x è in riga 1, colonna 1: nell'altra matrice lì c'è 5, quindi x = 5.",
                new object[] { new MatSpec("", Mx.S("x 2/3 4"), (r, c) => r == 0 && c == 0 ? 1 : 0, false), "   =   ", Mt("", Mx.I("5 2/3 4"), (r, c) => r == 0 && c == 0 ? 1 : 0) });
            Num("Le due matrici sono UGUALI. Quanto vale y?",
                new object[] { new MatSpec("", Mx.S("3 y/0 1"), null, false), "   =   ", Mt("", Mx.I("3 -6/0 1")) }, -6,
                "Guarda cosa c'è nell'altra matrice nella stessa posizione della y.",
                "y è in riga 1, colonna 2: nell'altra matrice lì c'è -6, quindi y = -6.",
                new object[] { new MatSpec("", Mx.S("3 y/0 1"), (r, c) => r == 0 && c == 1 ? 1 : 0, false), "   =   ", Mt("", Mx.I("3 -6/0 1"), (r, c) => r == 0 && c == 1 ? 1 : 0) });

            // ---------------- 7. TRASPOSTA (10)
            sec = 7;
            int[,] t1 = Mx.I("1 2 3/4 5 6");
            int[,] t2 = Mx.I("7 -1/0 3/5 8");
            TransDim(t1);
            TransElem(t1, 1, 2);
            TransElem(t1, 3, 1);
            Choice("Qual è la PRIMA RIGA della trasposta A^T?", One(Mt("A", t1)),
                new[] { "1 2 3", "1 4", "4 5 6", "3 6" }, 1,
                "La prima riga di A^T è la prima COLONNA di A.",
                "La prima colonna di A è 1, 4: diventa la prima riga di A^T.");
            TransDim(t2);
            TransElem(t2, 2, 3);
            Choice("La trasposta di una matrice RIGA è una matrice...", none,
                new[] { "RIGA", "COLONNA", "QUADRATA", "NULLA" }, 1,
                "Se A è 1 × n, che dimensione ha A^T?",
                "Una matrice riga 1 × n diventa n × 1: una matrice COLONNA.");
            TF("Se A è 2 × 5, allora A^T è 5 × 2.", none, true,
                "Nella trasposta righe e colonne si scambiano.",
                "Vero: 2 × 5 diventa 5 × 2.");
            TF("Per questa matrice vale A^T = A.", One(Mt("A", Mx.I("1 4/4 9"))), true,
                "Scrivi la trasposta: la prima riga diventa la prima colonna...",
                "La trasposta è ancora 1 4 / 4 9: è uguale ad A (A è simmetrica).");
            TransElem(Mx.I("3 0 -2/6 1 5/-4 7 8"), 1, 3);

            // ---------------- 8. SOMMA E DIFFERENZA (8)
            sec = 8;
            int[,] s1a = Mx.I("1 2/3 4"), s1b = Mx.I("5 0/-1 2");
            int[,] s2a = Mx.I("2 -3 1/0 4 5"), s2b = Mx.I("1 3 -6/7 -2 0");
            SumElem(s1a, s1b, 1, 1, false);
            SumElem(s1a, s1b, 2, 1, false);
            SumElem(s2a, s2b, 1, 2, false);
            SumElem(s2a, s2b, 2, 3, false);
            SumElem(Mx.I("7 3/2 5"), Mx.I("1 4/2 0"), 1, 2, true);
            SumElem(Mx.I("9 -2/4 6"), Mx.I("3 5/-1 6"), 2, 1, true);
            YN("A è una matrice 2 × 3 e B è una matrice 3 × 2. Si può calcolare A + B?", none, false,
                "Per sommare due matrici serve la STESSA dimensione.",
                "No: 2 × 3 e 3 × 2 sono dimensioni diverse, quindi non si possono sommare.");
            SumElem(Mx.I("4 1/0 -3"), Mx.I("0 0/0 0"), 2, 2, false, "O");

            // ---------------- 9. PRODOTTO PER SCALARE (7)
            sec = 9;
            int[,] k1 = Mx.I("1 -2/0 4");
            int[,] k2 = Mx.I("5 0 -1/3 2 4");
            ScalElem(3, k1, 1, 2);
            ScalElem(3, k1, 2, 2);
            ScalElem(-2, k2, 1, 3);
            ScalElem(-2, k2, 2, 1);
            ScalElem(0, Mx.I("8 3/1 6"), 1, 1);
            Choice("A è una matrice 3 × 2. Che dimensione ha la matrice 5 · A?", none,
                new[] { "3 × 2", "2 × 3", "15 × 10", "5 × 5" }, 0,
                "Moltiplicare per un numero cambia gli elementi, non la forma.",
                "La dimensione non cambia: 5 · A è ancora 3 × 2.");
            int[,] k3 = Mx.I("1 4/6 3");
            Num("Calcola la TRACCIA della matrice 2 · A.", One(Mt("A", k3)), 2 * k3[0, 0] + 2 * k3[1, 1],
                "Prima moltiplica per 2 gli elementi della diagonale principale, poi sommali.",
                "2 · A ha sulla diagonale " + (2 * k3[0, 0]) + " e " + (2 * k3[1, 1]) + ": la traccia è " + (2 * k3[0, 0] + 2 * k3[1, 1]) + ".",
                One(Mt("A", k3, (r, c) => r == c ? 1 : 0)));

            // ---------------- 10. PRODOTTO RIGHE PER COLONNE (5)
            sec = 10;
            YN("A è 2 × 3 e B è 3 × 4. Si può calcolare il prodotto A · B?", none, true,
                "Confronta le COLONNE di A con le RIGHE di B.",
                "Sì: A ha 3 colonne e B ha 3 righe. 3 = 3, quindi si può.");
            Choice("A è 2 × 3 e B è 3 × 4. Che dimensione ha A · B?", none,
                new[] { "2 × 4", "3 × 3", "4 × 2", "non si può fare" }, 0,
                "Il risultato prende le RIGHE di A e le COLONNE di B.",
                "(2 × 3) · (3 × 4) = 2 × 4.");
            YN("A è 2 × 3 e B è 2 × 3. Si può calcolare il prodotto A · B?", none, false,
                "Le colonne di A devono essere uguali alle righe di B.",
                "No: A ha 3 colonne ma B ha 2 righe. 3 è diverso da 2.");
            ProdElem(Mx.I("1 2/3 4"), Mx.I("5 6/7 8"), 1, 1);
            ProdElem(Mx.I("2 0/1 3"), Mx.I("4 1/2 5"), 2, 2);
        }
    }
}
