// I colori veri di una copertina (26.11.2026): si legge l'immagine dal ponte
// /api/vetrina/?img=, si riduce a 40 × 40, si raggruppano i pixel simili e si
// tengono i cinque colori più presenti e vivi. Niente servizi di terzi, niente
// immagini rimandate altrove: il risultato resta in memoria per un giorno.
const cache = new Map()
const GIORNO = 864e5
const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')

export const rgbDi = (hex) => {
  const s = String(hex || '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(s)) return [204, 255, 0]
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}
export const esa = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`
export const luminanza = (hex) => {
  const [r, g, b] = rgbDi(hex).map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const inchiostro = (hex) => (luminanza(hex) > 0.45 ? '#141018' : '#fffdf7')
export const mescola = (a, b, t) => esa(rgbDi(a).map((v, i) => v * (1 - t) + rgbDi(b)[i] * t))

async function bitmap(blob) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob)
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function tela(w, h) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

async function leggi(id) {
  const r = await fetch(`/api/vetrina/?img=${encodeURIComponent(id)}`, { cache: 'force-cache' })
  if (!r.ok) throw new Error(`copertina ${r.status}`)
  const bmp = await bitmap(await r.blob())
  const c = tela(40, 40)
  const x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(bmp, 0, 0, 40, 40)
  bmp.close?.()
  const d = x.getImageData(0, 0, 40, 40).data
  const gruppi = new Map()
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const k = `${r >> 5}-${g >> 5}-${b >> 5}`
    const o = gruppi.get(k) || { n: 0, r: 0, g: 0, b: 0 }
    o.n++; o.r += r; o.g += g; o.b += b
    gruppi.set(k, o)
  }
  const media = [...gruppi.values()].sort((a, b) => b.n - a.n).slice(0, 10).map((o) => [o.r / o.n, o.g / o.n, o.b / o.n])
  const vivezza = ([r, g, b]) => (Math.max(r, g, b) - Math.min(r, g, b)) * 0.8 + Math.max(r, g, b) * 0.2
  media.sort((a, b) => vivezza(b) - vivezza(a))
  return media.slice(0, 5).map(esa)
}

/** I cinque colori della copertina `id`, o `ripiego` se non c'è / non risponde. */
export async function palette(id, ripiego = ['#ccff00', '#9d00ff', '#5b2c7a', '#f5ffcc', '#2b1438']) {
  if (!id) return ripiego
  const vecchio = cache.get(id)
  if (vecchio && Date.now() - vecchio.t < GIORNO) return vecchio.p
  const p = leggi(id).catch(() => null)
  const out = (await p) || ripiego
  while (out.length < 4) out.push(ripiego[out.length % ripiego.length])
  cache.set(id, { p: out, t: Date.now() })
  return out
}
