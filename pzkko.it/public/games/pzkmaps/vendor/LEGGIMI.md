# Leaflet 1.9.4

`leaflet.js`, `leaflet.css`, `leaflet.js.map`, `images/` e `LICENSE` sono la
distribuzione ufficiale di Leaflet 1.9.4, copiata qui da npm
(`npm pack leaflet@1.9.4`), senza modifiche.

Sta nel sito, e non su un CDN, perché la Content-Security-Policy di pzkko.it
ammette solo gli script della stessa origine: un CDN di terzi verrebbe
bloccato. Non aggiornare un file per volta: si riprende tutta la cartella
`dist/` del pacchetto nuovo, `LICENSE` compresa.

Leaflet è BSD-2-Clause, © Volodymyr Agafonkin e CloudMade; i dettagli in
`LICENSE`. Le mappe sono © OpenStreetMap, i crediti sono nella mappa stessa.
