<!-- Specifica dello Studio di pzkko.it (26.11.2026): motori e UX di DeepSeek
     (OpenCode), grafica e animazioni di Claude Code (VS Code). Il lato dati non
     si tocca: Lanyard e la vetrina restano quelli della pagina. -->

# Studio — cosa c'è, cosa rifinire

La scheda **Studio** è nuova (la settima): dieci esperimenti veri, non mockup.
**Non è `/frontiera/`**: la Frontiera è il secondo giro, dieci tecnologie del
browser (WebGL, crittografia, fotocamera, voce, file locali, IA, WebXR), con un
altro indirizzo e un altro foglio; non fonderli. Le dieci app del browser
(Synth, Batteria, Theremin, Spettro, Specchio, Sabbia, Plotter, Livella,
Dettatura, Tavolozza) sono ancora un'altra cosa, dentro il profilo.
Ognuno ha un motore che funziona già; la grafica è volutamente sobria e neutra,
pronta per essere rifatta. **Non riscrivere la logica**: cambia CSS, markup
interno e animazioni, e se manca un aggancio aggiungilo senza rompere quello
che c'è.

## File

- `public/assets/studio/index.js` — il guscio: testi (it/en; le altre lingue
  vedono l'inglese), schede, IntersectionObserver (monta un esperimento solo
  quando si avvicina allo schermo), `api` condivisa, smontaggio al cambio lingua.
- `public/assets/studio/colori.js` — i cinque colori veri di una copertina
  (`/api/vetrina/?img=`), cache in memoria per un giorno.
- `public/assets/studio/utils.js` — escape, orologio, date, testo a capo, download.
- `public/assets/studio/esperimenti/` — i dieci moduli:
  `pip.js`, `quadro.js`, `diario.js`, `radio.js`, `cartolina.js`,
  `costellazione.js`, `stanza.js`, `sole.js`, `meteo.js`, `clip.js`.
- `public/assets/studio/studio.css` - il foglio dello Studio, caricato solo quando si apre
  la scheda. Dal 27.11 è solo un indice di `@import`, in quest'ordine: `/games/pzk-stile.css`
  (il foglio comune di tutte le app), `base.css` (testata, fogli, cornici: le classi `.lab*`
  comuni) e una vignetta per file in `vignette/<id>.css` (le classi `.lab-<id>*` di quella
  scheda, più eventuali asset in `vignette/<id>/`). Ogni vignetta si rifà da sola senza
  toccare le altre. È autonomo (usa le variabili di `src/site.css`, ma non sta dentro
  Tailwind). Il richiamo in bacheca `.lab-teaser` invece sta in `src/site.css`, perché serve
  prima che la scheda si apra.
- `public/studio-prova/` e `scripts/studio-foto.mjs` (27.11) — la pagina di prova col guscio
  vero e dati finti (`?solo=radio&stato=offline&musica=0&meteo=61&tema=dark&lang=en`), e lo
  script che la fotografa con Edge senza finestra:
  `node scripts/studio-foto.mjs --solo radio --w 560 --q "stato=offline"`.
- `public/assets/app.js` — `renderStudio()`, la voce `studio` in `TABS`/`SLUG`, il
  richiamo in bacheca e `liveListeners` (la presenza arriva qui senza aprire un
  secondo socket).
- `public/index.html` — `#panel-studio`.
- `vercel.json` — `Permissions-Policy`: `picture-in-picture=(self)` e
  `web-share=(self)` (prima erano chiusi). La CSP non è cambiata.

## Come parla con i dati

Il guscio passa a ogni modulo un oggetto `api`:

```js
api.adesso()        // { status, online, custom, gioco, track, apps, luogo, p, v }
api.onAdesso(f)     // f(adesso) a ogni cambio di presenza o vetrina; ritorna la disiscrizione
api.vetrina()       // l'ultima vetrina grezza (o null)
api.immagine(id)    // /api/vetrina/?img=<id>
api.palette(id, fallback) // Promise<string[5]> dei colori della copertina
api.inchiostro(hex), api.mescola(a, b, t), api.rgbDi(hex), api.luminanza(hex)
api.t({ it, en })   // la lingua corrente, con ripiego sull'inglese
api.stato(el, testo, tono) // scrive lo stato della scheda e data-tono="ok"|"no"
api.quandoVisibile(el, f)  // f(true/false): intersezione + document.hidden
api.open(key)       // apre la scheda di un progetto (per la costellazione)
api.toast(msg)
api.scarica(blob, nome)
api.reduced()       // prefers-reduced-motion
api.tema()          // { p, a } letti dalle variabili CSS
```

`adesso()` è normalizzato dal guscio, non da `adesso.js`: le due cose sono
indipendenti. Se un giorno vuoi riusare il motore di `adesso.js` per il PiP,
fallo senza cambiare il contratto qui sotto.

## Le dieci schede

