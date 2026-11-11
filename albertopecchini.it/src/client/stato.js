// L'informatore dei sistemi nel piè di pagina (11.11.2026, Alberto: «crea in ap e in pzk da qualche parte un informatore
// che dice che i sistemi vanno sempre connessi dal mio pc»). La frase e il controllo sono quelli di pzkko
// (pzkko/stato/frase.js, un modulo solo per i due siti); il dato è /api/stato/, che su questo progetto Vercel, senza le
// variabili del server di casa, gira la domanda a pzkko.it (pzkko/api/stato.mjs).
import { informa } from '../../pzkko/stato/frase.js'

export function initStato() {
  informa()
}
