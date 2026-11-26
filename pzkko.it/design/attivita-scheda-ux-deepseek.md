<!-- Specifica UX di DeepSeek (OpenCode, agente plan) per il riquadro attività della scheda profilo (#card-activity), 26.11.2026. La grafica e le animazioni sopra queste decisioni sono di Claude Code, in un modulo separato (public/assets/scheda-attivita.js) e in un foglio suo (src/scheda-attivita.css, importato in cima a src/site.css). Il lato dati (vetrina.js, adesso.js, app.js) non si tocca: adesso.js resta com'è, solo la chiamata in renderCardActivity() passa al nuovo modulo. -->

# Spec UX — il riquadro attività della scheda profilo

## 1. Scopo (in una frase)

È l'unico pezzo «dal vivo» sempre in vista in ogni scheda del sito: un **badge/segnalatore** minimale che risponde, con un solo sguardo, a «adesso pzkko c'è, e sta facendo cosa?» — il battito del profilo, non il resoconto.

Differenza dalle altre due zone:
- **«Adesso»** (bacheca/attività) = l'**elenco dei fatti** (stato, luogo, brano con barra, la fila di tutte le app, dispositivi). È il resoconto completo.
- **«Chi sono»** (bacheca) = la **scena** dell'app in primo piano (il «modo», la frase narrativa, il foglio col nastro). È la storia espressiva.
- **Questo riquadro** = il **badge** compatto: una cosa sola alla volta, senza elenco e senza scena, che vive nella colonna sinistra e accompagna il visitatore ovunque navighi. È il «pallino di presenza» del sito, fatto a parola e icona.

## 2. Cosa mostra e quando

**Modello a due strati.** Lo slot principale mostra **una cosa sola** (a priorità). Sotto, un **nastro musica** opzionale accompagna quando la musica è di sottofondo.

Priorità dello slot principale (vince la prima che scatta):

| # | Stato | Condizione | Slot principale | Nastro musica |
|---|---|---|---|---|
| 1 | **Attività Discord** | `presence.activities` tipo 0/1/3/5 (la prima) | gioco/diretta/guarda/gara: icona grande + nome + dettagli/stato + tempo/barra | sì, se `musica` presente |
| 2 | **App in primo piano** | `vetrina.app` con `su:true`, **e non è un'app-musica** | icona app + nome + «in primo piano» | sì, se `musica` presente |
| 3 | **Musica** | `vetrina.musica` presente (e niente di sopra) | copertina + titolo + «di Artista» + «in Album» + barra brano | no (è già principale) |
| 4 | **Riposo** | nessuna delle precedenti | riga di stato Discord (Online/Inattivo/Non disturbare/Offline) | no |

**Regola speciale:** se l'app in primo piano è una *app-musica* (Spotify, Apple Music, iTunes, ecc. — stessa famiglia `musica` di `chisono.js`), lo stato 3 (Musica) prende il posto dello stato 2: non mostrare un badge «Spotify» nudo accanto a un nastro col titolo. Se suona, è musica.

**«Più cose insieme»:** risolte dai due strati. Gioco + musica → slot = gioco, nastro = titolo. Lavoro + musica → slot = app, nastro = titolo. Mai due cose nello slot.

**Il riquadro non sparisce mai.** Oggi `:empty { display:none }` lo fa sparire quando non c'è niente; questo crea il salto di layout che va evitato. Decisione: **il riquadro resta sempre, con un'altezza minima riservata pari alla riga di riposo.** Lo stato 4 (Riposo) riempie sempre quello spazio con la parola di stato (utile anche a chi non distingue i colori del pallino sull'avatar). Quando entra uno stato «pieno» (gioco/musica con barra) l'altezza cresce **con una transizione dolce (~200 ms, smorzata)** e quando esce torna giù allo stesso modo; i box sotto («Profilo / Membro da») scivolano, non saltano. Niente `display:none` sul contenitore: si gioca solo su altezza e opacità.

## 3. «Animazione per cambio app» e switch in base all'uso (il cuore)

Il cuore è il **cambio dell'app in primo piano** (`su`), ma il riquadro non è una scena: è un badge che **cambia chi sta in mostra e con quale ritmo**, in base a come il pc viene usato davvero.

**Cosa misuro (nel browser, da quando la pagina è aperta — stessa matematica dell'osservatore di `adesso.js`, ma in un osservatore proprio del modulo, perché `adesso.js` non si tocca):**
- per ogni app: `suDa` (tempo accumulato in primo piano), `ultimoSu` (quando ha smesso di esserlo), `ritorni` (quante volte c'è tornato), `fondo` (mai stata in primo piano);
- app attuale: `frontAttuale`, `frontDal` (da quando è davanti);
- derivati esposti: `uso` (quota di tempo in primo piano, 0..1), `da` (secondi da quando è in primo piano), `ritorni`.

**Numeri fissi (costanti del modulo):**

| Costante | Valore | Motivo |
|---|---|---|
| `ATTESA` | **1800 ms** | un'app deve restare in primo piano 1,8 s prima di prendere lo slot: assorbe 3–4 tick del sensore (500 ms) e ignora gli alt-tab veloci. «Vince l'ultimo»: se cambia ancora durante l'attesa, riparte il timer sull'ultima. |
| `RESTA` | **3000 ms** | permanenza minima: una cosa che ha preso lo slot resta ≥ 3 s prima di un *cambio morbido* (app→app). I cambi *duri* (un gioco appare/sparisce, la musica parte/si ferma, il pc va offline/online) la scavalcato subito. |
| `GUARDIA` | **300 ms** | guardia per Discord e musica (cambi veri, eventi, non il flutter a 500 ms). |
| `CALMA` | **8 min** | la stessa app in primo piano da oltre 8 min → il badge si calma (vedi sotto). |
| `NUOVA` | **≤ 450 ms** | annuncio pieno: app mai vista in questa sessione. |
| `RITORNO` | **≤ 280 ms** | scambio svelto: app già vista (alt-tab di ritorno). |
| `MUSICA` | **≤ 200 ms** | crossfade sul nastro musica / sul cambio brano. |
| `SFOCO` | **220 ms** | uscita del nodo (prima della rimozione). |
| `RIENTRO` | **150 ms** | dissolvenza unica sotto `prefers-reduced-motion`. |

Il passaggio più lungo (450 ms) è ben sotto sia `ATTESA` sia `RESTA`: **le transizioni non si accavallano mai con i cambi a 500/250 ms**, perché quando una finisce il prossimo candidato è già passato dal debounce.

**Tre ritmi di transizione (per il cambio d'app):**
- **Nuova** — app mai mostrata in questa sessione, entro le prime 3 «novità» della sessione → annuncio pieno (icona che entra, nome che si rivela), ≤ 450 ms.
- **Ritorno** — app già vista (ci è tornato con un alt-tab) → scambio svelto, ≤ 280 ms, nessun annuncio.
- **Lunga / calma** — stessa app da oltre 8 min → il nodo prende `data-calma`, gli elementi decorativi si fermano e resta un respiro minimo; quando poi cambia, esce con un fade semplice (200 ms), senza fanfara.

**Come l'uso vero cambia chi prende lo slot e come:**
- **App in primo piano** prende lo slot solo se non c'è attività Discord; le app di sfondo (`fondo`) **non lo prendono mai** (e non si contano: l'elenco delle app è compito di «Adesso», qui mai).
- **`uso`** (quota di tempo davanti) guida l'enfasi: un'app molto usata sta più «pesante» (Claude decide il disegno; io espongo `--uso`).
- **`da`** (da quanto è davanti) guida la calma: cresce → dopo 8 min scatta `data-calma`.
- **`ritorni`** (quante volte ci torna) decide «nuova» vs «ritorno»: ≥ 3 ritorni conta come «ritorno» anche senza memoria, e può accendere un piccolo accento «abituale» (esposto come `--ritorni`).
- **Musica di sottofondo vs da sola:** se l'app davanti è una app-musica → la musica prende lo slot (stato 3, più ricco); altrimenti la musica resta sul nastro.

**Cosa si calma col tempo (riassunto):** dopo 8 min sulla stessa app, il badge si ferma su un respiro quieto; dopo le prime 3 novità della sessione, tutte le entrate diventano scambi svelti. Il «stra animata» è un effetto d'apertura, non un rumore perpetuo: il riquadro sta in vista **durante tutta la navigazione** (anche in chat e community), quindi deve stancarsi molto prima di «Chi sono».

## 4. Interazioni

- **Tutto è informativo, niente apre il pc di pzkko.** Lo slot (gioco, app, musica) non è un bottone.
- **Solo il titolo del brano è un link** → ricerca Spotify in nuova scheda (pattern già esistente). Anche il nastro musica intero è un link.
- **Gioco / diretta / app:** non cliccabili, non focusabili.
- **Tastiera:** il riquadro non è un elemento focusabile in blocco; il `Tab` raggiunge il solo link della musica. Nessuna scorciatoia custom.
- **Hover (solo pointer fine):** può rivelare il nome completo se troncato (o «in primo piano da N min»), ma non deve servire per capire: il dato essenziale è già a vista.
- **Tocco:** nessun gesto, nessuno scroll-jacking; il riquadro scorre con la pagina.

## 5. Accessibilità e tenuta

- **`aria-live` non più sul contenitore** (oggi `polite` su tutto: a raffica è spam). Si rimuove e si mette **una sola** regione `aria-live="polite" aria-atomic="true"` visivamente nascosta (`.sr`), che annuncia **una sola frase per cambio reale dello slot**, **dopo** il debounce — mai a ogni tick. La musica (nastro) non si annuncia (spam).
- **Annunci (una frase, italiano):** gioco → «Sta giocando a {nome}» (diretta/guarda/gara con i loro verbi); musica → «Sta ascoltando {titolo} di {artista}»; app → «Al pc su {app}»; riposo → la parola di stato.
- **`prefers-reduced-motion`:** tutto collassa a una dissolvenza da 150 ms; via pulse, scale, marquee e l'avanzamento continuo della barra (la barra aggiorna il valore senza animazione). Il modulo espone `data-motion="off"`.
- **Scheda nascosta (`document.hidden`):** si ferma ogni rAF/animazione; al ritorno si riallinea istantaneamente (nessun replay dei cambi persi).
- **Telefono:** la scheda sta in cima; il riquadro resta a una riga per il riposo/nastro e a contenuto limitato per il pieno; ellissi su tutto ciò che è testo.
- **Tema chiaro/scuro:** nessun colore qui (è di Claude), ma il badge e la barra devono reggere su entrambi: si usano i token esistenti `--box`, `--text`, `--muted`, `--ok`, `--line`.
- **Nomi lunghi:** `white-space: nowrap` + ellissi (pattern `.act__lines` già in uso); nome completo via `title` + testo `sr-only` quando serve.
- **Icona/copertina mancante:** fallback placeholder già previsti (logo Spotify per la musica, icona gioco per il gioco, lettera iniziale per l'app).
- **Nove lingue:** il modulo riusa i token i18n esistenti (sotto); le nuove chiavi le traduci tu nelle altre otto.

## 6. Testi (italiano, corti)

| Contesto | Testo | Da dove |
|---|---|---|
| Riga di riposo | «Online» / «Inattivo» / «Non disturbare» / «Offline» | `ui().status` (esiste già) |
| Intestazione gioco/diretta/guarda/gara | «Sta giocando» / «In diretta» / «Sta guardando» / «In gara» | `ui().act[type]` (esiste) |
| Intestazione musica | «Sta ascoltando Spotify» | `ui().listening` (esiste) |
| Riga musica | «di {artista}» · «in {album}» | `ui().by` / `ui().on` (esistono) |
| Tempo gioco | «{tempo} trascorsi» | `ui().elapsed` (esiste) |
| Intestazione app in primo piano | **«Al pc»** | **nuova chiave** `ui.atPc` |
| Sottoriga app | «in primo piano» | `vtx().su` (esiste in `app.js`) |
| Durata app (solo su hover/calma) | «da {N} min» | **nuova chiave** `ui.da` |
| Nastro musica | «♫ {titolo} · {artista}» | costruito |

**Nuove chiavi i18n (solo l'italiano; le altre otto le fai tu):**
- `ui.atPc` = «Al pc»
- `ui.da` = «da»  *(usato in «da N min»; non confonderlo con `memberSince` = «Membro da»)*

Nessun'altra stringa nuova: le frasi di annuncio si compongono dai pezzi sopra + il nome dell'app/titolo.

## 7. Agganci per la grafica (struttura, attributi, variabili, ordine delle fasi)

**Contratto del modulo (`public/assets/scheda-attivita.js`, scritto da Claude).** Stesso schema di `creaAdesso`:

```js
creaScheda({ testi, icone, coloreStato, immagine, asset, clock, presenza, vetrina, reduced })
// → { card(root), presenza(status), aggiorna(), distruggi() }
```

- `card(root)` è **idempotente** (chiamata a ogni `renderCardActivity()`: se già montata, restituisce la stessa zona).
- il modulo **si iscrive da sé** a `vetrina` con `ascolta()` (come `chisono.js`), quindi non dipende da `adesso.aggiorna()`.
- `presenza(status)` è chiamata da `app.js` in `onPresence` (accanto a `chiSono.presenza(...)`), per lo stato Discord.
- **Integrazione in `app.js`:** `renderCardActivity()` chiama `attivita.card($('#card-activity'))` al posto di `adesso.card(el)`. `adesso.js` e `vetrina.js` restano intatti (`adesso.card` diventa semplicemente inutilizzato).

**Struttura dei nodi (i nodi restano per chiave; la grafica sta sopra):**

```
#card-activity
  ├─ data-stato = online|idle|dnd|offline
  ├─ data-pc    = vivo|fermo|spento
  ├─ data-slot  = gioco|app|musica|riposo
  ├─ data-vuoto = presente solo in riposo
  ├─ data-motion = on|off
  │
  ├─ <div class="ca">                     (zona a min-height riservata, altezza animata)
  │    └─ <div class="ca__slot">          (una sola voce alla volta, a chiave)
  │         ├─ .ca__gioco   (data-slot="gioco")
  │         ├─ .ca__app     (data-slot="app", data-app, --uso --da --ritorni)
  │         ├─ .ca__musica  (data-slot="musica")
  │         └─ .ca__riposo  (data-slot="riposo")
  │
  ├─ <a class="ca__nastro"> ♫ <b>titolo</b> · artista </a>   (link Spotify; presente solo se musica di sottofondo)
  └─ <p class="sr ca__dice" aria-live="polite" aria-atomic="true"></p>
```

**Classi di stato condivise (stesso vocabolario di `adesso.js`, così Claude riusa curve e tempi):**
- voce che entra: `is-entra` → `is-entra-on` (dopo un `void offsetWidth`, al frame successivo);
- voce che esce: `is-esce` (resta ~220 ms poi viene rimossa);
- app già nota / ritorno: `data-ritorno`; app mai vista: `data-nuova`; uso prolungato: `data-calma="1"` sul nodo.

**Variabili CSS esposte:**
- sull'app: `--uso` (0..1), `--da` (secondi, intero o vuoto), `--ritorni` (intero);
- sulla barra (brano o gioco): `--pct` (0..1), `--done`, `--total` (la `.bar-t__fill` avanza col solo `transform: scaleX`, senza ridisegnare — pattern già in `adesso.js`);
- sul nodo app, per eventuale FLIP di ritorno: `--dx` / `--dy`.

**Ordine delle fasi (per ogni tipo di passaggio):**

1. **App nuova (annuncio pieno, ≤ 450 ms).** (0 ms) il vecchio prende `is-esce`; (≈ 80 ms) il nuovo viene appeso con `is-entra` (opaco, icona ridotta) poi `is-entra-on` al frame dopo; (80–450 ms) l'icona entra e il nome si rivela; (fine) classi d'ingresso rimosse, slot stabile. L'uscita parte ~80 ms prima dell'entrata (leggera sovrapposizione).
2. **App ritorno (≤ 280 ms).** (0 ms) vecchio `is-esce`; (≈ 40 ms) nuovo `is-entra`/`is-entra-on`, più corto; (fine ~280 ms) stabile. Niente annuncio.
3. **Lunga / calma.** nessun cambio: sul nodo presente `data-calma="1"` dopo 8 min, elementi decorativi fermi. All'uscita successiva: fade semplice 200 ms.
4. **Musica che diventa principale** = come «nuova» (≤ 420 ms). **Musica che torna al nastro**: il nodo principale esce (220 ms), il nastro riappare in crossfade (200 ms). **Cambio brano** (solo nastro): crossfade del testo 200 ms, lo slot non si muove.
5. **Gioco entra** = «nuova» (≤ 450 ms); **gioco esce** = fade 220 ms.
6. **Riposo entra/esce** = fade 200 ms, nessuna fanfara.

**Evento opzionale** (parità con `adesso:cambio`): il modulo può emettere `attivita:cambio` (`bubbles`) con `detail { da, a, tipo }`; non è necessario per la grafica (bastano le classi), ma resta a disposizione.

## 8. Cosa NON fare

1. Non duplicare «Adesso»: niente elenco di app, niente dispositivi, niente luogo. Una sola cosa nello slot, mai una lista.
2. Non duplicare «Chi sono»: niente scena del «modo», niente frase narrativa lunga. È un badge, non un foglio.
3. Non animare a ogni alt-tab o a ogni riordino delle icone: debounce 1,8 s.
4. Non far sparire il riquadro: mai `display:none`, sempre almeno la riga di stato.
5. Non tenere il «stra animata» all'infinito: si calma dopo 8 min e dopo le prime 3 novità.
6. Non far sembrare cliccabile l'icona app / il gioco (non apre il pc di pzkko).
7. Solo il titolo del brano (e il nastro) è un link; il resto non è cliccabile.
8. Niente testo a scorrimento perpetuo, niente rotazione del nome, niente flash > 3 al secondo.
9. Niente testo come immagine (illeggibile, non traducibile, male per screen reader).
10. Non annunciare ogni micro-cambio allo screen reader: una sola regione live, dopo il debounce.
11. Niente titoli di finestre, file o siti: il sensore passa già solo nome+icona+primo piano.
12. Nessun suono d'avvio (audio non richiesto).
13. Niente layout shift: altezza minima riservata + altezza animata, mai un salto secco.
14. Niente animazioni con `prefers-reduced-motion`.
15. Non toccare `adesso.js` né `vetrina.js`: modulo separato, e in `app.js` cambia solo `renderCardActivity()`.

## 9. Dato extra dal pc (a parte, non bloccante)

La specifica si regge sui dati di oggi (presenza Discord + vetrina). I campi che *aiuterebbero* senza essere necessari sono gli stessi già richiesti nel brief `design/adesso-vivo.md` (che leggo come riferimento): **`suDa`** (epoch esatto di quando l'app è in primo piano), **`uso` / `ritorni` aggregati lato pc** (così la quota non si azzera a ogni ricarica della pagina), **`fermo`** (pc fermo da N minuti). Per questo riquadro in particolare servirebbe solo `suDa` esatto: oggi il «da quanto è davanti» parte da quando si apre la pagina. Nessun dato nuovo oltre a quelli già chiesti altrove; niente nomi di file, URL o titoli di finestre.

---

**Decisioni prese, nessun ventaglio.** Base per Claude: un badge a due strati (slot principale a priorità + nastro musica), che non sparisce mai, reagisce al cambio dell'app in primo piano con debounce 1,8 s e tre ritmi (nuova/ritorno/calma), musica di sottofondo vs principale, una sola regione `aria-live`, tutto fermo sotto `prefers-reduced-motion`.

**Domande aperte (solo se vuoi, non bloccano):**
1. La riga di riposo mostra la parola di stato Discord (Online/Inattivo/…). Va bene, o preferisci che in riposo mostri la scritta esistente «Nessuna attività in corso» (`ui().nothing`)? Ho scelto lo stato perché è sempre vero e mai vuoto, ma è una tua call di gusto.
2. Confermi che la durata «da N min» sull'app sia solo su hover (e non fissa, per non affollare il badge stretto)?

---

## Note di Claude Code (la grafica, 26.11.2026)

Costruito sopra questa specifica: `public/assets/scheda-attivita.js` (macchina a stati e nodi) e `src/scheda-attivita.css` (il vestito). In `app.js` cambiano solo `renderCardActivity()`, una riga in `onPresence` e l'import.

**Il vestito.** Un foglietto del muro attaccato alla scheda col nastro di carta vero (`/art/nastro/carta-gommata.webp`), strappato in fondo. Brano: la copertina in una busta col vinile che esce e gira, titolo in Anton evidenziato, barra a matita ripassata a pennarello. App: l'icona vera su un bollo adesivo, col giro rosso che cresce con `--uso` e le tacche a penna dei ritorni (`--ritorni`, fino a cinque). Gioco: polaroid. Riposo: una strisciolina con lo stato evidenziato nel suo colore. La musica di sottofondo è un pezzo di carta gommata sotto il foglietto.

**I passaggi** (dentro i massimi della specifica): *nuova* = il foglietto cala dal nastro e dondola, il nastro si appiccica, il bollo arriva con uno schiaffo, l'etichetta si batte a macchina, l'evidenziatore passa, il timbro «dal vivo» cade (450 ms); *ritorno* = due carte che si scambiano (280 ms); *piano* = dissolvenza (200 ms); cambio brano sul posto = il vinile rientra, la busta si gira, le righe si ribattono. Dopo otto minuti (`data-calma`) restano solo il vinile lento e il respiro del bollo.

**Scostamenti dalla specifica, e perché.**
- Le due scritte nuove («Al pc», «da N min») stanno nel modulo (`TX`, nove lingue) invece che nei nove file i18n, come fanno la vetrina e «Chi sono».
- `aria-live` sul contenitore lo toglie il modulo quando monta (`index.html` lo stavano toccando altre sessioni).
- Le altezze sono fisse stato per stato (riposo 46, app 110, gioco 128/150, brano 150 px) e cambiano in 200 ms: niente misure in JS.
- La barra avanza con `--pct` e una transizione lineare di un secondo (solo `transform`); con movimento ridotto salta al valore.

**Le due domande aperte.** 1) Riposo = la parola di stato: tenuta così. 2) «da N min»: al passaggio del mouse e quando la cosa è calma, più nel `title`.

**Per provarlo** (console della pagina): `attivita` non è globale; si usa la vetrina finta dei test oppure, da un modulo, `creaScheda(...).prova({ luogo, app: [{ n, i, su }], musica }, attesaMs)`.
