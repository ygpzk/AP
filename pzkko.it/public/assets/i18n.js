// pzkko.it: i testi. Italiano e inglese arrivano subito; le altre lingue si
// scaricano solo quando servono (un file per lingua in ./i18n/), così la prima
// visita non porta giù tutte e nove le traduzioni.

import it from './i18n/it.js'
import en from './i18n/en.js'

export const I18N = { it, en }
export const LINGUE = ['it', 'en', 'es', 'fr', 'de', 'pt', 'ru', 'ja', 'zh']

/** Carica la lingua richiesta (se non è già in memoria) e la restituisce. */
export async function caricaLingua(code) {
  if (!LINGUE.includes(code)) return null
  if (!I18N[code]) {
    const modulo = await import(`./i18n/${code}.js`)
    I18N[code] = modulo.default
  }
  return I18N[code]
}
