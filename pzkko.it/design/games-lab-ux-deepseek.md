<!-- Specifica delle dieci app in-profile di pzkko.it (26.11.2026): motori e UX
     di DeepSeek (OpenCode), grafica e animazioni di Claude Code (VS Code).
     Non sono lo Studio (#studio) e non sono la Frontiera (/frontiera/): sono
     le dieci schede che il profilo apre con `qui:<chiave>`. -->

# Le dieci app in-profile — cosa c'è, cosa rifinire

Dieci strumenti che girano **dentro il profilo**, sopra la scheda, senza una pagina a sé e senza niente da
installare. I motori funzionano; la grafica è volutamente sobria, carta del muro + pannelli da banco, pronta per
essere rifatta. **Non riscrivere la logica dei motori**: cambia CSS, markup interno e animazioni; se manca un
aggancio, chiedilo e lo aggiungo io.

## Dove sono, e come si aprono

- Dal profilo: ogni progetto ha `play: [['…', 'qui:<chiave>']]` in `public/assets/config.js`. `openHere` in
  `public/assets/app.js` carica `/games/<chiave>/<chiave>.js` e chiama `apri()`.
- Dalla ricerca (Ctrl K) e da «da provare»: gli stessi indirizzi `qui:<chiave>`.
- Non hanno una pagina intera: sono `<dialog class="fg lab">` sopra il profilo. Non aggiungere una scheda alla
  navigazione e non duplicare gli indirizzi.
- **Non sono** lo Studio (`#studio`, `public/assets/studio/`) né la Frontiera (`/frontiera/`,
  `public/frontiera/`). I tre giri hanno motori, fogli e brief separati: non fonderli.

## File

| File | Cos'è |
|---|---|
| `public/games/lab/lab.js` | Il guscio comune: `creaFoglio()`, `tela()`, `ciclo()`, `copia()`, `stile()`, `clamp()`, `mappa()`, `hz()`, `db()`, `nota()`, `freqMidi()`. |
| `public/games/lab/lab.css` | L'impalcatura del foglio: `.fg.lab`, `.lab-corpo`, `.lab-griglia`, `.lab-colonna`, `.lab-pannello`, `.lab-tasto`, `.lab-range`, `.lab-nota`, `.lab-avviso`, `.lab-led`, `.lab-conti`, `.lab-scena`, `.lab-vuoto`. |
| `public/games/lab/audio.js` | Un solo `AudioContext` per Synth, Batteria, Theremin e Spettro: `contesto()`, `sblocca()`, `uscita()`, `sospendi()`, `rumore()`. |
| `public/games/foglio.css` | Il foglio col nastro dei tavoli: la carta `art/roulette/carta.webp`, Anton, Permanent Marker, Special Elite, il tasto nero. Lo carica `lab.js`. |
| `public/games/<chiave>/<chiave>.js` | Il motore. Esporta `apri()`; costruisce il dialogo la prima volta e lo distrugge alla chiusura. |
| `public/games/<chiave>/<chiave>.css` | Il foglio dell'app. Si carica solo quando l'app si apre. |
| `public/games/plotter/plotter.worker.js` | Il Web Worker del Plotter: calcola i tracciati fuori dal thread della pagina. |

Le chiavi sono: `synth`, `batteria`, `theremin`, `spettro`, `specchio`, `sabbia`, `plotter`, `livella`,
`dettatura`, `tavolozza`. In `config.js` hanno tutte `nuovo: '2026-11-26'`; le descrizioni stanno in
`public/assets/i18n/it.js` e `en.js` sotto `projects`.

## Il guscio: contratto

`creaFoglio({ chiave, titolo, voce, corpo })` (in `lab.js`) restituisce:

```js
{
  dlg,                 // il <dialog class="fg lab" data-app="…">
  corpo,               // .lab-corpo, dove va l'HTML dell'app
  voce(testo, scossa), // scrive .fg-voce; `scossa` è l'animazione di errore
  chiudi(),            // animazione di chiusura (rispetta reduced-motion)
  alChiudere(fn),      // ferma rAF, audio, stream, worker… alla chiusura
  apri(),              // showModal + focus sul primo controllo
}
```

Classi del guscio: `.fg.lab`, `.fg-dentro`, `.fg-testa`, `.fg-voce`, `.fg-chiudi`, `.lab-corpo`,
`.lab-griglia` (`.lab-griglia--larga`, `--sotto`), `.lab-colonna` (`--lato`), `.lab-scena`, `.lab-pannello`,
`.lab-titolo`, `.lab-fila` (`--tra`), `.lab-etichetta`, `.lab-valore`, `.lab-tasto` (`--pieno`), `.lab-link`,
`.lab-range`, `.lab-nota`, `.lab-avviso`, `.lab-riga`, `.lab-conti`, `.lab-led`, `.lab-vuoto`,
`.lab-scorri`, `.lab-solo-lettore`.

Variabili del foglio: `--lab-carta`, `--lab-inchiostro`, `--lab-matita`, `--lab-filo`, `--lab-velo`,
`--lab-accento` ( una per app, la più importante), `--lab-ok`, `--lab-attesa`. Stanno su `.fg.lab` e si possono
cambiare per app con `.fg.lab[data-app="synth"] { --lab-accento: … }`.

**Da conservare, sempre:** l'elemento `<dialog>` con `class="fg lab"` (o un suo sostituto con lo stesso
comportamento modale), `data-app`, il tasto `[data-chiudi]`, `.fg-voce[role="status"]`, la chiamata alle pulizie
alla chiusura, l'export `apri()`. Il resto — markup interno, classi, CSS — è tuo.

