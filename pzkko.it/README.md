# pzkko.it

Il profilo per svago di Alberto Pecchini, fatto come il suo profilo di Discord e
con i pezzi veri di Discord: i caratteri (gg sans, gg mono, ABC Ginto Nord e
Pricedown per il nome), la cornice «Crystals (Peridot)», l’effetto «Dreamy (Green)»,
il tema `#ccff00 → #9d00ff` calcolato come lo calcola il client (velo bianco
all’80 % col tema chiaro, nero al 60 % con quello scuro, tinta del testo, sfondo
del pannello), banner, avatar con la decorazione, stato, stato personalizzato,
tag NODE, badge, bio e collegamenti, tutto dal vivo. Il sito principale resta
[albertopecchini.it](https://www.albertopecchini.it).

## Da dove arrivano i dati

- **Lanyard** (`api.lanyard.rest`, WebSocket): avatar, decorazione, stato,
  dispositivi, stato personalizzato, Spotify, giochi, tag del server, stile del
  nome (carattere ed effetto). Serve restare nel server <https://discord.gg/lanyard>.
- **Profilo pubblico** (`dcdn.dstn.to/profile/<id>`): banner, colori del tema,
  bio, badge, collegamenti e gli SKU di effetto, cornice e decorazione; si
  ricarica ogni 10 minuti. Il campo dei pronomi non viene mai letto né mostrato.
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
- `public/fonts/`: i caratteri del client di Discord (vedi sotto).
- `public/.well-known/discord`: la verifica del dominio per Discord.
- `src/site.css`: Tailwind v4 e i componenti.
- `scripts/media.mjs`: scrive `media.js` dalle cartelle di `public/media/p/`.

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

## Comandi

```sh
npm install
npm run build   # genera public/assets/site.css
npm run dev     # lo rigenera a ogni modifica
npm run media   # riscrive public/assets/media.js dopo aver cambiato le catture
npm run serve   # il sito in locale con le funzioni di api/ (porta 5080) e la banca del pc
```

Vercel esegue `npm run build` e pubblica `public/` (vedi `vercel.json`).

## I caratteri

`public/fonts/` contiene i file che usa il client web di Discord: gg sans e gg
mono (di Discord), ABC Ginto Nord (Dinamo) e i caratteri dei nomi, fra cui
Pricedown (Typodermic). Sono caratteri con una licenza propria, non liberi:
qui servono a rifare fedelmente il profilo. Per toglierli basta cancellare la
cartella e le regole `@font-face` in `src/site.css`: il sito ripiega su Noto
Sans e sui caratteri di sistema.
