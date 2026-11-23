# Da Claude Code a OpenCode — 23.11, ore 17:10: i pezzi spenti escono dal disegno (`pezzi.css`)

Alberto ha chiesto altra ottimizzazione. Ho misurato `/o/tutto` in onda: **366 livelli** della scheda video (168 MB), 300
dei quali di pezzi spenti (quadro 52, fine 42, dovevivo 40, surf 22, azienda, argomento…), e l'albero dei livelli
rifatto a ogni fotogramma (13% di un core) perché i pezzi che ruotano mossi dal giro non passano dalla via veloce.

- **Cosa ho cambiato**, solo in `pubblico/pezzi.css` (più una riga in `pezzi.js`): `.pezzo .aria` è
  `visibility: hidden` quando il pezzo è spento (1,5 s dopo, finita l'uscita) e `inherit` quando è acceso o lo
  trascini; lo stesso per `.cornice` e `.sfondo-via`. In `mascheraPersone` la tela ha `willReadFrequently`.
  Risultato: 366 → 63 livelli, 168 → 26 MB, filo principale 31% → 16%. Copie:
  `copie/pezzi-prima-livelli-2026-11-23.css` e `.js`.
- **Per i tuoi pezzi** (`pc.css`, `scene.css`, `esterna.css`, che non ho toccato): dentro un pezzo non mettere
  `visibility: visible`, lo farebbe disegnare anche da spento (`.dx-luce` in `esterna.css` lo fa, ma solo con
  `ha-foto`: va bene). Le misure non cambiano, `offsetWidth` e `getBoundingClientRect` rispondono come prima.
- **Se vuoi alleggerire ancora `pc.css`**: `ap-onda`, `ap-respira` e `pc-gira` ruotano; mossi dal freno di
  `giro.js` fanno rifare i livelli a ogni fotogramma (adesso costa poco, 2%). E `.pc-ico-vivo` e `.pc-quadrante`
  si ridipingono 60 volte al secondo anche quando il numero non cambia.
- **Ho riavviato il server alle 17:04** con `riavvia.cmd` (nessun portatile collegato, nessuna chiamata): sono
  partiti anche i tuoi `esterna.mjs` e `macchina.mjs` di oggi e la mia azione `regola`. Log pulito.
- Sulla webcam a 1080p60: dai log di Discord, Camo gli dà già 1920 × 1080 a 60 fissi; è Discord che la codifica a
  720p30 (l'ho scritto nel README, sotto «Discord: il massimo che legge»).

---

# Da Claude Code a OpenCode — 23.11, ore 15:32: `pubblico/regia.html` è quella nuova (a zone)

Alberto mi ha chiesto di rifare la regia a **zone** (Sorgenti · Monitor · Controlli a schede · Proprietà), con nomi
tecnici e, per ogni sorgente, le regolazioni di Camo (opacità, luminosità, contrasto…) più rotazione e specchio.
**Scritta alle 15:25** (ritocchi fino alle 15:31). Niente di tuo è andato perso:

- **Il dialogo `#dx` è il tuo, intero**, preso dal file com'era alle 15:24 (senza codice di pairing), e così tutto lo
  `<script>` (`apriVista`, `vistaMostra`…), con le mie aggiunte in fondo. Il CSS dei `dx-*` l'ho riscritto a variabili
  (`--avv-t`, `--avv-f`, `--err-t`, `--err-f` per avvisi ed errori): le classi sono le stesse. Sono rimaste nel CSS
  anche `.dx-codice` e `.dx-scadenza`, che non usi più: toglile pure.
- **Per altre modifiche parti dal file nuovo.** Gli ID sono quelli di prima (`#dx…`, `#apri-vista`, `#dx-apri`,
  `#dx-gestisci`, `#dx-dice-scheda`, `#pz-rete`). Cambiati: l'elenco non sparisce più quando selezioni (la scheda sta a
  destra, `#prop`); `#sc-av` non c'è più (`#sc-led`); i «torno subito», il podcast e la tv stanno nel dock
  (`[data-dock]`); le impostazioni sono a pagine (`[data-imp]`, `impApri('tv')`).
- La regia di prima, con le tue modifiche delle 15:24: `copie/regia-prima-zone-2026-11-23-b.html`. Le altre copie:
  `copie/*-prima-zone-2026-11-23.*`.
- File miei nuovi: `pubblico/regola.js`, `pubblico/nomi-tecnici.js`. Ho toccato anche `server.mjs` (`stato.regola`,
  azione `regola`, evento SSE `regola`: tre punti, cercali con «regola»), `pubblico/pezzi.js` (`regolaMetti`,
  `window.__regola`, `giro` in `__pezzi`), `pubblico/pezzi.css` (`--op` e `--reg` su `.dentro`), `pubblico/muri.html`
  (nomi tecnici, foglio `#tema-scuro`) e il README («La regia»). Non ho toccato `esterna.mjs`, `vista.*`,
  `esterna.*`, `scene.*`.
- **Non ho riavviato il server**: alle 15:29 «Pavillion» era collegato e in onda, e tu stai cambiando `esterna.mjs`.
  Finché non si riavvia, la regia nuova funziona ma rotazione libera e regolazioni non si salvano (lo dice lei nella
  riga di stato). Al prossimo riavvio (tuo o di Alberto) parte anche la mia azione; poi in Camo va ricaricato il
  livello web, perché prenda `pezzi.js` e `pezzi.css` nuovi.

---

# Da Claude Code a OpenCode — la regia nuova

Fatto: la regia ha lo stile del Discord verde chiaro dello screenshot, **solo UI**, e la Vista esterna c'è tutta.
Ho toccato `pubblico/regia.html`, `pubblico/muri.html`, `pubblico/vista.css` (solo i colori) e il README. `esterna.mjs`,
il server, `vista.html`, `vista.js` ed `esterna.*` sono come li hai lasciati. Le pagine di prima sono in `copie/`
(`regia-prima-stile-discord-2026-11-22.html` e le altre due con lo stesso nome).

## Cosa è cambiato in `regia.html`

- **Tutto il CSS.** I colori sono variabili in `:root` (`--rail`, `--lato`, `--fondo`, `--carta`, testo quasi nero,
  `--blu` per i tasti forti). `--p` (lime) resta solo per quello che si disegna sopra la webcam.
- **L'impaginazione**: striscia del titolo, colonna delle icone (`.rail`), colonna dei pezzi a **sinistra** (`#lato`,
  con «Trova un pezzo»), riquadro in basso a sinistra (`.pannello`: `#filo`, `#occhio-chip`, `#cam`, `#gpu`,
  `#apri-imp`), banco a destra (`.testa`, anteprima, riga `.dice-r` con `#aiuto` e `#annulla`).
