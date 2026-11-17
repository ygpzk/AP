using System;
using System.Collections.Generic;

namespace MatriciOS
{
    static class Mx
    {
        // "1 2 3/4 5 6" -> matrice di testo
        public static string[,] S(string s)
        {
            string[] rows = s.Split('/');
            string[] first = rows[0].Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            var m = new string[rows.Length, first.Length];
            for (int r = 0; r < rows.Length; r++)
            {
                string[] t = rows[r].Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (t.Length != first.Length) throw new Exception("Riga di lunghezza diversa in: " + s);
                for (int c = 0; c < t.Length; c++) m[r, c] = t[c];
            }
            return m;
        }

        public static int[,] I(string s)
        {
            string[,] t = S(s);
            var m = new int[t.GetLength(0), t.GetLength(1)];
            for (int r = 0; r < t.GetLength(0); r++)
                for (int c = 0; c < t.GetLength(1); c++) m[r, c] = int.Parse(t[r, c]);
            return m;
        }

        public static string[,] S(int[,] a)
        {
            var m = new string[a.GetLength(0), a.GetLength(1)];
            for (int r = 0; r < a.GetLength(0); r++)
                for (int c = 0; c < a.GetLength(1); c++) m[r, c] = a[r, c].ToString();
            return m;
        }
    }

    class Block
    {
        public string Text;
        public Ink Ink = Ink.Norm;
        public bool Head;
        public object[] Row;
        public int Gap;
    }

    class Page
    {
        public List<Block> B = new List<Block>();
        public Page H(string s) { B.Add(new Block { Text = s, Head = true }); return this; }
        public Page T(string s) { B.Add(new Block { Text = s }); return this; }
        public Page D(string s) { B.Add(new Block { Text = s, Ink = Ink.Dim }); return this; }
        public Page K(string s) { B.Add(new Block { Text = s, Ink = Ink.Bright }); return this; }
        public Page M(params object[] row) { B.Add(new Block { Row = row }); return this; }
        public Page G() { B.Add(new Block { Gap = 1 }); return this; }
    }

    class Lesson
    {
        public string Title;
        public int Sec;
        public List<Page> Pages = new List<Page>();
        public Lesson(string title, int sec) { Title = title; Sec = sec; }
        public Page P() { var p = new Page(); Pages.Add(p); return p; }
    }

    static class LessonBank
    {
        static MatSpec M(string label, string s) { return new MatSpec(label, Mx.S(s), null, false); }
        static MatSpec M(string label, string s, Func<int, int, int> hl) { return new MatSpec(label, Mx.S(s), hl, false); }
        static MatSpec MI(string label, string s, Func<int, int, int> hl) { return new MatSpec(label, Mx.S(s), hl, true); }