Ognuna è un `<article class="lab__card" data-lab="…">` con:
`header.lab__capo` (numero, `h3`, `span.lab__stato[data-tono]`),
`p.lab__descr`, `div.lab__corpo`, `footer.lab__tech`. Il guscio mette
`data-montato="1"` quando il modulo è partito. **Non cambiare `data-lab`**: è
la chiave di montaggio.

### 01 · pip — «Adesso, sempre»
Document PiP (Chrome/Edge 116+). Il modulo disegna un'anteprima e apre una
finestra sempre sopra le altre con la scheda «Adesso» viva: stato, luogo,
stato personale, brano con barra, app aperte. La finestra usa `site.css`,
`studio.css` e le variabili del tema copiate dall'opener.
Classi: `.lab-pip`, `.lab-pip__capo/riga/punto/custom/musica/arte/brano/barra/apps/vuoto/gioco`,
`.lab-pip__live`, `.lab-pip__anteprima`, `.lab-pip--mini`.
Stati: `data-online="true|false"`, `data-stato` sul puntino
(`online|idle|dnd|offline`), `data-inizio`/`data-fine` sulla barra.
Cosa rifinire: la finestra PiP deve sembrare la scheda vera (stessi caratteri,
stesso tema, stessa ombra); il bottone deve dire «Chiudi la finestra» quando è
aperta; a finestra chiusa si torna a «Apri la finestra». Non togliere il
ripiego «Apri Attività».
Attenzione: la finestra PiP non è raggiungibile dal CSS della pagina; lo stile
è quello di `site.css` e `studio.css` più il piccolo `<style>` nel modulo. Se
serve, aggiungi regole a `.lab-pip` in `studio.css` (valgono in entrambe).

### 02 · quadro — «Quadro vivo»
Canvas 2D 240 px. Prende i colori della copertina e li fa muovere in un campo
di aloni; si ferma quando non è visibile o con `prefers-reduced-motion`.
Classi: `.lab-quadro`, `.lab-quadro__tela`, `.lab-quadro__pie`,
`.lab-quadro__palette` (cinque `i` con `background`).
Cosa rifinire: il quadro è volutamente astratto. Puoi cambiare composizione,
grana, velocità, cornice, didascalia; **non** cambiare la sorgente dei colori:
sono cinque, veri, dalla copertina. La palette in basso è un controllo visivo,
non un selettore.

### 03 · diario — «Diario di bordo»
IndexedDB (`pzkko-lab` → `diario`), 300 eventi al massimo, solo nel browser.
Registra stato, brano, app, luogo, gioco, stato personale; esporta JSON;
«Svuota» chiede conferma con un secondo clic entro 3 s.
Classi: `.lab-diario__testa`, `.lab-diario` (lista scrollabile),
`.lab-diario__riga` con `data-tipo` (`inizio|stato|musica|app|luogo|gioco|custom`),
`.lab-diario__vuoto`.
Cosa rifinire: la riga del tempo, il puntino del tipo, il vuoto e lo stato
«N eventi · solo in questo browser». **Non** aggiungere campi al record e non
cambiare il nome del DB: i dati di chi ha già usato lo Studio devono restare.

### 04 · radio — «Radio pzk»
Web Audio: una traduzione in 8 bit del brano (o dello stato), con scala, tempo
e timbro derivati da un hash; `AnalyserNode` per le barre; Media Session per i
tasti del telefono. Parte solo dopo un clic.
Classi: `.lab-radio`, `.lab-radio__barre` (canvas 90 px),
`.lab-radio__controlli`, `.lab-radio__play`, `.lab-radio__volume` (range),
`.lab-radio__brano`.
Cosa rifinire: fai sembrare la radio un oggetto vero (manopola, tasti, display).
Non cambiare il fatto che **non è Spotify**: la nota in fondo deve restare.
Non alzare il volume di default oltre il 55%; non partire in autoplay.

