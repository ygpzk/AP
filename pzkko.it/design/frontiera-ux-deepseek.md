<!-- Specifica della Frontiera di pzkko.it (26.11.2026): motori e UX di DeepSeek
     (OpenCode), grafica e animazioni di Claude Code (VS Code). È il secondo giro
     dopo lo Studio: dieci tecnologie nuove, non i dieci esperimenti dello Studio
     e non le dieci app di games/lab. Il lato dati non si tocca: Lanyard e la
     vetrina restano quelli della pagina. -->

# Frontiera — cosa c'è, cosa rifinire

La **Frontiera** è la seconda ondata di esperimenti: dieci cose nuove che usano
il browser fino in fondo (WebGL2, Web Crypto, WebXR, OPFS, BarcodeDetector, Web
Speech, BroadcastChannel, Web Audio, MediaRecorder, IA locale). I motori
funzionano già; la grafica è volutamente sobria e neutra, pronta per essere
rifatta. **Non riscrivere la logica dei motori**: cambia CSS, markup interno e
animazioni, e se manca un aggancio aggiungilo senza rompere quello che c'è.

## Dove sta, e come si apre

- **Pagina intera**: `/frontiera/` (`public/frontiera/index.html`). È la vetrina
  delle dieci schede; ogni scheda apre il suo `<dialog>` sopra la pagina.
- **Dallo Studio**: in fondo alla scheda Studio c'è una riga `.lab__frontiera`
  con il collegamento «Apri la Frontiera →» (`public/assets/studio/index.js`).
  Il collegamento apre `/frontiera/` in una scheda nuova: così fotocamera,
  microfono, MIDI e WebXR non hanno i limiti dell'iframe.
- **Dentro il profilo**: se serve aprire una finestra della Frontiera dal sito,
  `openApp` in `public/assets/app.js` concede `camera`, `microphone`, `midi` e
  `xr-spatial-tracking` solo agli indirizzi `/frontiera/…`.
- **Niente nuova scheda nella navigazione**: la Frontiera non è una settima
  scheda; è un secondo giro dello Studio, con una pagina sua. Non duplicare la
  voce nella barra.

## File

- `public/frontiera/index.html` — la pagina: testata, dieci schede statiche,
  avviso per l'iframe, link al profilo e allo Studio.
- `public/frontiera/hub.js` — il comportamento della pagina: carica un modulo
  solo quando si apre una scheda (`import()`), legge `#ink`, `#busta`… e i link
  della Busta (`#b1.…`), aggiorna i puntini di supporto, apre e chiude i
  dialoghi. Non ha motori: quelli stanno nei moduli.
- `public/frontiera/lab.css` — il foglio comune: pagina, dialoghi, tasti,
  campi, tele, liste. Le variabili `--lab-*` e il reset sono **chiusi dentro
  `.lab-pagina` e `.lab-dlg`** (vedi «Il vincolo del CSS»).
- `public/frontiera/shell.js` — il guscio dei dialoghi: `creaDialogo()`,
  `scarica()`, `copia()`, `byte()`, `quando()`, `caso()`. Ogni modulo esporta
  `apri()` e costruisce il suo `<dialog>` con questo guscio.
- `public/frontiera/telecamera.js` — le cinque funzioni comuni a Occhio e
  Boomerang: `messaggioCamera`, `accendi`, `ferma`, `videoPronto`,
  `disegnaCoperto`. La fotocamera si accende solo dopo un gesto; in AR la
  fotocamera la apre il browser con WebXR.
- `public/frontiera/esperimenti/<nome>/<nome>.js` — i dieci motori. In testa a
  ogni file c'è la tecnologia e il contratto dei dati; in fondo al file la
  logica. **Non riscrivere il motore per fare grafica.**

## Il guscio dei dialoghi

`creaDialogo({ id, titolo, tech, voce, corpo, larga, onChiudi })` restituisce:

