# TikTok in bacheca — brief UX per DeepSeek (OpenCode)

> **Questo file è per l'agente DeepSeek dentro OpenCode.** La grafica della
> scheda l'ha fatta Claude Code (26.11): aspetto, stati, sfondi. **L'esperienza
> d'uso è tua**: il visualizzatore, l'anteprima al passaggio, la tastiera, i
> gesti, l'accessibilità. Leggi tutto il file e apri i file citati prima di
> cambiare qualcosa.

## Cosa c'è già

La scheda TikTok è viva in bacheca, subito sotto quella di Instagram
(`#tt-card` in `renderBoard()` di `public/assets/app.js`). È la sorella della
scheda Instagram, non la gemella: stessa famiglia, vestito diverso.

File:

- `public/assets/tt.js` — dati, scheda, stati. Esporta `monta(root, { lang })`
  e `stato(root)` (`{ acc, storie, video, repost }`: il profilo scelto, le
  storie ancora vive, i video, i repost). **Le interazioni le aggiungi qui** (o in un modulo
  nuovo, per esempio `tt-vista.js`, caricato da `tt.js` al primo clic).
- `public/assets/tt-sfondi.js` — gli sfondi vivi: dodici scene, una ogni due
  ore. È grafica: non toccare le scene. L'API è `accendi(casa, { quandoCambia })`
  → `{ sposta, tema, stato, nome(lang), prossimo(), spegni }`.
- `src/site.css` — le regole `.ttc*` (dopo quelle di Instagram, prima della
  vetrina). Per il visualizzatore usa un prefisso nuovo, `.ttv*`.
- `public/media/tt/index.json` — il contratto dati; **non riscriverlo a mano**.
- `public/media/tt/<account>/…` — avatar, `v/<id>.webp|mp4` (video),
  `storie/<id>.webp|mp4`, `r/<id>.webp` (copertine dei repost). Non
  cancellare, non rinominare, non ricomprimere.

Il contratto dati (semplificato):

```json
{
  "updated": "2026-11-25T23:22:01+00:00",
  "accounts": [{
    "username": "…", "name": null, "bio": [], "avatar": "…/avatar-….webp",
    "url": "https://www.tiktok.com/@…", "private": false, "verified": false,
    "stats": { "followers": 0, "following": 0, "likes": 0, "videos": 0 },
    "history": [{ "t": "…", "f": 0 }],
    "stories": [{ "id": "…", "type": "photo|video", "src": "…", "w": 0, "h": 0,
                  "at": "…", "until": "…", "durata": 0, "stats": { "views": 0, "likes": 0 } }],
    "videos": [{ "id": "…", "at": "…", "type": "video|photo", "pinned": false,
                 "cover": "…/v/<id>.webp", "src": "…/v/<id>.mp4", "photos": [{ "src": "…", "w": 0, "h": 0 }],
                 "w": 0, "h": 0, "durata": 0, "url": "https://www.tiktok.com/@…/video/<id>",
                 "solo_qui": true,
                 "stats": { "views": 0, "likes": 0, "comments": 0, "shares": 0 } }],
    "reposts": [{ "id": "…", "at": "…", "type": "video|photo", "cover": "…/r/<id>.webp",
                  "w": 0, "h": 0, "durata": 0, "author": "account-dell-autore",
                  "stats": { "views": 0, "likes": 0 }, "url": "https://www.tiktok.com/@autore/video/<id>" }],
    "synced": "…"
  }]
}
```

`name` è `null` quando il nome del profilo contiene il nome personale: la
scheda mostra solo `@account` (è voluto). Un post di foto (`type: "photo"`) ha
la prima foto in `cover` e le altre in `photos`; un video ha `src` (MP4) se non
era troppo grande, altrimenti solo la copertina.

**I video `solo_qui`** su TikTok non sono pubblici: il proprietario li ha
scelti per il sito (i due virali). Non hanno `url` (il video su TikTok, per chi
guarda, non si apre): nel visualizzatore il collegamento va al profilo, e
l'etichetta ciano «solo qui» deve restare. Il filmato è nel sito (`src`).

**I repost** sono video di altri: hanno solo copertina, `author` (l'account,
mai il nome; può mancare), numeri e `url` dell'originale. **Niente `src`**: nel
visualizzatore mostra la copertina a tutta altezza, `@autore` ben visibile e un
invito «Guarda su TikTok» verso `url`. Non scaricare né incorporare i loro
filmati.

**Dati veri di oggi:** 2 video (`solo_qui`), 93 repost, 0 storie (TikTok segna
le storie di oggi come private, e il raccoglitore le lascia fuori). Per provare
le storie o un post di foto copia `index.json` da parte, scrivine uno di prova
che punta a media già pubblici (per esempio
`"src": "../ig/<account>/highlights/…/….webp"`), prova, e **rimetti quello
vero**. Non committare mai dati finti.

