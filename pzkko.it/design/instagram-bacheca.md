# Instagram in bacheca — brief per Claude Code in VS Code

> **Questo file è per Claude Code in VS Code.** Non è per l'agente dentro
> OpenCode: il lato dati è già fatto, qui si rifinisce solo la presentazione.
> Prima di cambiare qualcosa, leggi tutto il file e apri i file citati.

## Cosa c'è già

La scheda Instagram è viva in bacheca, dopo il progetto in evidenza. Non è un
iframe e non è uno screenshot: è HTML/CSS del sito, con i dati statici scritti
dal raccoglitore sul pc. Funziona senza account, senza cookie e senza chiamare
Instagram dal browser.

File:

- `public/assets/ig.js` — dati, scheda, visualizzatore. Esporta `monta(root,
  { lang })` e `apri(account, items, titolo, lang, partenza)`.
- `src/site.css` — regole `.igc*` (scheda) e `.igv*` (visualizzatore), in fondo.
- `public/assets/app.js` — `renderBoard()` monta `#ig-card`; `renderSocial()`
  mostra il gruppo «Personale».
- `public/assets/config.js` — `PERSONAL_SOCIALS` (l'eccezione voluta).
- `public/media/ig/index.json` — il contratto dati; **non riscriverlo a mano**.
- `public/media/ig/<account>/…` — media già scaricati (WebP/MP4, risoluzione
  nativa). Non cancellare, non rinominare, non ricomprimere.

Il contratto dati è questo (semplificato):

```json
{
  "updated": "2026-11-24T21:18:58+00:00",
  "accounts": [{
    "username": "…", "name": "…", "bio": ["…"], "avatar": "…",
    "url": "https://www.instagram.com/…/", "private": true,
    "stats": { "followers": 0, "following": 0, "posts": 0 },
    "history": [{ "t": "…", "f": 0 }],
    "stories": [{ "id": "…", "type": "photo|video", "src": "…", "w": 0, "h": 0, "at": "…" }],
    "highlights": [{ "id": "…", "title": "…", "count": 0, "cover": "…", "items": [] }],
    "synced": "…"
  }]
}
```

## Cosa deve restare vero

1. **Nativo, non incorporato.** Niente iframe di Instagram, niente screenshot,
   niente widget di terzi. Il profilo, i numeri e le storie sono nostri.
2. **Pubblico e senza account.** Chi apre `pzkko.it` non deve mai vedere un
   campo password, un login o un «accedi con Instagram». I dati sono già
   nell'HTML/JSON pubblico.
3. **Risoluzione nativa.** Le immagini e i video restano quelli scaricati:
   `object-fit: contain`, nessun ritaglio che taglia la storia. Il
   visualizzatore non deve deformare né upscalare.
4. **Solo ciò che è stato scelto.** Niente elenco follower, niente DM, niente
   commenti, niente didascalie: solo conteggi, storie attive e storie in
   evidenza.
5. **Tempi leggeri.** Il raccoglitore controlla i follower ogni ora, le
   storie solo quando `latest_reel_media` cambia, le evidenze ogni 6 ore. La
   UI non deve suggerire un live istantaneo: mostrare «aggiornato …» e
   «controllo automatico» è corretto.
6. **Non toccare il lato dati**: `scripts/guard.mjs`, `public/media/ig/**`, il
   raccoglitore fuori dal repo, `vercel.json` (CSP) e `README.md` (spiegazione
   della regola). Se serve un dato nuovo, chiedilo prima.

## Direzione visiva

La scheda deve sembrare **una parte del profilo di Discord**, non un plugin
Instagram incollato: stesso fondo `--box`, stessi raggi 14–16 px, stessa
tipografia `gg sans`, stessi bordi `--line`. L'Instagram si riconosce da un
dettaglio: la linea gradiente in cima e i cerchi delle storie. Il resto resta
pzkko.

- Gradiente Instagram: `#f9ce34 → #ee2a7b → #6228d7`, usato con parsimonia
  (linea superiore, anello delle storie, chip `@pzkko`).
- Tema chiaro e scuro: tutto deve passare dalle variabili già esistenti
  (`--text`, `--muted`, `--box`, `--box-2`, `--line`, `--p`, `--a`).
- Numeri in `font-variant-numeric: tabular-nums`; bio su due righe massimo,
  con ellissi o `line-clamp` solo se non si perde il senso.
- La scheda è `span2`: su desktop può respirare, su mobile resta una colonna.
- Niente ombre pesanti, niente bianco assoluto, niente loghi Meta.

Wireframe di riferimento (desktop):

```
┌ Instagram ─────────────────────────────── controllo automatico ┐
│ [ap] @personale   [albi] @pzkko                                │
│                                                                │
│  ◯ avatar      αp🕯️  🔒          [Apri su Instagram ↗]        │
│                @account                                        │
│                giugnoh · unirsm                                │
│  ┌────────────┬────────────┬────────────┐                      │
│  │ 0 post     │ 1.667      │ 815 seguiti│                      │
│  └────────────┴────────────┴────────────┘                      │
│  ~sparkline~  +12 negli ultimi 7 giorni                        │
│  STORIE IN EVIDENZA                                       2    │
│  ◯ Storia   ◯ Highlights 15   ◯ Highlights 27                  │
│  Solo conteggi e storie scelte da me. Nessun elenco.  @pzkko → │
│  ● aggiornato 1 ora fa · 24 nov, 22:17                         │
└────────────────────────────────────────────────────────────────┘
```

Il visualizzatore deve sembrare Instagram senza copiarlo: pannello nero,
barre di avanzamento sottili, chiudi e pausa in alto, didascalia minima in
basso. Su desktop è un pannello centrato `min(92vh, 900px)`; su mobile è tutto
schermo con `100dvh` e `env(safe-area-inset-bottom)`.

## Stati da coprire

- **Caricamento**: skeleton con la stessa altezza della scheda, niente salto.
- **Primo avvio**: «In attesa del primo aggiornamento.»
- **Errore**: se il JSON non risponde, resta l'ultima copia in memoria e si
  aggiunge una nota; senza copia, messaggio breve.
- **Account senza storie attive**: nessun anello sull'avatar, nessuna bolla
  «Storia».
- **Account senza evidenze**: «Nessuna storia in evidenza.»
- **Evidenza con un solo elemento**: la barra è una sola, il contatore «1 di 1».
- **Video**: parte muto, si può attivare l'audio, la barra segue la durata vera.
- **Storia scaduta**: il client la ignora oltre le 24 ore anche se il JSON è
  vecchio (già fatto in `storieBuone`).
- **Dati vecchi**: mostrare la data vera, non nasconderla.

## Interazioni

- Click sull'avatar con anello → storie attive, dalla prima.
- Click su un cerchio → quell'evidenza, dal primo elemento.
- Switcher in alto → cambia account senza ricaricare la pagina.
- Nel visualizzatore: tap a sinistra/destra per prev/next, tap al centro per
  pausa, swipe orizzontale, swipe in basso per chiudere, `Esc`, frecce,
  spazio. Focus visibile, focus trap, ritorno al punto di partenza.
- `prefers-reduced-motion`: niente transizioni, ma il tempo delle storie resta
  leggibile (già 8 s invece di 5,2 s).
- Non aggiungere autoplay con audio: parte sempre muto.

## Accessibilità

- `role="dialog"`, `aria-modal="true"`, etichetta con il titolo dell'evidenza.
- Contatore `aria-live="polite"` («3 di 15»).
- Pulsanti con `aria-label` in italiano e inglese; testi in `TESTI` dentro
  `ig.js` (per le altre sette lingue si usa l'inglese, come la scheda
  Community).
- Contrasto: il visualizzatore è nero, i controlli bianchi; la scheda usa le
  variabili del tema.
- Non usare `outline: none` senza un sostituto visibile.

## Cosa rifinire (in ordine di valore)

1. Proporzioni della scheda: la testata, lo switcher e la riga delle storie
   oggi sono corretti ma un po' rigidi; far respirare il profilo e dare più
   peso al numero dei follower.
2. Anello delle storie: deve sembrare un anello, non un bordo pieno; provare
   con `mask` o con un gradiente conico e uno stacco del colore della scheda.
3. Cerchi delle evidenze: copertine diverse hanno luminosità diverse; valutare
   un velo scuro leggero sotto il titolo e un badge contatore più leggibile.
4. Visualizzatore: barre di avanzamento, spaziatura dei controlli, testo del
   contatore, pulsante audio. Il pannello deve sfruttare tutta l'altezza senza
   tagliare l'immagine (`object-fit: contain` già attivo).
5. Tema scuro: verificare che la linea gradiente e il chip `@pzkko` non
   stonino.
6. Micro-movimento: entrata della scheda, hover dei cerchi, apertura del
   visualizzatore. Sobrio, 150–250 ms.

## Prove da fare prima di dire fatto

- `npm run check` e `npm run build` devono passare.
- Aprire `/#bacheca`: la scheda c'è, i due account si scambiano, i numeri sono
  quelli di `index.json`.
- Aprire un'evidenza con foto e una con video: l'immagine non è tagliata, il
  video parte muto, la barra avanza, si chiude con `Esc`.
- Provare a 1440 px, 900 px, 500 px e 360 px (DevTools): nessun overflow
  orizzontale, nessun testo tagliato.
- Tema chiaro e scuro.
- Con `prefers-reduced-motion: reduce`.
- Senza rete (DevTools offline) dopo un primo caricamento: la scheda non
  sparisce e non compare un login.
- Non deve comparire nessun campo password/account in nessuno stato.

## Cosa non fare

- Non cambiare `public/media/ig/index.json` a mano e non cancellare media.
- Non aggiungere chiamate a `instagram.com` dal browser.
- Non inserire iframe, script di Instagram o pixel di Meta.
- Non toccare `scripts/guard.mjs`, `vercel.json`, `README.md` o il raccoglitore
  per far passare un esperimento di design.
- Non mettere il nome personale in nuovi file: l'eccezione del guard copre
  solo `public/assets/ig.js`, `public/assets/config.js` e `public/media/ig/`.
  Se serve un nuovo file con quel nome, chiedilo prima.
- Non trasformare la scheda in una pagina a sé: resta dentro `#bacheca`.