```js
{
  dlg,         // il <dialog class="lab-dlg" data-lab="…">
  corpo,       // .lab-corpo, dove va l'HTML dell'esperimento
  stato,       // .lab-stato, in fondo
  apri(),      // showModal + focus sul primo [data-focus] o sul tasto chiudi
  nota(testo, tipo), // scrive lo stato; tipo: 'ok' | 'male' | 'attesa'
  suPulizia(fn),     // ferma rAF, audio, fotocamera… alla chiusura
  chiudi(),    // animazione di chiusura (rispetta reduced-motion)
  distruggi(), // chiusura immediata per gli errori
}
```

Classi del guscio: `.lab-dlg`, `.lab-dlg--larga`, `.lab-dentro`, `.lab-testa`,
`.lab-titoli`, `.lab-occhiello`, `.lab-luce`, `.lab-tech`, `.lab-titolo`,
`.lab-descrizione`, `.lab-chiudi`, `.lab-corpo`, `.lab-piede`, `.lab-stato` (con
`data-tipo`), `.lab-firma`, `.lab-chiude` (animazione).

> **Nota (OpenCode, 26.11):** la descrizione del guscio si chiama
> `.lab-descrizione`, **non** `.lab-voce`. `.lab-voce` è il contenitore
> dell'esperimento 06 (la griglia a due colonne): tenerli separati, altrimenti
> la descrizione di ogni dialogo eredita la griglia e si restringe a 700 px.

Il guscio è **provvisorio**: puoi ridisegnarlo, ma conserva `data-lab`, il
tasto `[data-chiudi]`, `[data-focus]`, il ruolo `status` di `.lab-stato` e la
chiamata alle pulizie alla chiusura. I moduli contano su questi agganci.

## Le dieci schede

### 01 · ink — «Muro liquido»
WebGL2 con due texture ping-pong, uno shader di advezione e uno di splat; se
WebGL2 non c'è, Canvas 2D con le scie. Inchiostro neon che scorre; si disegna
col puntatore o col dito.

- File: `esperimenti/ink/ink.js`; tela 1280 × 720.
- Classi: `.lab-colore` (pallini palette, `is-on`), `.lab-tela`,
  `.lab-telecamera`.
- Agganci: `[data-colore]`, `[data-auto]` (`aria-pressed`), `[data-pulisci]`,
  `[data-salva]`.
- Stati: `.lab-stato` dice «WebGL2» o «Canvas 2D»; il salvataggio è un PNG.
- Cosa rifinire: la cornice del muro, la palette, il tasto «salva», il vuoto
  iniziale; il colore è già un controllo vero. Non cambiare le dimensioni della
  tela né il fallback.

### 02 · battito — «Battito»
Web Audio: cassa, rullante, hi-hat, basso e melodia a 16 passi, con convolver
per la stanza e analyser per l'oscilloscopio; Web MIDI se c'è un controller.

- File: `esperimenti/battito/battito.js`; oscilloscopio 960 × 320.
- Classi: `.lab-battito`, `.lab-pads`, `.lab-pad` (`is-on`), `.lab-scope`,
  `.lab-range`.
- Agganci: `[data-play]`, `[data-genera]`, `[data-midi]`, `[data-bpm-range]`,
  `[data-bpm]`, `[data-vol]`, `[data-nota="0…7"]`.
- Tastiera `1–8`, `P` play/stop; MIDI note-on.
- Cosa rifinire: fai sembrare la radio un oggetto vero (display, tasti,
  manopole), l'oscilloscopio e i pad. Non alzare il volume di default oltre il
  72%; non partire in autoplay.

### 03 · due — «Due schede»
BroadcastChannel: la prima scheda prende il campo e simula il Pong, la seconda
è la racchetta di destra; se resta sola, il muro insegue la palla. Nessun server.

- File: `esperimenti/due/due.js`; tela 900 × 520.
- Classi: `.lab-due-tela`, `.lab-badge` (`--acceso`), `.lab-tasto`.
- Agganci: `[data-ruolo]`, `[data-ospite]`, `[data-apri-scheda]`,
  `[data-copia]`, `[data-rigioca]`, `[data-prendi]`; pulsanti del dialogo.
- Stati: «in attesa…», «campo · gioca il muro», «campo · due giocatori»,
  «racchetta · sei a destra», «il campo non risponde».