        public static List<Lesson> Build()
        {
            var all = new List<Lesson>();
            Lesson L;

            // ------------------------------------------------------------------ 1
            L = new Lesson("COS'È UNA MATRICE", 1); all.Add(L);
            L.P().H("UNA TABELLA DI NUMERI")
                .T("Una MATRICE è una tabella di numeri ordinati in RIGHE e COLONNE, chiusa tra due parentesi.")
                .T("Si chiama con una lettera MAIUSCOLA: A, B, C...")
                .M(M("A", "3 1 4/1 5 9"))
                .T("Ogni numero della tabella si chiama ELEMENTO.")
                .T("Questa matrice A contiene 6 elementi.");
            L.P().H("LE RIGHE")
                .T("Le RIGHE sono le file ORIZZONTALI (da sinistra a destra).")
                .T("Si numerano dall'alto verso il basso: riga 1, riga 2, ...")
                .M(MI("A", "3 1 4/1 5 9", (r, c) => r == 0 ? 1 : 0))
                .T("Qui è evidenziata la RIGA 1: contiene i numeri 3, 1, 4.")
                .D("I numerini grigi a sinistra sono i numeri delle righe.");
            L.P().H("LE COLONNE")
                .T("Le COLONNE sono le file VERTICALI (dall'alto in basso).")
                .T("Si numerano da sinistra verso destra: colonna 1, colonna 2, ...")
                .M(MI("A", "3 1 4/1 5 9", (r, c) => c == 1 ? 1 : 0))
                .T("Qui è evidenziata la COLONNA 2: contiene i numeri 1 e 5.")
                .D("I numerini grigi in alto sono i numeri delle colonne.");
            L.P().H("IL TRUCCO PER RICORDARE")
                .T("RIGA = orizzontale, come le righe del quaderno.")
                .T("COLONNA = verticale, come le colonne di un tempio.")
                .G()
                .K("REGOLA D'ORO: si dice SEMPRE prima la RIGA e poi la COLONNA.")
                .T("Pensa a  RI-CO :  prima RIga, poi COlonna.")
                .G()
                .D("Comandi: [→] o [INVIO] pagina avanti, [←] indietro, [ESC] torna al menù. Un tasto qualsiasi salta l'animazione del testo.");

            // ------------------------------------------------------------------ 2
            L = new Lesson("LA DIMENSIONE", 1); all.Add(L);
            L.P().H("QUANTO È GRANDE UNA MATRICE?")
                .T("La DIMENSIONE (o ORDINE) di una matrice dice quante righe e quante colonne ha.")
                .T("Si scrive  m × n  e si legge \"m per n\":")
                .K("m = numero di RIGHE        n = numero di COLONNE")
                .M(M("A", "2 0 7/1 3 5"))
                .T("A ha 2 righe e 3 colonne: è una matrice 2 × 3.");
            L.P().H("ALTRI ESEMPI")
                .M(M("B", "4/8/1"), "      ", M("C", "5 2/6 1"), "      ", M("D", "9 3 6 2"))
                .T("B è 3 × 1  (3 righe, 1 colonna)")
                .T("C è 2 × 2  (2 righe, 2 colonne)")
                .T("D è 1 × 4  (1 riga, 4 colonne)")
                .G()
                .K("ATTENZIONE: 2 × 3 e 3 × 2 sono dimensioni DIVERSE! Prima le righe.");
            L.P().H("QUANTI ELEMENTI?")
                .T("Il numero totale di elementi è  m · n  (righe per colonne).")
                .T("Una matrice 2 × 3 ha 2 · 3 = 6 elementi. Una 4 × 4 ne ha 16.")
                .G()
                .H("COME SI SCRIVE NEGLI ESERCIZI")
                .T("Sulla tastiera il simbolo × si scrive con la lettera x.")
                .T("Per dire \"2 righe e 3 colonne\" scrivi  2x3  e premi INVIO.")
                .T("Va bene anche con gli spazi:  2 x 3");

            // ------------------------------------------------------------------ 3
            L = new Lesson("LA POSIZIONE DEGLI ELEMENTI", 2); all.Add(L);
            L.P().H("L'INDIRIZZO DI UN ELEMENTO")
                .T("Ogni elemento ha un \"indirizzo\" fatto da due numeri: la sua RIGA e la sua COLONNA.")
                .T("Nei libri si scrive a con due numerini in basso. Qui sul terminale li scriviamo attaccati: a23 vuol dire RIGA 2, COLONNA 3.")
                .M(MI("A", "a11 a12 a13/a21 a22 a23", (r, c) => r == 1 && c == 2 ? 1 : 0))
                .T("a23 si legge \"a due tre\". Il primo numero è SEMPRE la riga.");
            L.P().H("TROVARE UN ELEMENTO")
                .M(MI("A", "5 8 1/4 9 7", (r, c) => r == 1 && c == 2 ? 1 : (r == 1 || c == 2 ? 2 : 0)))
                .T("Quanto vale a23?")
                .T("1) Scendi fino alla RIGA 2.")
                .T("2) Spostati a destra fino alla COLONNA 3.")
                .K("Dove riga e colonna si incrociano trovi il numero: a23 = 7.");
            L.P().H("AL CONTRARIO: DOVE SI TROVA?")
                .M(MI("A", "5 8 1/4 9 7", (r, c) => r == 1 && c == 1 ? 1 : 0))
                .T("Dove si trova il 9? È in riga 2 e colonna 2: è l'elemento a22.")
                .G()
                .T("Negli esercizi la posizione si scrive così:")
                .K("RIGA spazio COLONNA      esempio:  2 2");
            L.P().H("L'ERRORE PIÙ COMUNE")
                .M(MI("A", "5 8 1/4 9 7", (r, c) => r == 0 && c == 1 ? 1 : (r == 1 && c == 0 ? 2 : 0)))
                .T("a12 = 8   (riga 1, colonna 2)")
                .T("a21 = 4   (riga 2, colonna 1)")
                .G()
                .K("Scambiare riga e colonna cambia l'elemento! Ricorda: RI-CO.");

            // ------------------------------------------------------------------ 4
            L = new Lesson("I TIPI DI MATRICI (FORMA)", 3); all.Add(L);
            L.P().H("MATRICE RIGA")
                .T("Ha UNA SOLA RIGA. La sua dimensione è 1 × n.")
                .M(M("R", "3 7 1 0"))
                .H("MATRICE COLONNA")
                .T("Ha UNA SOLA COLONNA. La sua dimensione è m × 1.")
                .M(M("C", "2/9/5"));
            L.P().H("MATRICE QUADRATA")
                .T("Ha lo STESSO numero di righe e di colonne (n × n). Si dice anche che è \"di ordine n\".")
                .M(M("Q", "1 2/3 4"), "        ", M("P", "3 -1 0/2 2 8/0 5 1"))
                .T("Q è quadrata di ordine 2, P è quadrata di ordine 3.")
                .H("MATRICE RETTANGOLARE")
                .T("Il numero di righe è DIVERSO dal numero di colonne. Esempio: una 2 × 3.");
            L.P().H("MATRICE NULLA")
                .T("Tutti i suoi elementi sono ZERO. Si indica con O (la lettera o) e può avere qualsiasi dimensione.")
                .M(M("O", "0 0/0 0"), "        ", M("O", "0 0 0"))
                .T("Basta un solo numero diverso da zero e la matrice NON è più nulla.")
                .G()
                .K("Negli esercizi scegli sempre il nome PIÙ PRECISO.")
                .T("Esempio: una matrice di soli zeri 2 × 3 è rettangolare, ma il nome più preciso è NULLA.");

            // ------------------------------------------------------------------ 5
            L = new Lesson("DIAGONALI E TRACCIA", 4); all.Add(L);
            L.P().H("LA DIAGONALE PRINCIPALE")
                .T("Esiste solo nelle matrici QUADRATE. Va dall'angolo in ALTO a SINISTRA all'angolo in BASSO a DESTRA.")
                .M(MI("A", "2 5 1/0 3 8/4 6 -1", (r, c) => r == c ? 1 : 0))
                .T("I suoi elementi hanno riga = colonna: a11, a22, a33.")
                .T("Qui sono 2, 3 e -1.");
            L.P().H("LA DIAGONALE SECONDARIA")
                .T("Va dall'angolo in ALTO a DESTRA all'angolo in BASSO a SINISTRA.")
                .M(MI("A", "2 5 1/0 3 8/4 6 -1", (r, c) => r + c == 2 ? 1 : 0))
                .T("In una 3 × 3 i suoi elementi sono a13, a22, a31. Qui sono 1, 3 e 4.")
                .D("Trucco: sulla secondaria riga + colonna fa sempre n + 1 (in una 3 × 3 fa 4).");
            L.P().H("LA TRACCIA")
                .T("La TRACCIA di una matrice quadrata è la SOMMA degli elementi della diagonale principale. Si scrive tr(A).")
                .M(M("A", "2 5 1/0 3 8/4 6 -1", (r, c) => r == c ? 1 : 0))
                .K("tr(A) = 2 + 3 + (-1) = 4")
                .D("Attenzione ai negativi: sommare -1 vuol dire togliere 1.");

            // ------------------------------------------------------------------ 6
            L = new Lesson("LE MATRICI QUADRATE SPECIALI", 5); all.Add(L);
            L.P().H("TRIANGOLARE SUPERIORE")
                .T("SOTTO la diagonale principale ci sono solo zeri.")
                .M(M("U", "3 5 2/0 1 4/0 0 6", (r, c) => r > c ? 1 : 0))
                .H("TRIANGOLARE INFERIORE")
                .T("SOPRA la diagonale principale ci sono solo zeri.")
                .M(M("L", "2 0 0/7 1 0/3 5 4", (r, c) => r < c ? 1 : 0));
            L.P().H("DIAGONALE")
                .T("FUORI dalla diagonale principale ci sono solo zeri.")
                .M(M("D", "4 0 0/0 -2 0/0 0 7", (r, c) => r == c ? 1 : 0))
                .H("SCALARE")
                .T("È una diagonale in cui gli elementi della diagonale sono TUTTI UGUALI.")
                .M(M("S", "5 0/0 5", (r, c) => r == c ? 1 : 0));
            L.P().H("IDENTITÀ")
                .T("È una diagonale con tutti 1 sulla diagonale. Si indica con I (I2 se è 2 × 2, I3 se è 3 × 3, ...).")
                .M(M("I2", "1 0/0 1"), "        ", M("I3", "1 0 0/0 1 0/0 0 1"))
                .T("Fa da \"numero 1\" tra le matrici: moltiplicata per un'altra matrice la lascia uguale.");
            L.P().H("SIMMETRICA")
                .T("Gli elementi sono uguali \"allo specchio\" rispetto alla diagonale principale: aij = aji.")
                .M(MI("A", "1 7 3/7 2 5/3 5 0", (r, c) => (r == 0 && c == 1) || (r == 1 && c == 0) ? 1 : ((r == 0 && c == 2) || (r == 2 && c == 0) ? 2 : 0)))
                .T("a12 = a21 = 7      a13 = a31 = 3      a23 = a32 = 5");
            L.P().H("CHI CONTIENE CHI")
                .T("Ogni IDENTITÀ è anche SCALARE. Ogni SCALARE è anche DIAGONALE. Ogni DIAGONALE è anche triangolare (superiore e inferiore) e simmetrica.")
                .G()
                .K("Per questo negli esercizi devi scegliere il nome PIÙ PRECISO.")
                .T("Esempio: I3 è diagonale, ma il nome più preciso è IDENTITÀ.");

            // ------------------------------------------------------------------ 7
            L = new Lesson("L'UGUAGLIANZA", 6); all.Add(L);
            L.P().H("QUANDO DUE MATRICI SONO UGUALI?")
                .T("Due matrici A e B sono UGUALI se:")
                .T("1) hanno la STESSA DIMENSIONE;")
                .T("2) gli elementi nella STESSA POSIZIONE sono uguali.")
                .M(M("A", "1 2/3 4"), "   è uguale a   ", M("B", "1 2/3 4"))
                .M(M("A", "1 2/3 4"), "   è diversa da   ", M("C", "1 3/2 4", (r, c) => r != c ? 1 : 0))
                .T("A e C hanno gli stessi numeri, ma in posti diversi.");
            L.P().H("TROVARE UN NUMERO MANCANTE")
                .M(M("", "x 2/3 4", (r, c) => r == 0 && c == 0 ? 1 : 0), "  =  ", M("", "5 2/3 4", (r, c) => r == 0 && c == 0 ? 1 : 0))
                .T("Se le due matrici sono uguali, gli elementi nella stessa posizione sono uguali: x = 5.")
                .H("ATTENZIONE ALLA DIMENSIONE")
                .M(M("", "1 2 3"), "   e   ", M("", "1/2/3"))
                .T("Stessi numeri, ma una è 1 × 3 e l'altra è 3 × 1: NON sono uguali.");

            // ------------------------------------------------------------------ 8
            L = new Lesson("LA TRASPOSTA", 7); all.Add(L);
            L.P().H("SCAMBIARE RIGHE E COLONNE")
                .T("La TRASPOSTA di A si scrive A^T. Si ottiene trasformando le RIGHE in COLONNE: la riga 1 diventa la colonna 1, la riga 2 diventa la colonna 2, ...")
                .M(M("A", "1 2 3/4 5 6", (r, c) => r == 0 ? 1 : 0), "    →    ", M("A^T", "1 4/2 5/3 6", (r, c) => c == 0 ? 1 : 0))
                .T("La prima riga di A (1 2 3) è diventata la prima colonna di A^T.");
            L.P().H("DIMENSIONE E POSIZIONI")
                .T("Se A è m × n, allora A^T è n × m.  Esempio: A è 2 × 3, quindi A^T è 3 × 2.")
                .T("L'elemento in riga i, colonna j di A^T è quello in riga j, colonna i di A:")
                .K("(A^T)ij = aji")
                .M(MI("A", "1 2 3/4 5 6", (r, c) => r == 1 && c == 0 ? 1 : 0), "        ", MI("A^T", "1 4/2 5/3 6", (r, c) => r == 0 && c == 1 ? 1 : 0))
                .T("(A^T)12 = a21 = 4");
            L.P().H("TRASPOSTA E SIMMETRIA")
                .T("Una matrice è SIMMETRICA quando è uguale alla sua trasposta: A^T = A.")
                .M(M("A", "1 4/4 9"), "      ", M("A^T", "1 4/4 9"))
                .T("La trasposta di una matrice RIGA è una matrice COLONNA (e viceversa).");

            // ------------------------------------------------------------------ 9
            L = new Lesson("SOMMA E DIFFERENZA", 8); all.Add(L);
            L.P().H("SOMMARE DUE MATRICI")
                .T("Si possono sommare solo matrici con la STESSA DIMENSIONE. Si sommano gli elementi che stanno nella STESSA POSIZIONE.")
                .M(M("", "1 2/3 4", (r, c) => r == 1 && c == 0 ? 1 : 0), "  +  ", M("", "5 0/-1 2", (r, c) => r == 1 && c == 0 ? 1 : 0), "  =  ", M("", "6 2/2 6", (r, c) => r == 1 && c == 0 ? 1 : 0))
                .T("In alto a sinistra: 1 + 5 = 6.")
                .T("In basso a sinistra: 3 + (-1) = 2.")
                .D("Una 2 × 3 e una 3 × 2 NON si possono sommare.");
            L.P().H("LA DIFFERENZA")
                .T("Funziona allo stesso modo: si sottraggono gli elementi nella stessa posizione.")
                .M(M("", "7 3/2 5", (r, c) => r == 0 && c == 1 ? 1 : 0), "  -  ", M("", "1 4/2 0", (r, c) => r == 0 && c == 1 ? 1 : 0), "  =  ", M("", "6 -1/0 5", (r, c) => r == 0 && c == 1 ? 1 : 0))
                .T("In alto a destra: 3 - 4 = -1. Attenzione ai segni!")
                .G()
                .K("A + B = B + A          A + O = A   (O = matrice nulla)");

            // ------------------------------------------------------------------ 10
            L = new Lesson("IL PRODOTTO PER UNO SCALARE", 9); all.Add(L);
            L.P().H("MOLTIPLICARE PER UN NUMERO")
                .T("Uno SCALARE è un numero normale (come 3 oppure -2). Per calcolare k · A si moltiplica OGNI elemento di A per k.")
                .M("3 · ", M("", "1 -2/0 4", (r, c) => r == 0 && c == 1 ? 1 : 0), "  =  ", M("", "3 -6/0 12", (r, c) => r == 0 && c == 1 ? 1 : 0))
                .T("In alto a destra: 3 · (-2) = -6.");
            L.P().H("COSE DA RICORDARE")
                .T("- La dimensione NON cambia: se A è 2 × 3, anche 5 · A è 2 × 3.")
                .T("- (-1) · A = -A : si cambia il segno a tutti gli elementi.")
                .T("- 0 · A = O : viene la matrice nulla.")
                .M("(-1) · ", M("", "2 -5/0 3"), "  =  ", M("", "-2 5/0 -3"));

            // ------------------------------------------------------------------ 11
            L = new Lesson("PRODOTTO RIGHE PER COLONNE", 10); all.Add(L);
            L.P().H("QUANDO SI PUÒ FARE A · B?")
                .T("Il prodotto A · B si può fare solo se:")
                .K("numero di COLONNE di A  =  numero di RIGHE di B")
                .T("Il risultato ha le RIGHE di A e le COLONNE di B:")
                .K("(m × n) · (n × p)  =  m × p")
                .G()
                .T("2 × 3  ·  3 × 4   →  si può (3 = 3), viene 2 × 4")
                .T("2 × 3  ·  2 × 3   →  NON si può (3 è diverso da 2)");
            L.P().H("CALCOLARE UN ELEMENTO")
                .T("L'elemento in riga i e colonna j del risultato si ottiene \"incrociando\" la RIGA i di A con la COLONNA j di B: si moltiplicano a coppie e poi si somma.")
                .M(M("A", "1 2/3 4", (r, c) => r == 0 ? 1 : 0), "    ", M("B", "5 6/7 8", (r, c) => c == 0 ? 1 : 0))
                .T("Riga 1 di A per colonna 1 di B:")
                .K("1·5 + 2·7 = 5 + 14 = 19");
            L.P().H("IL RISULTATO COMPLETO")
                .M(M("A·B", "19 22/43 50", (r, c) => r == 0 && c == 0 ? 1 : 0))
                .T("c12 = 1·6 + 2·8 = 22")
                .T("c21 = 3·5 + 4·7 = 43")
                .T("c22 = 3·6 + 4·8 = 50")
                .G()
                .K("ATTENZIONE: di solito A · B è DIVERSO da B · A. L'ordine conta!");

            return all;
        }
    }
}
