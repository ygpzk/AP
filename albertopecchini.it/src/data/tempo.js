// La macchina del tempo (/tempo/): i siti e le loro versioni, una per giorno di lavoro.
// I manifesti stanno in src/data/tempo/<id>.js, GENERATI da tools/tempo/tempo.mjs (uno per
// sito, così i siti si ricostruiscono insieme senza pestarsi i piedi); qui solo l'ordine.
//
// Dal 26.11.2026 i siti pubblicati sono due: Rivalta sul Mincio è un progetto nascosto e il suo
// nome è il paese, quindi resta nel repository (tools/tempo/siti.mjs lo ricostruisce ancora) ma
// non va online (tools/privacy.mjs lo toglie anche da dist/).

import ap from './tempo/ap.js'
import cascina from './tempo/cascina.js'

export const siti = [ap, cascina].filter((s) => s.versioni.length)

// la home (src/templates/pages/home.js) racconta le versioni di albertopecchini.it
export const versioni = ap.versioni
export const aggiornato = siti.map((s) => s.aggiornato).sort().at(-1)