**Non aggiungere CSS globale.** Niente `*`, `body`, `html`, `:root`, `a`, `button`, `img` senza un contenitore
`.fg.lab` / `.lab-*`: lo stesso foglio può essere aperto mentre il profilo è in tema chiaro o scuro, e non deve
cambiarlo. I fogli dell'app sono già caricati dal motore; se ne aggiungi uno, mettilo in `games/<chiave>/` e
caricalo con `stile()`.

## Le dieci app

### 01 · synth — «Synth» (`games/synth/`)

**Cosa fa.** Sintetizzatore polifonico: due oscillatori per nota (detune), inviluppo ADSR, filtro passa-basso
risonante, arpeggiatore, tastiera del computer, piano sullo schermo e **Web MIDI** per una tastiera vera. Il suono
è tutto Web Audio; niente campioni.

**Ganci.** `.sy-scena` > `canvas[data-osc]`, `.sy-display` > `[data-nota]` e `[data-hz]`; `.sy-piano` con
`.sy-tasto.sy-bianco` / `.sy-nero` e `[data-midi]`, stato `.is-on`; pannello `[data-onde]` con `[data-onda]`
(`sine|triangle|sawtooth|square`), `[data-s]` (`detune`, `ottava`, `attacco`, `decadimento`, `sostegno`,
`rilascio`, `taglio`, `risonanza`, `volume`, `bpm`), `[data-v]` per il valore; `[data-arp]`, `[data-modo]`
(`su|giu|caso`); `[data-midi-btn]`, `[data-midi-led]`, `[data-midi-stato]`. Le impostazioni stanno in
`localStorage['pzkko-synth']`.

**Stato attuale.** Oscilloscopio nero con traccia lime, piano bianco/nero, pannelli con cursori rossi, MIDI in
fondo. La nota e la frequenza stanno in basso a sinistra; il tasto del computer è una riga di aiuto.

**Da disegnare.** Un banco di sintetizzatore, non un form: un solo pannello con serigrafie, manopole al posto dei
cursori dove ha senso, il piano che sembra vero, l'oscilloscopio come vetro verde. L'arpeggiatore può diventare una
manopola con i tre giri. Il tasto MIDI deve dire a colpo d'occhio se è collegato (led).

**Attenzione.** Il canvas deve restare figlio di `.lab-scena` (è `position:absolute`): non dargli un'altezza
intrinseca. Su telefono il piano è alto 94–124 px; le etichette delle note possono sparire sotto i 480 px.
L'audio parte solo al primo gesto (`sblocca()`), e il contesto si sospende alla chiusura.

### 02 · batteria — «Batteria» (`games/batteria/`)

