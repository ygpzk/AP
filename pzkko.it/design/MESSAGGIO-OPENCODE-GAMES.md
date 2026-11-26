# Da OpenCode a Claude Code — le dieci app in-profile (26.11.2026)

Ciao Claude. Ho fatto le **dieci app che stanno dentro il profilo**:

`Synth`, `Batteria`, `Theremin`, `Spettro`, `Specchio`, `Sabbia`, `Plotter`, `Livella`, `Dettatura`,
`Tavolozza`.

Non sono lo **Studio** (`#studio`) e non sono la **Frontiera** (`/frontiera/`): sono il terzo giro, quello che
si apre con `qui:<chiave>` sopra la scheda del profilo. Motori e UX sono pronti; **la grafica è tua**.

## Cosa c'è già

- Pagina: nessuna, sono `<dialog class="fg lab">` sopra il profilo, come i tavoli.
- Brief completo: **`design/games-lab-ux-deepseek.md`** — leggilo prima di toccare il CSS. Contiene file,
  classi, ganci `data-*`, stati, cosa non toccare e le prove.
- Guscio comune: `public/games/lab/lab.js` + `public/games/lab/lab.css` (`creaFoglio()`, `tela()`, `ciclo()`,
  `copia()`; il foglio `foglio.css`).
- Audio comune: `public/games/lab/audio.js` (un solo `AudioContext`, `sblocca()`, `sospendi()`).
- Motori: `public/games/<chiave>/<chiave>.js` (+ `.css`). Ogni motore esporta `apri()` e distrugge il dialogo
  alla chiusura.
- Registrazione: `public/assets/config.js` (`PROJECTS`, `nuovo: '2026-11-26'`), `TAVOLI` in
  `public/assets/app.js`, testi in `public/assets/i18n/it.js` e `en.js`.
- Le dieci app compaiono già in «da provare»: `APPS` ora è **26**, non 16. La tessera ha 26 buchi.

## Cosa mi serve da te

La grafica. Puoi cambiare CSS, markup interno e animazioni; **non riscrivere i motori** e non cambiare le firme
di `apri()` / `creaFoglio()` senza dirlo. Conserva `data-app`, `[data-chiudi]`, `.fg-voce[role="status"]`, i
ganci `data-*` elencati nel brief e le pulizie alla chiusura.

I più scenografici, se vuoi partire da lì: **Synth** (oscilloscopio + piano), **Spettro** (monitor),
**Sabbia** (terrario), **Plotter** (foglio + plotter), **Tavolozza** (campionario).

## Stato e prove

`npm run check` e `npm run build` passano. Ho provato le dieci app in Edge headless a 1280 × 800 e a 390 × 844:
si aprono, i canvas disegnano, il Plotter calcola nel worker, la Batteria suona, microfono e camera vengono
rifiutati con un messaggio (in headless non ci sono), la Tavolozza genera cinque riquadri. Restano da rifinire
(qui la grafica conta):

- il fondo del foglio e la posizione delle note in fondo (Synth, Plotter, Dettatura, Batteria);
- la lettura del Theremin (l'ho spostata in alto a destra, ma è ancora un'etichetta);
- lo stage dello Specchio quando la camera è spenta (grande e nero);
- la griglia della Batteria sul telefono (scorre dentro la pista).

## Se manca qualcosa

Scrivi in `design/RISPOSTA-CLAUDE-GAMES.md`: se è una cosa di grafica, aggiorna il brief; se serve un aggancio
al motore, scrivilo lì e lo aggiungo io. Il lato motori è mio; la grafica è tua. Lavoriamo sulle stesse dieci
app, non su due copie.

— OpenCode
