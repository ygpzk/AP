<!-- Specifica UX di DeepSeek (OpenCode, agente plan) per il riquadro «Strumenti» della bacheca, 26.11.2026: il comportamento dal vivo (cosa è in uso adesso, il cambio di app, l'ordine). La grafica e le animazioni sopra queste decisioni sono di Claude Code: public/assets/strumenti.js e il blocco «gli strumenti» in src/site.css. Il brief di OpenCode sulle 32 voci è in strumenti-bacheca.md; cosa è stato fatto e dove ci si è scostati è in RISPOSTA-CLAUDE-STRUMENTI.md. -->


**Correzioni.** (1) Il riquadro «Strumenti» oggi **non è affatto collegato ai dati dal vivo**: `renderBoard()` lo disegna una volta (riga 708), e il callback della vetrina (riga 1403) aggiorna solo `#now-widget`, `#now-widget-2` e l'attività della card — mai gli strumenti. Claude dovrà aggiungere l'ascolto. (2) Il `setInterval` da 1 s (riga 820) riscrive solo `#now-widget`, **non** tocca gli strumenti: il rischio non è il tick, è `renderBoard()` che rifà tutto il pannello a ogni cambio scheda. (3) `su:true` è la finestra in primo piano: confermato, ed è l'unico segnale "in uso" affidabile. Le 17 voci hanno tutte un'icona reale in `icons.js`.

## 1 — Cosa dice la zona
«Cosa sa usare pzkko — e cosa ha in mano **adesso**». La zona racconta la cassetta degli attrezzi reale, con quella attiva che si accende in tempo reale.

## 2 — Gli stati

| Stato | Come lo so | Cosa si vede | In evidenza | Testo breve (it / en) |
|---|---|---|---|---|
| PC spento / in giro | `app: []` (dato >3 min) | 17 pillole tutte neutre, ferme, ordine base | nessuna; la zona "dorme" | «Non al PC ora» / «Away from the PC» |
| PC acceso, nessuno strumento | `app` con voci ma nessuna mappa a uno strumento (o in primo piano c'è Spotify/Discord) | pillole neutre; le mappate in background leggermente "aperte" | nessuna accesa | «Sul PC» + luogo |
| Uno strumento in uso | app in primo piano mappa a un solo tool | quel tool: ingrandito, acceso, indicatore "live" | solo la pillola attiva | «In uso ora: {tool}» / «Using now: {tool}» |
| Più strumenti insieme | più app mappano a tool, uno è in primo piano | attivo = acceso + ingrandito; gli altri aperti = marcati | prima l'attivo, poi gli aperti | «{tool} · +N aperti» / «{tool} · +N open» |
| Cambio di app | cambia l'app in primo piano | handover animato (punto 3) | esce il vecchio, entra il nuovo | riga di stato aggiornata |

## 3 — Il cambio di app
**Cosa lo fa partire:** il cambio del tool *attivo* derivato (da `str` o dalla mappa), non ogni evento SSE. Si confronta "tool attivo precedente" vs "candidato".

**Ordine e significato (chi esce / entra / si sposta):**
1. *Esce* (0–160 ms): il tool attivo lascia lo stato "acceso" — si rimpicciolisce, il bagliore e l'indicatore spariscono. Resta al suo posto.
2. *Entra* (120–280 ms): il nuovo sale — scala su, si accende, passa sopra (z-index). I due momenti si sovrappongono ~40 ms: un passaggio di testimone, non un vuoto.
3. *Si assesta* (280–420 ms): gli altri ricadono nelle posizioni finali (FLIP, solo se cambia l'ordine).
Totale ~400 ms.

**Anti-sfarfallio (alt-tab veloce):** il cambio viene **confermato** solo se il candidato resta in primo piano per **600 ms** continui (debounce: gli scarti entro la finestra non animano nulla); dopo un cambio, il tool attivo non può essere sostituito per **minimo 1,2 s** (dwell). Così un alt-tab rapido produce al massimo *un* handover pulito, mai uno stroboscopio.

## 4 — «In base all'utilizzo»: ordine e gerarchia
**Misura:** solo client-side, da quando la pagina è aperta. **Nessun nuovo campo "utilizzo" dal PC**: violerebbe la regola (è storia, non output) e esporrebbe dati personali. La gerarchia vive su due livelli:
- **Live** (dal dato attuale): attivo > aperti > resto.
- **Recency in sessione**: un contatore locale di quanto ogni tool è stato in primo piano, usato solo per ordinare *tra i tool aperti*.

**Ordine risultante:** `[tool attivo] → [aperti, dal più recente] → [resto, ordine base di TOOLS]`. Il riordino avviene **solo all'assestamento** (dopo il debounce), mai durante la transizione, mai a ogni tick, e mai mentre il puntatore è su una pillola. La posizione del tool attivo è il primo slot: il resto si sposta con una sola mossa FLIP, tutto dentro il widget (altezza fissa, niente "ballo" sotto).

## 5 — Mappatura app/processo → strumenti e contratto del campo
**Campo nuovo (consigliato, opzionale):** su ogni voce di `app`, un campo `str` = chiave strumento da whitelist fissa (le 17 chiavi di `icons.js`). Lo calcola il PC (dove conosce eseguibile + titolo): è **output pronto**, non titoli/percorsi — quindi lecito. Contratto:
- nome `str`, stringa, max 16 char, deve appartenere alla whitelist; se sconosciuta → scartata.
- può mancare (dato di oggi): il sito funziona lo stesso, con la fallback qui sotto.
- limite: un valore per voce; di norma lo si manda solo per l'app in primo piano.

**Fallback per nome app (con il dato attuale):**

| App (oggi) | Tool |
|---|---|
| Visual Studio Code | JavaScript (primario); aperti: TypeScript, Node.js, HTML, CSS |
| Chromium / Microsoft Edge | nessuno (riposo) |
| Discord, Camo Studio, Esplora risorse, Spotify | nessuno (riposo) |

**Mappa completa che il PC userà per `str`:** VS Code → `javascript`/`typescript`/`nodejs`/`html5`/`css`/`react`/`vite`/`threejs` (in base al progetto aperto); terminale con `claude` → `claude`; `pwsh`/PowerShell → `powershell`; `dotnet`/Visual Studio → `csharp`; `python` → `python`; `acad.exe` → `autocad`; `figma` → `figma`; `ffmpeg` → `ffmpeg`; `vercel`/`git` CLI → `vercel`/`git`. Tutte le altre → assente (stato "nessuno strumento").

## 6 — Interazione
- **Hover (mouse) / tap (touch):** la pillola si espande leggermente e mostra una micro-riga di stato (attivo → «in uso ora», aperto → «aperto», resto → «usato in N progetti»). Su touch l'informazione sta comunque nella riga di stato sempre visibile, non solo in hover.
- **Clic / tap / Invio:** ogni pillola è un `<button>`; porta alla scheda **progetti filtrata per quel tool** (in-pagina, riusando `filter` + `data-filter` di `renderProjects`, niente pagina nuova). **Sì**: lo strumento porta ai progetti (`PROJECTS[].tags` usa le stesse icone), è il collegamento naturale e rispetta "tutto resta nella pagina".
- **Tastiera:** focus visibile, Invio/Spazio = filtro. Il cambio di tool attivo **non sposta mai il focus**.

## 7 — Accessibilità e limiti
- **Screen reader:** il widget è un `role="group"` con `aria-label` "Strumenti". La riga di stato è `aria-live="polite"` e annuncia **solo il cambio di tool attivo**, throttled a **max 1 annuncio / 3 s**. Le pillole sono bottoni con etichetta stabile (nome) + stato in `aria-label`.
- **`prefers-reduced-motion`:** niente scale/glow/FLIP; gli stati cambiano solo colore/indicatore, istantanei. L'annuncio resta.
- **360 px:** pillole su 2 colonne, tool attivo a piena larghezza in prima riga; nomi lunghi troncati; niente scroll orizzontale.
- **Touch:** tap = azione primaria (filtro); nessuna informazione nascosta dietro hover.
- **Testi (corti, tutte le 9 lingue via mini-dizionario in stile `VTX`):** solo 3–4 stringhe nuove: «in uso ora», «aperto», «+N aperti», «Non al PC ora». Riuso `vtx().luogo` per lo stato "giro".

## 8 — Vincoli tecnici per Claude
- **Deve sopravvivere a `renderBoard()` (innerHTML):** solo lo **stato di sessione** — contatore recency, tool attivo, timer debounce/dwell — in variabile a livello di modulo. Mai nel DOM o in attributi.
- **Non deve sopravvivere:** i nodi DOM e le classi d'animazione in corso: al ritorno sulla scheda si ridisegna lo stato assestato, senza ri-animare.
- **Aggiornamento live:** aggiungere un listener `ascolta()` dedicato che muta **solo** il sottoalbero `#tools-widget` (toggle di classi + testo), mai `innerHTML` dell'intero pannello. Il `setInterval` da 1 s non deve toccare la zona.
- **Leggerezza:** ≤17 nodi piatti, `will-change: transform` solo su attivo/aperti, un `requestAnimationFrame` per cambio, niente librerie/shadow DOM. Altezza stabile del widget per evitare shift sotto.

Claude può partire da qui per la grafica (colori, curve, disegni sono suoi).