**Cosa fa.** Drum machine a 16 passi, sei pezzi sintetizzati (cassa, rullante, charleston chiuso/aperto, clap,
tom), swing, volume, BPM, quattro giri pronti, memoria in `localStorage['pzkko-batteria']`. Il tempo usa il
look-ahead dell'AudioContext (25 ms di controllo, 120 ms di anticipo), non `setInterval` per il suono.

**Ganci.** `[data-play]` (testo «suona»/«ferma», `aria-pressed`), `[data-pulisci]`, `[data-contatore]`,
`[data-s]` (`bpm`, `swing`, `volume`), `.bt-griglia` con `.bt-num[data-num]`, `.bt-nome`, `.bt-pad[data-str]`
`[data-passo]` (`aria-pressed`, `.is-on`, `.is-ora` sulla colonna che suona), `[data-ascolta]` per il colpo secco,
`[data-preset]`.

**Stato attuale.** Griglia di pad colorati per pezzo, testata con play e cursori, aside con i pezzi e i giri. Il
passo che suona è evidenziato; la griglia ha `min-width:560px` e scorre dentro `.bt-scena` sul telefono.

**Da disegnare.** Il passo deve leggersi come una macchina: colonne, playhead verticale, pad che si accendono e si
spengono con un colpo, swing visibile. I pezzi possono avere simboli (cassa, rullante…). Il tasto play è il
trasporto: nero, grande, con il triangolo/quadrato. La griglia può diventare una pista da 16 con i numeri in alto.

**Attenzione.** Non cambiare le regole `data-str`/`data-passo`: il motore le usa per leggere e scrivere il
pattern. Sul telefono lo scorrimento orizzontale deve restare **dentro** la pista, non sulla pagina.

### 03 · theremin — «Theremin» (`games/theremin/`)

**Cosa fa.** Strumento gestuale: il puntatore sceglie la nota (scala pentatonica, maggiore, minore, blues,
cromatica; due ottave) e l'altezza dà il volume; sul telefono si inclina il telefono (DeviceOrientation). Un
oscillatore, un filtro, un riverbero generato al volo, tre timbri.

**Ganci.** `.th-scena` > `canvas[data-tela]`, `.th-lettura` > `[data-nota]`, `[data-hz]`; `.th-volume` >
`[data-volume]`, `[data-volume-val]`; `[data-suona]` (`aria-pressed`), `[data-stato]`, `[data-scala]`,
`[data-onda]`, `[data-spazio]`, `[data-sensori]`, `[data-sensori-stato]`.

**Stato attuale.** Campo nero con le note della scala a sinistra, la scia del dito, la linea del volume, la
lettura in alto a destra (con fondo), il tasto «suona» in basso.

**Da disegnare.** Un campo di fosforo o una lastra di theremin: le note come corde orizzontali, la mano come un
alone, il volume come una colonna di luce. La lettura deve sembrare un display, non un'etichetta. Il tasto
«suona» può diventare un interruttore a leva. I sensori meritano un tasto chiaro con lo stato.

**Attenzione.** Il canvas è `position:absolute`; la lettura è un overlay HTML. Non coprire le note in alto a
sinistra. Su telefono il campo è alto 280–320 px; il tasto deve restare raggiungibile.

### 04 · spettro — «Spettro» (`games/spettro/`)

**Cosa fa.** Analizzatore del microfono: FFT 4096, spettro logaritmico 40 Hz–16 kHz con picchi che restano,
forma d'onda, nota e centesimi, livello dB, croma e accordo probabile. L'audio resta nel browser; il microfono si
spegne alla chiusura.

**Ganci.** `[data-mic]` (`aria-pressed`), `[data-congela]`, `[data-picchi]`, `[data-stato]`; `.sp-scena` >
`canvas[data-tela]`, `.sp-lettura` > `[data-nota]`, `[data-freq]`, `[data-cents]`; `.sp-livello` >
`[data-barra]`, `[data-db]`; `.sp-vuoto[data-vuoto]`; `.sp-accordo[data-accordo]`; `.sp-croma` con
`span[data-c]` (12), `.sp-numeri` > `[data-nota2]`, `[data-freq2]`, `[data-cents2]`.

**Stato attuale.** Monitor nero, barre lime, waveform sotto, letture in alto, aside con accordo, croma, nota,
spiegazione e privacy. Senza microfono il messaggio è in `.sp-vuoto` sopra il canvas (non disegnarlo anche nel
canvas).

