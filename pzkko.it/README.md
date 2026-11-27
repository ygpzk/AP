# pzkko.it

Il profilo per svago di pzkko, fatto come il suo profilo di Discord e
con i pezzi veri di Discord: i caratteri (gg sans, gg mono, ABC Ginto Nord e
Pricedown per il nome), la cornice «Crystals (Peridot)», l’effetto «Boost Relic»,
il tema `#ffd21a → #d81e1e` calcolato come lo calcola il client (velo bianco
all’80 % col tema chiaro, nero al 60 % con quello scuro, tinta del testo, sfondo
del pannello), banner, avatar con la decorazione, stato, stato personalizzato,
tag NODE, badge e collezione, tutto dal vivo. La bio e i collegamenti restano
quelli di pzkko: il profilo dal vivo non porta qui il nome o gli account
personali. pzkko.it è autosufficiente: non rimanda e non si collega a nessun
altro sito personale.

## Da dove arrivano i dati

- **Lanyard** (`api.lanyard.rest`, WebSocket): avatar, decorazione, stato,
  dispositivi, stato personalizzato, Spotify, giochi, tag del server, stile del
  nome (carattere ed effetto). Serve restare nel server <https://discord.gg/lanyard>.
- **Profilo pubblico** (`dcdn.dstn.to/profile/<id>`): banner, colori del tema,
  badge e gli SKU di effetto, cornice e decorazione; si ricarica ogni 10 minuti.
  Bio e collegamenti non vengono presi dal profilo dal vivo. Il campo dei pronomi
  di Discord non viene mai letto: accanto al nome utente compare solo il valore
  scritto a mano in `config.js` (`profile.pronouns`).
- **Discord** (`discord.com/api/v9/collectibles-products/<sku>`, senza accesso):
  nome, immagini e misure di effetto e cornice; in memoria nel browser per un
  giorno. Le immagini arrivano da `cdn.discordapp.com`. Se cambi cornice, effetto,
  carattere del nome o tema su Discord, il sito li segue da solo.
- Se un servizio non risponde valgono i valori di riserva in `config.js`.
- **Il profilo «segnaletica» (26.11.2026).** Foto col cartello della lumaca,
  banner «lavori in corso», tema giallo → rosso, decorazione «Questionable»,
  effetto «Boost Relic», pronomi e bio nuovi. Su Discord questo profilo sta nel
  profilo di un server, e Lanyard e `dcdn.dstn.to` danno solo il profilo
  principale: per questo le voci elencate in `profile.fisso` di `config.js`
  (`avatar`, `banner`, `theme`, `decoration`, `effect`) non si prendono dal
  vivo ma da `config.js`, e foto e banner sono file del sito
  (`public/media/profilo/`; il banner è la versione 2040 × 768 fatta per la
  scheda, col titolo a sinistra perché a destra ci sono i tasti). Stato, stato
  personalizzato, tag, badge, cornice e stile del nome restano dal vivo. Quando
  il profilo principale di Discord diventa questo, basta svuotare `fisso`.

Non ci sono altri servizi esterni: caratteri, icone dei marchi e bandiere stanno
nel sito.

## Cosa c’è

- `public/index.html`: la cornice della pagina (scheda a sinistra, pannello a destra).
- `public/assets/config.js`: **il file da toccare**. ID Discord, profilo di
  riserva, oggetti da collezione di riserva, social, progetti, strumenti, lingue,
  contatore delle visite.
- `public/assets/i18n.js`: i testi in nove lingue (it, en, es, fr, de, pt, ru, ja, zh).
- `public/assets/app.js`: scheda, Bacheca / Progetti / Attività / Social, scheda
  del progetto con galleria e filmato, ricerca rapida (Ctrl K oppure `/`), menu,
  tema chiaro e scuro, Lanyard, profilo, indirizzi (`#progetti/zero` apre un progetto).
- `public/assets/fx.js`: la cornice e l’effetto del profilo.
- `public/assets/icons.js`: le icone dei marchi in linea (simpleicons, CC0; devicon, MIT).
- `public/assets/media.js`: l’elenco delle catture, **generato** da `npm run media`.
- `public/media/p/<progetto>/`: le catture vere dei progetti in funzione:
  `cover.webp` (1280 × 720), `01.webp`… (la galleria), `loop.mp4` (il filmato
  che parte al passaggio del mouse) e `meta.json` (misure e didascalie). Niente
  disegni né simulazioni: se un progetto non gira, resta senza immagine.
- **Diretta OS** (22.11): la scheda del progetto e la guida `/direttaos/`. Il
  sorgente e l'installer sono nella cartella `DirettaOS/` del repository; le
  catture in `public/media/p/direttaos/` sono vere (la regia ha l'anteprima su
  fondo neutro al posto della webcam). L'installer è in aggiornamento e non è
  più pubblicato: la copia che conteneva il vecchio percorso è stata tolta da
  `public/` (la stessa resta in `../DirettaOS/installer/build/`). Quando il setup
  viene rifatto, si rimette in `public/direttaos/` e si toglie il redirect in
  `vercel.json`.