- **Gli ID sono tutti quelli di prima** (`#dx` e i suoi blocchi, `#pz-rete`, `#apri-vista`, `#dx-apri`,
  `#dx-gestisci`…): nessun handler perso. `#grandezze` e `#tutti-posto` ora sono le due righe in cima alla lista.
- **JS aggiunto, solo di aspetto**: le faccine dei pezzi (`TINTE`, `tintaDi`, `iniziale`, dentro `riga()`), la classe
  `su` sulle righe accese, `railMostra()` (i numeri sulle icone), il clic sulle icone (scorre alla sezione), il filtro
  `#cerca`. «Segnale perso» nella scheda del pezzo usa `var(--arancio)` al posto di `#ffb37a`, che sul chiaro non si
  leggeva.

## Provato

Su una copia (regia 2353, vista 2373, webcam finta di Edge, 1366 × 768):

- codice → permesso → «in onda sul pc» sul portatile;
- in regia: riga «in attesa» → collegata, `#apri-vista` diventa «gestisci», anteprima, in onda / specchia / adatta;
- portatile chiuso di colpo → «segnale perso» col banner; «stacca» → «senza codice».

A 1366 × 768 il codice e i tasti stanno sopra la piega. Sotto i 760 px di altezza la scheda si stringe: spariscono i
paragrafi sotto i due passi; i testi di sicurezza (certificato, «stacca») restano.

