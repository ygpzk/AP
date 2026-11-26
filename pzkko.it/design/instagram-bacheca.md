# Instagram in bacheca — brief per Claude Code in VS Code

> **Questo file è per Claude Code in VS Code.** Non è per l'agente dentro
> OpenCode: il lato dati è già fatto, qui si rifinisce solo la presentazione.
> Prima di cambiare qualcosa, leggi tutto il file e apri i file citati.

## Cosa c'è già

La scheda Instagram è viva in bacheca, dopo il progetto in evidenza. Non è un
iframe e non è uno screenshot: è HTML/CSS del sito, con i dati statici scritti
dal raccoglitore sul pc. Funziona senza account, senza cookie e senza chiamare
Instagram dal browser.

**Dal 26.11 il codice è in comune con la scheda TikTok** (che è la stessa
dashboard con altri colori, vedi `design/tiktok-bacheca.md`): il motore sta in
`public/assets/scheda-social.js` e `ig.js` è solo la configurazione di
Instagram. Una modifica al motore cambia tutte e due le schede: provale
entrambe.

File:

- `public/assets/scheda-social.js` — il motore: dati, scheda, visualizzatore
  (`crea(config)` → `{ monta, apri, stato }`).
- `public/assets/ig.js` — la configurazione di Instagram (testi, mazzi, numeri,
  sfondi). Esporta `monta(root, { lang })` e `apri(account, items, titolo,
  lang, partenza)`.
- `public/assets/ig-sfondi.js` — gli sfondi vivi del palco: 24 temi in pixel,
  uno per ora (vedi «Sfondi vivi»). Caricato dopo la scheda.
- `src/site.css` — regole `.igc*` (scheda) e `.igv*` (visualizzatore), in fondo.
- `public/assets/app.js` — `renderBoard()` monta `#ig-card`; `renderSocial()`
  mostra il gruppo «Personale».
- `public/assets/config.js` — `PERSONAL_SOCIALS` (i profili personali, l'eccezione
  voluta).
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

## Direzione visiva (rifatta il 24.11 sera, su richiesta: «una nuova visione»)

La scheda non è più un riquadro con i cerchi delle storie. È **un palco a sé
dentro la bacheca**, parente del banner della community (`.cm-banner`): stessi
occhielli in `gg mono` maiuscolo, stessi titoli in ABC Ginto Nord.

Ha **due vesti** (dal 25.11): col tema scuro è nera (`#0b090e`, testo bianco),
col tema chiaro è carta lilla (`#f8f5fc`, inchiostro `#17121f`). Tutto passa
da due variabili su `.igc__in`: `--ig-c` (i tre numeri dell'inchiostro) e
`--ig-b` (i tre numeri del fondo); il resto ne deriva. Restano scure in
entrambi i temi solo le tessere (sono foto), il marchio e le etichette nere.
Per un colore nuovo si usa `rgba(var(--ig-c), …)`, mai un bianco fisso.

Quattro idee, e solo queste:

1. **I profili sono una colonna di server.** A sinistra c'è la colonna di
   Discord: in cima il marchio (dove Discord mette la casa), poi un avatar per
   profilo. Quello scelto diventa quadrato arrotondato e ha la tacca bianca;
   al passaggio compare l'etichetta nera con `@nome`.
2. **I follower sono il titolo.** Il numero è in Ginto Nord, enorme, riempito
   col gradiente di Instagram (`--ig-gt`: schiarito sul nero, più carico sulla
   carta). È l'unico punto in cui il gradiente fa da protagonista.
3. **Le evidenze sono tessere 9:16**, non cerchi: la foto vera della storia più
   recente, il titolo in Ginto Nord, e in alto **una barra per ogni storia**
   (quelle vere: 15 storie, 15 tacche). Sono appena ruotate, come carte sul
   tavolo; si raddrizzano al passaggio.
4. **Le tessere si sfogliano.** Muovendo il puntatore da sinistra a destra si
   scorrono le storie del mazzo (foto dopo 90 ms di sosta, video muto), con il
   contatore e la data di ogni storia; il clic apre il visualizzatore **da
   quella storia**. Da tastiera: frecce sinistra/destra sulla tessera.

Regole che restano:

- Gradiente Instagram `#f9ce34 → #ee2a7b → #6228d7` solo su: marchio in cima
  alla colonna, numero dei follower (versione schiarita), anello delle storie
  attive (avatar e tessera «Storia»). Nient'altro.
- Il verde lime del profilo (`--p`) compare solo nel puntino dell'occhiello.
- Numeri in `tabular-nums`, sempre col separatore («1.667», non «1667»).
- Niente loghi Meta oltre al glifo, niente ombre colorate, niente bagliori in
  più: c'è già una luce rosa/viola in basso a sinistra e basta.
- La scheda è `span2`. Sopra i 640 px di **larghezza della scheda** (non della
  finestra: è una `@container`) è a due colonne; sotto, una colonna sola con
  le tessere che si dividono la riga. La colonna dei profili resta sempre.

Schema (scheda larga):

```
┌────┬─────────────────────────────────────────────────────────────┐
│ IG │ ● INSTAGRAM  [🔒 PROFILO PRIVATO]     CONTROLLO … OGNI ORA │
│ ── │ (ava) nome                     STORIE IN EVIDENZA        2 │
│▌ap │       @account                 ┌▬▬▬▬▬▬┐ ┌▬▬▬▬▬▬┐           │
│ al │ bio                            │      │ │      │           │
│    │                                │ foto │ │ foto │           │
│    │ 1.667   ← Ginto Nord, gradiente│      │ │      │           │
│    │ FOLLOWER  ~spark~ +12 …        │Titolo│ │Titolo│           │
│    │ 815 seguiti  0 post            │15 st.│ │27 st.│           │
│    │ [Apri su Instagram ↗]          └──────┘ └──────┘           │
│    │                                Passa sopra per sfogliare…  │
│    │ ─────────────────────────────────────────────────────────── │
│    │ Solo conteggi e storie scelte…   ● aggiornato 1 ora fa · … │
└────┴─────────────────────────────────────────────────────────────┘
```

Il visualizzatore sembra Instagram senza copiarlo: pannello nero 9:16 alto
`min(92vh, 900px)`, la foto lo riempie da bordo a bordo senza tagli
(`object-fit: contain`), comandi e barre sono sovrapposti in alto, contatore e
collegamento in basso, frecce **fuori** dal pannello. Dietro, la stessa foto
sfocata fa da luce d'ambiente (nessuno scarico in più). In pausa compare la
targhetta «IN PAUSA». Su mobile è tutto schermo con `100dvh` e
`env(safe-area-inset-*)`.

## Sfondi vivi (25.11)

Dietro al palco gira uno sfondo animato in pixel: **24 temi, uno per ogni ora**.
L'ordine si rimescola ogni giorno con un seme fatto dalla data (stesso giorno,
stesso ordine per tutti; ogni tema esce una volta al giorno). In fondo alla
colonna dei profili c'è il dado: ne pesca uno a caso, che resta fino al cambio
dell'ora. L'etichetta del dado dice l'ora e il nome del tema.

