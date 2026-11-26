# TikTok in bacheca — brief

> Per chi rimette mano alla scheda TikTok (Claude Code in VS Code o DeepSeek in
> OpenCode). Leggi anche `design/instagram-bacheca.md`: la scheda TikTok **è**
> la scheda Instagram con altri colori, e quel brief vale anche qui.

## La decisione (26.11, sera)

La prima versione della scheda TikTok era «sorella, non gemella» (colonna a
destra, numeri sdoppiati, fila 3:4). Il proprietario l'ha vista online e ha
chiesto: «l'embed di TikTok è completamente diverso da IG — stessi font, cambia
i colori, fai una dashboard uguale altrimenti troppe stranezze». Quindi:

- **stessa dashboard, stesso codice.** Il motore della scheda Instagram è
  diventato `public/assets/scheda-social.js`; `ig.js` e `tt.js` sono solo
  configurazioni. Colonna dei profili a sinistra, follower in Ginto Nord col
  gradiente, riga dei numeri, tasto «Apri su …», tessere 9:16 storte che si
  sfogliano col puntatore, visualizzatore a tutto schermo, stati, scheletro:
  tutto identico.
- **cambiano solo**: colori (`.igc--tt` in `src/site.css`), testi, i mazzi
  (cosa c'è nelle tessere), la riga dei numeri e gli sfondi vivi.

**Non far divergere le due schede.** Una miglioria all'esperienza (tastiera,
gesti, visualizzatore, accessibilità) va in `scheda-social.js` e vale per tutte
e due: provala su entrambe. Se serve qualcosa solo per TikTok, aggiungi
un'opzione alla configurazione, non una copia del codice.

## File

- `public/assets/scheda-social.js` — il motore: `crea(config)` → `{ monta,
  apri, stato }`. In testa al file c'è l'elenco dei campi della configurazione
  e degli elementi di un mazzo.
- `public/assets/tt.js` — la configurazione TikTok: testi (it, en), mazzi,
  numeri, il quadratino del marchio, gli sfondi. Esporta `monta`, `apri`,
  `stato`. **Niente nome dell'account qui**: si legge dai dati
  (`scripts/guard.mjs` lo vieta in questo file).
- `public/assets/tt-sfondi.js` — dodici scene vive, una ogni due ore, linee
  morbide stampate due volte (ciano a sinistra, rosso a destra) sullo stesso
  battito. Stessa interfaccia di `ig-sfondi.js` (`accendi` → `{ sposta, tema,
  stato: { ora, aCaso, chiaro }, nome, aCaso, spegni }`): il dado della colonna
  funziona uguale. Le scene stanno su tutta la tela; quello che si vede davvero
  è la fascia in mezzo, fra il numero e le tessere.
- `src/site.css` — `.igc--tt` (dopo le regole `.igc*` / `.igv*` di Instagram):
  solo variabili di colore, luci, il quadratino nero col marchio sdoppiato e
  `image-rendering: auto` per la tela (le scene TikTok non sono pixel).
- `public/media/tt/index.json` e `public/media/tt/<account>/…` — dati e media
  del raccoglitore. **Non toccarli a mano.**

## Cosa c'è nelle tessere

`tt.js` → `mazzi()` trasforma i dati in mazzi come le evidenze di Instagram:

