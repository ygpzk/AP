// Dove stanno le cose nella foto della macchinetta delle sigarette (art/deutschland/automat.webp sul muro, 900 px;
// automat-grande.webp nella pagina, 1028 px; finché non c'erano quelle vere, il segnaposto automat-segnaposto.svg), tutto
// in frazioni della foto (w, h sono le misure a 900 px):
//   `schermo`   i quattro angoli del display da in alto a sinistra in senso orario (ci si proietta sopra lo sprite delle
//               tappe sul muro e il display «PASSWORT» nella pagina, con l'omografia di telefono/zero/muro.js)
//   `vetrine`   le otto vetrinette [x, y, w, h], da sinistra; dentro ci sono già i nostri pacchetti (schermo.mjs li compone)
//   `tasti`     gli otto tasti numerati 1–8 [x, y, w, h], uno sotto ogni vetrinetta: la pagina ci mette sopra i tasti veri
//               (quello che manda la password, o la scelta del pacchetto)
//   `manopola`  (dal primo giro, quando la macchinetta aveva le manopole da tirare: centro e larghezza) oggi è il tasto in
//               mezzo alla fila, per chi ancora la legge; meglio usare `tasti`
// `schermo`, `vetrine` e `tasti` li riscrive tools/pzkko/deutschland/schermo.mjs angoli cercando il verde pieno (#00FF00)
// e il blu pieno (#0000FF) nella foto (i tasti stimati sotto le vetrinette, controllati a occhio su
// tools/pzkko/lavoro/deutschland/automat-rettangoli.png). (9.11.2026, rifatta la sera con la macchinetta di notte)
export default { w: 900, h: 1437, schermo: [[0.1119, 0.145], [0.8366, 0.1469], [0.8375, 0.5003], [0.1119, 0.4997]], vetrine: [[0.1274, 0.532, 0.0603, 0.1438], [0.2169, 0.532, 0.0603, 0.1444], [0.3074, 0.532, 0.0603, 0.1444], [0.3979, 0.5326, 0.0593, 0.1432], [0.4883, 0.5326, 0.0593, 0.1432], [0.5778, 0.5326, 0.0603, 0.1438], [0.6683, 0.5326, 0.0603, 0.1432], [0.7588, 0.5326, 0.0593, 0.1432]], tasti: [[0.1274, 0.7046, 0.0603, 0.0604], [0.2169, 0.7053, 0.0603, 0.0607], [0.3074, 0.7053, 0.0603, 0.0607], [0.3979, 0.7044, 0.0593, 0.0601], [0.4883, 0.7044, 0.0593, 0.0601], [0.5778, 0.7052, 0.0603, 0.0604], [0.6683, 0.7044, 0.0603, 0.0601], [0.7588, 0.7044, 0.0593, 0.0601]], manopola: { x: 0.518, y: 0.735, w: 0.06 } }
