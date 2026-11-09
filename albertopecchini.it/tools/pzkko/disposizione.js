// La disposizione del muro di pzkko.it (index.html), usata da disponi.mjs.
//
// Dal 6.11.2026 la saracinesca è alleggerita (Alberto: «togli tutti i volantini, rifai quelli social, mettili già in
// tutta la serranda anche se è vuota, sparsi a coordinate casuali senza che si sovrappongano più del 10%; in fondo lascia
// la petizione»): niente più pile. Ci sono tre modi di mettere un pezzo, tutto in unità della parete (1280 sul computer,
// 390 sotto i 900 px):
//
//   abs     dove si dice: { k, x, y, w, r }
//   fondo   attaccato al fondo della parete: { k, x, w, r, sotto } (sotto = quanto spazio resta sotto di lui: le penne
//           della petizione, appese allo spago, sporgono ~180 unità sul computer e ~130 sul telefono)
//   sparsi  a caso su tutta la parete: { k, w } (e r, se no la storta la decide il caso). Ogni pezzo ha il suo caso, dal
//           seme e dal suo nome: aggiungerne uno non sposta gli altri. Fra `prove` punti a caso prende quello più lontano
//           dagli altri pezzi (largo, ma non in fila), mai sopra un pezzo fisso (con `aria` intorno) e mai coperto più di
//           `copre` (0.1 = il 10% del pezzo più piccolo). Cambiando `seme` cambia tutta la sparsa.
//
// L'altezza della parete è `minimo` (serranda.mjs allunga --minimo=N; --telefono per il telefono). Le chiavi: '#id', il
// percorso dell'immagine sotto art/ senza .webp, o 'vol:' + il titolo del volantino. Le pile (`cols`, `rel`) ci sono
// ancora in disponi.mjs: le usa la storia (storia/disposizione.js).

const V = (k) => 'vol:' + k
export const DESK = {
  gap: -15,
  // manopole (serranda.mjs): spazio in cima e in fondo, altezza minima, passo delle pile, larghezza dei pezzi
  top: 0, bottom: 40, minimo: 3320, passo: 1, scala: 1,
  cols: [],
  abs: [
    // il wallet (avvitato) e il cercapersone (col nastro), in cima; il rivolo della condensa, dove cade la goccia
    { k: '#wallet-muro', x: 20, y: 0, w: 245, r: -2 },
    { k: '#cercapersone-muro', x: 297, y: 6, w: 185, r: 3 },
    { k: 'bestiole/rivolo', x: 1215, y: 0, w: 36, r: 0 },
  ],
  fondo: [
    // la petizione: in fondo, in mezzo, sopra tutto; sotto di lei solo le sue penne
    { k: '#petizione', x: 510, w: 260, r: -1, sotto: 230 },
  ],
  sparsi: {
    seme: 628, prove: 40, copre: 0.1, aria: 26, lato: 16, cima: 14,
    items: [
      { k: V('instagram'), w: 200 },
      { k: V('tiktok'), w: 195 },
      { k: V('github'), w: 205 },
      { k: V('whatsapp'), w: 215 },
      { k: V('e-mail'), w: 200 },
      { k: V('un caffè?'), w: 195 },
    ],
  },
}

export const MOB = {
  gap: -12,
  // manopole (serranda.mjs): spazio in cima e in fondo, altezza minima, passo delle pile, larghezza dei pezzi
  top: 0, bottom: 40, minimo: 3800, passo: 1, scala: 1,
  cols: [],
  abs: [
    { k: '#wallet-muro', x: 8, y: 0, w: 182, r: -2 },
    { k: '#cercapersone-muro', x: 218, y: 4, w: 150, r: 3 },
    { k: 'bestiole/rivolo', x: 352, y: 0, w: 22, r: 0 },
  ],
  fondo: [
    { k: '#petizione', x: 100, w: 190, r: -1, sotto: 170 },
  ],
  // tre volantini per riga: larghi ~118 su 390
  sparsi: {
    seme: 628, prove: 40, copre: 0.1, aria: 14, lato: 6, cima: 10,
    items: [
      { k: V('instagram'), w: 118 },
      { k: V('tiktok'), w: 118 },
      { k: V('github'), w: 120 },
      { k: V('whatsapp'), w: 122 },
      { k: V('e-mail'), w: 118 },
      { k: V('un caffè?'), w: 118 },
    ],
  },
}