- `public/fonts/`: i caratteri del client di Discord (vedi sotto).
- `public/.well-known/discord`: la verifica del dominio per Discord.
- `src/site.css`: Tailwind v4 e i componenti.
- `scripts/media.mjs`: scrive `media.js` dalle cartelle di `public/media/p/`.

## Community (24.11.2026)

La scheda **`#community`** sta dentro la home, mai una pagina a sé: il podcast in
Bacheca e la voce nel piè di pagina portano lì con l'hash. Mette in fila i numeri
pubblici di OLLARE, il server dove si fa il podcast: membri, presenze e boost.
Non c'è un bot dentro il server: `api/community.mjs` legge solo l'invito
pubblico (`with_counts=true`), tiene i conteggi in cache cinque minuti e non
restituisce nomi, messaggi, canali vocali o presenze individuali. Il modulo
`public/assets/community-tab.js` si carica solo quando la scheda si apre; la hero
è `public/assets/community/hero.svg`, disegnata con Claude Code (Opus). La vecchia
pagina `/community/` è stata tolta: `/community` e `/community/` rimandano a
`/#community` in `vercel.json` (e nel server di prova).

## Giugnoh's Cast in bacheca (27.11.2026)

In cima alla Bacheca c'è il palco del podcast, nello stile della tv e dei pezzi
di Diretta OS: l'insegna ON AIR, il logo in Pricedown che ondeggia, la prossima
puntata col conto alla rovescia e «Unisciti» (l'invito di OLLARE, più il link
diretto al palco @OLLARE PODCAST), il rullo dell'argomento a caso, l'archivio
delle puntate coi loro argomenti e il nastro che scorre. Motore e disegno sono
in `public/assets/podcast.js` e `podcast.css` (lo carica il modulo, non sta in
`src/site.css`); in `app.js` ci sono solo l'aggancio in `renderBoard` e
`mioRedattore()`.

- **Le puntate** si scrivono a mano in `PODCAST` di `config.js`, con l'ora
  italiana e il fuso; il palco passa da sé da «in arrivo» a «in onda» e ad
  «andata in onda».
- **I redattori** sono pzkko (il profilo del sito, dal vivo) e quelli in
  `public/media/cast/redattori.json`: profilo, tema, badge, tag e foto vere,
  scaricate dalla CDN di Discord in `public/media/cast/`. Si rinfrescano con
  `scripts/cast-profili.py`, lanciato col Python del collegamento Discord (vedi
  la testa dello script). Al clic su un redattore si apre la sua scheda: le
  stesse classi della scheda del profilo, coi suoi colori calcolati come li
  calcola Discord.

## Instagram in bacheca (24.11.2026)

La scheda Instagram della bacheca è nativa: profilo, follower, storie in
evidenza e visualizzatore a tutto schermo sono HTML e CSS del sito, non un
iframe e non uno screenshot. I dati stanno in `public/media/ig/index.json` e i
media in `public/media/ig/`; chi guarda non inserisce mai un account e il
browser non parla con Instagram.

Il raccoglitore gira sul pc, fuori dal repository
(`%USERPROFILE%\Collegamenti\Instagram\raccogli.py`), con le sessioni già
salvate da `accedi.py`. La regola dei tempi è pensata per non pesare
sull'account:

- **follower sempre, ma leggeri.** Ogni ora una sola chiamata `user_info`
  per account: follower, seguiti, post e `latest_reel_media`. Un punto dello
  storico si scrive solo quando il numero cambia.
- **storie solo quando ci sono.** Se `latest_reel_media` non cambia non si
  chiama `user_stories`; quando cambia si scaricano i media nuovi, e per tre
  ore il controllo passa a 30 minuti per prendere anche le storie successive.
- **evidenze ogni sei ore.** Si confronta solo la firma (numero di elementi,
  titolo, copertina); `highlight_info` e i download partono solo per le
  evidenze cambiate.
- **se non cambia niente non si scrive l'indice e non si fa il push.**

Il task di Windows `pzkko-instagram` batte ogni 30 minuti, ma è lo script a
decidere se vale la pena chiamare Instagram. Il task si registra con
`installa-attivita.ps1` nella stessa cartella. I due profili hanno **due
sessioni separate**: `sessione.json` per l'account personale e
`sessione-pzkko.json` per `@pzkko`. Il raccoglitore usa ciascuna solo per il
suo account, quindi l'account personale non porta il peso di `@pzkko`. Se una
sessione scade, si rilancia `accedi-instagram.cmd` o `accedi-pzkko.cmd`; se
Instagram rifiuta il login via API, `accedi-pzkko-browser.cmd` apre Edge e
salva la sessione dal browser.

