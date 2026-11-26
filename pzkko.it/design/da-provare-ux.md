# «da provare» — UX (DeepSeek) → grafica (Claude)

Questo è il passaggio di consegne per la zona **«da provare»** della bacheca
(`<section class="annunci" id="annunci">`). DeepSeek ha fatto il comportamento,
Claude disegna sopra. Il codice sta in `public/assets/provare.js` (nuovo) e in
alcuni punti di `public/assets/app.js`; la struttura CSS minima è in fondo a
`src/site.css` nel blocco marcato `/* ── UX «da provare» (DeepSeek) … ── */`.
La grafica di Claude sta in `public/assets/provare-arte.js` (un modulo che
ascolta gli eventi sotto, caricato una volta sola da `provare.js`).

## Secondo giro (26.11): cosa è cambiato e cosa ho deciso

Claude ha provato il motore in un browser vero e ha segnalato tre difetti e
due scelte di UX da rivedere. Ecco le decisioni.

- **Difetto 1 — i tempi letti male.** Il CSS pubblicato è compresso da
  Tailwind: `--pz-scambio: 560ms` diventa `.56s`, `--pz-respiro: 5200ms`
  diventa `5.2s`. `parseFloat` leggeva 0,56 ms e 5,2 ms: cambio istantaneo e
  giro a ogni battito. Ora `leggiMs()` legge l'unità (`s` → ×1000, `ms` o
  niente → millisecondi), così `.56s` torna 560 ms e `5.2s` torna 5200 ms.
- **Difetto 2 — timer che sopravvivono al ridisegno.** Ogni `monta` incrementa
  un numero di generazione (`gen`); tutti i `setTimeout` (in `scambia`,
  `segnaAppena`, `reagisci`, `aggiornaTessera`, `aggiornaStato`, il nastro
  `data-ritorno`) scattano solo se `gen` è ancora quello (`vivo(g)`). Un timer
  della generazione vecchia non tocca più il muro nuovo.
- **Difetto 3 — il timbro sotto il dialog.** Ho scelto di timbrare **solo alla
  chiusura**: `segna()` (all'apertura) non chiama più `reagisci(…, 'aperta')`,
  registra soltanto l'uso e la tessera si ridisegna quando torni in bacheca
  (`reagisci(…, 'chiusa')`). Così il «pop» del buco si vede davvero, e non
  riparte due volte.
- **Scelta 4 — il comando a mano cambia tutta la fila.** Prima «avanti»/trascina
  cambiava un solo volantino. Ora il comando dell'utente cambia **tutti e 4**,
  uno dopo l'altro con `--pz-sfalsa` (lo sfalsamento è mio: `setTimeout`
  spaziati da `--pz-sfalsa`, default 90 ms; il tempo totale resta letto dal CSS
  perché `--pz-scambio` e `--pz-sfalsa` vengono entrambi dal CSS). Il giro
  automatico resta uno alla volta. **«Indietro» è una cronologia vera e corta**
  (`storia`, fino a 6 scatti): riporta i 4 volantini di prima, non ne pesca di
  nuovi.
