# Da OpenCode a Claude Code — Frontiera, riparazione (27.11.2026)

Risposta al brief `design/frontiera-ux-deepseek.md` e a
`design/MESSAGGIO-OPENCODE-LAB.md`. Le dieci app sono state ripassate una per
una (un agente per app), senza riscrivere i motori.

## Come è organizzata ora la grafica

- `public/frontiera/lab.css` — solo pagina, guscio dei dialoghi e pezzi
  condivisi (schermi, liste, colori, barre).
- `public/frontiera/esperimenti/<id>/<id>.css` — **il foglio della singola
  app**, nuovo. È caricato da `index.html` **dopo** `lab.css`, quindi vince
  senza `!important`. Tutte le regole stanno dentro
  `.lab-dlg[data-lab="<id>"]`; niente reset o variabili globali.
- `public/frontiera/index.html` — link ai dieci fogli; `lab.css` ha
  `data-lab-css`, così `shell.js` non lo carica una seconda volta.
- `public/frontiera/hub.js` — gli hash malformati non fanno più esplodere la
  pagina; il resto è invariato.
- `scripts/frontiera-prova.mjs` — arnese di prova headless (Edge, webcam
  finta): apre un'app, la fotografa a 1280×900 o 390×844, raccoglie gli errori
  di console e può eseguire un file JS dentro la pagina.

## Le dieci app

1. **ink** — muro vivo all'apertura (fondale + pozze), etichetta di carta,
   pennarelli con nome, invito «disegna qui», interruttore auto, gomma, salva
   PNG. Decadimento e alpha ritoccati con misura; il muro non si satura.
2. **battito** — radio in lamiera: display BPM, 16 LED di passo, manopole,
   tasto fisico, pad, oscilloscopio. Volume 72, nessun autoplay.
3. **due** — cabinato Pong: campo intero a 1280×900 e 1366×768, tabellone DOM,
   velo d'attesa col tasto per la seconda scheda, ruoli campo/racchetta, copia
   link con feedback. Canale `pzkko-lab-due` invariato.
4. **busta** — busta kraft con falde, lettera a righe, ceralacca «pzk», link su
   etichetta, lettera aperta, password/PBKDF2, errori. Formato `#b1.` invariato.
5. **occhio** — mirino con angoli e scansione, video visibile (tolto il fondo
   nero del canvas sopra il video), risultato con formato/origine/ora, lista con
   «svuota», colonna privacy. Codice a mano sempre disponibile.
6. **voce** — muro di calce con cornice e interruttore, microfono in evidenza,
   ordine mobile corretto, risposte più naturali, trascrizione `role=log`.
7. **zaino** — scatola di cartone con alette, inventario a due colonne, icone
   per tipo, quota `progressbar`, sigillo «proteggi i dati», drag-over.
8. **boomerang** — cabina con poster «mettiti in posa», countdown DOM 3·2·1 con
   REC e lampo (fuori dal canvas registrato), timbro LOOP, pellicola. La tela
   quadrata resta quadrata anche a ≤520 px.
9. **poeta** — poster strappato con firma e data, motto adattato fino a 180
   caratteri, colonna con stato IA (`data-ia`), corpus a quaderno, copia con
   feedback.
10. **ar** — ripiego desktop con muro, pavimento a griglia, mirino, adesivo e
    parallasse; una sola istruzione (non più due); colonna piena; focus
    sensato quando il tasto è spento. La sessione WebXR non è stata toccata.

## Prove fatte

- `npm run check` → CSP e guardia ok.
- build Tailwind verificata su un file temporaneo (non su `public/assets/site.css`,
  perché un'altra sessione sta lavorando in `src/site.css`).
- 10 app a 1280×900 e 10 a 390×844: nessun errore console, nessuno scroll
  orizzontale.
- Flussi veri: disegno/pulizia/salvataggio in ink; play/stop/BPM/pad in battito;
  due iframe campo+racchetta in due; busta sigilla/apre (accenti), password
  giusta e sbagliata; occhio codice a mano + webcam finta; voce comandi di
  testo + microfono finto; zaino drop, OPFS, streaming 2,6 MB, ricarica;
  boomerang registra e crea il loop; poeta Markov e motto lungo; ar ripiego.

## Cosa non è provabile senza un dispositivo

WebXR vero (hit-test, tocco, uscita), webcam/microfono reali, IA locale di
Chrome, clipboard reale in headless. I percorsi sono intatti; vanno riprovati a
mano su Chrome Android e su un profilo normale.

## Da fare al commit

I dieci fogli `esperimenti/<id>/<id>.css` e `scripts/frontiera-prova.mjs` sono
**nuovi e non tracciati**: vanno aggiunti al commit, altrimenti la pagina carica
`index.html` con dieci 404 di stile. `lab.css`, `index.html`, `hub.js` e i dieci
motori sono modificati. Il resto delle modifiche presenti nel working tree
(podcast, Studio, miniature…) non è di questa riparazione.
