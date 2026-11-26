# pzkko.it — nota per Claude Code

Prima di toccare la scheda Instagram della bacheca, leggi
`design/instagram-bacheca.md`: è il brief di design scritto per Claude Code in
VS Code, con il contratto dati, gli stati, l'accessibilità e le cose da non
toccare.

Il lato dati (raccoglitore, `public/media/ig/`, `scripts/guard.mjs`) è già
fatto e non va cambiato da qui.

La scheda TikTok (26.11) è **la stessa dashboard** della scheda Instagram con
altri colori: il motore comune è `public/assets/scheda-social.js`, `ig.js` e
`tt.js` sono solo configurazioni, `.igc--tt` in `site.css` cambia solo i
colori. Una modifica al motore vale per tutte e due: provale entrambe, e non
far divergere le schede. Brief: `design/tiktok-bacheca.md`. Se OpenCode chiede
qualcosa, lo scrive in `design/MESSAGGIO-OPENCODE-TIKTOK.md`; si risponde in
`design/RISPOSTA-CLAUDE-TIKTOK.md`.

## La Frontiera (26.11)

La seconda ondata di esperimenti è in `public/frontiera/`: dieci tecnologie
nuove (WebGL2, Web Audio, BroadcastChannel, Web Crypto, BarcodeDetector, Web
Speech, OPFS, MediaRecorder, IA locale, WebXR). I motori sono fatti; la grafica
è da rifinire. Brief: `design/frontiera-ux-deepseek.md`; consegna:
`design/MESSAGGIO-OPENCODE-LAB.md`. La pagina è `/frontiera/` e il ponte è la
riga `.lab__frontiera` in fondo allo Studio. **Non riscrivere i motori** e non
aggiungere CSS globale: `lab.css` si carica anche dentro il profilo, quindi
reset e variabili restano chiusi in `.lab-pagina` / `.lab-dlg`. Non toccare le
dieci schede dello Studio né le dieci app di `public/games/lab/`.

La scheda **Strumenti** della bacheca (26.11) passa da 17 a 42 voci: il lato
dati è in `public/assets/config.js` e `public/assets/icons.js`, la UI e la
grafica sono state rifatte. Brief: `design/strumenti-bacheca.md`; la risposta è
in `design/RISPOSTA-CLAUDE-STRUMENTI.md`. **Fatta il 26.11**: il foglio coi
cartellini e lo strumento «in mano» dal vivo sono in
`public/assets/strumenti.js` e nel blocco «gli strumenti» di `src/site.css`
(comportamento: `design/strumenti-ux-deepseek.md`); la scheda segue `TOOLS`
da sola, qualunque sia il numero di voci. **La lista è la stessa, con gli
stessi nomi, della sezione Strumenti di `/studio/` del sito professionale**
(26.11: «siamo le stesse persone, quindi stessi strumenti»): se cambia una
voce, cambia in tutte e due.

Lo **Studio** (26.11) è la scheda nuova con dieci esperimenti veri sui dati
del profilo (Picture-in-Picture, quadro vivo, diario, radio 8 bit, cartolina,
costellazione, stanza, sole, meteo, clip). Motori e UX sono di DeepSeek; la
grafica è tua. Brief: `design/studio-ux-deepseek.md`. Il contratto è in
`public/assets/studio/index.js`; non riscrivere i motori e non aggiungere
servizi esterni. **Non è `/frontiera/`**: la Frontiera è il secondo giro
(WebGL, crittografia, fotocamera, voce, file locali, IA, WebXR), con un altro
indirizzo; le dieci app in-profile (Synth, Batteria, Theremin, Spettro,
Specchio, Sabbia, Plotter, Livella, Dettatura, Tavolozza) sono ancora un'altra
cosa. Non fonderli.
Se manca un aggancio: `design/MESSAGGIO-OPENCODE-STUDIO.md`, risposta in
`design/RISPOSTA-CLAUDE-STUDIO.md`.

Il riquadro **«Chi sono»** della bacheca (26.11) è vivo: un foglio del muro col
nastro che mostra quello che pzkko sta facendo sul pc (la chiocciola cambia
mestiere con l'app in primo piano), e a riposo la bio. UX di DeepSeek:
`design/chi-sono-ux-deepseek.md`. Motore `public/assets/chisono.js`, stile
`public/assets/chisono.css`: lo stile sta **fuori** da `src/site.css` apposta
(lo carica il modulo) e lì non va rimesso. In `app.js` restano solo tre
agganci: l'import, `chiSono.monta(...)` in `renderBoard`, `chiSono.presenza(...)`
in `onPresence`. Per provarlo senza aspettare il pc:
`import('/assets/chisono.js').then((m) => m.prova({ luogo: 'ufficio', app: [{ n: 'Discord', i: null, su: true }], musica: null }, 'online', 300))`.

## Le dieci app in-profile (26.11.2026)

`Synth`, `Batteria`, `Theremin`, `Spettro`, `Specchio`, `Sabbia`, `Plotter`, `Livella`, `Dettatura` e
`Tavolozza` stanno in `public/games/<chiave>/`, col guscio comune in `public/games/lab/` (`lab.js`, `lab.css`,
`audio.js`). Non sono lo Studio né la Frontiera: si aprono dal profilo con `qui:<chiave>`. I motori e la UX sono
pronti; **la grafica è tua**. Brief: `design/games-lab-ux-deepseek.md`; consegna:
`design/MESSAGGIO-OPENCODE-GAMES.md`; risposta: `design/RISPOSTA-CLAUDE-GAMES.md`. Non riscrivere i motori,
conserva `data-app`, `[data-chiudi]`, la voce `role="status"` e i ganci `data-*`; il CSS nuovo resta dentro
`.fg.lab` / `.lab-*`, niente regole globali.

## «da provare» in bacheca (26.11.2026)

La zona dei volantini è fatta a due mani: il comportamento è di DeepSeek in `public/assets/provare.js` (la pila
ordinata per uso, il giro, il cambio a mano, i numeri in `pzkko-app-stats`), la grafica è di Claude in
`public/assets/provare.css` e `public/assets/provare-arte.js` (classi e keyframe `pza-*`). Il contratto dei ganci e
degli eventi `provare:*` è in `design/da-provare-ux.md`: leggilo prima di toccare una delle due metà. Lo stile della
zona non sta in `src/site.css` (lì ci sono solo il blocco di struttura di DeepSeek e un blocco piccolo di Claude).
I tempi (`--pz-scambio`, `--pz-respiro`, `--pz-appena`, `--pz-sfalsa`) li legge il motore dal CSS: si cambiano lì.
Per provare: `?provare=fermo|veloce|azzera` e `window.provare` in console.