- Cosa rifinire: il campo, le racchette, il punteggio, il velo di attesa e il
  tasto «apri un'altra scheda». Non togliere la tastiera (W/S, frecce) e il
  puntatore; non cambiare il canale `pzkko-lab-due`.

### 04 · busta — «Busta»
Web Crypto AES-GCM a 256 bit. Senza password la chiave viaggia nel frammento
del link; con password si deriva con PBKDF2 (210 000 giri) e il link da solo non
basta. Il messaggio non passa da un server.

- File: `esperimenti/busta/busta.js`; formato `#b1.<modo>.<compresso>.<iv>.<sale>.<chiave>.<cifrato>`.
- Classi: `.lab-schede`, `.lab-tab` (`is-on`), `.lab-messaggio`,
  `.lab-copia`, `.lab-campo`, `.lab-area`.
- Agganci: `[data-scheda="scrivi|apri"]`, `[data-pannello]`, `[data-messaggio]`,
  `[data-contatore]`, `[data-password]`, `[data-comprimi]`, `[data-sigilla]`,
  `[data-uscita]`, `[data-link]`, `[data-copia-link]`, `[data-apri-link]`,
  `[data-link-in]`, `[data-password-in]`, `[data-apri-busta]`,
  `[data-avviso-busta]`, `[data-letto-box]`, `[data-letto]`,
  `[data-copia-letto]`.
- Stati: vuoto, «sigillo…», «pronta · copia il link», «apro…», «busta aperta»,
  errore di password/link. Il link può essere lungo: mostralo con misura.
- Cosa rifinire: la metafora della busta (ceralacca, filo, timbro), le due
  schede, il campo del link e il messaggio letto. Non cambiare il formato, non
  mandare mai il frammento a un server, non aggiungere telemetria.

### 05 · occhio — «Occhio»
BarcodeDetector + getUserMedia. La lettura avviene sul dispositivo; il canvas
sopra il video disegna solo i riquadri, il codice non viene copiato nel canvas.

- File: `esperimenti/occhio/occhio.js`, con `telecamera.js`; video + canvas
  sovrapposto.
- Classi: `.lab-occhio`, `.lab-occhio__tela`, `.lab-occhio__invito`,
  `.lab-occhio__lista`, `.lab-telecamera--quadrata`, `.lab-sovrapposizione`.
- Agganci: `[data-occhio-video]`, `[data-occhio-tela]`,
  `[data-occhio-vista]`, `[data-occhio-avviso]`, `[data-occhio-invito]`,
  `[data-occhio-accendi]`, `[data-occhio-gira]`, `[data-occhio-torcia]`,
  `[data-occhio-spegni]`, `[data-occhio-file]`, `[data-occhio-motore]`,
  `[data-occhio-ultimo]`, `[data-occhio-form]`, `[data-occhio-mano]`,
  `[data-occhio-lista]`, `[data-occhio-vuoto]`.
- Stati: fotocamera spenta, permesso chiesto, permesso negato, lettore non
  disponibile («codice a mano»), codice letto, lista vuota.
- Cosa rifinire: il mirino, il riquadro del codice, il tasto della torcia, la
  lista. Non disegnare il codice dentro il canvas e non aggiungere un upload.

### 06 · voce — «Parla col muro»
Web Speech: SpeechRecognition per capire, SpeechSynthesis per rispondere, Canvas
2D per il muro. C'è sempre la riga di testo: funziona anche senza microfono.

- File: `esperimenti/voce/voce.js`; tela 960 × 540.
- Classi: `.lab-voce`, `.lab-muro-tela`, `.lab-voce__colori`,
  `.lab-voce__udito`, `.lab-trascrizione`, `.lab-riga-voce--tu`,
  `.lab-riga-voce--muro`.
- Agganci: `[data-voce-tela]`, `[data-voce-colori]`, `[data-voce-esempi]`,
  `[data-voce-mic]` (`aria-pressed`), `[data-voce-risposta]`,
  `[data-voce-lingua]`, `[data-voce-stato]`, `[data-voce-udito]`,
  `[data-voce-form]`, `[data-voce-input]`, `[data-voce-trascrizione]`;
  i colori e gli esempi usano `[data-colore]` / `[data-comando]`.