**Da disegnare.** Un oscilloscopio/analizzatore da laboratorio: griglia, scala dei dB, barre con un picco che
cade, la croma come 12 LED. La nota può essere il numero più grande della scheda, l'accordo il secondo. Il tasto
«accendi il microfono» deve sembrare un interruttore armato, non un bottone di form.

**Attenzione.** Il canvas va bene `position:absolute`, ma le letture HTML devono avere fondo/contrasto sufficiente
sopra le barre. Il pulsante «congela» deve cambiare testo e stato. Dopo il permesso, `el.vuoto` sparisce.

### 05 · specchio — «Specchio» (`games/specchio/`)

**Cosa fa.** Webcam con sei effetti in un frammento GLSL (WebGL 1): normale, caleidoscopio, pixel, CRT, termico,
contorni. Specchio orizzontale, «scatta» copia il fotogramma negli appunti e prepara il PNG, la camera si spegne
alla chiusura. Se WebGL non c'è, usa il Canvas 2D con un filtro semplice.

**Ganci.** `[data-camera]` (`aria-pressed`), `[data-led]`, `[data-stato]`, `[data-specchio]`, `[data-scatta]`,
`a[data-salva][download]`, `.sc-effetti` con `[data-eff]` (0…5), `.sc-scena` > `video[data-video]` (nascosto) e
`canvas[data-tela]`, `.sc-vuoto[data-vuoto]`, `.sc-eti`.

**Stato attuale.** Barra comandi con i sei effetti, stage nero, messaggio centrato, aside con la spiegazione e la
privacy. La camera non parte da sola: serve il gesto.

**Da disegnare.** Uno specchio vero, non un player: la cornice può essere un vetro/ottone, i sei effetti dei
«filtri» da specchio da bagno, il tasto scatta come un otturatore. Il caleidoscopio e il termico sono i due effetti
più scenografici: dagli una piccola anteprima/icona. «Scatta» deve avere un feedback immediato (lampo, flash).

**Attenzione.** Il canvas può essere 1×1 finché la camera non parte: non disegnare sopra il buffer senza
`dimensiona()`. Non mostrare il video fuori dal canvas. La Clipboard API può mancare: il tasto salva è il ripiego.

### 06 · sabbia — «Sabbia» (`games/sabbia/`)

**Cosa fa.** Automa cellulare 180 × 110: sabbia, acqua, pietra, olio, fuoco, fumo. La sabbia scende e affonda,
l'acqua scorre, l'olio galleggia, il fuoco accende l'olio e diventa fumo, il fumo sale. Pioggia e vulcano.
Pennello da 1 a 14, pausa, un passo, pulisci.

**Ganci.** `[data-pausa]` (`aria-pressed`, testo «pausa»/«riprendi»), `[data-passo]`, `[data-pulisci]`,
`[data-pioggia]`, `[data-vulcano]`; `.sb-materiali` con `[data-mat]` (0…6, `aria-pressed`); `[data-pennello]`,
`[data-pennello-val]`; `.sb-scena` > `canvas[data-tela]` e `i.sb-cursore[data-pennello-ind]`; `.sb-eti`;
`[data-sabbia]`, `[data-acqua]`, `[data-fuoco]`, `[data-passi]`.

**Stato attuale.** Stage nero con il mondo in scala, barra materiali, pennello, aside con i conti e le regole.
Il mondo parte con una duna e una pozza.

**Da disegnare.** Un terrario/teca da laboratorio: vetro, sabbia vera, luce dall'alto, il cursore come un dito o
una lente. I materiali possono essere barattoli o provette. «Pioggia» e «vulcano» sono i due momenti scenografici:
possono avere un'icona e un breve lampo. La scritta `180 × 110` è un dettaglio tecnico, non il titolo.

**Attenzione.** Il canvas è una griglia di byte: non cambiare le regole di `G`/`VITA`; il mondo vive in memoria e
si azzera solo con «pulisci». Il cursore è un elemento HTML sopra il canvas; il `pointermove` deve continuare a
funzionare anche con il dito. La griglia ha un rapporto 180:110, quindi sul canvas largo restano bande laterali:
puoi usare le bande per la cornice, ma non deformare il mondo.

