// Le cose minute che servono a più di un esperimento.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export const ferma = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`
}

export const ora = (ts, lang = 'it') => new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
  timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(ts)

export const data = (ts, lang = 'it') => new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
  timeZone: 'Europe/Rome', day: '2-digit', month: 'short', year: 'numeric',
}).format(ts)

export const oggi = (lang = 'it') => new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
  timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long',
}).format(new Date())

export const notte = () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }).format(new Date()))
  return h < 7 || h >= 20
}

export const limita = (n, a, b) => Math.max(a, Math.min(b, n))

export const semi = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }

export function caso(seme) {
  let s = seme >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export const blobUrl = (blob) => URL.createObjectURL(blob)

export function scarica(blob, nome) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/** Un testo a più righe dentro una larghezza, per le tele. */
export function righe(ctx, testo, larghezza, massimo = 3) {
  const parole = String(testo || '').split(/\s+/).filter(Boolean)
  const out = []
  let riga = ''
  for (const parola of parole) {
    const prova = riga ? `${riga} ${parola}` : parola
    if (ctx.measureText(prova).width <= larghezza) riga = prova
    else { if (riga) out.push(riga); riga = parola; if (out.length === massimo - 1) break }
  }
  if (riga && out.length < massimo) out.push(riga)
  if (out.length === massimo && parole.join(' ').length > out.join(' ').length) out[massimo - 1] = out[massimo - 1].replace(/\s+\S*$/, '…')
  return out
}

/** Il canvas giusto per il rapporto del contenitore, con al massimo 2× di pixel. */
export function telaPronta(canvas, larghezza, altezza) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.round(larghezza * dpr)), h = Math.max(1, Math.round(altezza * dpr))
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}