## Gli agganci già nel markup

- `#tt-pan` — il pannello principale (`data-tt-lang` = lingua).
- `a.ttc__clip[data-tt-clip="k"]` — un video; `k` è l'indice in
  `stato(root).video`. Oggi è un link a TikTok (`target=_blank`): **intercetta
  il clic** e apri il visualizzatore; il link resta come ripiego senza JS.
- `a.ttc__rep[data-tt-repost="k"]` — un repost (fila «Repost», tessere più
  piccole con `@autore` sotto); `k` è l'indice in `stato(root).repost`. Oggi
  è un link all'originale su TikTok: intercettalo e apri il visualizzatore
  sulla fila dei repost (scorrimento verticale come i video).
- Un video `solo_qui` oggi apre il suo MP4 del sito in una scheda nuova: è il
  ripiego, sostituiscilo col visualizzatore.
- `a.ttc__clip--storia[data-tt-storie]` — la tessera delle storie di oggi
  (anello ciano→rosso). Il clic apre le storie dalla prima.
- `.ttc__prev` dentro ogni tessera — vuoto: è il posto per l'anteprima
  (video muto o foto successiva) al passaggio.
- `.ttc__clip.is-sopra` — la classe che dà l'aspetto «al passaggio» (si alza
  di 3 px, bordo ciano a sinistra e rosso a destra). Col mouse c'è già via
  `:hover`; mettila tu quando l'anteprima parte da tastiera o dal tocco.
- `button[data-tt-disco]` — il disco del suono: chiama già `prossimo()` sullo
  sfondo e fa un giro in più (`.is-gira`). Etichetta e `data-tip` dicono la
  fascia e il nome della scena.

## Cosa deve restare vero

1. **Nativo, non incorporato.** Niente iframe di TikTok, niente `embed.js`,
   niente pixel, niente oEmbed dal browser. Il CSP (`vercel.json`) non va
   allargato.
2. **Pubblico e senza account.** Nessun campo password, nessun «accedi con
   TikTok», in nessuno stato.
3. **Risoluzione nativa nel visualizzatore.** `object-fit: contain`, niente
   ritagli che tagliano il video, niente upscaling. (Nelle tessere 3:4 il
   ritaglio è voluto: è la griglia del profilo.)
4. **Solo ciò che è stato scelto.** Niente didascalie, commenti, elenchi di
   follower o «mi piace» altrui; dei repost solo quello che c'è nei dati. Se
   serve un dato nuovo, chiedilo (vedi in fondo).
5. **Tempi leggeri.** Il raccoglitore passa una volta all'ora: mostrare
   «aggiornato …» e «controllo automatico ogni ora» è corretto, niente finto
   «in diretta».
6. **Il nome personale non entra nei file.** `scripts/guard.mjs` blocca la
   build se `tt.js` (o un file nuovo) contiene il nome dell'account: l'account
   si legge **sempre dai dati** (`acc.username`, `acc.url`). L'eccezione del
   guard copre solo `public/media/tt/`.

## Il linguaggio visivo (non romperlo)

- Due vesti, come Instagram: carta fredda col tema chiaro, nero col tema scuro.
  Tutto passa da `--tt-c` (inchiostro) e `--tt-b` (fondo) su `.ttc__in`; un
  colore nuovo si scrive `rgba(var(--tt-c), …)`, mai un bianco fisso.
- **Ciano e rosso solo su**: numeri grandi (sdoppiati), marchio, tasto «Segui»,
  anello delle storie, etichette «fissato» (rosso) e «solo qui» (ciano), bordo
  delle tessere al passaggio.
  Nel visualizzatore puoi usarli per la barra di avanzamento e per il cuore,
  non per i fondi.
- Il verde lime del profilo (`--p`) solo nel puntino dell'occhiello.
- Numeri in `tabular-nums`, col separatore («12.310»); sotto le icone la forma
  corta (`corto()` in `tt.js`: «227,7K»).
- Tessere dritte (non ruotate: le carte storte sono di Instagram), 3:4,
  angoli 6 px. Il tasto rosso è un filo storto con l'ombra piena in ciano.
- La colonna delle azioni sta **a destra** (la colonna dei profili di Instagram
  sta a sinistra): non spostarla.

## Il tuo lavoro (UX)

### 1. Il visualizzatore (`.ttv`)

Deve sembrare TikTok senza copiarlo, e non deve essere il visualizzatore di
Instagram ricolorato:

- **I video si scorrono in verticale**, come il feed «Per te»: rotella, swipe
  su/giù, frecce su/giù, PagSu/PagGiù. Uno scatto per video, con snap.
- **Le storie e i post di foto si scorrono in orizzontale** (tap a sinistra o a
  destra, swipe, frecce sinistra/destra), con le barre in alto.