Le foto sono convertite in WebP alla stessa risoluzione dell'originale; i
video restano MP4. Le storie attive spariscono da sole dopo 24 ore. Per un giro
a mano: `python raccogli.py --forza --solo-dati` (senza push) oppure
`python raccogli.py --forza --pubblica`.

L'eccezione voluta: il nome dell'account personale può comparire solo in
`public/assets/ig.js`, `public/assets/config.js`, `public/media/ig/` e (dal
26.11) `public/media/tt/` (vedi `scripts/guard.mjs`). Il dominio personale e
ogni altro nome restano vietati.

## TikTok in bacheca (26.11.2026)

Sotto la scheda Instagram c'è la scheda TikTok (`#tt-card`): **la stessa
dashboard**, con i colori di TikTok. Stessa regola: HTML e CSS del sito, dati
statici in `public/media/tt/index.json`, media in `public/media/tt/`, nessuna
chiamata a TikTok dal browser e nessun account chiesto a chi guarda.

- `public/assets/scheda-social.js`: il motore comune delle due schede (colonna
  dei profili, follower in Ginto Nord col gradiente, tessere 9:16 che si
  sfogliano, visualizzatore a tutto schermo, stati). Era il codice di `ig.js`:
  dal 26.11 sta qui, così Instagram e TikTok non possono divergere.
