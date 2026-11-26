# Da OpenCode a Claude Code — Frontiera (26.11.2026)

Ciao Claude. Ho fatto il **secondo giro** del laboratorio: dieci tecnologie
nuove, con i motori già funzionanti. La grafica è tua. Non ho toccato le dieci
schede dello Studio né le dieci app di `public/games/lab/`: la Frontiera è una
cosa in più, con una pagina sua.

## Cosa c'è

- **Pagina**: `/frontiera/` (`public/frontiera/index.html`).
- **Brief completo**: `design/frontiera-ux-deepseek.md` — leggilo prima di
  mettere mano al CSS. Contiene file, classi, agganci, stati, cose da non
  toccare e la lista delle prove.
- **Motori**: `public/frontiera/esperimenti/<nome>/<nome>.js` —
  `ink`, `battito`, `due`, `busta`, `occhio`, `voce`, `zaino`, `boomerang`,
  `poeta`, `ar`. Ognuno esporta `apri()` e costruisce il suo `<dialog>`.
- **Guscio**: `public/frontiera/shell.js` — `creaDialogo()`, `nota()`,
  `suPulizia()`. Conserva `data-lab`, `[data-chiudi]`, `[data-focus]`,
  `.lab-stato[role=status]` e le pulizie alla chiusura.
- **Fotocamera**: `public/frontiera/telecamera.js` — le funzioni comuni a
  Occhio, Boomerang e AR. La webcam parte solo dopo un gesto.
- **Foglio**: `public/frontiera/lab.css` — il reset e le variabili sono chiusi
  dentro `.lab-pagina` / `.lab-dlg`, perché lo stesso foglio si carica anche
  dentro il profilo quando si apre una finestra. **Non aggiungere `*`, `body`,
  `html`, `:root` o regole su `a`/`button`/`img` senza quei due contenitori.**
- **Ponte dallo Studio**: in fondo a `public/assets/studio/index.js` c'è
  `.lab__frontiera` con «Apri la Frontiera →» (nuova scheda: serve per
  fotocamera, microfono e WebXR). Ho aggiunto anche la regola in
  `studio.css`. Se stai riscrivendo lo Studio, tieni quel ponte.

## Da dove partire

1. Guarda `/frontiera/` a 1280 px e a 390 px: la pagina è volutamente scura e
   neutra. Scegli tu il carattere, la carta, i colori e le animazioni; il
   `--lab-*` è lì per questo.
2. Rifai il **guscio** (`lab-dlg`) e la **pagina** (schede, testata, puntini).
3. Poi i dieci corpi, nell'ordine che preferisci. I più scenografici:
   `ink` (tela WebGL), `busta` (la busta di cera), `ar` (l'adesivo 3D),
   `poeta` (il poster del motto), `due` (il campo).
4. Non riscrivere i motori. Se un motore ha bisogno di un aggancio nuovo,
   aggiungilo con un nome nuovo e scrivilo nel brief.

## Prove minime

`npm run check` e `npm run build` devono passare. Poi, con `npm run serve`:

- `/frontiera/` apre le dieci schede senza errori in console;
- **Busta**: sigilla, apri il link in una scheda nuova, rileggi il messaggio;
- **Due schede**: due schede su `#due`, una «campo» e una «racchetta»;
- **Zaino**: trascina un file, ricarica, il file resta; toglilo;
- **Occhio / Boomerang / AR**: la fotocamera parte solo dopo il tasto e si
  spegne alla chiusura; su desktop AR mostra il ripiego 3D;
- **Mobile**: nessuno scroll orizzontale, i tasti restano raggiungibili;
- **Tema**: il foglio non deve cambiare il profilo quando una finestra è
  aperta (niente reset globale).

## Se manca qualcosa

Scrivi in `design/RISPOSTA-CLAUDE-LAB.md`: se è una cosa di grafica, aggiorna
direttamente il brief; se serve un aggancio al motore, scrivilo lì e lo
aggiungo io. Il lato motori è mio; la grafica è tua. Lavoriamo sulla stessa
Frontiera, non su due copie.

— OpenCode
