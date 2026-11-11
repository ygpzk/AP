// La frase dell'informatore (11.11.2026, Alberto: «un informatore che dice che i sistemi vanno sempre connessi dal mio
// pc»): da quello che risponde /api/stato/ (pzkko/api/stato.mjs) a «● sistemi operativi · connessi dal pc di Alberto ·
// controllato 2 min fa». Un modulo solo per i due siti: lo usano pzkko/stato/informatore.js (pzkko.it, così com'è) e
// src/client/stato.js (albertopecchini.it, dentro la build di vite).

export const API = '/api/stato/'

// un controllo più vecchio di così non dice più com'è adesso: il pallino diventa grigio
const VECCHIO = 20 * 60_000

export function quando(agg, ora = Date.now()) {
  const s = Math.max(0, Math.round((ora - agg) / 1000))
  if (s < 60) return 'adesso'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min fa`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h fa`
  return new Date(agg).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

const elenco = (v) => (v.length < 2 ? v.join('') : `${v.slice(0, -1).join(', ')} e ${v[v.length - 1]}`)

/** → { tono: 'su'|'parziale'|'spento'|'ignoto', testo, titolo } */
export function frase(d, ora = Date.now()) {
  if (!d || !d.ok || typeof d.agg !== 'number') return { tono: 'ignoto', testo: 'stato dei sistemi: il controllo non risponde', titolo: '' }
  const visto = `controllato ${quando(d.agg, ora)}`
  const siti = Array.isArray(d.siti) ? d.siti : []
  const online = siti.filter((s) => s.su).length
  const titolo = [
    d.pc ? `pc di Alberto: ${d.pc.su ? `connesso (${d.pc.ms} ms)` : 'spento o scollegato'}` : '',
    d.banca ? `banca: ${d.banca.su ? 'aperta' : 'in pausa'}` : '',
    d.tempo ? `macchina del tempo: ${d.tempo.su ? 'accesa' : 'spenta'}` : '',
    ...siti.map((s) => `${s.nome}: ${s.su ? `${s.codice} · ${s.ms} ms` : s.codice ? `${s.codice}` : 'non risponde'}`),
  ].filter(Boolean).join('\n')
  if (ora - d.agg > VECCHIO) return { tono: 'ignoto', testo: `stato dei sistemi: ultimo controllo ${quando(d.agg, ora)}`, titolo }
  switch (d.stato) {
    case 'su':
      return { tono: 'su', testo: `sistemi operativi · connessi dal pc di Alberto · ${visto}`, titolo }
    case 'parziale':
      return { tono: 'parziale', testo: `connessi dal pc di Alberto, ma ${elenco(d.giu || [])} non ${(d.giu || []).length > 1 ? 'vanno' : 'va'} · ${visto}`, titolo }
    case 'pc-spento':
      return { tono: 'spento', testo: `il pc di Alberto è spento: banca in pausa${siti.length ? ` · siti online ${online}/${siti.length}` : ''} · ${visto}`, titolo }
    default:
      return { tono: 'ignoto', testo: 'stato dei sistemi: non lo so', titolo }
  }
}

export async function carica(url = API) {
  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

/**
 * Riempie gli elementi `[data-stato]`: il pallino (`.stato__punto`) e il testo (`.stato__testo`), con `data-tono` sul
 * contenitore per i colori. Niente animazioni: il testo si riscrive una volta al minuto («2 min fa» → «3 min fa») e il
 * controllo si richiede ogni 5 minuti, e solo con la scheda in vista.
 */
export function informa(radice = document, url = API) {
  const el = [...radice.querySelectorAll('[data-stato]')]
  if (!el.length) return
  let dati = null, preso = 0
  const scrivi = () => {
    const f = frase(dati)
    for (const e of el) {
      e.dataset.tono = f.tono
      const t = e.querySelector('.stato__testo') || e
      t.textContent = f.testo
      if (f.titolo) e.title = f.titolo
      e.dispatchEvent(new CustomEvent('stato', { detail: dati }))
    }
  }
  const prendi = async () => { preso = Date.now(); dati = await carica(url); scrivi() }
  prendi()
  setInterval(() => {
    if (document.hidden) return
    if (Date.now() - preso > 5 * 60_000) prendi()
    else scrivi()
  }, 60_000)
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - preso > 60_000) prendi() })
}
