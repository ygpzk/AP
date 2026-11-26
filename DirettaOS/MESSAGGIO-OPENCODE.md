# Da OpenCode a Claude Code — Vista esterna

Puoi partire. Il utente vuole che tu rifaccia **l’UI della regia e delle sue sotto-pagine locali** nello stile
dello screenshot (il Discord verde chiaro) e che unisca la UX che ho appena costruito per la **Vista esterna**.
L’UI è tua; il flusso, le API, i testi di sicurezza e il consumo restano quelli che ho già messo. Non toccare
`esterna.mjs` né il comportamento del server.

## Cosa c’è adesso

La Vista esterna è una webcam di un portatile sulla stessa rete, dentro una finestra della diretta:

1. Regia → **In rete → collega un pc**.
2. Il pannello mostra indirizzo, codice di sei cifre (10 minuti, mono-uso) e il conto alla rovescia.
3. Sul portatile si apre `https://<nome-pc>:2371`, si accetta il certificato self-signed una volta («Avanzate →
   Procedi»), si scrive il codice e si concede la webcam.
4. Al primo fotogramma la finestra si accende da sola in Camo (`/o/esterna`, dentro `/o/tutto`).
5. Dalla scheda: in onda, specchia, adatta tutta, rinomina, stacca. Si sposta e si scala come gli altri pezzi.

Stati veri già gestiti: **in attesa**, **collegata**, **in onda**, **segnale perso**, **senza codice**,
**non disponibile** (rete/cert/porta), **posto occupato** (un altro dispositivo apre la pagina mentre uno è
collegato), **staccata**. Sul portatile ci sono codice, permesso, live in onda, live solo anteprima, staccato,
posto occupato.

## Dove sta

- `pubblico/regia.html`: sezione **In rete**, riga `#pz-rete`, pulsante `#apri-vista`, dialog `#dx` (tutta la
  scheda), CSS `.dx-*`, JS `apriVista()`, `vistaMostra()`, i listener della scheda e i due intervalli.
- `pubblico/esterna.js`, `pubblico/esterna.css`: il pezzo `/o/esterna` (finestra, LIVE, attesa, persa; MJPEG).
- `pubblico/vista.html`, `vista.css`, `vista.js`: la pagina del portatile.
- `esterna.mjs`: server HTTPS del portatile, coppia, token, fotogrammi, MJPEG. **Non modificarlo.**
- `pubblico/muri.html` + `pubblico/muri.js`: l’editor dei muri, la sotto-pagina locale più importante.
- `pubblico/dualsense.html`, `pubblico/via/prova.html`: pagine locali di prova; se le tocchi, solo l’UI.
- `DESIGN-VISTA-ESTERNA.md`: la mia nota di design più dettagliata; leggila prima di rifare la scheda.

## Sotto-pagine (aggiunta dell’utente)

Non rifare solo la home: **anche le sotto-pagine locali**, almeno `/muri.html`, devono avere lo stesso UI della
nuova regia. `muri.html` è un editor complesso (tela 1920×1080, iframe dei pezzi, SVG dei muri, quattro punti,
pannello laterale): cambiagli solo markup/CSS/gerarchia visiva, non la logica di `muri.js` né gli ID/handler.
Riusa gli stessi token/componenti della nuova regia (testata, bottoni, leve, carte, tipografia) così sembrano
lo stesso prodotto.

- **Fai**: `muri.html` (e le eventuali altre pagine locali di gestione che condividono i controlli della regia:
  `dualsense.html`, `via/prova.html` se ha senso). Anche `vista.html` e la scheda/overlay della Vista esterna
  devono parlare la stessa lingua.
- **Non toccare**: `tv.html`/`tv.css` (è la tv 4K, ha un’altra distanza di lettura) e i pezzi `/o/*` (sono
  sovrimpressioni trasparenti) se non per un dettaglio concordato. `esterna.mjs` resta com’è.
- **Non perdere**: tutti gli ID, i listener e le funzioni di `muri.js`; se rinomini un elemento aggiorna anche
  il JS. La tela, i quattro punti, il trascinamento e l’anteprima dal vivo devono continuare a funzionare.
- **Stile**: la stessa nuova UI dello screenshot, ma la tela dei muri resta il protagonista (niente pannelli
  che la coprono). Su 1366×768 i comandi principali devono stare senza scroll e la tela deve restare usabile.
- **Niente tab a ogni clic**: i link a `/muri.html` e `/tv` devono riusare la stessa scheda
  (`target="diretta-muri"` e `target="diretta-tv"`), non aprirne una nuova ogni volta. Vale dalla regia e dalla
  pagina dei muri.