### 07 · plotter — «Plotter» (`games/plotter/`)

**Cosa fa.** Plotter generativo in un Web Worker: flusso (campo di rumore), armoniche (pendoli di Lissajous),
truchet (piastrelle), rose (curve polari). Seme, densità, tre palette, animazione tratto per tratto, SVG da salvare
o copiare. Lo stesso seme dà lo stesso disegno.

**Ganci.** `.pl-scena` > `canvas[data-tela]`; `[data-stato]`; `[data-algo]` (`flusso|armoniche|truchet|rose`),
`[data-spiega]`, `[data-seme]`, `[data-dado]`, `[data-densita]`, `[data-densita-val]`, `[data-palette]`
(`inchiostro|botanica|sera`), `[data-disegna]`, `[data-ferma]`, `[data-svg]`, `[data-copia]`.

**Stato attuale.** Foglio chiaro dentro una cornice scura, segni di registro, targhetta con algoritmo/seme/densità,
aside con algoritmo, seme, densità, inchiostro, azioni e spiegazione. Il disegno cresce in circa 40 fotogrammi.

**Da disegnare.** Un vero plotter da tavolo: carta, squadretta, matite/inchiostri, la targhetta come un cartellino
scritto a mano, i quattro algoritmi come quattro punte. Il disegno è il protagonista: lascia respirare il foglio,
non mettere controlli sopra il canvas. L'animazione può avere una punta che traccia, non solo linee che appaiono.

**Attenzione.** Il calcolo è nel Worker: non spostarlo sul thread principale. Il canvas è `position:absolute` e
deve stare dentro `.pl-scena`. Il tasto «salva SVG» scarica un file: è voluto. Sul telefono il canvas è alto
270–320 px e i comandi vanno sotto, in colonna.

### 08 · livella — «Livella» (`games/livella/`)

**Cosa fa.** Bolla del telefono con DeviceOrientation (beta/gamma), calibrazione, bussola quando il browser dà il
nord, vibrazione quando è in bolla. Sul computer si trascina la bolla col mouse.

**Ganci.** `.lv-scena` > `.lv-vial` (anelli, mira, `.lv-bolla[data-bolla]`), `.lv-stato[data-stato]`,
`.lv-istruzioni`; `[data-beta]`, `[data-gamma]`, `[data-heading]`; `.lv-bussola` > `i.lv-ago[data-ago]` e
`[data-sensori]`, `[data-calibra]`.

**Stato attuale.** Una bolla di ottone su carta, cerchi concentrici, bolla verde, stato «in bolla», numeri e
bussola a destra. Il mouse simula l'inclinazione.

**Da disegnare.** Uno strumento da geometra: ottone, vetro, bolla vera, bussola sul coperchio. I numeri possono
stare incisi sul bordo. La vibrazione va segnalata con un piccolo «clic» visivo, non con un testo. La modalità
mouse deve essere dichiarata («prova col mouse») senza sembrare un errore.

**Attenzione.** Il sensore non c'è su desktop: non lasciare la bolla ferma senza spiegazione. `DeviceOrientation`
su iOS vuole `requestPermission()` dentro un gesto; è già nel motore. La bolla usa `--x`/`--y` (valori -1…1) e
`transform: translate(calc(var(--x) * 38%), …)`: puoi cambiare la percentuale, non il nome delle variabili.

### 09 · dettatura — «Dettatura» (`games/dettatura/`)

**Cosa fa.** Riconoscimento vocale del browser (Web Speech) in italiano, inglese, spagnolo, francese e tedesco,
punteggiatura detta a voce, conteggio, copia, rilettura con SpeechSynthesis (voce e velocità). Se il browser non
ha il riconoscimento, resta un foglio per scrivere a mano.

**Ganci.** `[data-avvia]` (`aria-pressed`), `[data-pulisci]`, `[data-led]`, `[data-stato]`, `[data-parole]`,
`[data-caratteri]`, `[data-lingua]`, `[data-punteggiatura]`, `[data-copia]`, `[data-leggi]`; `.de-foglio` >
`.de-testo[data-testo]` con `.de-finale` / `.de-provvisorio`, `textarea[data-manuale]`,
`.de-vuoto[data-vuoto]`; `[data-voce]`, `[data-velocita]`, `[data-velocita-val]`.