- Comandi: colori (rosso, verde, blu, giallo, viola, lime, nero, bianco,
  arancio, rosa), «adesivo» (anche con colore), «pioggia», «smetti di piovere»,
  «terremoto», «che ore sono», «ciao», «aiuto», «pulisci», «spegni».
- Cosa rifinire: il muro, gli adesivi, la pioggia, il terremoto, il messaggio
  «sono le…», l'indicatore d'ascolto e la trascrizione. Non togliere la riga di
  testo; il riconoscimento vocale di Chrome può usare il servizio del browser,
  dillo nella nota.

### 07 · zaino — «Zaino»
OPFS: i file si scrivono nella cartella privata del sito, sul dispositivo; si
scaricano o si tolgono. `persist()` chiede che il browser non li cancelli.

- File: `esperimenti/zaino/zaino.js`.
- Classi: `.lab-zaino-drop` (`is-over`), `.lab-zaino-lista`, `.lab-zaino-icona`,
  `.lab-barra`.
- Agganci: `[data-drop]`, `[data-file]`, `[data-lista]`, `[data-vuoto]`,
  `[data-quota]`, `[data-quota-barra]`, `[data-scegli]`, `[data-aggiorna]`,
  `[data-svuota]`, `[data-persisti]`.
- Stati: vuoto, salvataggio con percentuale, elenco, quota, «dati protetti»,
  errore di spazio.
- Cosa rifinire: la zona di trascinamento, le righe dei file (icona, nome,
  misura, data, apri/togli), la barra della quota. Non cambiare il nome dello
  spazio OPFS e non caricare niente.

### 08 · boomerang — «Boomerang»
getUserMedia + Canvas 2D + MediaRecorder su `canvas.captureStream()`: tre
secondi di webcam con la cornice pzk, in loop, scaricabili.

- File: `esperimenti/boomerang/boomerang.js`; tela 720 × 720.
- Classi: `.lab-boom`, `.lab-boom-video`, `.lab-telecamera--quadrata`,
  `.lab-sovrapposizione`.
- Agganci: `[data-video]`, `[data-velo]`, `[data-accendi]`, `[data-spegni]`,
  `[data-registra]`, `[data-rifai]`, `[data-scarica]`, `[data-stato-cam]`,
  `[data-specchio]`, `[data-nota-boom]`.
- Stati: webcam spenta, permesso, «registro · 3 secondi», «loop pronto»,
  download, specchio sì/no.
- Cosa rifinire: la cabina, la cornice (lime/viola, adesivo, ora), il
  countdown, il loop e il tasto scarica. Non registrare lo schermo, non
  aggiungere audio, non caricare il filmato.

### 09 · poeta — «Poeta»
Due strade: la Prompt API di Chrome (`LanguageModel`) se il modello locale è
pronto; altrimenti una catena di Markov a due parole costruita con il corpus
scritto a mano. Nessuna rete.

- File: `esperimenti/poeta/poeta.js`.
- Classi: `.lab-poeta`, `.lab-poeta-quadro`, `.lab-motto` (`is-nuovo`),
  `.lab-corpus`.
- Agganci: `[data-motto]`, `[data-genera]`, `[data-copia]`, `[data-modello]`,
  `[data-ia-stato]`, `[data-corpus]`.
- Stati: «Markov locale», «IA del browser», «IA da scaricare», «scrivo…»;
  il motto entra con `is-nuovo`.
- Cosa rifinire: il poster del motto, la firma, il badge del modello, il
  corpus. Non inventare un motto in HTML: il testo arriva sempre da
  `data-motto`; non chiamare servizi.

### 10 · ar — «AR»
WebXR `immersive-ar` con hit-test, WebGL2 puro: un quad con la texture
dell'adesivo, una matrice di vista per occhio, il mirino sul piano. Un tocco
attacca l'adesivo. Altrove un adesivo 3D in CSS e le istruzioni.

- File: `esperimenti/ar/ar.js`; canvas WebGL2.
- Classi: `.lab-ar`, `.lab-ar-vista`, `.lab-ar-canvas`, `.lab-ar-fallback`
  (`hidden`), `.lab-ar-sticker`, `.lab-ar-ui` (`hidden`), `.lab-passi`.
