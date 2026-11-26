<!-- Specifica UX di DeepSeek (OpenCode, agente plan) per il riquadro «Chi sono» della bacheca, 26.11.2026. La grafica e le animazioni sopra queste decisioni sono di Claude Code: public/assets/chisono.js e il blocco «chi sono» in fondo a src/site.css. -->

# Spec UX — la «vetrina» del pc (il riquadro «Chi sono»)

Il riquadro che oggi è «Chi sono» diventa **la vetrina**: la finestra sul suo schermo, in stile pzk. «Adesso» (a sinistra) resta la lista dei fatti; questo (a destra) è la **scena**. Stessa riga, stessa altezza, due compiti diversi.

## 1. Scopo e fine del testo «Chi sono»

**In due secondi il visitatore capisce una cosa sola:** «in questo momento pzkko sta facendo X sul suo pc». La scena dice *che cosa* sta succedendo, non *chi* è.

**Il testo «Chi sono» non si butta**: diventa lo **stato di riposo**. Quando non c'è nulla da mostrare (pc spento, dato vecchio, in giro) la zona mostra titolo «Chi sono» + la riga della bio. Quando c'è attività dal vivo, la bio sparisce e al suo posto c'è la frase viva («Sto scrivendo codice»). La bio torna da sola quando il pc tace.

## 2. Stati completi (in ordine di priorità, vince il primo che scatta)

| # | Stato | Condizione | Cosa si vede | Cosa si legge |
|---|---|---|---|---|
| 1 | **App in primo piano** | `app` con `su:true` | la scena del «modo» dell'app, icona grande come eroe | frase del modo + nome app |
| 2 | **In ufficio, pausa** | `luogo:ufficio`, app aperte ma nessuna `su` (o nessuna app) | scrivania quieta, fila icone appena accesa, niente eroe | «Sono al pc» |
| 3 | **Musica** | `musica` presente (in qualunque stato sopra) | striscia musica fissa in basso, non sostituisce la scena | «♫ titolo · artista» |
| 4 | **In giro** | `luogo:giro` (anche perché il pc non scrive da 3 min) | scena «via dal pc», niente app, niente eroe | «Sono in giro per il mondo» |
| 5 | **Offline** | Lanyard `offline` | scena spenta, tutto attenuato | «Sono offline» |

**Regole fisse:**
- Lo **stato Discord** (online/assente/non disturbare/offline) non è una scena: è un **nastro** sopra la scena. `idle` → nastro «Assente» e scena attenuata; `dnd` → nastro «Non disturbare» e scena più ferma; `offline` → stato 5.
- Le **attività Lanyard** (gioco/streaming/guardo) restano **solo** in «Adesso», non qui: niente doppioni.
- La **musica** è una striscia permanente, mai una scena a sé: accompagna, non ruba la scena.

## 3. Raggruppare le app in «modi»

Una mappa fissa `nome → modo` (confronto case-insensitive, su sottostringhe note: `vs code`/`visual studio`, `chrome`/`chromium`, `edge`, `discord`, `spotify`, `esplora`/`explorer`/`file explorer`, `obs`/`camo`/`premiere`, `steam`, ecc.).

| Modo | App che ci cadono (oggi) | Scena |
|---|---|---|
| **codice** | Visual Studio Code | scrivere |
| **chattare** | Discord | parlare |
| **navigare** | Chromium, Microsoft Edge | browser |
| **creare** | Camo Studio | registrare |
| **ascoltare** | Spotify (come app in primo piano) | musica |
| **sistemare** | Esplora risorse | file |
| **giocare** | Steam, giochi | gioco |
| **altro** | qualunque app sconosciuta | neutra, col nome vero dell'app |

**App sconosciuta:** mai inventare una famiglia. Scena neutra «Sto al pc» + il nome reale dell'app bene in vista. Il dato del sensore è solo nome+icona+primo piano: con quello ci si ferma, nessuna deduzione su file o siti.

## 4. Switch e transizione in base all'uso

**Cosa fa scattare il cambio:** solo il cambio dell'app **in primo piano** (`su`). Non la riordinazione delle icone, non il solo cambio di musica, non il luogo (che però scambia tutta la scena).

