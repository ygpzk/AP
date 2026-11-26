<!-- Specifica UX di DeepSeek (OpenCode) per il riquadro «ADESSO» della bacheca e della scheda attività, 26.11.2026.
     La grafica e le animazioni sopra queste decisioni sono di Claude Code: si appoggiano al motore
     public/assets/adesso.js e al blocco «adesso: struttura (DeepSeek)» in fondo a src/site.css.
     Sorelle di questo brief: design/chi-sono-ux-deepseek.md (la scena, a destra) e
     design/strumenti-ux-deepseek.md (gli strumenti). Le tre zone leggono la stessa vetrina: non farle divergere. -->

# Spec UX — il riquadro «ADESSO» (la lista dei fatti)

Su quella stessa riga della bacheca ci sono tre zone, tre compiti:
- **«Adesso»** (questo, a sinistra) = **la lista dei fatti**. Dice *che cosa* sta succedendo, nudo e onesto.
- **«Chi sono»** = la scena (l'altro brief: un solo eroe, debounce 1,8 s, la bio come riposo).
- **«Strumenti»** = la cassetta degli attrezzi (l'altro brief).

«Adesso» non deve diventare una seconda scena: resta l'elenco. Ma è l'elenco **vivo**: ogni voce è un nodo che dura nel tempo e si muove quando cambia la realtà, senza mai ridisegnarsi da capo.

## 1 — Cosa racconta, e in che ordine

Un visitatore legge, dall'alto in basso:

1. **L'etichetta** «ADESSO · dal vivo» (il polso del live).
2. **Lo stato** (pallino + Online/Inattivo/Non disturbare/Offline) e il **luogo** («in ufficio» / «in giro per il mondo»).
3. **La cosa che riempie il momento**: il brano di Spotify (copertina, titolo, artista, album, barra) oppure l'attività Discord in corso (gioco/streaming/guardo/gara). Se ci sono tutte e due, il gioco viene prima del brano (come oggi).
4. **«Aperte sul PC»** con la fila di icone; quella in primo piano ha il pallino verde. L'ordine è l'ordine di Alt+Tab: la più usata di recente per prima.
5. **«Attivo su»** (computer/browser/telefono).

**Motivo dell'ordine**: lo stato e il luogo danno il contesto in una riga; il brano è l'unica cosa con un *suono* che dura, quindi merita la barra e la copertina; le app sono il corpo della zona e vengono per ultime perché sono tante.

## 2 — La decisione chiave: niente debounce qui

**La lista riflette subito la realtà.** A differenza di «Chi sono» (debounce 1,8 s) e «Strumenti» (600 ms), «Adesso» non ha debounce: il cambio dell'app in primo piano riordina la fila **immediatamente**, con una transizione FLIP. **Motivo**: è la lista dei fatti, deve essere vera; il ritmo ce lo dà già il pc (scrive ogni 500 ms). La *scena* ha il debounce; l'*elenco* no. Se Alberto vuole anche qui un attimo di calma, è una riga da cambiare in `adesso.js` (non serve toccare la grafica).

## 3 — Gli stati (la macchina)

| Stato | Come lo so | Attr. sulla radice |
|---|---|---|
| Stato Discord | `presence.discord_status` | `data-stato="online\|idle\|dnd\|offline"` |
| PC vivo | `vetrina.agg` scrive da < 3 min | `data-pc="vivo"` |
| PC fermo | `agg` non scrive da > 3 min | `data-pc="fermo"` |
| PC mai visto | `vetrina` null o `agg` null | `data-pc="spento"` |
| Niente da mostrare | niente voci (brano/gioco) e niente app | `data-vuoto` presente → mostra «Nessuna attività in corso.» |
| Movimento ridotto | `prefers-reduced-motion` | `data-motion="off"` (via `data-motion="on"`) |

Le transizioni *di stato* (stato, luogo, pc vivo/fermo/spento) cambiano solo classi/attributi: Claude può animarle **al massimo 300 ms**, mai di più, e mai con ritardi a catena.

## 4 — Il cambio di app e l'«in base all'utilizzo»

### Cosa succede quando cambia l'app in primo piano

L'app appena portata in primo piano è la **prima** dell'array (`app[0]`, `su:true`). Il motore la porta al primo posto della fila (indice `0`, la più a sinistra) e tutte le altre scorrono di una posizione: **un solo FLIP per tutte**, niente danza di singole mosse.

- **App appena aperta** → nodo nuovo, classe `is-entra` (fade/scale in, ≤ 300 ms).
- **App chiusa** → resta al suo posto (assoluta) mentre sfuma con `is-esce` (≤ 220 ms), poi viene tolta; le altre scorrono sotto con FLIP.
- **App spostata** (cambio di primo piano / riordino) → `is-flip` + `--dx`/`--dy` (≤ 250 ms).
- **Primo piano** → classe `is-su` (il pallino verde, come oggi).

**Motivo del FLIP e non delle View Transitions**: la fila è fino a 16 icone piccole che si riordinano ogni 500 ms; le View Transitions fotografano e ricostruiscono tutto l'albero (più care, si accodano), il FLIP muove solo chi si sposta, con un `transform` compositato. Il meccanismo è già in `adesso.js`; a Claude restano curve e tempi.

### La gerarchia «in base all'uso» (misurata nel browser)

Oggi il pc manda solo `{ n, i, su }`. Il motore misura **nel browser, dal momento in cui la pagina è aperta**, e per ogni app scrive sulle variabili CSS:

| Variabile | Significato | Oggi |
|---|---|---|
| `--uso` | frazione 0..1 di tempo passata in primo piano (dall'apertura della pagina) | calcolata qui |
| `--da` | secondi in primo piano (se è `su`) oppure secondi dall'ultimo primo piano; **assente** se non è mai stata in primo piano | calcolata qui |
| `--ritorni` | numero di volte che è passata in primo piano | calcolata qui |
| `--dx` / `--dy` | lo spostamento in px durante un FLIP (poi rimossi) | — |

Con queste Claude può fare la gerarchia: l'app in primo piano (`is-su`) più grande/accesa, quelle «calde» (tornate di recente, `--ritorni` alto) un gradino sotto, quelle solo aperte sullo sfondo (`is-fondo`, mai in primo piano) più spente. **`is-fondo`** è già messo dal motore.

**Motivo**: «quanto ci torna» e «da quanto» sono *numeri*, non dati personali — rispettano la regola «solo nome, icona e numeri». Ma finché il pc non li manda (vedi §8), il browser si accontenta della misura locale: funziona subito, si azzera a ogni visita.

## 5 — Il brano (e il gioco con timer)

- **Il brano non ridisegna mai la barra**: la `.bar-t__fill` avanza col solo `transform: scaleX()` (`transform-origin: left`), aggiornata da un `requestAnimationFrame` unico per tutta la pagina. I testi `m:ss`/`h:mm:ss` si aggiornano una volta al secondo.
- Sulla `.bar-t` il motore scrive `--pct` (0..1), `--done` e `--total` (secondi) per Claude.
- **Cambio brano** (stesso slot, nuovo titolo): il nodo resta, cambiano solo testo/copertina; Claude può fare un crossfade ≤ 300 ms. L'evento `adesso:cambio` di tipo `musica` glielo segnala.
- **Il brano si ferma**: `musica: null` → la voce esce con `is-esce` (≤ 220 ms). Evento `musica-stop`.
- **Gioco con `timestamps`**: stessa barra (se ha fine) oppure «X trascorsi» (se è solo iniziato). Stessi agganci del brano.

## 6 — Durate massime (per non accavallarsi con il tick da 500 ms)

| Transizione | Max | Note |
|---|---|---|
| FLIP (riordino fila app) | 250 ms | curve di Claude |
| Entrata app | 300 ms | fade/scale |
| Uscita app | 220 ms | poi rimozione |
| Entrata/uscita voce (brano/gioco) | 300 / 220 ms | |
| Cambi di stato/luogo/pc | 300 ms | classi/attributi |
| Barra del brano | continua | solo `transform`, nessuna transizione |

**Regola**: ogni cambio si chiude **prima del tick successivo** del pc (500 ms). Niente code, niente transizioni accodate: se arriva un cambio nuovo mentre una transizione è in corso, la nuova vince e l'altra si ferma (il motore rimuove le classi e ricomincia). Con `data-motion="off"` (ridotto o scheda nascosta) tutte collassano a zero, istantanee.

## 7 — Gli agganci per la grafica (elenco preciso)

### Radice (`.widget` con `#now-widget` / `#now-widget-2`, oppure `.card-activity` con `#card-activity`)
- `data-adesso="1"` (widget) / `"card"` (l'attività della scheda a sinistra).
- `data-stato`, `data-pc`, `data-vuoto`, `data-motion` (vedi §3).

### Fila app — `ul.pcapp__row[role=list]`, figli `li.pcapp__i`
- `data-app` = nome (la chiave: **un'app = un nodo che resta** finché l'app è aperta).
- `data-i` = indice (0 = la più recente/in primo piano).
- classi: `is-su`, `is-fondo`, `is-entra`→`is-entra-on`, `is-esce`, `is-flip`→`is-flip-on`.
- variabili: `--uso`, `--da`, `--ritorni`, `--dx`, `--dy`.
- dentro: `img` (icona, `loading=lazy`) oppure `b` con l'iniziale se manca l'icona; `span.sr` = nome (+ «· in primo piano» se `is-su`); `title` = nome; `tabindex=0`.

### Voce (brano/gioco) — `div.adesso__voce` con `data-voce`
- `data-voce` = `"m"` (brano) o `"g:…"` (gioco).
- struttura: `.widget__h` (icona + etichetta) → `.act` (`.act__art` con `img` o `.act__ph`, `.act__lines` con titolo/artista/album o nome/dettagli/stato/trascorso) → `.bar-t`.
- classi `is-entra`/`is-esce` come sopra. Il separatore tra voci è già in CSS (`.adesso__voce + .adesso__voce`).

### Barra — `div.bar-t`
- `--pct` (0..1), `--done`/`--total` (secondi); `.bar-t__fill` avanza con `transform: scaleX()`, `transform-origin: left center`, `width:100%`.

### Evento
- **`adesso:cambio`** — `CustomEvent` con `bubbles:true`, lanciato su ogni radice montata. `detail = { tipo, da, a }` con `tipo` ∈ `stato` · `luogo` · `musica` · `musica-stop` · `app-su` · `app-entra` · `app-esce` · `pc`.
  - `musica`: `a = { titolo, artista, album }`, `da = null` o il brano precedente.
  - `app-su`: `da`/`a` = nome (o `null`).
  - `pc`: `da`/`a` = `vivo|fermo|spento`.
  - Ascolto consigliato: `document.addEventListener('adesso:cambio', …)`; al primo avvio tutti i cambi arrivano come `…-entra`/`musica` (per le animazioni d'ingresso).

## 8 — Dati richiesti al pc (opzionali, non bloccanti)

Tutti **numeri**, quindi leciti («solo nome, icona e numeri»). Finché mancano, il browser calcola da sé (§4). Sul **programma del pc** (fuori dal repo, lo cambia Claude) chiedo:

Su ogni voce di `app` (in aggiunta a `{ n, i, su }`):
- `suDa` (numero, secondi): da quanto l'app è in primo piano (solo se `su`, altrimenti 0). → al posto del `--da` locale.
- `uso` (numero, secondi): secondi totali in primo piano nell'ultima ora. → al posto del `--uso` locale.
- `ritorni` (numero): volte che è passata in primo piano nell'ultima ora. → al posto del `--ritorni` locale.
- `w` (numero): id finestra stabile, per distinguere due finestre della stessa app. **Oggi la chiave è il nome**: se due finestre hanno lo stesso nome collidono. Se succede, serve `w`.

A livello vetrina:
- `fermo` (numero, secondi): da quanto il pc non vede tastiera/mouse. → stato «dormiente»/«si è allontanato».
- `schermo` (booleano, opzionale): schermo bloccato.

Il filtro `api/vetrina.mjs` (`pulisci`) andrà aggiornato per far passare questi campi (tutti numeri, controllati come gli altri). **Non** cambiare mai la regola: niente titoli di finestre, file, URL o eseguibili.

## 9 — Cosa NON rompere

1. **`renderBoard()` riscrive tutta la bacheca a ogni cambio di scheda.** I nodi a chiave non sopravvivono a quel `innerHTML`: va bene — al ritorno si rimonta lo stato *assestato* senza ri-animare (il motore lo fa già: una zona nuova non riparte da zero sui dati, li ridisegna fermi). Non provare a tenere i nodi vivi attraverso il `innerHTML`.
2. **Non toccare** `vetrina.js`, `api/vetrina.mjs`, `scripts/`. Se serve un campo nuovo (§8), il cambio è nel programma sul pc e in `api/vetrina.mjs` (numeri), non nel motore.
3. **Non toccare le schede Instagram/TikTok** (`scheda-social.js`, `ig*.js`, `tt*.js`, `.igc*`), né `chisono.js`/`strumenti.js` (sono le altre due zone, con i loro brief).
4. **Niente `innerHTML` a ogni cambio** nella zona: il motore aggiorna testo/classi/variabili sui nodi che già esistono. Le uniche stringhe fidate via `innerHTML` sono le icone (già passate da `app.js`).
5. **La grafica non è nel motore**: colori, font, ombre, keyframe stanno nel blocco «adesso» di `src/site.css`. Nel blocco «adesso: struttura (DeepSeek)» ci sono **solo** i meccanismi (FLIP/entrata/uscita) con tempi neutri: **sostituiscili** con curve/tempi tuoi (rispettando i massimi del §6), ma non togliere le classi/attributi/variabili che il motore legge.
6. **Un solo `aria-live`** in tutta la pagina, quello già presente su `#card-activity`: annuncia i cambi di attività *lì*, non nella bacheca. Non aggiungerne altri: niente annunci a raffica a ogni cambio di finestra.
7. **`prefers-reduced-motion`**: il motore mette `data-motion="off"` e non aggiunge classi di movimento; il CSS deve rispettarlo (la regola `[data-motion="off"]` già azzera le transizioni).
8. **Scheda nascosta**: il rAF è fermo, nessuna coda. Non riavviarlo tu.
9. **Fino a 16 app, nomi lunghi, icona mancante**: la fila va a capo (`flex-wrap`), i nomi non devono esplodere la riga, senza icona c'è l'iniziale (`b`).

## 10 — Accessibilità e prestazioni (già decise)

- **Tastiera**: le icone sono focalizzabili (`tabindex=0`, `title` + `span.sr`); `:focus-visible` è già in `site.css`.
- **Screen reader**: il widget **non** ha `aria-live`; l'elenco è un `role="list"` con `aria-label` («Aperte sul PC»), ogni icona espone il nome. Solo `#card-activity` annuncia (polite).
- **Telefono**: riquadro stretto, niente hover obbligatorio (il nome è in `title`/`sr`), niente scroll-jacking.
- **Prestazioni**: un solo `requestAnimationFrame` per tutta la pagina (si ferma quando non c'è nulla da muovere e quando la scheda è nascosta); niente layout forzati a raffica, niente librerie, niente nuovi timer.
- **Testi**: le scritte della zona sono in `VTX` dentro `app.js` (nove lingue); ho aggiunto una sola voce nuova, `su` («in primo piano», per l'etichetta `sr`). Se aggiungi altre scritte, aggiungile in tutte e nove.

## 11 — Domande aperte

1. **I campi «uso» dal pc**: questo brief chiede `suDa`/`uso`/`ritorni` come *numeri opzionali*; il brief «strumenti» sostiene invece «nessun campo utilizzo dal pc: è storia, non output». Per «Adesso» i numeri sono il cuore di «in base all'utilizzo», quindi li raccomando — ma è una scelta di Alberto: se vuole coerenza totale col brief strumenti, si lascia la misura solo client-side (già funzionante) e si butta il §8.
2. **Finestre duplicate**: se il pc può avere due finestre con lo stesso nome, serve `w` (§8); altrimenti collidono sulla chiave. Confermare.
3. **Debounce**: qui è zero (lista dei fatti). Se si preferisce un attimo di calma anche sulla lista, si aggiunge un debounce in `adesso.js` senza toccare la grafica.
4. **Nome del file**: questo brief è `design/adesso-vivo.md` (come richiesto); i due fratelli usano `…-ux-deepseek.md`. Se si vuole un solo schema di nomi, si rinomina.

---

Decisioni prese, nessun ventaglio. Quando passi a Claude per la grafica: la lista dei fatti vive su nodi a chiave, si riordina con FLIP (≤ 250 ms) al cambio di primo piano, il brano avanza col solo `transform`, gli agganci sono quelli del §7, i massimi quelli del §6. Il disegno — colori, curve, proporzioni, la voce «stra nel suo stile» — è tuo.

---

## 12 — La grafica (Claude Code, 26.11, dopo questo brief)

Fatta sopra il motore, senza cambiare le decisioni di qui sopra: resta la lista dei fatti, senza debounce e senza un secondo eroe.

- **Dove sta**: `public/assets/adesso-arte.js` (il vestito: classi `.adx*`, qualche pezzo di carta `aria-hidden`, la scelta del gesto) e il blocco «adesso: grafica (Claude)» in fondo a `src/site.css`. Le due scritte nuove («in diretta dal mio pc», «pc spento») sono in `VTX_ARTE` dentro `app.js`, nove lingue.
- **Com'è**: un cartoncino kraft con le graffette (il foglio crema col nastro è già «chi sono», accanto); «adesso» in Anton, la voce a pennarello, stato e luogo come timbri; il brano è una polaroid col vinile che gira e le barrette; le app sono adesivi di carta, e quella in primo piano è il foglietto colorato in cima alla fila (è lo stesso `li.is-su`, allargato: non un nodo in più), col nome, da quanto ci sta, le tacche dei ritorni e, dopo dieci minuti, la puntina.
- **«In base all'utilizzo»**:
  - il peso di un adesivo (`data-peso` 0-3) viene da `--uso`: mai in primo piano = piccolo e sbiadito (`is-fondo`), poi cresce;
  - il gesto del cambio di primo piano (`data-cambio` sul `li`, classe `is-arriva`, ≤ 300 ms): `schiaffo` (normale), `veloce` (meno di 2,5 s dall'ultimo cambio: uno scatto), `torna` (ritorno all'app di prima: si rigira come una carta), `lungo` (lascia un'app dopo almeno dieci minuti: la botta grossa);
  - l'app che lascia il primo piano si posa (`is-posa`); il brano che cambia fa rientrare polaroid e vinile (`is-cambia` sulla voce); stato e luogo si ribattono (`is-batte`).
- **Tre ritocchi al motore** (segnati in testa a `adesso.js`): l'aggancio `opzioni.arte` (`zona` / `aggiorna` / `tick`); il battito è un timer da un secondo e la barra arriva al punto dopo con una transizione lineare del CSS (prima un rAF a ogni fotogramma, e alla barra arrivava il tempo di rAF invece di `Date.now()`: restava a 0:00); una zona disegna ferma la prima volta che ha i dati (§9.1: prima, a ogni ritorno in bacheca, rientravano tutte le icone). In più: le classi `is-entra` si tolgono anche a tempo (restavano se il CSS non faceva una transizione), l'iniziale per le app senza icona ora c'è, niente `title` (il nome lo dà l'etichetta al passaggio e lo `span.sr`).
- **`#card-activity`** non è più di questo motore: l'ha preso un'altra sessione, con un modulo suo.

### I dati dal pc (§8): non ancora

Il motore li legge già se arrivano (`uso` = secondi in primo piano nell'ultima ora senza il turno in corso, `ritorni`, e `dal` = da quando è in primo piano, in ms: un'ora ferma e non secondi che cambiano, così il pc non riscrive a ogni secondo). Ma **non li ho accesi**: servono tre pezzi insieme — `C:\pzkko-serveretrinaetrina.mjs`, il filtro del canale diretto in `C:\pzkko-server\server.mjs` (`leggiVetrina`: va riavviata la banca) e `api/vetrina.mjs` — e c'è la domanda aperta n. 1. Finché Alberto non decide, vale la misura nel browser: per questo «da quanto» compare solo se il cambio è stato visto succedere (la pagina non inventa da quando).
