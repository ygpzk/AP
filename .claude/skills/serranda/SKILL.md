---
name: serranda
description: Allunga, accorcia o riempie la serranda di pzkko.it (la home di albertopecchini.it/pzkko, solo 2D dal 6.11.2026) — aggiungere un volantino, un manifesto o un graffito, spostare la sparsa dei volantini, cambiare un titolo o un contatto senza che le scritte vadano a capo. Usala quando Alberto chiede di mettere qualcosa di nuovo sul muro di pzkko, di allungare o accorciare la serranda, di risparpagliare i volantini, o dice che una scritta va a capo male.
---

# La serranda di pzkko.it

Dal 6.11.2026 la saracinesca è **alleggerita e solo in 2D** (Alberto: «le ventole del pc
diventano un aereo»). Sul muro di `albertopecchini.it/pzkko/index.html` ci sono il wallet e
il cercapersone in cima, sei volantini compatti dei social (`.vol.s`) **sparsi a caso col
seme** su tutta la parete, mai coperti più del 10%, e la petizione in fondo, sopra tutto.
Sul telefono i volantini sono larghi ~118 unità su 390: tre per riga. Niente pile, niente
scena 3D (`pzkko/scena/` resta lì, spenta: non riaccenderla e non rifare le sue foto).

Le posizioni stanno in `albertopecchini.it/tools/pzkko/disposizione.js` (`abs` = dove si
dice, `fondo` = attaccato al fondo della parete, `sparsi` = a caso) e le scrive in pagina
`disponi.mjs`. Non spostare pezzi a mano in `index.html` (le `--x --y …` si riscrivono).
Tutto da `albertopecchini.it/`:

```bash
node tools/pzkko/serranda.mjs                 # stato: parete, manopole, gli sparsi con le coordinate, la petizione
node tools/pzkko/serranda.mjs volantino --titolo="…" --testo="…" [--link=URL] [--handle=…] [--mano="in arrivo"] \
     [--carta=giallo] [--arte=arte2/dadi] [--zona=social]     # un volantino di quelli grandi, fra gli sparsi
node tools/pzkko/serranda.mjs pezzo --img=manifesti2/x [--tipo=man|tag|pezzo]   # un manifesto o un graffito, fra gli sparsi
node tools/pzkko/serranda.mjs allunga --minimo=3600      # l'altezza della parete (--telefono, --entrambi)
node tools/pzkko/serranda.mjs rifai                      # disponi + scritte + 404 + storia, con le foto delle pagine
node tools/pzkko/scritte.mjs [--scrivi] [--pagina=storia] # nessuna parola spezzata; --scrivi rimette --tt e --th
node tools/pzkko/caratteri.mjs                           # i caratteri a pezzi (solo le lettere che servono)
node tools/pzkko/leggere.mjs                             # le immagini leggere (art/social/, art/leggere/)
```

`--prova` su volantino, pezzo e allunga mostra cosa farebbe senza scrivere.

## Come si fa

1. `serranda.mjs` (stato): dove sono gli sparsi, quanto è alta la parete.
2. **Un volantino compatto nuovo** (come quelli dei social) si scrive a mano in
   `index.html`, copiandone uno: `class="vol it s c-<carta> f-<carattere>"`, l'illustrazione
   (stesa sul bianco: aggiungila a `leggere.mjs`), il titolo in `<h3><a>`, `<p class="handle">`,
   i cinque tagliandi (righe corte, con `<br>`: devono stare nell'altezza del tagliando).
   Poi una riga in `sparsi.items` di `DESK` e di `MOB` in `disposizione.js`. Se il titolo ha
   un carattere suo: una riga nel gruppo `social` di `caratteri.mjs` (il testo esatto del
   titolo), una classe `f-…` nello stile, `node tools/pzkko/caratteri.mjs`.
3. **Sempre**, dopo aver toccato un titolo, un contatto, un carattere o una carta:
   `node tools/pzkko/scritte.mjs --scrivi`. Mette `--tt` e `--th` (le misure in cqw) e
   controlla a otto larghezze che nessuna parola sia spezzata e niente esca dal riquadro.
   Se dice «da sistemare» non è finito: Alberto non vuole MAI una lettera sola a capo.
4. Risparpagliare: cambia `seme` in `sparsi` (computer e telefono). Più o meno larghi:
   `prove` (più prove = più distanti e regolari), `copre` (quanto possono coprirsi, 0.1).
   Se un pezzo «non trova posto»: `allunga --minimo=N`.
5. `rifai`: serve un browser (`tools/pzkko/browser.mjs`: Chromium di Playwright, il Chrome
   scaricato in `%LOCALAPPDATA%\pzkko-chrome`, o Edge) e `npm ci` in `albertopecchini.it/` e
   in `tools/catture/`. Rigenera anche `404.html` e la storia.
6. Guarda le foto con Read: `tools/pzkko/lavoro/muro-desk.png`, `muro-mob.png`,
   `storia-desk.png`, `storia-mob.png` (sono grandi: rimpicciolite con sharp, o a pezzi).
7. Aggiorna `pzkko/README.md` («La saracinesca alleggerita», in cima a «Com'è fatta la
   home») se cambia qualcosa che lì è descritto.

## Attenzione

- **Leggera deve restare.** Niente animazioni CSS senza fine, niente `requestAnimationFrame`
  che gira a pagina ferma, niente variabili scritte su `html` a ogni fotogramma, niente strati
  in `mix-blend-mode` grandi quanto la pagina lasciati lì trasparenti (`display:none` finché
  non servono). Un'immagine nuova: alla misura a cui si vede (3× al più), non l'originale.
- La petizione (`#petizione`) sta in `fondo`, con `sotto` unità libere per le penne (230 sul
  computer, 170 sul telefono), e ha `z-index:25`: niente deve stare sopra le penne. Gli
  sparsi la evitano da soli.
- I giochi, i siti e la storia non hanno più il volantino sul muro: si aprono dalla barra in
  alto (gadget, storia), dal cercapersone e con `#roulette`, `#mine`… nell'indirizzo.
- La storia (`pzkko/storia/`) è la home con un altro muro, a pile: stesso CSS e stesso
  script, rifatta da `tools/pzkko/genera-storia.mjs` (lo fa `rifai`). Le sue pile stanno in
  `tools/pzkko/storia/disposizione.js`; `stato` e `allunga` ci lavorano con `--pagina=storia`.
  I suoi fogli si scrivono a mano in `storia/index.html`, dentro `<div class="parete storia">`.
- `disponi.mjs` misura nel browser che trova: con Edge le altezze vengono qualche unità
  diverse. È normale.
- Non fare commit né push se Alberto non lo chiede: ogni push su `main` va online.