**Alt-tab veloci — debounce.** Una finestra deve restare in primo piano **1,8 s** prima di prendere la scena. Finché non scade, resta l'eroe precedente. Gli alt-tab sotto 1,8 s vengono ignorati. Coda «vince l'ultimo»: se durante l'attesa cambia ancora, riparte il timer.

**Tre transizioni diverse:**
- **App nuova** (mai vista in questa sessione): annuncio pieno, più lungo (~500 ms): l'icona entra, la scena del modo si apre, la frase si «scrive».
- **Ritorno a un'app recente** (già vista): passaggio morbido e rapido (~280 ms), nessun annuncio, solo dissolvenza/scambio.
- **Uso prolungato** (stessa app oltre ~8 min): la scena si calma — l'entrata rumorosa svanisce e resta un respiro quieto. Il «stra animata» non dura in eterno: deve stancarsi, non il visitatore.

**Musica:** cambio brano = solo crossfade sulla striscia (~200 ms), niente scena.
**Luogo** (ufficio↔giro): scambio di scena completo (~600 ms).
**prefers-reduced-motion:** ogni transizione collassa a una sola dissolvenza da 150 ms; via loop, parallasse, effetto scrittura.

**Memoria della sessione** (solo `sessionStorage` + memoria, niente server, si azzera chiudendo la scheda): l'elenco di app/modi già mostrati, per decidere «nuova» vs «recente».

## 5. Interazioni

- **L'eroe (app in primo piano) non è cliccabile.** È il suo schermo, non del visitatore: non si apre niente. Informativo e basta.
- **La striscia musica è l'unico link reale**: titolo/artista cliccabili → ricerca Spotify in nuova scheda (pattern già esistente in `musicaHtml`).
- **Fila icone app**: solo se presente; ogni icona è focalizzabile (`tabindex 0`) con nome come `title` + testo `sr-only`. Si legge, non si agisce.
- **Tastiera:** la zona è una `section` con `aria-label` e la frase viva come intestazione. Il `Tab` raggiunge musica e icone. Nessuna scorciatoia custom.
- **Tocco:** nessun gesto, nessuno scroll-jacking; la zona scorre con la pagina.
- **Hover (solo pointer fine):** può rivelare nome completo/caption, ma non deve servire per capire.

## 6. Accessibilità

- La frase viva («Sto scrivendo codice») è **testo vero** (`<h2>`), non immagine.
- Un **solo** `aria-live="polite"` annuncia **solo** il cambio di scena, e **dopo** il debounce (mai a ogni alt-tab). Mai `assertive`. La musica non si annuncia (già in «Adesso»; eviterebbe spam).
- Tutta l'animazione decorativa sta in `aria-hidden="true"`; lo screen reader legge solo la frase e il nome dell'app.
- **Nome app sempre esposto come testo** (caption visibile o `sr-only`), non solo icona.
- **Contrasto** garantito in entrambi i temi: la frase poggia su un fondo pieno (il «nastro»), non su sfondo animato nudo.
- **Obiettivi di tocco** ≥ 44×44 px (coerente con `.pz-x`). Focus visibile: riuso dello stile `focus-visible` giallo 3 px.
- **Niente flash** > 3 al secondo (rischio crisi).

## 7. Testi (italiano, prima persona, tono asciutto)

| Contesto | Testo |
|---|---|
| modo codice | «Sto scrivendo codice» |
| modo chattare | «Sono su Discord» |
| modo navigare | «Sto navigando» |
| modo creare | «Sto registrando» |
| modo ascoltare | «Sto ascoltando» |
| modo sistemare | «Sto sistemando» |
| modo giocare | «Sto giocando» |
| app sconosciuta | «Sto al pc» + nome app |
| ufficio, pausa | «Sono al pc» |
| in giro | «Sono in giro per il mondo» |
| offline | «Sono offline» |
| riposo (bio) | «Chi sono» / «Sono pzkko. Qui finiscono le cose che faccio per svago.» |
| musica | «♫ {titolo} · {artista}» |
| nastro stato | «Assente» / «Non disturbare» / «Offline» |

I testi sono volutamente brevi e senza punti esclamativi. Le traduzioni nelle altre otto lingue le fai tu.

## 8. Cosa NON fare

