<!-- Specifica UX di DeepSeek (OpenCode) per la scheda «Strumenti» della bacheca, 26.11.2026. Dati e icone sono già fatti e provati; la grafica, il layout e le animazioni sopra queste regole sono di Claude Code: public/assets/app.js e il blocco «strumenti» in src/site.css. -->

# Strumenti in bacheca — brief per Claude Code in VS Code

> **Questo file è per Claude Code in VS Code.** Il lato dati è già fatto da
> OpenCode: qui si progetta solo la UI e la grafica della scheda «Strumenti»
> della bacheca. Prima di cambiare qualcosa, leggi tutto il file e apri i file
> citati.

## Cosa è già fatto (non rifarlo)

Su richiesta di Alberto la scheda «Strumenti» passa da **17 a 32 voci**: 15
strumenti nuovi, tutti con l'icona del marchio presa da Simple Icons (CC0) e
messa in linea, senza richieste esterne.

- `public/assets/config.js` — `TOOLS` ora ha 32 voci, nell'ordine:
  HTML, CSS, JavaScript, TypeScript, React, Next.js, Astro, Svelte, Tailwind
  CSS, GSAP, Node.js, Bun, Vite, C#, Rust, Python, PowerShell, three.js,
  Babylon.js, WebGPU, WebAssembly, Claude Code, Ollama, AutoCAD, Blender,
  Figma, FFmpeg, OBS Studio, Docker, PostgreSQL, Vercel, Git.
- `public/assets/icons.js` — 15 icone nuove, con le chiavi qui sotto.
- `npm run check` e `npm run build` passano.
- **Non ho toccato** `app.js`, `src/site.css`, le schede Instagram/TikTok, il
  raccoglitore, `scripts/guard.mjs`, `vercel.json` né il README.

I 15 nuovi, con chiave, colore del marchio e il motivo per cui sono in scheda:

| Strumento | Chiave `ICONS` | Colore | Cosa ci fa |
|---|---|---|---|
| Next.js | `nextjs` | `#000000` | React quando servono rotte, rendering e un sito intero |
| Astro | `astro` | `#BC52EE` | siti di contenuti che spediscono quasi zero JavaScript |
| Svelte | `svelte` | `#FF3E00` | interfacce compilate, senza virtual DOM |
| Tailwind CSS | `tailwindcss` | `#06B6D4` | è il motore di stile di pzkko.it |
| GSAP | `gsap` | `#0AE448` | animazioni che non scattano |
| Bun | `bun` | `#000000` | un runtime solo per installare, provare e impacchettare |
| Rust | `rust` | `#000000` | velocità e sicurezza per i tool che non devono fallire |
| WebGPU | `webgpu` | `#005A9C` | la scheda grafica dal browser, calcolo e 3D |
| WebAssembly | `webassembly` | `#654FF0` | codice quasi nativo dentro la pagina |
| Babylon.js | `babylonjs` | `#BB464B` | il 3D della casa di Diretta OS |
| Ollama | `ollama` | `#000000` | modelli in locale, senza cloud |
| Blender | `blender` | `#E87D0D` | modelli, render e asset 3D |
| OBS Studio | `obs` | `#302E31` | la regia dal vivo di Diretta OS |
| Docker | `docker` | `#2496ED` | lo stesso ambiente ovunque |
| PostgreSQL | `postgresql` | `#4169E1` | dati relazionali che restano |

## Come funziona oggi la scheda

- `public/assets/app.js`, `renderBoard()`: la scheda è
  `<div class="widget span2 rise" style="--i:4">` con
  `${rolesHtml(TOOLS)}` (intorno alla riga 708).
- `rolesHtml(list)` (riga ~431) trasforma ogni voce `[nome, icona]` in una
  pillola. Se la chiave esiste in `ICONS`, `brand(key)` disegna l'SVG in linea;
  altrimenti mette un pallino colorato.
- `brand(key)` (righe ~70-76) usa `brandColors()` per ricavare due colori dal
  colore del marchio: `--icl` per il tema chiaro e `--icd` per quello scuro.
  Il colore non va scritto a mano nell'HTML.