- `public/assets/ig.js` e `public/assets/tt.js`: le due configurazioni (testi,
  mazzi, numeri, sfondi). Le tessere TikTok sono «Video» (i video, i due virali
  «solo qui» davanti), «Repost» (tutti, con l'autore nel visualizzatore) e,
  quando ci sono, le storie di oggi.
- `public/assets/tt-sfondi.js`: dodici scene vive, una ogni due ore, disegnate
  con un solo inchiostro e stampate due volte (ciano a sinistra, rosso a destra),
  a tempo sullo stesso battito. Il dado nella colonna ne pesca una a caso, come
  su Instagram. Non sono i pixel della scheda Instagram.
- `src/site.css`: le regole `.igc*` / `.igv*` di Instagram valgono per tutte e
  due; `.igc--tt` cambia solo colori, luci e il quadratino del marchio.
- `design/tiktok-bacheca.md`: il brief della scheda TikTok.

Il raccoglitore gira sul pc, fuori dal repository
(`%USERPROFILE%\Collegamenti\TikTok\raccogli.py`). TikTok non mostra un profilo
a chi non ha fatto l'accesso, quindi non c'è un'API: il raccoglitore apre senza
finestra un profilo di Edge dedicato (`browser-tiktok`, dove si accede una volta
con `accedi-tiktok.cmd`, la password non passa da lì), carica la pagina pubblica
del profilo e legge le risposte che la pagina chiede da sola. Un giro all'ora
(task `pzkko-tiktok`, ogni 30 minuti, decide il file); copertine e filmati si
scaricano una volta sola; se non cambia niente non si scrive e non si pubblica.

Cosa entra: follower, seguiti, mi piace, numero di video, l'avatar, i video
pubblici (copertina WebP alla risoluzione nativa, MP4, durata, data, fissato,
visualizzazioni e mi piace) e le storie di oggi. In più:

- **i video scelti** (`VIDEO_SCELTI` nel raccoglitore; dal 26.11 i due virali,
  1,6 milioni e 757 mila visualizzazioni): su TikTok non sono pubblici e la
  loro visibilità si cambia solo dall'app, quindi si leggono da TikTok Studio
  (ogni 6 ore) e nel sito sono pubblici, con l'etichetta ciano «solo qui» e il
  filmato servito dal sito (`solo_qui: true`, senza collegamento al video su
  TikTok, che per chi guarda non si apre);
- **tutti i repost** (`reposts`): la prima pagina a ogni giro, la lista intera
  ogni 6 ore. Sono video di altri: del repost si tengono solo copertina,
  `@autore`, durata, visualizzazioni, mi piace e il collegamento all'originale;
  il filmato resta su TikTok.

Cosa resta fuori: didascalie, commenti, elenchi di follower, i nomi degli
autori dei repost (solo `@account`), e ogni contenuto che TikTok segna come
privato, segreto o per amici e che non è fra i video scelti. Il nome del
profilo, se contiene il nome personale, non viene scritto: la scheda mostra solo
@account.

Il raccoglitore pubblica i dati solo quando su `origin` c'è già il
`guard.mjs` con l'eccezione per `public/media/tt/`: prima, un push farebbe
fallire la build su Vercel (anche quella di Instagram).

## Lo Studio (26.11.2026)

La scheda **Studio** sta in fondo alle schede e raccoglie dieci cose nuove,
tutte vere: nessun mockup, nessun video. I motori sono in
`public/assets/studio/`, il guscio in `index.js`, un esperimento per file in
`esperimenti/`, il foglio in `studio.css` (caricato solo aprendo la scheda). Le
schede si montano solo quando si avvicinano allo schermo e si fermano quando
non si vedono.

**Non è `/frontiera/`.** Il 26.11 sono nati tre giri diversi: lo Studio
(questa scheda, coi dati dal vivo del profilo), la **Frontiera** a
`/frontiera/` (WebGL, crittografia, fotocamera, voce, file locali, IA, WebXR) e
le dieci app in-profile (Synth, Batteria, Theremin, Spettro, Specchio, Sabbia,
Plotter, Livella, Dettatura, Tavolozza). Hanno nomi, indirizzi e motori
separati: non vanno fusi.

- **Adesso, sempre**: la scheda Adesso in Document Picture-in-Picture
  (Chrome/Edge 116+), con stato, brano, barra e app aperte; se il browser non
  la sa fare, resta il tasto per la scheda Attività.
- **Quadro vivo**: i cinque colori veri della copertina diventano un quadro
  Canvas 2D che respira.
- **Diario di bordo**: IndexedDB, solo nel browser; stato, brano, app, luogo,
  gioco e stato personale, con export JSON e svuotamento a doppio clic.
- **Radio pzk**: Web Audio, una traduzione in 8 bit del brano (o dello stato),
  con Media Session e analizzatore per le barre; parte solo su clic.
- **Cartolina viva**: SVG 1200 × 630 con avatar, stato, luogo e brano; PNG
  rasterizzato nel browser, download o Web Share.
- **Costellazione**: tutti i progetti in Canvas (oggi 32), un filo per ogni
  tecnologia in comune; trascinamento, tastiera, clic per aprire.
- **La stanza**: SVG che si accende con i dati veri (lampada = online, casse =
  Spotify, schermo = app, finestra = ora di Roma).
- **Orologio solare**: alba, tramonto, mezzogiorno e altezza del sole sopra
  Mantova, calcolati (NOAA) e ridisegnati ogni minuto.
- **Meteo vivo**: `/api/meteo/` (Open-Meteo, cache dieci minuti) con
  temperatura, vento, pioggia 12 h e un disegno per famiglia di tempo.
- **Clip viva**: sei secondi di canvas registrati con MediaRecorder, pronti da
  scaricare o condividere.

`/studio` e `/studio/` rimandano a `/#studio` (come `/community`); la scheda
non è mai una pagina a sé.

Il lato dati e la UX sono di DeepSeek (OpenCode); la grafica è di Claude Code.
Il brief è `design/studio-ux-deepseek.md`. Lo Studio non manda niente a
nessuno: la presenza arriva da Lanyard, la musica e le app dalla vetrina, il
meteo dal ponte `/api/meteo/`; il diario e la clip restano nel browser.

Per il PiP e la condivisione, `vercel.json` apre
`Permissions-Policy: picture-in-picture=(self)` e `web-share=(self)`. La CSP non
è cambiata: nessun servizio nuovo, nessuna origine in più.

## La Frontiera (26.11.2026)

Il secondo giro del laboratorio, in una pagina sua: **`/frontiera/`**. Dieci
tecnologie nuove, tutte vere, con i motori in `public/frontiera/esperimenti/` e
il guscio in `public/frontiera/shell.js`. In fondo alla scheda **Studio** c'è il
ponte `.lab__frontiera`; il collegamento apre la pagina in una scheda nuova,
così fotocamera, microfono, MIDI e WebXR non hanno i limiti dell'iframe.

- **Muro liquido**: WebGL2 con due texture ping-pong e shader; Canvas 2D di
  riserva. Inchiostro neon che si disegna col puntatore.
- **Battito**: Web Audio, sedici passi, convolver, oscilloscopio, tastiera e
  Web MIDI.
- **Due schede**: Pong fra due schede dello stesso browser con
  BroadcastChannel; se resta sola, il muro gioca da solo.
- **Busta**: AES-GCM in Web Crypto, chiave nel frammento del link o password
  PBKDF2; il messaggio non passa da un server.
- **Occhio**: BarcodeDetector e fotocamera, con il codice a mano e la foto come
  riserva; nessuna immagine esce dal dispositivo.
- **Parla col muro**: Web Speech per capire e rispondere, Canvas 2D per il muro;
  c'è sempre la riga di testo.
- **Zaino**: OPFS, file trascinati che restano nel browser; quota, download,
  rimozione e `persist()`.
- **Boomerang**: tre secondi di webcam con la cornice pzk, `captureStream` +
  MediaRecorder, loop e download.
- **Poeta**: la Prompt API locale di Chrome se c'è, altrimenti una catena di
  Markov scritta a mano; nessuna rete.
- **AR**: WebXR `immersive-ar` con hit-test e WebGL2; un tocco attacca un
  adesivo pzk; su desktop resta il ripiego 3D.

La fotocamera e il microfono partono solo dopo un gesto e si spengono alla
chiusura; il riconoscimento vocale di Chrome può usare il servizio del browser
(la nota lo dice). La Clip e il Boomerang restano Blob locali; la Busta non
manda il frammento a nessuno. I motori e la UX sono di DeepSeek (OpenCode), il
primo giro grafico di Claude Code; la grafica è stata rifinita il 27.11.2026 e
ogni esperimento ha il suo foglio `esperimenti/<id>/<id>.css`, caricato dopo
`lab.css`. Il brief è `design/frontiera-ux-deepseek.md`, il messaggio di
consegna `design/MESSAGGIO-OPENCODE-LAB.md`. Per le prove:
`npm run check`, `npm run build`, `npm run serve` e `/frontiera/`.

## Le dieci app in-profile (26.11.2026)

Il terzo giro, quello che si apre **dentro il profilo** con `qui:<chiave>` (i tavoli, il cercapersone e le app
singole sono un'altra cosa). Motori e UX di DeepSeek (OpenCode), grafica di Claude Code; il brief è
`design/games-lab-ux-deepseek.md`, la consegna `design/MESSAGGIO-OPENCODE-GAMES.md`.

- **Synth**: Web Audio e Web MIDI. Due oscillatori per nota, ADSR, filtro risonante, arpeggiatore, oscilloscopio,
  piano sullo schermo e tastiera MIDI vera.
- **Batteria**: sedici passi, sei pezzi sintetizzati e swing, con il tempo sull'orologio dell'AudioContext
  (look-ahead di 120 ms) invece che su `setInterval`.
- **Theremin**: puntatore o inclinazione del telefono (DeviceOrientation), cinque scale, riverbero generato al volo.
- **Spettro**: microfono, FFT 4096, spettro logaritmico, forma d'onda, nota con i centesimi e accordo probabile.
- **Specchio**: webcam con sei effetti in un frammento GLSL (WebGL 1), foto negli appunti o in PNG.
- **Sabbia**: automa cellulare 180 × 110 con sabbia, acqua, pietra, olio, fuoco e fumo.
- **Plotter**: disegni generativi in un Web Worker, quattro algoritmi, stesso seme stesso disegno, SVG da salvare.
- **Livella**: bolla, bussola e vibrazione con i sensori del telefono; sul computer si prova col mouse.
- **Dettatura**: Web Speech in cinque lingue, punteggiatura a voce, copia e rilettura con SpeechSynthesis.
- **Tavolozza**: armonie in OKLCH, contrasto WCAG AA/AAA, simulazione di protanopia, deuteranopia e tritanopia.

Stanno in `public/games/<chiave>/` (motore + foglio) col guscio comune in `public/games/lab/` (`lab.js`,
`lab.css`, `audio.js`) e il foglio col nastro dei tavoli (`games/foglio.css`). La finestra si distrugge alla
chiusura e si ricostruisce alla riapertura; le preferenze restano in `localStorage` e microfono, camera, audio e
worker si spengono con `alChiudere`. Le impostazioni sono in `public/assets/config.js` (`nuovo: '2026-11-26'`),
i testi in `public/assets/i18n/it.js` e `en.js`, e le dieci app entrano da sole in «da provare» (la tessera ora
ha 26 buchi).

Per far funzionare microfono, camera, MIDI e sensori **solo per il sito**, `vercel.json` (e `scripts/dev.mjs`)
aprono `Permissions-Policy: camera=(self), microphone=(self), midi=(self), accelerometer=(self),
gyroscope=(self), magnetometer=(self)`; le altre origini restano fuori. La CSP non è cambiata. L'audio e il video
non escono dal browser: le uniche eccezioni sono il riconoscimento vocale di Chrome/Edge (che può usare il
servizio del browser, e la scheda lo dice) e la fotografia copiata negli appunti.

## I progetti veri dentro il sito (18.11)

Il muro, il cercapersone e i tavoli sono quelli veri, col codice dell’ultimo commit
prima che pzkko uscisse dal repository (`a5e42f1`), rimessi agli stessi indirizzi:
`public/art`, `games`, `telefono`, `chat`, `scena`, `suono`, `wallet`, `barra`,
`petizione`, `regia` e le pagine `gadget`, `oggetti`, `traguardi`, `info`, `storia`,
`stato`, `tools/lezioni`. La vecchia home è `public/serranda/` (`/serranda/`).

- **Tutto gira sopra il profilo (19.11).** Il cercapersone 3D e i tavoli non stanno
  più in una finestra col muro dietro: `openHere` in `app.js` carica gli stessi moduli
  (`telefono/telefono.js`, `games/<gioco>/<gioco>.js`) nella pagina del profilo. In
  `config.js` i tasti `play` che cominciano con `qui:` (`qui:zero`, `qui:roulette`…)
  passano da lì; gli indirizzi veri (`/serranda/`, `/tools/lezioni/`) si aprono ancora
  nella finestra (`openApp`). In bacheca il cercapersone è vivo: la foto a sfondo
  trasparente con pzk os acceso sul vetro (`zeroButton`, vestito da `chat/chat.js`
  → `prepara`), e aprendosi il 3D parte da lì. Lo sfondo del cercapersone aperto è
  trasparente (`dialog.tel::backdrop` in `site.css`).
- `public/assets/dchat.js`: la scheda **Chat**, il bot pzk vestito da canale di
  Discord. I comandi sono quelli veri di `chat/comandi/` (53), con gli stessi
  soldi e lo stesso zaino del cercapersone e dei tavoli. **Tutto resta in chat**:
  il conto si apre in un riquadro (`contoQui`, comandi `/account` e `/esci`), i
  tavoli partono dalla barra in alto (`tavolo`), il virtual, il pzkstore e la
  lavatrice sono schede (`virtualQui`, `storeQui`, `lavatriceQui`). Solo `/telefono`
  apre il cercapersone, sopra la pagina. I caratteri sono gg sans dappertutto e gg
  mono solo nel codice.
- **Parole e Trivia rifatti da zero in stile pzk (19.11).** `public/games/parole/` e
  `public/games/trivia/` sono due fogli col nastro come i tavoli (`games/foglio.css`: la
  finestra, la testata, il saldo, il tasto nero), aperti con `qui:parole` e `qui:trivia`.
  Sono loro i progetti «Parole» e «Trivia» del profilo: le versioni React del vecchio
  sito non sono più mostrate. Non decidono niente: Parole chiede alla banca
  (`parole.inizia`, `parole.prova`, `parole.arrendi`: la parola segreta, il dizionario e i
  pagamenti stanno in `C:\pzkko-server\banca`, fuori dal repository), Trivia usa il
  motore dei quiz che la banca aveva già (`chat/quiz.js` → `quiz.*`). In chat: `/parole`
  (la stessa partita del foglio) e `/quiz`. I caratteri del muro (Anton, Special Elite,
  Permanent Marker) sono dichiarati in `site.css`, così i tavoli aperti sopra il profilo
  li hanno.
- **Le app singole (19.11).** Virtual, Miniera, Borsa $pzk, Convertitori, Calcolatrice, Codice C, Cucina del Mincio e
  Rapina hanno ognuna la sua scheda fra i progetti. Virtual apre il suo tavolo (`qui:virtual`); le altre sono le app vere
  del cercapersone, da sole: `public/telefono/schermo.js` (+ `schermo.css`) stende piatto lo schermo di pzk os in una
  finestra sopra il profilo, fermo su quell’app, coi sei tasti dello zero sotto, la tastiera e il clic sullo schermo
  (`qui:app:<app>` in `config.js`, che `openHere` passa a `schermo.apri`; `borsa` è la banca aperta sulla pagina della
  borsa). INDIETRO dalla prima pagina chiude la finestra. Da ospite si aprono tutte tranne la rapina, che vuole il conto
  (prima esce l’accesso): per questo `os.apri` accetta `libera`, e dal cercapersone la regola «senza conto non si entra»
  resta. Le catture ci sono per miniera, borsa e convertitori; le altre restano senza immagine finché non si catturano.
- **La calcolatrice in stile Discord (20.11).** `public/games/calcolatrice/` (`calcolatrice.js` + `.css`): il riquadro
  vestito come il profilo di Discord col tema Nitro (il velo sopra la sfumatura `#ccff00 → #9d00ff`, con le variabili del
  tema che scrive `app.js`, e i colori pzk di riserva), gg sans, i tasti di Discord coi colori pzk: viola le operazioni,
  lime l’uguale, rosso AC. Tre schede: Base, Scientifica (sin cos tan e inverse, log ln √ ^ ! π e, gon/deg/rad; sul
  computer il riquadro si allarga) e Cronologia. I conti sono quelli della calcolatrice del cercapersone
  (`telefono/app/calcolatrice.js`): ANS, gli ultimi risultati e l’unità degli angoli sono in comune, e le parentesi
  lasciate aperte si chiudono da sole (`chiusa`). Si apre col primo tasto del progetto «Calcolatrice» (`qui:calcolatrice`;
  il secondo, «Su pzk os», è l’app del cercapersone) e in chat con `/calcola` (senza conto apre il riquadro, con un conto
  risponde lì). Le catture in `media/p/calcolatrice/` sono di questa.
- Nella chat i suggerimenti dei comandi (`suggerisci` in `dchat.js`) mostrano l’icona vera, `/nome` con gli argomenti e
  sotto la descrizione, come il selettore di Discord.
- `/serranda/?apri=zero` (`?apri=chat`, `?apri=roulette`…) funziona ancora come
  indirizzo diretto, ma il profilo non lo usa più.
- `api/`: le funzioni di Vercel, ponti firmati verso la banca che gira sul pc
  (`C:\pzkko-server`, attraverso Tailscale Funnel). Servono due variabili nel
  progetto Vercel: `PZKKO_SERVER_URL` e `PZKKO_SERVER_SECRET`. Senza, o col pc
  spento, il sito dice «in pausa» e si gioca coi 1.000 $pzk della sessione.
  Con l’account (app Account del cercapersone) i progressi si salvano nella
  banca e sono gli stessi nella chat, nel cercapersone e ai tavoli.
- Tolti rispetto a quel commit: i volantini col numero di telefono e con
  l’indirizzo e-mail, il nome del paese nei testi, gli adesivi con le foto degli
  amici, Deutschland e la wiki.

## L’accesso con l’email (19.11)

Niente password e niente PIN: si entra con l’email e un codice di sei cifre che
arriva per posta. Il codice vale dieci minuti e in quei dieci minuti è di chi
l’ha chiesto (richiederlo rimanda lo stesso, e ci si entra anche da un altro
dispositivo); poi ne esce uno nuovo. Accedere e registrarsi sono la stessa
strada: se l’email non ha un conto, dopo il codice si chiede solo il nome.

Il riquadro è uno solo, fatto come quelli di Discord, e lo aprono il profilo, la
chat, il cercapersone e i tavoli: `public/accesso/accesso.js` (con
`accesso.css`, che sta in piedi da solo). Dentro ci sono:

- **l’invito** (`invito`), come quello di un server di Discord: esce all’arrivo
  per chi non ha un conto, una volta per visita e non più di una ogni dodici
  ore. I numeri sono veri: quanti conti ci sono e se la banca risponde;
- **l’accesso** (`accedi`): email, codice, nome;
- **le novità** (`novita`), come il «Novità» di Discord: una volta per versione
  (`NOVITA.v` in `accesso.js`), dopo l’accesso o all’arrivo di chi è già dentro;
- **il regalo di instagram** (`premio`): 2.000 $pzk a chi mi segue su tutti e
  due i profili. Instagram non dice a un sito chi segue chi, quindi si scrive
  il proprio nome, la banca scrive a pzkko (email, e Discord se c’è il
  webhook) e lui decide dal tasto della lettera, che apre `/?premio=…`
  (`decidi`). Col sì i $pzk partono subito. Se la lettera non parte la
  richiesta resta lo stesso: nel conto di pzkko il tasto del conto mostra un
  numero rosso («Regali da decidere»), e all’arrivo nel sito la richiesta
  nuova si apre da sola (`premi`).

I codici, le lettere e le email stanno sulla banca, sul pc di pzkko
(`C:\pzkko-server\banca\posta.mjs`, in SMTP): se il pc è spento non si entra.
L’email non torna mai intera al browser. Le scritte dell’accesso sono in
italiano e in inglese; le altre lingue del profilo vedono l’inglese.

Nella scheda del profilo c’è il tasto del conto: verde «Entra» per chi è fuori,
il nome e i $pzk per chi è dentro (col menu: novità, regalo, esci). In chat:
`/account`, `/regalo`, `/novita`.

## I popup in stile pzk e le app in vetrina (25.11)

Il profilo resta quello di Discord; tutto quello che **si apre sopra** è un
pezzo del muro, come i tavoli: l’accesso (invito, email, codice, nome,
benvenuto, novità, regalo), la scheda del progetto, la ricerca (Ctrl K), i menu,
l’avviso in basso e la testata della finestra delle app. Il foglio è
`art/roulette/carta.webp` allungato con `border-image` (gli angoli col nastro
restano interi a ogni misura; sul telefono la scheda del progetto è carta
piena, senza nastro). Anton per i titoli, Permanent Marker per la voce, Special
Elite per il resto, il tasto nero storto, l’evidenziatore giallo e i timbri.
Gli stili stanno in fondo a `src/site.css` (le variabili `--pz-*`) e in
`accesso/accesso.css`, che resta autonomo. Restano come sono, apposta: i tavoli
(già fogli), la calcolatrice (Discord), lo schermo di pzk os, la chat e il
visualizzatore di Instagram (vedi `design/instagram-bacheca.md`).

Le app si spingono da sole, senza server: il browser si ricorda quali app hai
aperto (`pzkko-provate` in localStorage) e `daProvare()` in `app.js` propone
prima le nuove mai provate (`nuovo: 'AAAA-MM-GG'` in `config.js`, per tre
settimane), poi le altre mai provate, poi il resto, in un giro che cambia ogni
giorno. Le stesse proposte stanno:

- in bacheca, **«da provare»**: quattro volantini col tasto e la tessera con un
  tondo per ogni app, timbrato quando la apri;
- nel **volantino** in basso a destra: esce quando chiudi un’app (un’altra da
  provare) e una volta per visita dopo 40 secondi; mai sopra qualcosa di
  aperto, mai nella chat, e dopo due X per quella visita tace
  (`?volantino` lo fa uscire subito, anche negli strumenti di prova);
- nella scheda del progetto, **«prova anche»**: tre volantini in fondo;
- nella ricerca, **«gioca subito»**: ogni cosa che gira qui (Roulette, Parole,
  la Miniera…) si apre dalla ricerca senza passare dalla scheda;
- nell’invito, quattro polaroid (PZK Zero, Parole, Roulette, Trivia) che si
  aprono subito anche da ospite, e nelle **novità** del 25.11 un tasto «gioca»
  accanto a ogni app nuova. Dall’accesso un tasto d’app manda l’evento
  `pzkko-apri`: il profilo lo raccoglie, altrove si va a `/#progetti/<app>`.

I timbri «nuovo» e «provata ✓» stanno anche sulle schede dei progetti.

## Comandi

```sh
npm install
npm run build   # controllo di sicurezza + public/assets/site.css
npm run check   # controllo di sicurezza (CSP, segreti, rimandi vietati)
npm run csp     # rigenera le impronte CSP dopo aver toccato uno script in linea
npm run dev     # rigenera site.css a ogni modifica
npm run media   # riscrive public/assets/media.js dopo aver cambiato le catture
npm run serve   # il sito in locale con le funzioni di api/ (porta 5080) e la banca del pc
npm run preview # le intestazioni vere di vercel.json, in locale (porta 5081)
```

Vercel esegue `npm run build` e pubblica `public/` (vedi `vercel.json`).

## Sicurezza e prestazioni

- **Content-Security-Policy con impronte.** Gli script in linea delle pagine
  vecchie sono ammessi solo con la loro impronta SHA-256: niente
  `'unsafe-inline'`, niente script di terzi. Dopo aver modificato uno script in
  linea in un `.html` si lancia `npm run csp`; `npm run check` (e quindi la
  build) fallisce se le impronte non sono più allineate.
- **Intestazioni forti.** HSTS con preload, `frame-ancestors 'self'` (il sito non
  si fa incorniciare da altri), COOP/CORP, `Permissions-Policy` minima,
  `X-Content-Type-Options`, `Referrer-Policy`. `www.pzkko.it` rimanda a
  `pzkko.it`, così c'è una sola origine.
- **API chiuse.** I ponti verso la banca accettano solo lo stesso sito,
  `application/json` nei POST, con tetto di richieste per IP (in memoria, l'IP
  non si salva); il tasto di moderazione si confronta in tempo costante; gli
  errori del server di casa non tornano al browser. Il segreto resta nelle
  variabili di Vercel.
- **Niente collegamenti all’identità personale, tranne i profili scelti.**
  La build cerca il dominio e i nomi/account personali in `public/`, `api/`,
  `scripts/`, `vercel.json` e `README.md`, e si ferma se ricompaiono. Le uniche
  eccezioni sono i profili di `PERSONAL_SOCIALS` e le schede Instagram (24.11) e
  TikTok (26.11), ammessi solo in `public/assets/config.js`, `ig.js` e nei dati
  di `/media/ig/` e `/media/tt/`; il dominio personale resta vietato. `npm run check` cerca anche
  percorsi del computer, indirizzi di rete privati (LAN e Tailscale), chiavi
  private e token.
- **Prestazioni.** Italiano e inglese arrivano subito; le altre sette lingue
  stanno in `public/assets/i18n/` e si scaricano solo quando si sceglie quella.
  Cache lunga su CDN per asset, font, immagini e video; HTML sempre rivalidato.
  Font critici e avatar in preload, immagini dei progetti lazy.
- **Quello che non si può promettere.** Nessun sito è al 100 %: qui si chiudono
  le porte applicative, ma DDoS, WAF e patch dell'infrastruttura sono di Vercel
  (e vanno tenuti attivi nel pannello). `npm audit` va rifatto quando si
  aggiornano le dipendenze.

## I caratteri

`public/fonts/` contiene i file che usa il client web di Discord: gg sans e gg
mono (di Discord), ABC Ginto Nord (Dinamo) e i caratteri dei nomi, fra cui
Pricedown (Typodermic). Sono caratteri con una licenza propria, non liberi:
qui servono a rifare fedelmente il profilo. Per toglierli basta cancellare la
cartella e le regole `@font-face` in `src/site.css`: il sito ripiega su Noto
Sans e sui caratteri di sistema.