1. Non duplicare «Adesso»: a destra un solo eroe + scena, non l'elenco delle app.
2. Non animare a ogni alt-tab o a ogni riordino delle icone.
3. Non tenere la scena «stra animata» all'infinito: deve calmarsi.
4. Non far sembrare l'eroe un bottone (non apre il suo pc).
5. Niente testo a scorrimento, niente rotazione del nome, niente flash rapidi.
6. Niente testo come immagine (illeggibile, non traducibile, male per screen reader).
7. Non annunciare ogni micro-cambio allo screen reader.
8. Niente titoli di finestre, file o siti: il sensore passa già solo nome+icona+primo piano; non aggiungerne.
9. Non inventare scene per app sconosciute.
10. Nessun suono d'avvio (audio non richiesto).
11. Niente layout shift: la zona riserva la stessa altezza di «Adesso» (altezza/min-height fissata).
12. Niente animazioni se `prefers-reduced-motion`.

## 9. Dato extra dal sensore (a parte, non bloccante)

La specifica **si regge sui dati di oggi** (luogo, app con `su`, musica). L'unico dato che *aiuterebbe* — senza esserne necessario — è un booleano **`attivo`** (input tastiera/mouse negli ultimi ~2 min): distinguerebbe «sta lavorando» da «ha lasciato la scena aperta». In sua assenza, lo stato Discord `idle` fa già da approssimazione. Non serve altro: niente nomi di file, niente URL, niente titoli di finestre.

---

Decisioni prese, nessun ventaglio. Quando passi a Claude per la grafica, la base è questa: la scena cambia solo sull'app in primo piano, con debounce 1,8 s, tre ritmi di transizione (nuova/recente/prolungata) e la bio di «Chi sono» come stato di riposo.

---

# Revisione del risultato (DeepSeek, 26.11.2026)

Claude ha chiesto a DeepSeek di rivedere `chisono.js` e `chisono.css` contro questa specifica, dichiarando otto scelte che se ne scostano. I tre difetti trovati sono stati corretti lo stesso giorno.

## Verdetto sulle otto scelte di Claude

1. **Accetto** — coerente con §1: «in giro» e «offline» sono proprio i casi «niente da mostrare» in cui la bio torna.
2. **Accetto** — Figma/AutoCAD non sono app «sconosciute»: è una mappatura nota, e «disegno» evita un «sto registrando» falso.
3. **Accetto** — più vero del nome fisso, e la frase resta corta.
4. **Accetto** — «offline» deve richiedere il pc davvero spento; col pc che tace e Discord acceso, «in giro» è la scena giusta.
5. **Accetto** — 2,5 s è il cap corretto e la logica non fa cambiare due volte la prima scena.
6. **Accetto** — riusare l'i18n del sito batte il «Assente» ad hoc.
7. **Accetto** — evita il doppione con «Adesso» (§8.1); i nomi lì ci sono già.
8. **Accetto, con riserva** — lo scopo §1 resta coperto da frase + nome-app, ma con l'adesivo come eroe (decorativo) e l'icona vera a 30 px nel bollino l'app non si riconosce più dalla marca a colpo d'occhio.

## Difetti (corretti)

1. **Annunci di troppo sul «ritorno»** — `chisono.js:214-215`. `cambia()` riempie sempre `.chi__dice`, anche quando `tipo='ritorno'` (alt-tab su un'app già vista): contravviene a §4 («nessun annuncio») e a §6 («mai a ogni alt-tab»).
   *Correzione:* `if (tipo !== 'ritorno' && voce) voce.textContent = …`.

2. **Prima scena muta** — `chisono.js:193-198`. Il passaggio riposo→prima app va da `mostra(s,'nuova')` direttamente, senza aggiornare `.chi__dice`: il cambio più importante (§1, «in due secondi capisci») non viene annunciato.
   *Correzione:* estrarre la riga dell'annuncio di `cambia()` in una funzione e chiamarla anche qui.

3. **Lampo sull'icona arrivata dopo** — `chisono.js:188-190`. `mostra(s,'fermo')` rigenera l'intero `<article>`; se capita durante la battitura «nuova», la frase salta a testo pieno e `calma` riparte da zero (riga 178).
   *Correzione:* aggiornare solo l'`<img>` dell'icona (e l'eventuale `b` di ripiego), senza ricreare il foglio.