- `src/site.css`: `.roles` e `.role` (righe ~303-306), `.bi` (righe ~642-643).
- `public/assets/site.css` è **generato** da `npm run build`: si modifica
  `src/site.css`, mai il file in `public/assets/`.

**Attenzione:** `.role` e `.roles` sono usati anche per i tag dei progetti
(`rolesHtml(feat.tags)`, `projectCard`). Se cambi la pillola in modo globale
cambi anche le schede dei progetti. Metti le regole nuove sotto un contenitore
solo della scheda strumenti (per esempio `#tools-card` o
`.widget--tools`) e lascia `.role` com'è per il resto del sito.

## La direzione è tua

La scheda deve reggere **32 pillole** senza sembrare un muro. Alberto ha chiesto
«almeno 10 cose nuove super fighe» e ha lasciato la UI a Claude Code: qui sotto
ci sono solo i vincoli e qualche idea, non un layout da eseguire alla lettera.

Idee possibili, scegline una e portala a fondo:

- **Famiglie**: web, runtime e linguaggi, 3D, AI, tecnica, media,
  infrastruttura. Etichette in `gg mono` maiuscolo, come gli occhielli della
  scheda community; niente etichette italiane hardcoded (vedi i18n).
- **Mappa**: i marchi più importanti più grandi, gli altri come satelliti
  intorno; oppure una griglia ordinata con un filo colorato per famiglia.
- **Movimento**: comparsa a cascata quando la scheda entra in vista, sollevamento
  di 1-2 px al passaggio, alone del colore del marchio. Poco, non un carnevale.
- **Dettaglio**: al passaggio o al tocco, una riga che dice cosa fa lo
  strumento (le descrizioni sono nella tabella qui sopra). Se vuoi i tooltip
  per tutti e 32, scrivili tu o chiedimi i dati.

## Cosa deve restare vero

1. **Nativo e leggero.** Niente iframe, niente immagini remote, niente
   dipendenze nuove. Le icone restano gli SVG in linea di `icons.js`.
2. **Chiaro e scuro.** Ogni cosa deve funzionare con `[data-theme=dark]`, con
   i colori del tema `#ccff00 → #9d00ff` e con il tema chiaro.
3. **Telefono.** Sotto i 680 px la scheda è a tutta larghezza: niente scroll
   orizzontale, niente testo tagliato, bersagli comodi al tocco.
4. **Accessibilità.** Il nome dello strumento è sempre leggibile; se usi solo
   l'icona da qualche parte, metti un'etichetta accessibile. Focus visibile,
   contrasto decente, `prefers-reduced-motion` rispettato.
5. **i18n.** Il titolo «Strumenti» arriva da `i18n.js` (`u.tools`). I nomi dei
   marchi restano com'è. Se aggiungi etichette di famiglia, aggiungi le chiavi
   in tutte e nove le lingue o non metterle.
6. **Prestazioni.** 32 SVG in linea vanno benissimo; non aggiungere JS che gira
   a ogni frame. `renderBoard()` ridisegna la scheda: se serve stato, tienilo
   fuori dal DOM o inizialo in modo idempotente.
7. **Non toccare il lato dati**: `TOOLS`, le chiavi di `icons.js`,
   `scripts/guard.mjs`, `vercel.json`, le schede social. Se ti serve un dato in
   più (per esempio un gruppo per ogni strumento), chiedilo prima invece di
   inventarlo nel markup.

## Cosa consegnare

- La scheda «Strumenti» rifatta in `public/assets/app.js` e `src/site.css`
  (o nei file che decidi, purché non siano generati).
- `npm run check` e `npm run build` verdi.
- Un breve riassunto in `design/RISPOSTA-CLAUDE-STRUMENTI.md`: cosa hai
  cambiato, cosa hai provato, cosa serve ancora. Se hai bisogno che OpenCode
  aggiunga o rinomini una chiave, scrivilo lì.

## Prova finale

- 32 strumenti visibili su computer, tablet e telefono, senza overflow.
- Le pillole dei progetti sono rimaste quelle di prima.
- Tema chiaro e scuro, zoom 200%, movimento ridotto.
- Nessuna richiesta a domini esterni e nessun errore in console.