- Pannello 9:16 alto `min(92vh, 900px)` sul desktop, tutto schermo su mobile
  (`100dvh`, `env(safe-area-inset-*)`); `object-fit: contain`.
- A destra, sopra il video, la stessa colonna della scheda in piccolo:
  visualizzazioni, mi piace, commenti, condivisioni **del video** (dai dati),
  e il link «Apri su TikTok». Nessun pulsante finto («mi piace» che non fa
  niente): solo numeri e il link.
- In basso: data del video e contatore «3 di 6» (`aria-live="polite"`).
- Il video parte **muto** e va in loop (come TikTok); un pulsante attiva
  l'audio. Tap al centro = pausa, con una targhetta «IN PAUSA».
- Se un video non ha `src` (troppo grande), mostra la copertina e un invito
  «Guarda su TikTok».
- Si apre dal video cliccato (o dalla storia), si chiude con `Esc`, con la ×,
  con uno swipe in giù sulle storie; il fuoco torna alla tessera.
- Precarica solo il video successivo (metadati), non tutta la fila.

### 2. L'anteprima al passaggio

- Col mouse fermo su una tessera per ~120 ms: il video parte muto dentro
  `.ttc__prev` (o, per un post di foto, le foto scorrono ogni 0,9 s).
- Uscendo, si ferma e si svuota. Niente cache di oggetti `Video`/`Image` in JS:
  ci pensa il browser.
- Sul tocco niente anteprima: il tocco apre.
- Con `prefers-reduced-motion: reduce` niente anteprima automatica.

### 3. Tastiera e fuoco

- Nella fila: frecce sinistra/destra spostano il fuoco fra le tessere
  (roving tabindex), Invio/Spazio aprono. Il fuoco visibile c'è già.
- Il disco: annuncia il cambio di scena (una regione `aria-live` discreta).
- Nel visualizzatore: focus trap, `role="dialog"`, `aria-modal="true"`,
  etichetta col nome dell'account e il tipo di contenuto.

### 4. La fila

- Quando la fila sborda: due frecce discrete ai lati (solo col mouse) o lo
  scorrimento con la rotella in orizzontale. La sfumatura a destra c'è già
  (`mask` su `.ttc__strip`): toglila quando si è arrivati in fondo.

### 5. Testi

I testi stanno in `TESTI` dentro `tt.js` (italiano e inglese; le altre sette
lingue usano l'inglese, come la scheda Community). Aggiungi lì quelli nuovi.

## Stati da coprire (la grafica c'è già, verifica il comportamento)

- **Caricamento**: lo scheletro ha la stessa sagoma, niente salto.
- **Primo avvio** (manca `index.json`): «In attesa del primo aggiornamento.» e
  il link al profilo preso da `config.js`.
- **Errore**: resta l'ultima copia in memoria con una nota; senza copia,
  messaggio breve.
- **Nessun video pubblico** (com'è oggi): il riquadro tratteggiato.
- **Storie**: la tessera con l'anello compare solo se ci sono storie vive
  (`until` nel futuro); scadute spariscono anche se il JSON è vecchio.
- **Dati vecchi**: la data vera, non nasconderla.

## Prove prima di dire fatto

- `npm run check` e `npm run build` passano.
- `/#bacheca` (anteprima: `npm run preview` → porta 5081): la scheda c'è, i
  numeri sono quelli di `index.json`.
- 1440, 900, 500, 360 px: nessun overflow orizzontale, niente testo tagliato.
- Tema chiaro e scuro; `prefers-reduced-motion: reduce`; offline dopo un primo
  caricamento.
- Con un indice di prova: un video, un post di foto, una storia; il video
  parte muto, si scorre in verticale, si chiude con `Esc` e il fuoco torna
  alla tessera. Poi rimetti l'indice vero.
- Nessun campo password/account in nessuno stato.

## Cosa non fare

- Non toccare `public/media/tt/**`, il raccoglitore
  (`%USERPROFILE%\Collegamenti\TikTok\`), `scripts/guard.mjs`, `vercel.json`.
- Non cambiare le scene di `tt-sfondi.js` né la direzione visiva qui sopra:
  se ti serve un ritocco grafico, chiedilo.
- Non toccare la scheda Instagram (`ig.js`, `ig-sfondi.js`, `.igc*`, `.igv*`).
- Non trasformare la scheda in una pagina a sé: resta dentro `#bacheca`.
- Non scrivere il nome dell'account in nessun file.

## Se ti serve qualcosa

Un dato nuovo (per esempio la musica di un video) o un ritocco grafico: scrivilo
in `design/MESSAGGIO-OPENCODE-TIKTOK.md`, con cosa ti serve e perché. Claude
Code risponde in `design/RISPOSTA-CLAUDE-TIKTOK.md`.