- **Scelta 5 — la nota d'uso su ogni volantino.** In `flyerHtml` c'è ora
  `<p class="fly__nota">…</p>` (vuota = non c'è), coi testi in `SPOT` (it/en).
  Soglie mie: mai aperta → `notaMai`; ≥5 volte → `notaPreferita` («la tua
  preferita»); aperta oggi → `notaOggi`; ieri → `notaIeri`; una volta →
  `notaUna`; altrimenti `notaVolte(n)`. Niente che suoni da rimprovero.

## Cosa ho fatto e perché (due righe l'una)

- **Il muro è una finestra su una pila ordinata.** Le 26 app formano una pila
  (`deck`) riordinata in base all'uso; i 4 volantini mostrano le prime 4, e un
  volantino alla volta esce mentre uno nuovo entra. Così tutte le 26 passano dal
  muro senza che diventi una lista.
- **Il cambio è a due tempi con durata nel CSS.** Prima il volantino esce
  (`data-stato="uscendo"` + `data-motivo` + `.is-out`), poi il contenuto cambia
  e il nuovo entra (`entrando` + `.is-in`), poi torna `pronto` (il `data-motivo`
  si toglie). La durata sta in `--pz-scambio` (letta dal JS con un tempo di
  sicurezza: se il CSS non c'è, niente resta bloccato).
- **L'ordine della pila segue l'uso.** Mai provate prima (le nuove davanti), poi
  le provate: riemergono prima quelle che non vedi da un po' e quelle che usi di
  più; se usi quasi solo un genere, le mai-provate di quel genere salgono. Un
  seme giornaliero tiene l'ordine stabile nella giornata ma diverso ogni giorno.
- **La zona reagisce a quello che fai.** Alla chiusura di un'app (il momento in
  cui torni in bacheca) la tessera si timbra (il buco fa «pop») e il volantino
  appena usato si ridisegna col timbro «provata ✓», resta un attimo in evidenza
  e poi esce, portando dentro il prossimo (preferendo lo stesso genere). Si
  registrano anche quante volte, quando e quanto è durata.
- **Il giro da solo si ferma quando non deve girare.** Niente auto-cambio con
  `prefers-reduced-motion` (i cambi restano ma istantanei), con rete debole
  (`heavy` falso), con un dialog/ricerca/menu/finestra aperta (`occupato()`),
  con la bacheca non attiva, la scheda nascosta, la zona fuori vista, il mouse
  sopra o il fuoco dentro. Il comando manuale (tasti, trascina, frecce) resta
  sempre.
- **Si comanda con mouse, tocco e tastiera.** Trascina orizzontale (solo tocco),
  frecce sinistra/destra sulla fila, due tasti avanti/indietro; un solo
  `aria-live` educato che annuncia solo i cambi dell'utente, mai il giro
  automatico (niente annunci a raffica).
- **Niente doppioni e niente timer orfani.** Ogni `monta` fa prima `smonta`
  (AbortController per gli ascoltatori, `clearInterval` per il battito, e
  `gen++` per invalidare i timer in volo): quando `renderBoard` rifà l'HTML, la
  zona riparte pulita. `pzkko-provate` resta com'era (un array di target); i
  numeri in più stanno in `pzkko-app-stats` e `pzkko-app-ultima`.

## I ganci (tutti)

Su cosa, quando si mette, quando si toglie, quanto dura, cosa vuol dire.

| Gancio | Elemento | Si mette | Si toglie | Dura | Vuol dire |
|---|---|---|---|---|---|
| `data-provare="1"` | `#annunci` | a ogni `monta` | mai (finché montata) | — | la zona è viva, il motore gira |
| `data-stato="gira"` | `#annunci` | quando il giro può andare | — | — | sta girando da sola |
| `data-stato="pausa"` | `#annunci` | mouse sopra o fuoco dentro | al leave/blur | — | ferma finché ci sei sopra |
| `data-stato="fermo"` | `#annunci` | rete debole, bacheca non attiva, scheda nascosta, zona fuori vista, `occupato()` | quando la condizione passa | — | niente giro automatico |
| `data-completo="1"` | `#annunci` | quando hai provato tutte le 26 | mai (finché è vero) | — | tessera piena |
| `data-festa="1"` | `#annunci` | quando la tessera diventa piena ADESSO (all'ultima chiusura) | dopo ~6 s | ~6 s | la festa, una volta sola |
| `data-ritorno="1"` | `#annunci` | al monta, se manchi da più di 2 giorni | dopo ~5 s | ~5 s | «bentornato»: un gancio per un tocco di benvenuto |
| `data-provare-fila` + `role="group"` + `tabindex="0"` + `aria-label` | `.annunci__fila` | a ogni monta | — | — | la fila è un gruppo raggiungibile da tastiera; frecce → cambia |
| `data-app="<key>"` | ogni `.fly` (anche volantino e «prova anche») | in `flyerHtml` | — | — | quale app è il volantino |
| `data-genere="game\|tool\|site"` | ogni `.fly` | in `flyerHtml` | — | — | il genere, per stili/timbri diversi |
| `data-uso="nuova\|mai\|provata"` | ogni `.fly` | in `flyerHtml` | — | — | nuova = app nuova mai provata; mai = mai provata; provata |
| `data-volte="<n>"` | ogni `.fly` | in `flyerHtml` | — | — | quante volte l'hai aperta (0 se mai) |
| `.fly__nota` | ogni `.fly` | in `flyerHtml` (vuota = assente) | — | — | la riga scritta a mano che cambia con l'uso |
| `data-slot="0..3"` | le 4 `.fly` del muro | al monta e a ogni ricostruzione | — | — | la posizione fissa (la rotazione `--r` segue il posto, non l'app) |
| `data-stato="pronto"` | la `.fly` | stato base | quando esce/appena | — | ferma, interattiva |
| `data-stato="uscendo"` + `.is-out` | la `.fly` | all'inizio del cambio | quando il contenuto cambia | `--pz-scambio` (560 ms) | sta uscendo (non risponde ai clic) |
| `data-stato="entrando"` + `.is-in` | la `.fly` nuova | quando il contenuto cambia | a fine entrata | `--pz-scambio` | sta entrando |
| `data-stato="appena"` + `.is-appena` | la `.fly` appena usata | alla chiusura dell'app, se è in vista | ~1,4 s, o quando esce | ~1,4 s | «l'hai appena usata», col timbro «provata ✓» |
| `data-motivo="giro\|mano\|usata"` | la `.fly` che esce E quella che entra | per tutto il cambio | a `pronto` | il cambio | `giro` = automatico, `mano` = comando dell'utente, `usata` = tornato da quell'app |
| `data-prossimo="1"` | la `.fly` dello slot del cursore | quando parte il conto (si azzera `ultimo`) | quando esce | fino al prossimo giro | la prossima a cambiare nel giro automatico: il nastro che si stacca per `--pz-respiro` |
| `--dir` (`-1\|1\|0`) | la `.fly` | durante uscendo/entrando; `0` da ferma | a `pronto` | il cambio | direzione del movimento (in linea) |
| `--ritardo` (`0ms`) | la `.fly` | sempre, `0ms` | — | — | ritardo di scena (pronto per Claude se vuole sfalsare) |
| `data-stato="incompleta\|piena"` | `.tessera` | in `tesseraHtml` | — | — | stato della tessera |
| `data-pieni` / `data-totale` | `.tessera` | in `tesseraHtml` | — | — | N su 26, per stili/grafiche |
| `--timbro-ritardo` (`<ms>`, in linea) | `.tessera` appena ridisegnata | a ogni `aggiornaTessera` | — | — | quando il buco deve timbrarsi davvero: se l'app è in vista `--pz-appena`+`--pz-scambio`, altrimenti `0ms` |
| `data-app="<key>"` | ogni `i` di `.tessera__buchi` | in `tesseraHtml` | — | — | quale app è quel buco |
| `on` | l'`i` del buco | quando l'app è provata | mai (finché è vero) | — | buco timbrato (regola esistente) |
| `is-nuova` | l'`i` del buco | quando si timbra adesso | dopo `ritardo + 1,6 s` | `ritardo + 1,6 s` | «buco appena timbrato»: il pop (il CSS può animare il pop con `animation-delay: var(--timbro-ritardo)`) |
| `data-provare-prev` / `data-provare-next` | i due tasti di `.annunci__comandi` | al monta | — | — | avanti / indietro |
| `.annunci__live` (`role="status"`, `.sr`) | in fondo alla zona | al monta | — | — | l'annuncio educato per i lettori di schermo |

## Variabili CSS

- **Lettura (dal JS):** `--pz-scambio` (quanto dura il cambio di un volantino;
  default `560ms`, `0ms` con `prefers-reduced-motion`), `--pz-respiro` (ogni
  quanto il muro gira da solo; default `5200ms`), `--pz-appena` (l'attesa prima
  che il volantino appena usato esca; default `1000ms`), `--pz-sfalsa` (lo
  sfalsamento tra i volantini nel cambio a mano; default `90ms`). Stanno su
  `.annunci` e Claude può ritoccarle lì. Il JS legge l'unità (`s`/`ms`), quindi
  può stare anche compresso (`.56s`, `5.2s`).
- **Scrittura (sulle `.fly`, in linea):** `--dir` (`-1`/`1`/`0`) e `--ritardo`
  (in ms). Servono alla grafica per la direzione e l'eventuale sfalsamento.
- **Scrittura (sulla `.tessera`, in linea):** `--timbro-ritardo` (in ms), per
  il momento del pop del buco appena timbrato.

## Eventi

- **Ascolto** (sulla zona, con `AbortController`): `pointerdown/move/up/cancel`
  sulla fila (trascinamento), `keydown` (frecce), `click` (tasti e inghiottire
  il clic dopo un trascinamento), `pointerenter/leave` (pausa su hover),
  `focusin/out` (pausa da tastiera), un `IntersectionObserver` (in/fuori vista)
  e un `setInterval` da 400 ms che decide quando girare.
- **Emessi** (tutti `CustomEvent` su `#annunci` con `bubbles: true`, così
  `provare-arte.js` li ascolta su `document`):
  - `provare:monta` → `detail: { zone }`, alla fine di `monta()`, dopo che
    `import('./provare-arte.js')` è riuscito (così arriva anche a chi si collega
    dopo; c'è anche `provare.zona()` che restituisce `#annunci` montato).
  - `provare:esce` → `{ slot, via, dir, motivo, el }`, nell'istante in cui il
    volantino comincia a uscire (`el` è il volantino che esce).
  - `provare:scambio` → `{ slot, via, entra, dir, motivo, el }`, quando il
    contenuto è cambiato (`el` è il volantino nuovo che entra).
  - `provare:timbro` → `{ chiavi, ritardo }`, quando la tessera viene ridisegnata
    con un buco `is-nuova` (`chiavi` sono le chiavi dell'app appena chiusa).
- **Richiamo da `app.js`** (non sono eventi DOM, ma è qui che il motore entra):
  `provare.aperta(target)` all'apertura, `provare.chiusa(target)` alla chiusura,
  `provare.reagisci(target, motivo)` per far reagire il muro (di norma `'chiusa'`),
  `provare.scegli(tranne)` per il volantino in basso, `provare.monta(root, deps)`
  in `renderBoard()`, `provare.zona()` per la zona montata.

## Cosa mi aspetto che la grafica renda visibile

1. **`uscendo`** → il volantino se ne va secondo `--dir` (scivola/fugge/ruota),
   non risponde; **`entrando`** → il nuovo arriva dalla parte opposta. Il cambio
   dura esattamente `--pz-scambio` (il JS lo aspetta per cambiare il contenuto).
   **Tre uscite diverse** a seconda di `data-motivo`: `giro` si stacca dal muro
   e cade, `mano` vola via di lato secondo `--dir`, `usata` vola dentro la
   tessera.
2. **`appena`** → il volantino appena usato mostra il timbro verde «provata ✓»
   che si stampa (sbattendo, come un timbro) e resta un attimo in evidenza.
3. **`is-nuova` sul buco** → il tondo della tessera si riempie «timbrato» con un
   piccolo effetto (pop/timbro), uno solo alla volta. Il pop può partire in
   ritardo con `animation-delay: var(--timbro-ritardo)` e `is-nuova` resta su
   per `ritardo + 1600 ms`.
4. **`data-prossimo`** → il nastro che si stacca piano per `--pz-respiro`
   (animare solo sotto `[data-stato="gira"]`); il conto e il gancio partono
   insieme.
5. **`data-uso` / `data-volte` / `.fly__nota`** → una piccola differenza di
   stile tra nuova/mai/provata e la riga scritta a mano con la nota d'uso.
6. **`data-ritorno`** → un tocco di benvenuto se manchi da giorni (es. un nastro
   «bentornato» che si stacca). È transitorio: sparisce da solo.
7. **`data-completo` / `data-festa`** → quando la tessera è piena, la zona può
   festeggiare in modo diverso (il testo «tessera piena» c'è già); `data-festa`
   è il gancio per la festa una volta sola, ~6 s.
8. **`pausa`/`fermo`** → eventualmente un'aria più ferma (niente movimento), ma
   il contenuto non cambia da solo.
9. **I tasti avanti/indietro** → li ho posizionati solo come scheletro (in
   `src/site.css`, blocco marcato): a Claude tocca l'aspetto e la posizione fine,
   anche sul telefono dove la fila va a 2 colonne.

**Niente grafica da parte mia:** nel blocco CSS di DeepSeek non ci sono colori,
caratteri o keyframe; i movimenti (con `--pz-scambio`, `--pz-appena`,
`--pz-sfalsa`) sono tutti da disegnare sui ganci qui sopra. Senza il tuo CSS, il
cambio è una pausa (560 ms) e poi il contenuto cambia: è la base, non un difetto.

## Come provare a mano

- **`?provare=veloce`** → il muro gira ogni 900 ms (per vedere il cambio subito).
- **`?provare=fermo`** → niente giro automatico (solo comandi manuali).
- **`?provare=azzera`** → svuota `pzkko-provate`, `pzkko-app-stats` e
  `pzkko-app-ultima` (poi ricarica). Solo per prove.
- **Da console** (c'è `window.provare`): `provare.stato()` mostra pila, visibili,
  numeri e lunghezza della cronologia; `provare.avanza()` cambia un volantino
  (giro automatico); `provare.indietro()` fa il comando indietro (cronologia);
  `provare.azzera()` ripulisce; `provare.aperta('qui:parole')` e
  `provare.chiusa('qui:parole')` simulano l'uso; `provare.reagisci('qui:parole','chiusa')`
  simula il ritorno da un'app; `provare.zona()` restituisce `#annunci`.
- **Stati da vedere:** apri un'app (dalla bacheca) e chiudila → tessera che si
  timbra (al ritorno) e volantino appena usato che esce. Apri tutte le 26 →
  `data-completo` e, all'ultima chiusura, `data-festa`. Tieni il mouse sulla
  zona → `data-stato="pausa"`. Scorri la zona fuori dallo schermo →
  `data-stato="fermo"`. Imposta il sistema su `prefers-reduced-motion` → i cambi
  diventano istantanei. Comando avanti → cambia tutti e 4; indietro → riporta i
  precedenti.

## Dubbi rimasti

- **Il ritmo.** `--pz-scambio` 560 ms, `--pz-respiro` 5200 ms, `--pz-appena`
  1000 ms e `--pz-sfalsa` 90 ms sono una base: tu (Claude) puoi cambiarli nel
  CSS e il JS li segue da solo. Vedi se il muro «gira» alla velocità giusta e se
  lo sfalsamento del cambio a mano è piacevole.
- **La cronologia è corta e approssimata.** Salvo i 4 volantini di prima (fino
  a 6 scatti) e il puntatore della pila; se nel frattempo la pila si riordina,
  il ripristino dei volantini è esatto ma il puntatore è indicativo (i pescaggi
  successivi evitano comunque le chiavi visibili e recenti).
- **Il peso di genere è una soglia (2×).** Se usi quasi solo giochi, spingo
  prima i giochi mai provati; la soglia è in `pesoApp()` e si può ritoccare.
- **La durata è approssimata.** Conto dall'apertura alla chiusura del dialog /
  della finestra; per i tavoli e le app `qui:` va bene, ma non è un cronometro
  esatto.
- **Solo CSS, niente suono.** Ho messo gli eventi (`provare:esce`, `provare:scambio`,
  `provare:timbro`, `provare:monta`) per chi volesse agganciare qualcosa fuori
  dal CSS; non li ho usati.
- **I tasti avanti/indietro** sono uno scheletro: sul telefono (2 colonne)
  possono stare stretti, valuta tu dove metterli.

## La grafica (Claude, 26.11.2026)

Sopra i ganci qui sopra, senza toccare `provare.js`. Dove sta:

- `public/assets/provare.css`: tutto l'aspetto e i movimenti (classi e keyframe `pza-*`). Non passa da Tailwind e
  non sta in `src/site.css` (lo riscrivono più sessioni insieme). In `src/site.css` c'è solo un blocco piccolo
  marcato «da provare: la grafica (Claude)»: l'attesa prima che la grafica accenda la zona e la nota `.fly__nota`.
- `public/assets/provare-arte.js`: ascolta `provare:monta/esce/scambio/timbro`, carica lo stile e mette
  `data-arte` sulla zona (`attesa` → `entra` quando arriva in vista → `1`). Aggiunge solo pezzi decorativi:
  `.pza-porta` (la cornice della tessera, col nastro) e `.pza-penna`, `.pza-resto` (la carta rimasta sotto il nastro),
  `.pza-pioggia` (le fiches della festa), le classi `is-qui`, `is-trema`, `is-colpo`, e `--tx/--ty` sul volantino
  che vola nella tessera.

Cosa si vede: `giro` = il volantino segnato `data-prossimo` cede dal nastro per `--pz-respiro`, poi si strappa e cade;
`mano` = la fila vola via di lato secondo `--dir`; `usata` = timbro verde, evidenziatore sul nome, volo dentro il suo
buco della tessera, che si timbra a `--timbro-ritardo`. `data-uso="provata"` = orecchia piegata; `nuova` = il timbro
rosso non sta fermo. `data-festa` = fiches; `data-ritorno` = «rieccoti!».

Tempi ritoccati dal CSS (il motore li legge): `--pz-respiro: 6200ms`, `--pz-appena: 1150ms`.

Una cosa cambiata fuori dalla grafica: in `app.js` `stampHtml` ora mette il timbro verde «provata ✓» anche alle app
nuove già provate (prima vinceva «nuovo»): è lo stesso conto di `data-uso`.

Provato in Edge (headless, filmando): entrata, giro col conto, cambio a mano, strisciata col dito a 390 px, ritorno
da un'app vera (Angoli) col volantino in basso, festa, bentornato, tema scuro, `prefers-reduced-motion`. Con e senza
grafica la pagina tiene gli stessi fotogrammi al secondo.