### 05 · cartolina — «Cartolina viva»
SVG 1200 × 630 costruito con avatar, stato, luogo, brano e colori veri; il PNG
è rasterizzato da un canvas con le immagini già dentro come data URL; Web Share
se c'è, altrimenti download.
Classi: `.lab-cartolina` (l'anteprima), i tre bottoni `.lab__bottone` in
`.lab__azioni`.
Cosa rifinire: la composizione della cartolina è tutta in `svg()` dentro
`cartolina.js`; puoi ridisegnarla come vuoi (forme, griglia, tipografia), ma
lascia leggibili nome, stato, luogo e brano, e non inserire dati che non
arrivano da `api.adesso()`. Il PNG deve restare 1200 × 630.

### 06 · costellazione — «Costellazione»
Canvas 2D con tutti i progetti (oggi 32): un filo per ogni tecnologia condivisa; fisica
semplice, trascinamento, clic/Invio per aprire, tooltip HTML.
Classi: `.lab-cost`, `.lab-cost__tela` (`tabindex=0`, `role=application`),
`.lab-cost__tip`.
Cosa rifinire: stelle, fili, alone, tipografia, tooltip. I nodi veri sono
`PROJECTS`; i colori vengono da `p.art[0]`. Non togliere la tastiera
(frecce + Invio) e non rendere il canvas l'unico modo per aprire un progetto:
il tooltip e la scheda Progetti restano.

### 07 · stanza — «La stanza»
SVG con una stanza in prospettiva: lampada = online, casse = Spotify,
schermo = numero di app, finestra = giorno/notte di Roma. Aggiorna ogni minuto
e a ogni cambio.
Classi: `.lab-stanza` con `data-online`, `data-music`, `data-notte`;
`.lab-stanza__svg`, `.lab-stanza__didascalia`, `.lab-stanza__giorno/notte/onde/alone`;
i sei `rect[data-app]` nello schermo.
Cosa rifinire: è il pezzo più «grafico»: puoi ridisegnare tutta la stanza,
purché restino leggibili i quattro segnali e la didascalia. Le animazioni
devono fermarsi con `prefers-reduced-motion`.

### 08 · sole — «Orologio solare»
Astronomia vera (NOAA) per Mantova: alba, tramonto, mezzogiorno, altezza,
frazione del giorno. SVG ridisegnato ogni minuto.
Classi: `.lab-sole`, `.lab-sole__numeri` (quattro `span` con `b`).
Cosa rifinire: cielo, arco, sole/luna, stelle, etichette. Le ore sono vere e
in `Europe/Rome`: non inventare un tramonto. Se ridisegni l'SVG, mantieni gli
attributi `data-alba`, `data-tramonto`, `data-durata`, `data-altezza` (li
riempie il modulo) e l'`aria-label`.

### 09 · meteo — «Meteo vivo»
`/api/meteo/` (Open-Meteo, cache 10 min): temperatura, vento, pioggia 12 h,
visibilità, codice WMO → famiglia (`sereno|poco|nuvoloso|nebbia|pioggia|neve|temporale`).
Classi: `.lab-meteo[data-meteo=…]`, `.lab-meteo__icona/testo/numeri`.
Cosa rifinire: l'icona SVG, lo sfondo per famiglia, le tre statistiche, lo
stato «Open-Meteo» / «il meteo non risponde». Non chiamare Open-Meteo dal
browser: passa sempre da `/api/meteo/`.

### 10 · clip — «Clip viva»
Canvas 720 × 720 animato; `captureStream(30)` + `MediaRecorder` per sei
secondi; anteprima `<video>`, download WebM/MP4, Web Share.
Classi: `.lab-clip`, `.lab-clip__tela`, `.lab-clip__velo` (`REC`, countdown),
`.lab-clip__video`.
Cosa rifinire: la scena della clip è in `dipingi()`; puoi rifarla, ma deve
restare 720 × 720, senza audio, e la registrazione deve durare 6 s. Non
registrare lo schermo e non chiedere il permesso della fotocamera.

## Cosa deve restare vero

1. **Niente servizi nuovi.** Solo Lanyard, la vetrina, `/api/meteo/`, e i file
   del sito. Niente iframe, niente script di terzi, niente API key.
2. **Niente dati personali in più.** Non aggiungere nomi, email, città o
   percorsi che non siano già nella pagina. Mantova è già nella scena 3D e nel
   meteo; non aggiungere altro.
3. **Il motore non si riscrive.** Se ti serve un hook, aggiungilo con un nome
   nuovo e aggiorna questo brief; non cambiare le firme di `api` senza dirlo.
4. **Accessibilità.** Ogni canvas ha un'etichetta o è decorativo; i bottoni
   hanno testo; la tastiera funziona sulla costellazione; nessun lampeggio
   > 3/s; `prefers-reduced-motion` ferma le animazioni.
5. **Prestazioni.** Un modulo si monta solo quando la scheda si avvicina; i
   canvas si fermano quando non sono visibili; l'audio parte solo su clic.
6. **Privacy.** Il diario resta in IndexedDB, la radio è generata, la clip non
   lascia il browser finché non la scarichi. Non aggiungere telemetria.
7. **La scheda si chiama Studio** e sta in fondo alle schede; il richiamo in
   bacheca è `.lab-teaser`. Non duplicare la scheda.

## Prova

```sh
npm run check     # CSP e guardia: deve passare
npm run build     # site.css minificato
npm run serve     # http://localhost:5080/#studio
```

Controlla: le dieci schede si montano scorrendo; il cambio lingua rimonta il
Studio (i testi restano it/en); il tema chiaro/scuro non rompe i canvas; il PiP
apre e chiude; la radio parte e si ferma; la clip registra sei secondi; la
cartolina scarica PNG; il meteo dice «non risponde» se il ponte è giù.

## Se qualcosa non torna

Scrivi in `design/MESSAGGIO-OPENCODE-STUDIO.md` cosa manca (hook, stato, dato) e
la risposta arriva in `design/RISPOSTA-CLAUDE-STUDIO.md`. Il lato dati è di
DeepSeek: non lo cambiare in silenzio.