## Cosa deve restare (UX, non solo stile)

- **La porta d’ingresso**: «In rete» deve restare visibile e riconoscibile nella nuova regia. La riga «Vista
  esterna» deve dire a colpo d’occhio: nessun pc, in attesa, in onda, segnale perso. Il pulsante «collega un pc»
  apre la scheda; quando è collegata diventa «gestisci».
- **La scheda**: due colonne quando c’è spazio. In attesa: a sinistra indirizzo + codice + scadenza + nota
  certificato, a destra il radar e la rete. Collegata: anteprima grande a sinistra, comandi e misure a destra.
  Il codice e il pulsante chiaro devono stare sopra la piega a 1366×768.
- **La pagina del portatile**: il codice e «Accendi la webcam» devono stare sopra la piega a 1366×768; il
  codice è il momento chiave (sei caselle, incolla, auto-invio, errore che non sposta il layout). La figura a
  destra spiega «sul pc comparirà così». Il live deve sembrare un monitor acceso, non un pannello di admin.
  Deve dire sempre **in onda sul pc** / **collegato · solo anteprima** e avere **stacca la webcam**.
- **La finestra in onda**: si legge su muro bianco e scena scura, non copre la persona, sta sotto agli altri
  pezzi. «In attesa» e «segnale perso» sono stati previsti, non errori tecnici.
- **Privacy e sicurezza**: solo video, niente microfono; niente cloud; un portatile alla volta; il codice vale
  dieci minuti e una volta; il certificato è del pc e la prima visita chiede di procedere; «stacca» spegne
  davvero la webcam. Non cambiare questi testi/ comportamenti.
- **Accessibilità**: contrasto, focus visibile, `aria-live` per stato/errori, input del codice etichettati,
  `prefers-reduced-motion` per radar e pulsazioni. Non usare emoji come icone.
- **Leggerezza**: 15 fps in onda, 5 fps da sola, 960 px di larghezza, niente animazioni costose sopra il video;
  la regia non deve tenere un secondo flusso MJPEG nascosto (dentro l’iframe si usano le foto a 2 fps).

## UI: la direzione

- Prendi lo stile dello screenshot che hai in contesto (Discord verde chiaro) e applicalo a **tutta la regia**,
  non solo alla Vista esterna. Mantieni la gerarchia: anteprima grande, pannello laterale, cose veloci in alto.
- La mia UX è già «sospesa», con etichette piccole, lime e viola, testi in italiano. Unisci il tuo UI: se il
  nuovo stile è più chiaro, porta anche la scheda e la finestra nello stesso linguaggio, senza perdere i
  contrasti sul muro bianco e sulla scena scura.
- La scheda della Vista esterna può essere ridisegnata da zero, ma deve contenere tutti gli stati e i comandi
  qui sopra. Se rinomini gli ID o sposti i blocchi, aggiorna anche il JS della regia; meglio se tieni `#dx`,
  `#pz-rete`, `#apri-vista` e i blocchi esistenti per non perdere gli handler.
- Non riscrivere `regia.html` alla cieca: ho appena aggiunto la Vista esterna. Rileggi il file e integra, oppure
  rifai il layout conservando i blocchi funzionali. Se qualcosa non torna, chiedi prima di cancellare.

## Come provare

```bat
set DIRETTA_PORTA=2351
set DIRETTA_STATO=stato-prova.json
set DIRETTA_VISTA_PORTA=2372
node server.mjs --senza-camo --senza-sensori --senza-tv
```

Poi `http://localhost:2351/` → «In rete → collega un pc». Sul portatile (o in una seconda finestra Edge con
`--ignore-certificate-errors`) `https://<ip>:2372/`; per la webcam finta:
`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`.

## Fatto quando

- [ ] La nuova UI della regia è nello stile dello screenshot e non ha perso la Vista esterna.
- [ ] Posso collegare il portatile, vedere l’anteprima, accendere/spegnere, specchiare, adattare e staccare
      dalla nuova scheda.
- [ ] Gli stati «in attesa», «senza codice», «segnale perso», «non disponibile», «posto occupato» sono belli e
      chiari.
- [ ] Code/pulsante sopra la piega a 1366×768; nessun cambio di API, comportamento o consumo.

Quando hai finito, rispondi pure qui: se serve un controllo di comportamento chiama OpenCode, non cambiare
`esterna.mjs` da solo.
