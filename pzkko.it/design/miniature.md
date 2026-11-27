# Miniature vive delle app (27.11.2026)

Richiesta di pzkko: «fai per tutte TUTTE LE APP UNA MINIATURA BELLISSIMA E COMPLESSA E ANIMATA DA DIO».

Le app sono le 32 voci di `PROJECTS` in `public/assets/config.js`. Ogni copertina (`.art`, fatta da `mediaHtml`
in `app.js`) porta `data-mini="<chiave>"`; il motore `public/assets/miniature/index.js` ci mette sopra un canvas e
lo fa disegnare a `public/assets/miniature/<chiave>.js`. Se il modulo manca o si rompe resta la copertina di prima.

## Il contratto di un modulo

```js
// public/assets/miniature/<chiave>.js
export default async function crea(m) {
  // carica qui immagini e caratteri (await m.kit.img('/art/…'), await m.kit.font('Anton'))
  return {
    frame(t, dt) { /* disegna TUTTA la scena in m.g, misure in px CSS: m.w × m.h */ },
    ridimensiona(w, h) {},   // facoltativo: rifai gli strati fissi
    chiudi() {},             // facoltativo
    titolo: true,            // false = il titolo HTML sparisce e lo disegni tu nel canvas
    cattura: false,          // true = resta sopra la cattura vera inclinata di prima (di solito no: mettila TU nella scena)
    fermo: 2.5,              // il tempo del fotogramma unico per chi ha prefers-reduced-motion
  }
}
```

`m` contiene: `g` (CanvasRenderingContext2D, già scalato per il dpr), `w`, `h` (px CSS, 16:9), `dpr`, `t` (secondi),
`su` (0→1 morbido col mouse sopra o col fuoco: la scena si «accende», accelera, rivela qualcosa), `chiave`,
`titolo`, `c1`, `c2`, `ink`, `font` (i colori e il carattere della copertina in `art` di config.js), `cattura`
(l'URL della cattura vera del progetto in funzione, se c'è, altrimenti null), `ridotto`, `fermo`, `kit`.

`frame` deve ridisegnare tutto (nessuno pulisce il canvas per te). Deve essere **deterministico rispetto a t**
quando possibile (stesso t → stessa immagine), oppure una simulazione che avanza con dt: il motore, per le foto
ferme, arriva al tempo voluto a passi di 1/60 s, quindi le simulazioni funzionano lo stesso.

## Gli attrezzi (`m.kit`, file `kit.js`)

`clamp lerp smooth fract TAU ciclo onda ease.{in,out,inOut,outBack,outElastic,outBounce} rng(seme) rumore(x,seme)`,
`img(src) imgForse(src) font(nome)`, `strato(w,h,dpr,fn) metti(g,c,x,y,w,h)` (strati fissi: le ombre sfocate e le
cose che non si muovono si disegnano una volta qui), `tondo con`, stile pzk: `PZK` (colori e nomi dei caratteri),
`CARTE`, `carta(tipo)` + `foglio(g,img,cx,cy,w,h,rot)` (i fogli veri col nastro di `/art/carta/`), `nastro`,
`scritta`, `evidenzia`, `timbro`, finiture: `granella vignetta righeCrt fondo`.

Caratteri del sito utilizzabili nel canvas (dopo `await kit.font(nome)`): Anton, Permanent Marker, Special Elite,
gg sans, gg mono, ABC Ginto Nord, Fake Receipt e i caratteri dei nomi di Discord: 8Bit, Headbang, Jellybean,
Journal, Mainframe, Medieval, Modern, Monkey Bars, Pricedown, Sakura, Tempo, Vampyre.

## Le regole

1. **Vera, non inventata.** pzkko ha già bocciato le copertine disegnate «finte» (vedi la regola delle anteprime
   vere): la miniatura deve raccontare l'app com'è davvero. Prima di disegnare **apri il codice dell'app** e usa i
   suoi pezzi veri: i suoi colori, le sue immagini (`public/art/…`, `public/games/<app>/…`, `public/telefono/…`),
   la sua meccanica (la sabbia cade come nell'automa vero, il plotter traccia le sue curve, la roulette ha i suoi
   numeri). Se esiste `m.cattura`, la cattura vera va **dentro la scena** (su uno schermo, una polaroid col nastro,
   un monitor…), animata intorno, non sostituita da un disegno.
2. **Bellissima, complessa, animata da dio.** Più piani (sfondo, scena, primo piano, luce), movimento continuo e
   morbido in un ciclo che non si nota (8–16 s), un evento «wow» ricorrente (un colpo, una vincita, un'esplosione,
   un rivelarsi), profondità (parallasse, ombre, luce), dettagli che premiano chi guarda da vicino, e col mouse
   sopra (`m.su`) qualcosa di più. Stile pzk dove ci sta (carta col nastro, Anton minuscolo, pennarello rosso,
   macchina da scrivere, evidenziatore giallo, timbri), ma rispettando l'identità della singola app (un LCD resta
   un LCD, un CRT resta un CRT).
3. **Il titolo.** Di base il titolo HTML (carattere della copertina) resta in alto a sinistra sopra il canvas:
   lascia leggibile la fascia in alto a sinistra (circa il 55% della larghezza e il 35% dell'altezza), o metti
   `titolo: false` e disegna tu un titolo più bello e animato, ma sempre con il nome esatto dell'app.
4. **Leggera.** Solo Canvas 2D (niente WebGL: ce ne sono 32 sulla stessa pagina). Un fotogramma sotto ~1,5 ms
   a 480×270. Niente `shadowBlur` o filtri in ogni fotogramma: mettili negli strati fissi. Niente `getImageData`
   a ogni fotogramma su tutto il canvas; per le simulazioni a pixel usa una griglia piccola (es. 96×54) disegnata
   con `putImageData` su un canvas piccolo e poi scalata con `imageSmoothingEnabled = false`.
5. **Deve funzionare a ogni misura**: la scheda (~360–480 px), la riga piccola (~160–240 px), il grande (~720 px)
   e il volantino 16:10. Tutto in proporzione a `m.w`/`m.h`.
6. **Niente rete esterna**, niente audio, niente fotocamera/microfono, nessun dato personale (niente nomi veri,
   email, telefoni, il paese dove vive, facce di amici). `npm run check` (guard.mjs) rifiuta anche il suo nome vero
   nei commenti. Commenti in italiano, brevi.
7. **File tuoi soltanto**: crei solo `public/assets/miniature/<chiave>.js` (ed eventuali immagini nuove in
   `public/assets/miniature/<chiave>/`). Non toccare `index.js`, `kit.js`, `miniature.css`, `app.js`, `site.css`, né i
   file delle app: altre sessioni li stanno modificando nello stesso momento. Se ti serve qualcosa nel kit, mettilo
   nel tuo modulo.

## Come provarla

- Foto di più fotogrammi: `node scripts/miniature-foto.mjs --solo synth --tempi 0.5,2,4,6,9 --larghezza 480 --out <file.png>`
  (aggiungi `--su 1` per lo stato col mouse sopra, `--larghezza 480,200` per vedere anche la misura piccola).
  Poi guarda la foto. Ogni cella è il fotogramma a quel tempo.
- Dal vivo: `node scripts/preview.mjs 5090` e poi `http://127.0.0.1:5090/miniature/?solo=synth`.
- Se la cella mostra la copertina vecchia (titolo e sfondo a gradiente senza la tua scena), il modulo si è rotto:
  guarda la console (es. con `--enable-logging=stderr` o aprendo la pagina dal vivo).