- Agganci: `[data-fallback]`, `[data-fallback-testo]`, `[data-entra]`,
  `[data-esci]`, `[data-ar-ui]`, `[data-ar-stato]`, `[data-supporto-ar]`;
  stato `.lab-dlg.lab-ar-on` (la finestra diventa un vetro sopra la camera).
- Stati: «controllo…», «pronto», «serve Android», «inquadra il pavimento»,
  «adesivo N attaccato», «AR finita», errore di permesso.
- Cosa rifinire: l'adesivo 3D del ripiego, il mirino, il pannello dell'AR, il
  velo della sessione. Non cambiare le feature richieste (`hit-test`), non
  togliere il ripiego, non far partire la sessione senza un clic.

## Il vincolo del CSS

`lab.css` si carica **anche dentro il profilo**, quando si apre una finestra
della Frontiera. Per questo il reset e le variabili sono chiusi dentro
`.lab-pagina` e `.lab-dlg`:

```css
:where(.lab-pagina, .lab-dlg), :where(.lab-pagina, .lab-dlg) * { box-sizing: border-box; }
.lab-pagina { margin: 0; }
:where(.lab-pagina, .lab-dlg) :where(button, input, textarea, select) { font: inherit; color: inherit; }
```

**Non aggiungere** `* {}`, `body {}`, `html {}`, `:root {}` o regole su `a`,
`button`, `img` senza il contenitore `.lab-pagina` / `.lab-dlg`: cambierebbero
il profilo. Le variabili `--lab-*` stanno su `.lab-pagina, .lab-dlg`, non su
`:root`. I nomi delle classi sono `lab-…` (trattino), diversi da `.lab` /
`.lab__…` dello Studio: non fonderli.

## Cosa deve restare vero

1. **Niente servizi nuovi.** Solo il sito, Lanyard e la vetrina della pagina.
   Niente CDN, iframe di terzi, API key, font esterni.
2. **Niente dati personali in più.** Non aggiungere nomi, email, città,
   percorsi o account che non siano già nella pagina. Il corpus del Poeta è
   inventato e resta tale.
3. **Il motore non si riscrive.** Se serve un aggancio, aggiungilo con un nome
   nuovo e aggiorna questo brief; non cambiare le firme di `shell.js` o di
   `telecamera.js` senza dirlo.
4. **Accessibilità.** Ogni canvas ha un'etichetta o è decorativo; i bottoni
   hanno testo; il focus resta nel `<dialog>`; lo stato è `aria-live`; nessun
   lampeggio > 3/s; `prefers-reduced-motion` ferma le animazioni.
5. **Prestazioni.** I moduli si caricano solo quando si apre una scheda; i
   cicli `requestAnimationFrame`, l'audio, la fotocamera e la sessione XR si
   fermano alla chiusura (`suPulizia`). Le tele non superano i 1280 px di lato
   (AR e Boomerang hanno le loro misure).
6. **Privacy.** La fotocamera e il microfono partono solo su un gesto; nessuna
   immagine o audio viene caricato. La Busta non manda il frammento a nessuno;
   la Clip e il Boomerang restano Blob locali. Il riconoscimento vocale di Chrome può
   usare il servizio del browser: scrivilo nella nota, non nasconderlo.
7. **La Frontiera non è lo Studio.** Non duplicare le dieci schede dello Studio
   (`public/assets/studio/`) e non toccare le dieci app di `public/games/lab/`.
   Il ponte è la riga `.lab__frontiera` in fondo allo Studio.

## Prova

```sh
npm run check     # CSP e guardia: deve passare
npm run build     # site.css minificato
npm run serve     # http://localhost:5080/frontiera/
```

Controlla, oltre all'occhio:

- le dieci schede si aprono e si chiudono; il tasto Indietro non rompe l'hash;
- **Busta**: sigilla un messaggio, apri il link in una scheda nuova e rileggilo
  (con accenti); prova anche con una password;
- **Due schede**: apri `/frontiera/#due` in due schede, una deve dire «campo» e
  l'altra «racchetta»;
