# pzkko.it

Il profilo per svago di pzkko, fatto come il suo profilo di Discord e
con i pezzi veri di Discord: i caratteri (gg sans, gg mono, ABC Ginto Nord e
Pricedown per il nome), la cornice «Crystals (Peridot)», l’effetto «Dreamy (Green)»,
il tema `#ccff00 → #9d00ff` calcolato come lo calcola il client (velo bianco
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
  non viene mai letto né mostrato.
- **Discord** (`discord.com/api/v9/collectibles-products/<sku>`, senza accesso):
  nome, immagini e misure di effetto e cornice; in memoria nel browser per un
  giorno. Le immagini arrivano da `cdn.discordapp.com`. Se cambi cornice, effetto,
  carattere del nome o tema su Discord, il sito li segue da solo.
- Se un servizio non risponde valgono i valori di riserva in `config.js`.

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

La scheda **`#community`** sta dentro la home, mai una pagina a sé: il banner in
Bacheca e la voce nel piè di pagina portano lì con l'hash. Mette in fila i numeri
pubblici dei due server Discord che seguo, OLLARE e SOLLARY: membri, presenze e
boost. Non c'è un bot dentro i server: `api/community.mjs` legge solo gli inviti
pubblici (`with_counts=true`), tiene i conteggi in cache cinque minuti e non
restituisce nomi, messaggi, canali vocali o presenze individuali. Il modulo
`public/assets/community-tab.js` si carica solo quando la scheda si apre; la hero
è `public/assets/community/hero.svg`, disegnata con Claude Code (Opus). La vecchia
pagina `/community/` è stata tolta: `/community` e `/community/` rimandano a
`/#community` in `vercel.json` (e nel server di prova).

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
  (`decidi`). Col sì i $pzk partono subito.

I codici, le lettere e le email stanno sulla banca, sul pc di pzkko
(`C:\pzkko-server\banca\posta.mjs`, in SMTP): se il pc è spento non si entra.
L’email non torna mai intera al browser. Le scritte dell’accesso sono in
italiano e in inglese; le altre lingue del profilo vedono l’inglese.

Nella scheda del profilo c’è il tasto del conto: verde «Entra» per chi è fuori,
il nome e i $pzk per chi è dentro (col menu: novità, regalo, esci). In chat:
`/account`, `/regalo`, `/novita`.

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
- **Niente collegamenti all’identità personale.** Non è un accordo fra siti: la
  build cerca il dominio e i nomi/account personali in `public/`, `api/`,
  `scripts/`, `vercel.json` e `README.md`, e si ferma se ricompaiono. `npm run
  check` cerca anche percorsi del computer, chiavi private e token.
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
