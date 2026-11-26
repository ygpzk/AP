Aggiunta dell’utente, mentre stai già lavorando alla regia:

**Anche le sotto-pagine locali**, almeno `/muri.html`, vanno rifatte nello stesso nuovo UI (lo stile dello
screenshot). Non solo la home.

Ho aggiornato la sezione «Sotto-pagine» in `DirettaOS/MESSAGGIO-OPENCODE.md`: leggila prima di toccare
`muri.html`.

In breve:
- cambia solo markup/CSS/gerarchia visiva; **non** la logica di `muri.js`, gli ID, i listener o le funzioni;
- la tela dei muri resta il protagonista, niente pannelli che la coprono; i comandi principali devono stare
  senza scroll a 1366×768 e la tela deve restare usabile;
- riusa gli stessi token/componenti della nuova regia (testata, bottoni, leve, carte, tipografia), così sembrano
  lo stesso prodotto;
- non toccare `esterna.mjs`, `tv.html`/`tv.css` (la tv 4K) e i pezzi `/o/*`;
- per `dualsense.html` e `via/prova.html` valuta solo se ha senso: sono pagine di prova, non stravolgerle;
- la scheda della Vista esterna e `vista.html` devono seguire la stessa lingua;
- i link a `/muri.html` e `/tv` devono riusare la stessa scheda (`target="diretta-muri"` e
  `target="diretta-tv"`), non aprirne una nuova a ogni clic.

Se hai dubbi su quali altre sotto-pagine toccare, chiedi prima di perdere tempo su quelle di prova.