**Stato attuale.** Quaderno a righe, trascrizione in Special Elite, parte provvisoria in grigio corsivo, barra
comandi, aside con voce/velocità, spiegazione e privacy. La punteggiatura è una casella.

**Da disegnare.** Un quaderno vero: righe, margine rosso, inchiostro, la parte provvisoria come matita leggera.
«Ascolta» deve sembrare un registratore (pallino rosso, tempo), non un bottone. La rilettura può avere un piccolo
equalizzatore. La lingua e la punteggiatura stanno nella testata del quaderno, non in un form separato.

**Attenzione.** `data-testo` è `aria-live="polite"`: non trasformarlo in un `textarea` (la parte provvisoria deve
restare separata). Il `textarea[data-manuale]` è il ripiego: non toglierlo. La trascrizione non si salva da
nessuna parte: non aggiungere un salvataggio automatico.

### 10 · tavolozza — «Tavolozza» (`games/tavolozza/`)

**Cosa fa.** Banco di colore: un colore di partenza, armonie in OKLCH (analoga, complementare, triade, tetrade,
monocroma, libera), cromia e rotazione, cinque riquadri con hex e OKLCH, contrasto WCAG con bianco e nero, badge
AA/AAA, prova di stampa, simulazione di protanopia/deuteranopia/tritanopia, variabili CSS da copiare.

**Ganci.** `[data-colore]` (`input[type=color]`), `[data-hex]`, `[data-caso]`, `[data-copia-css]`,
`[data-stato]`; `.tv-swatches` con `.tv-sw[data-copia]` (hex), `.tv-num`, `.tv-contr`; `.tv-prova`;
`[data-armonia]`, `[data-cromia]`, `[data-cromia-val]`, `[data-ruota]`, `[data-ruota-val]`, `[data-dalto]`
(`normale|protanopia|deuteranopia|tritanopia`).

**Stato attuale.** Cinque riquadri grandi con hex/OKLCH/contrasto, una prova di stampa (sfondo, testo, due tasti,
un'ombra), comandi a destra. Su telefono i riquadri vanno a due colonne.

**Da disegnare.** Un campionario di colori da tipografia: cartelle, provini, etichette, il numero grande, il
codice in monospazio, i badge AA/AAA come timbri. La prova di stampa è il pezzo forte: falla sembrare una pagina
vera (titolo, paragrafo, tasti). La simulazione del daltonismo può cambiare l'anteprima con un'etichetta chiara
«stai vedendo…».

**Attenzione.** I cinque `.tv-sw` sono bottoni che copiano l'hex: non coprire il testo con decorazioni. I colori
mostrati nella simulazione sono simulati, ma i codici copiati sono quelli veri: scrivilo. Il contrasto è calcolato
sul colore originale, non su quello simulato. Non usare `color-mix()` per i colori veri: il motore calcola i hex.

## Regole comuni di grafica

1. **La carta è già lì.** Il foglio col nastro è condiviso con i tavoli; puoi cambiare il fondo solo dentro
   `.fg.lab[data-app="…"]`, non il foglio globale. Se serve una carta diversa, aggiungi uno pseudo-elemento
   dentro l'app.
2. **Un'accensione per app.** Ogni app ha un `--lab-accento`; usalo per il tasto principale, il LED, la traccia.
   Il resto resta inchiostro/carta.
3. **Movimento sobrio.** `prefers-reduced-motion` deve fermare oscilloscopi, scie, animazioni di ingresso e
   contatori; i canvas possono disegnare un fotogramma fermo. Niente `animation` infinita sui testi.
4. **Accessibilità.** Ogni controllo è un `<button>` vero, con `aria-pressed` quando è un interruttore e
   `aria-label` quando il testo non basta. I canvas hanno un'etichetta o un testo alternativo vicino. Il focus
   visibile non si toglie. I colori delle letture devono avere contrasto sufficiente.
5. **Niente servizi esterni.** Nessun font, icona, libreria o CDN: solo `public/`. La CSP non ammette altro.
6. **Niente scroll orizzontale sulla pagina.** Sul telefono la pagina non deve mai allargarsi; se una pista è
   larga (Batteria), lo scorrimento resta dentro il suo contenitore. Il foglio è `100dvh` e rispetta
   `safe-area-inset-*`.
7. **Chiudere è pulire.** Se aggiungi un canvas, un audio, una camera, un timer o un worker, registra la pulizia
   con `alChiudere`. La finestra viene distrutta alla chiusura e ricostruita alla prossima apertura: non contare
   su stato nel DOM tra due aperture (usa `localStorage` per le preferenze).

## Prove minime

```sh
npm run check     # CSP, nomi vietati, segreti
npm run build     # controllo + Tailwind
npm run serve     # http://localhost:5080
```

Poi, dal profilo (console del browser):

```js
document.dispatchEvent(new CustomEvent('pzkko-apri', { detail: { app: 'qui:synth' } }))
// oppure: location.hash = '#progetti/synth' e clic sul primo tasto «Gioca»
```

- **Synth**: parte l'oscilloscopio, il piano suona al clic, il tasto del computer suona, il MIDI (se c'è) collega.
- **Batteria**: play/stop, il passo si accende, i pad restano accesi, i preset cambiano il giro, lo swing si sente.
- **Theremin**: il puntatore muove la nota, l'altezza il volume, «suona» accende/spegne, i sensori su telefono.
- **Spettro**: il permesso del microfono, le barre si muovono, la nota è stabile, «congela» ferma, alla chiusura
  il microfono si spegne (icona del browser).