I temi riprendono le cose di pzkko: Cercapersone (lo schermo arancione a un
bit), Matrici, Il Muro, Fiches, Roulette, Semi, Borsa, Miniera, Frequenze (il
podcast), più Stelle, Orbite, Pioggia, Onde, Lucciole, Aurora, Griglia, Neve,
Plasma, Circuito, Radar, Vita, Serpente, Città, Tramonto.

Regole per aggiungerne o toccarli:

- Un tema è `{ id, it, en, avvia(g) }` in `TEMI`; `avvia` prepara la scena e
  restituisce `(t, dt) => …` in secondi. Se i temi non sono 24, l'ora si
  prende col resto: meglio tenerli 24.
- La tela è piccola (un pixel ogni 4 dello schermo: 192×108 sulla scheda
  larga) e ingrandita con `image-rendering: pixelated`. Niente tela a piena
  risoluzione, niente WebGL, niente immagini scaricate.
- Leggeri: 20 fotogrammi al secondo, sotto i 2 ms l'uno (misurati: il più
  caro è Plasma, 1,7 ms). Fermi quando la scheda è fuori schermo o la pagina
  è in secondo piano; con `prefers-reduced-motion` resta un fotogramma fisso.
- Colori solo dai nomi della tavolozza (lime, viola, rosa, giallo, lcd, verde,
  cielo, bianco) con `c(nome, alfa)` o `sfuma(da, a)`, mai numeri scritti a
  mano: le tavolozze sono due, `NOTTE` (luci sul nero) e `GIORNO` (inchiostri
  sulla carta; «bianco» lì è quasi nero), e la scelta segue il tema del sito
  anche quando cambia dal vivo. Sempre con trasparenza: sopra c'è un velo
  (`.igc__in::after`) e il testo deve restare leggibile.
- Di giorno alcune scene cambiano anche nome (`giorno: { it, en }`): Stelle →
  Coriandoli, Lucciole → Polline, Neve → Petali, Tramonto → Alba; la Città ha
  sole e nuvole al posto di luna e stelle. `g.chiaro` dice al tema se è giorno.
- La tela sta dentro `.igc__in` con `z-index: -1`; quando la scheda viene
  ridisegnata la stessa tela viene spostata nel nuovo palco (`sposta`).

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

- Click sull'avatar con anello (o sulla tessera «Storia») → storie attive.
- Click su una tessera → quell'evidenza, dalla storia che si stava sfogliando
  (dalla prima se non si è sfogliato, come sul tocco).
- Colonna dei profili → cambia account senza ricaricare la pagina; frecce
  su/giù da tastiera.
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

## Cosa è stato rifinito e cosa resta

Fatto: proporzioni e peso dei follower, anello vero (maschera, non bordo
pieno), tessere al posto dei cerchi, visualizzatore a tutta altezza, micro
movimenti (entrata, tessere, apertura), andamento calcolato davvero sugli
ultimi sette giorni.

Attenzioni per chi ci rimette mano:

- Il profilo scelto sta nella variabile `scelto` dentro `crea()` di
  `scheda-social.js` (una per scheda), **non** in un
  `data-ig-acc` sul nodo della scheda: quel nodo contiene i pulsanti dei
  profili e un `closest('[data-ig-acc]')` lo scambierebbe per uno di loro
  (era il motivo per cui, dopo un cambio profilo, le tessere non si aprivano).
- Cambiando profilo si riscrive solo `#ig-pan`; la colonna resta, così la
  tacca bianca scorre e il fuoco della tastiera non si perde.
- Lo sfoglio non tiene in memoria le foto già viste: ci pensa la cache del
  browser. Non aggiungere una mappa di `Image`: sono 10 MB decodificati l'una.
- Le barre di una tessera sono al massimo 48; oltre, la tacca accesa è in
  proporzione.

Resta da vedere dal vivo: una storia attiva (oggi non ce n'è: la tessera
«Storia» con l'anello e l'avatar cliccabile sono scritti ma provati solo con
dati finti) e l'andamento con più di un punto in `history`.

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