- **Zaino**: trascina un file, ricarica la pagina, il file deve restare; toglilo;
- **Occhio**: senza fotocamera deve restare il codice a mano; con la fotocamera
  il riquadro deve seguire il codice;
- **Boomerang**: tre secondi, loop, download; la webcam si spegne alla chiusura;
- **Poeta**: senza IA locale deve usare Markov; con l'IA pronta deve dirlo;
- **AR**: su Android/Chrome il mirino e l'adesivo; su desktop il ripiego 3D;
- **Mobile**: le finestre prendono tutto lo schermo, niente scroll orizzontale,
  i tasti restano raggiungibili;
- **Console**: nessun errore, nessun avviso di CSP.

## Se qualcosa non torna

Scrivi in `design/RISPOSTA-CLAUDE-LAB.md` cosa manca (hook, stato, dato). Il
lato motori è di DeepSeek: non riscriverlo in silenzio. La grafica è tua:
cambia quanto vuoi, purché i contratti qui sopra restino veri.

## Nota di integrazione (OpenCode, 26.11)

- **`.lab-voce` non è più la descrizione del guscio**: la descrizione è
  `.lab-descrizione` (vedi sopra). `.lab-voce` è la griglia dell'esperimento 06.
  Se rifai il guscio, non rimettere `.lab-voce` sulla `<p>` della descrizione.
- **Occhio**: il markup nuovo usa `.lab-occhio`, `.lab-occhio__tela` (canvas
  sopra il video), `.lab-occhio__invito`, `.lab-occhio__lista`,
  `.lab-occhio__val`, `.lab-risultato` per l'ultimo codice. In `lab.css` c'è
  solo la struttura minima (griglia, overlay, lista): la grafica è da rifare.
  Il canvas dei riquadri è `position:absolute` e usa `object-fit:cover`, come il
  video: se cambi il ritaglio del video, cambi anche il canvas.
- **Voce**: il corpo ora segue la griglia `.lab-voce` (sinistra muro e comandi,
  destra microfono, riga di testo e `.lab-trascrizione`). La trascrizione usa
  `.lab-riga-voce--tu` / `--muro`; tiene le ultime 12 righe. I comandi
  documentati ci sono tutti: colori, «adesivo» (anche col colore), «pioggia»,
  «smetti di piovere», «neve», «stelle», «cuori», «fuochi», «balla»,
  «terremoto», «che ore sono», «ciao», «aiuto», «pulisci», «spegni», «scrivi …».
- **Boomerang**: il conto alla rovescia e il pallino REC stanno nel badge, non
  nella tela; il video salvato contiene solo la cornice, l'ora e l'adesivo.
  Se aggiungi un countdown visivo, mettilo in un overlay DOM, non nel canvas
  che viene registrato.
- **AR**: il clear del framebuffer è stato spostato fuori dal ciclo degli occhi
  (prima il secondo occhio cancellava il primo). Non rimetterlo dentro.
- **Poeta**: il controllo dell'IA locale gestisce anche la vecchia API
  `capabilities()` oltre alla nuova `availability()`.
- **Permessi**: in `vercel.json` e `scripts/dev.mjs` ora c'è
  `xr-spatial-tracking=(self)` oltre a camera, microfono, MIDI e sensori.
  Se apri la Frontiera dentro il profilo, l'iframe deve dichiarare gli stessi
  permessi (`allow="camera; microphone; midi; xr-spatial-tracking"`).
- **Prove fatte** (Edge headless, webcam finta): le dieci schede si aprono;
  Busta sigilla e apre; Occhio accetta un codice a mano; Voce esegue i comandi e
  tiene la trascrizione; Zaino scrive e rilegge un file in OPFS; Boomerang
  produce il loop; Poeta genera con Markov; AR mostra il ripiego 3D. Restano da
  provare a mano la webcam vera, il microfono vero e il WebXR su Android.
- **Copia della pagina**: ho qualificato la privacy del riconoscimento vocale
  («solo il riconoscimento vocale di Chrome manda l'audio al servizio del
  browser»). Non rimettere la frase assoluta «tutto resta sul dispositivo».