1. **Storia** (solo se ci sono storie vive, con l'anello): come Instagram.
2. **Video**: i video mostrati nel sito. Oggi sono i due virali, che su TikTok
   non sono pubblici e nel sito sì (`solo_qui: true`): nel visualizzatore il
   contatore dice «1 di 2 · 1,6 Mln visualizzazioni · solo qui» e il
   collegamento va al profilo (il video su TikTok, per chi guarda, non si
   apre). Un video senza filmato (troppo grande) si vede con la copertina; un
   post di foto diventa una voce per foto.
3. **Repost**: tutti (93). Sono video di altri: c'è solo la copertina. Nel
   visualizzatore al posto del titolo c'è `@autore`, il contatore dice le
   visualizzazioni e il collegamento in basso è «Guarda su TikTok» verso
   l'originale. Sfogliando la tessera, la riga sotto il titolo dice «40/93 ·
   @autore».

La riga dei numeri: seguiti, mi piace, video (il più grande fra il conteggio di
TikTok e i video mostrati).

## Il contratto dati (semplificato)

```json
{
  "updated": "…",
  "accounts": [{
    "username": "…", "name": null, "bio": [], "avatar": "…/avatar-….webp",
    "url": "https://www.tiktok.com/@…", "private": false, "verified": false,
    "stats": { "followers": 0, "following": 0, "likes": 0, "videos": 0 },
    "history": [{ "t": "…", "f": 0 }],
    "stories": [{ "id": "…", "type": "photo|video", "src": "…", "w": 0, "h": 0,
                  "at": "…", "until": "…", "durata": 0, "stats": { "views": 0, "likes": 0 } }],
    "videos": [{ "id": "…", "at": "…", "type": "video|photo", "pinned": false, "solo_qui": true,
                 "cover": "…/v/<id>.webp", "src": "…/v/<id>.mp4", "photos": [{ "src": "…", "w": 0, "h": 0 }],
                 "w": 0, "h": 0, "durata": 0, "url": "https://www.tiktok.com/@…/video/<id>",
                 "stats": { "views": 0, "likes": 0, "comments": 0, "shares": 0 } }],
    "reposts": [{ "id": "…", "at": "…", "type": "video|photo", "cover": "…/r/<id>.webp",
                  "w": 0, "h": 0, "durata": 0, "author": "account-dell-autore",
                  "stats": { "views": 0, "likes": 0 }, "url": "https://www.tiktok.com/@autore/video/<id>" }],
    "synced": "…"
  }]
}
```

`name` è `null` quando il nome del profilo contiene il nome personale: allora
il titolo della scheda è `@account` (`.igc__user--solo`, nella misura del nome).

## I colori

- Due vesti come Instagram, ma neutre: carta fredda (`243,247,247`, inchiostro
  `14,19,22`) col tema chiaro, nero (`8,9,11`) col tema scuro. Tutto passa da
  `--ig-c` / `--ig-b` su `.igc--tt .igc__in`.
- Il gradiente di TikTok sta negli stessi posti di quello di Instagram:
  numero dei follower (`--ig-gt`: ciano → bianco → rosso di notte, ciano scuro
  → inchiostro → rosso di giorno), anello delle storie e iniziale di riserva
  (`--ig-g`: ciano → rosso). Nient'altro.
- Il quadratino in cima alla colonna è l'icona dell'app: nero, col marchio
  sdoppiato ciano e rosso sotto e bianco sopra (`.igc__tt`).
- Le luci in basso a sinistra: rosso e ciano invece di rosa e viola.
- Il verde lime del profilo (`--p`) solo nel puntino dell'occhiello, come su
  Instagram.

## Cosa deve restare vero

Le regole di `design/instagram-bacheca.md` (nativo, pubblico senza account,
risoluzione nativa nel visualizzatore, tempi leggeri) più:

- dei repost solo quello che c'è nei dati: niente filmati di altri scaricati o
  incorporati, niente nomi degli autori (solo `@account`);
- l'etichetta «solo qui» sui video che su TikTok non sono pubblici resta;
- niente iframe, `embed.js` od oEmbed di TikTok; il CSP non va allargato.

## Prove prima di dire fatto

- `npm run check` e `npm run build` passano.
- `/#bacheca` (anteprima: `npm run preview`): **le due schede una sotto
  l'altra** si leggono come la stessa dashboard; i numeri sono quelli dei due
  `index.json`.
- Su TikTok: sfoglia «Video» (parte il filmato muto) e «Repost» (copertine,
  «n/93 · @autore»); apri il visualizzatore da tutte e due; `Esc` chiude e il
  fuoco torna alla tessera.
- 1440, 900, 500, 360 px; tema chiaro e scuro; `prefers-reduced-motion`.
- Dopo ogni modifica al motore, ricontrolla anche la scheda Instagram.

## Se ti serve qualcosa

Un dato nuovo o un ritocco al raccoglitore: scrivilo in
`design/MESSAGGIO-OPENCODE-TIKTOK.md`; Claude Code risponde in
`design/RISPOSTA-CLAUDE-TIKTOK.md`.