## Sotto-pagine (la tua aggiunta)

- **`muri.html`**: rifatto con gli stessi colori e gli stessi pezzi della regia (striscia, colonna delle icone, colonna a
  sinistra con foto / muri / obiettivo / realismo / pezzi, riquadro in basso col filo e «torna alla regia», barra del
  banco con lente, foto / dal vivo, «annulla», «+ nuovo muro»). Solo stile e impaginazione: lo script è identico byte
  per byte a prima e tutti gli ID ci sono. I due interruttori («anche i pezzi spenti», «mostra i muri») stanno nella
  riga sotto la tela. A 1366 × 768 la tela è 885 × 498 e la riga sotto finisce a 645 px: niente scroll. Provato: i
  muri si disegnano, la lista e i pezzi si riempiono, «+ nuovo muro» si accende. Copia: `copie/muri-prima-stile-discord-2026-11-22.html`.
- **`vista.css`** (la pagina del portatile): solo i colori, portati su quelli della regia; `vista.html` e `vista.js` non
  toccati, impaginazione e testi tuoi. La webcam e la finestra disegnata restano scure (sono video). Provati con la
  webcam finta: codice, permesso, live «in onda sul pc», «webcam spenta». Copia: `copie/vista-prima-stile-discord-2026-11-22.css`.
- **Non toccate**: `dualsense.html` e `via/prova.html` (pagine di prova), `tv.*`, i pezzi `/o/*` (quindi anche
  `esterna.css`), `esterna.mjs`.

## Non fatto

- Il pezzo in onda (`esterna.css`) è com'era: è una sovrimpressione, vive sopra la webcam.
- Lo stato «non disponibile» (rete, certificato, porta) e «posto occupato» li ho ridisegnati ma non li ho visti dal
  vero: nella prova la porta era libera e il portatile era uno solo.
- Non ho riavviato il server vero: c'era un portatile collegato e riavviare lo avrebbe staccato. Alla regia basta
  ricaricare la pagina.

---

# Da Claude Code a OpenCode — la scritta da videosorveglianza (23 nov, 00:20)

Mentre lavori al filtro della webcam del pc 2, l'utente mi ha chiesto una scritta da videosorveglianza sulla Vista
esterna. **Non ho toccato `esterna.js` né `esterna.css`**: la scritta vive in due file nuovi.

- `pubblico/sorveglianza.js`: `sorveglianza(vista)` aggiunge `.dx-osd` dentro `.dx-finestra`, mette la classe `osd`
  su `.dx` e avvolge `vista.aggiorna` (chiama la tua, poi legge `el.dataset.stato`). Data e ora in alto a sinistra,
  «● REC» / «SEGNALE PERSO» / «NO VIDEO» in alto a destra, «CAM 02 ESTERNO» in basso a destra. Un solo timer ogni
  mezzo secondo (ora + lampeggio), fermo quando il pezzo è spento; niente animazioni CSS.
- `pubblico/sorveglianza.css`: lo stile. **Tre regole toccano i tuoi elementi**, in fondo al file:
  `.dx.osd .dx-live` e `.dx.osd .dx-pillola` → `display: none` (li sostituisce il REC), `.dx.osd .dx-luce` scende in
  basso a sinistra (`top: auto; bottom: 12px`). Se rinomini queste classi o vuoi riaverli, cambia solo quelle righe.
- Aggancio: `pezzi.js` (import + `fatti.esterna = () => (vistaEsterna = sorveglianza(creaEsterna())).el`) e
  `pezzo.html` (il `<link>` a `/sorveglianza.css`). Copie: `copie/*-prima-sorveglianza-2026-11-23.*`.
- Non ho riavviato: il portatile «Pavillion» è collegato e solo `pubblico/` è cambiato.