- **Specchio**: la camera parte solo dopo il tasto, i sei effetti cambiano, «scatta» copia o prepara il PNG, alla
  chiusura la camera si spegne.
- **Sabbia**: si disegna, la sabbia cade, l'acqua scorre, il fuoco accende l'olio, pioggia/vulcano, pulisci.
- **Plotter**: il disegno cresce, il seme cambia il disegno, «salva SVG» scarica, «copia SVG» copia, il worker non
  blocca la pagina.
- **Livella**: la bolla si muove col mouse, «calibra» azzera, su telefono i sensori e la vibrazione.
- **Dettatura**: «ascolta» chiede il permesso, la trascrizione cresce, la punteggiatura funziona, copia e rilettura.
- **Tavolozza**: cinque riquadri, il colore cambia, le armonie cambiano, il contrasto è coerente, le simulazioni
  cambiano i colori, le variabili CSS si copiano.

Controlla anche a **1280 × 800** e a **390 × 844**: nessun scroll orizzontale della pagina, tasti raggiungibili,
niente testo tagliato. Il foglio dei tavoli si carica in tema chiaro e scuro: apri un'app con il tema scuro e
verifica che il profilo sotto non cambi.

Quando la grafica è quella definitiva, cattura le schermate vere in `public/media/p/<chiave>/` (`cover.webp`
1280 × 720, `01.webp`…, `meta.json`) e lancia `npm run media`: è la regola del sito, niente disegni o
simulazioni. Prima della grafica definitiva le schede restano senza cattura, con l'arte di `config.js`.

## Cose da non fare

- Non riscrivere i motori JS, non cambiare le firme di `apri()` o `creaFoglio()`, non rinominare `data-*`.
- Non aggiungere una pagina nuova, una scheda nella navigazione o un iframe.
- Non toccare `public/assets/studio/`, `public/frontiera/` o `public/assets/provare.js`: sono altri giri.
- Non aggiungere `:root`, `body`, `html`, `*` o reset globali nel CSS.
- Non usare `innerHTML` con dati che arrivano dall'utente (il motore già fa `esc` dove serve).
- Non lasciare stream, audio, worker o `requestAnimationFrame` accesi dopo la chiusura.
- Non cambiare i testi delle i18n senza dirlo: le descrizioni di `projects` sono condivise con la scheda del
  progetto.

## Se manca un aggancio

Scrivi in `design/RISPOSTA-CLAUDE-GAMES.md`: cosa serve, su quale app, per quale stato. Se è una cosa di grafica,
aggiorna direttamente questo brief; se è un hook nuovo, lo aggiungo io nel motore con un nome nuovo e lo scrivo
qui. Lavoriamo sulle stesse dieci app, non su due copie.

— OpenCode
