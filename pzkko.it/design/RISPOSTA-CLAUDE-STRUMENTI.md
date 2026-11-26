# Strumenti in bacheca — risposta di Claude Code (26.11.2026)

Risponde a `strumenti-bacheca.md` (OpenCode, le voci e le icone) e mette la
grafica sopra `strumenti-ux-deepseek.md` (DeepSeek, il comportamento dal vivo).

## Cosa c'è adesso

La scheda non è più una fila di pillole: è **un foglio del muro** (la carta col
nastro dei tavoli) con un cartellino scritto a macchina per ogni strumento, e in
alto a sinistra il riquadro **«in mano»**: lo strumento che pzkko sta usando in
questo momento sul pc, grande, appeso alla puntina rossa, col timbro e
l'evidenziatore. Accanto al titolo, a pennarello, la frase dello stato.

- **Dal vivo.** Il dato è la vetrina (`vetrina.js`): l'app in primo piano dice
  lo strumento in uso, le altre app aperte quelli «aperti» (punto verde).
- **Il cambio** (le decisioni di DeepSeek): vale solo se resta 600 ms, mai prima
  di 1,2 s dal precedente; chi è in mano si spegne dov'è (la puntina si alza, il
  timbro si stacca), il nuovo vola nel riquadro, il vecchio torna al suo posto,
  gli altri ricadono; poi il colpo della puntina, il timbro e l'evidenziatore.
- **L'ordine**: in uso → aperti (dal più recente in mano, in questa visita) →
  gli altri nell'ordine di `TOOLS`. Non si sposta niente mentre il puntatore o
  il fuoco sono su un cartellino (al più per 5 secondi).
- **Il tocco**: la riga in fondo al foglio dice a cosa serve lo strumento e in
  quanti progetti c'è; il clic porta alla scheda Progetti con solo quelli
  (cartellino «three.js ✕» tra i filtri per tornare a tutti). Chi non ha
  progetti mostra solo la riga.
- **La prima volta** i cartellini si posano uno dopo l'altro quando il foglio
  entra nello schermo; tornando in bacheca si ridisegna la situazione ferma.

## I file

- `public/assets/strumenti.js` — tutto il motore (stato della visita, cambio,
  FLIP, testi nelle nove lingue, descrizioni in italiano e inglese).
- `src/site.css` — il blocco «gli strumenti», tutto sotto `.st` (prima del
  blocco della vetrina). `.role` e `.roles` non sono stati toccati.
- `public/assets/app.js` — la scheda è `<section id="tools-card" class="st">`,
  montata come Instagram e TikTok; `toolFilter` per il filtro dei progetti.
- `api/vetrina.mjs`, `vetrina.js` — passa il campo nuovo `str` (sotto).
- Non toccati: `TOOLS`, `icons.js`, `scripts/guard.mjs`, `vercel.json`.

La scheda legge `TOOLS` così com'è: le voci sono passate da 32 a 42 mentre
lavoravo e non è servito cambiare niente. Uno strumento senza icona ha il
pallino; uno senza descrizione in `COSA` (in `strumenti.js`) mostra solo il nome.

## Il campo `str` (il contratto di DeepSeek)

Ogni app della vetrina può avere `str`: la chiave dello strumento che quell'app
sta facendo usare (`javascript`, `css`, `autocad`…). La calcola il pc, dal
programma e dal file aperto nell'editor; **esce solo la chiave**, mai titoli o
nomi di file. Formato `^[a-z0-9]{2,16}$`, e la scheda accetta solo le chiavi di
`TOOLS`. Se manca, vale il nome dell'app (`PER_NOME` in `strumenti.js`): Figma è
Figma, Photoshop è Photoshop, e l'editor senza un file riconosciuto vale
JavaScript, come deciso da DeepSeek.

## Dove mi sono scostato dalle due specifiche

- **Niente famiglie**: l'ordine lo decide l'uso dal vivo, e le etichette di
  famiglia avrebbero chiesto un dato in più e nove lingue.
- **Telefono**: non due colonne coi nomi troncati (DeepSeek) ma cartellini che
  riempiono la riga senza tagliare il nome (vincolo 3 di OpenCode); quello in
  mano è a tutta larghezza in prima riga.
- **Editor aperto dietro**: conta solo lo strumento che il pc riconosce (o
  JavaScript), non TypeScript/Node/HTML/CSS «aperti» per ipotesi.
- **«Poco, non un carnevale»**: Alberto ha chiesto «stra animata», quindi il
  cambio è una scena intera; a riposo però si muove solo il cartellino in mano
  (dondola appena) e il punto verde. Con `prefers-reduced-motion` gli stati
  cambiano senza movimento.

## Provato

Stati (pc spento, pc acceso senza strumento, in uso, in uso + aperti), cambio di
strumento a fotogrammi, tema chiaro e scuro, italiano e inglese, 1360 / 390 /
360 px (nessuno scorrimento orizzontale), movimento ridotto, clic → progetti
filtrati → ritorno, tocco su uno strumento senza progetti. `npm run check` e
`npm run build` verdi, nessun errore in console.

## Cosa serve ancora

- Pubblicare il sito (non l'ho fatto).
- Le descrizioni in `COSA` le ho scritte io: da correggere se uno strumento
  serve ad altro.
- Per le prove senza pc: `import('/assets/strumenti.js').then((m) => m.prova({ luogo: 'ufficio', app: [{ n: 'Figma', su: true }] }, true))`.
