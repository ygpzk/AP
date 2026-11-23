// Diretta OS · le regolazioni di ogni sorgente, come il pannello «Regolazioni» di Camo: la trasformazione (rotazione,
// specchio) e l'immagine (opacità, luminosità, contrasto, saturazione, vividezza, tinta, temperatura, gamma, nitidezza,
// sfocatura, un filtro e un effetto). Un file solo per tutti: la regia ci costruisce i cursori, le pagine dei pezzi il
// filtro vero, il server ci controlla quello che salva (stato.regola: pezzo → { r, fx, fy, <chiave>: numero, si: [chiavi
// accese], filtro, effetto }). Un valore conta solo se la sua chiave è in «si»: spento, il cursore resta dov'era.

// [chiave, nome, minimo, massimo, passo, neutro, unità]
export const REGOLE = [
  ['op', 'Opacità', 0, 100, 1, 100, '%'],
  ['lum', 'Luminosità', -100, 100, 1, 0, '%'],
  ['con', 'Contrasto', -100, 100, 1, 0, '%'],
  ['sat', 'Saturazione', -100, 100, 1, 0, '%'],
  ['viv', 'Vividezza', -100, 100, 1, 0, '%'],
  ['tinta', 'Tinta', -180, 180, 1, 0, '°'],
  ['temp', 'Temperatura', -100, 100, 1, 0, ''],
  ['gamma', 'Gamma', 0.2, 3, 0.01, 1, ''],
  ['nit', 'Nitidezza', 0, 100, 1, 0, '%'],
  ['sfoca', 'Sfocatura', 0, 20, 0.5, 0, 'px'],
].map(([k, nome, min, max, passo, zero, u]) => ({ k, nome, min, max, passo, zero, u }))
export const FILTRI = [['', 'Nessuno'], ['mono', 'Monocromatico'], ['seppia', 'Seppia'], ['negativo', 'Negativo']]
export const EFFETTI = [['', 'Nessuno'], ['ombra', 'Ombra portata'], ['lime', 'Bagliore lime'], ['viola', 'Bagliore viola']]

const tra = (v, a, b) => Math.min(b, Math.max(a, v))
const n3 = (v) => +v.toFixed(3)

// quello che si può salvare (o null, se non c'è niente di diverso dal neutro)
export function pulisci(x) {
  if (!x || typeof x !== 'object') return null
  const R = {}
  if (Number.isFinite(x.r) && Math.abs(x.r) >= 0.05) R.r = tra(Math.round(x.r * 10) / 10, -180, 180)
  if (x.fx === true) R.fx = true
  if (x.fy === true) R.fy = true
  for (const g of REGOLE) {
    if (!Number.isFinite(x[g.k])) continue
    const v = tra(Math.round(x[g.k] / g.passo) * g.passo, g.min, g.max)
    if (Math.abs(v - g.zero) > 1e-9 || (Array.isArray(x.si) && x.si.includes(g.k))) R[g.k] = n3(v) // (acceso al neutro: resta acceso)
  }
  const si = Array.isArray(x.si) ? REGOLE.map((g) => g.k).filter((k) => x.si.includes(k) && k in R) : []
  if (si.length) R.si = si
  if (FILTRI.some(([k]) => k && k === x.filtro)) R.filtro = x.filtro
  if (EFFETTI.some(([k]) => k && k === x.effetto)) R.effetto = x.effetto
  return Object.keys(R).length ? R : null
}

// acceso (la leva nella regia), e acceso con un valore che cambia qualcosa (il disegno)
const ZERO = Object.fromEntries(REGOLE.map((g) => [g.k, g.zero]))
export const acceso = (R, k) => !!R && Array.isArray(R.si) && R.si.includes(k) && Number.isFinite(R[k])
export const vale = (R, k) => acceso(R, k) && Math.abs(R[k] - ZERO[k]) > 1e-9

const NIENTE = { giro: 0, specchio: '', op: null, filtro: '', svg: '' }
// Come si disegna: { giro (gradi), specchio ('-1 1'…), op (0…1 o null), filtro (il valore di «filter»), svg (i passi
// del filtro SVG «id», se servono: gamma, nitidezza, temperatura e vividezza non esistono come funzioni CSS) }
export function cssDi(R, id) {
  if (!R) return NIENTE
  const f = [], s = []
  if (vale(R, 'viv')) s.push(`<feColorMatrix type="saturate" values="${n3(Math.max(0, 1 + R.viv / 100 * 0.55))}"/>`) // (una saturazione dolce: la vividezza vera vorrebbe uno shader)
  if (vale(R, 'temp')) { const t = R.temp / 100; s.push(`<feColorMatrix type="matrix" values="${n3(1 + 0.22 * t)} 0 0 0 0  0 ${n3(1 + 0.04 * t)} 0 0 0  0 0 ${n3(1 - 0.26 * t)} 0 0  0 0 0 1 0"/>`) }
  if (vale(R, 'gamma')) { const e = n3(1 / R.gamma); s.push(`<feComponentTransfer><feFuncR type="gamma" exponent="${e}"/><feFuncG type="gamma" exponent="${e}"/><feFuncB type="gamma" exponent="${e}"/></feComponentTransfer>`) }
  if (vale(R, 'nit')) { const a = n3(R.nit / 100 * 1.2); s.push(`<feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 ${-a} 0 ${-a} ${n3(1 + 4 * a)} ${-a} 0 ${-a} 0"/>`) }
  if (s.length) f.push(`url(#${id})`)
  if (vale(R, 'lum')) f.push(`brightness(${n3(1 + R.lum / 100)})`)
  if (vale(R, 'con')) f.push(`contrast(${n3(1 + R.con / 100)})`)
  if (vale(R, 'sat')) f.push(`saturate(${n3(1 + R.sat / 100)})`)
  if (vale(R, 'tinta')) f.push(`hue-rotate(${R.tinta}deg)`)
  if (R.filtro === 'mono') f.push('grayscale(1)')
  else if (R.filtro === 'seppia') f.push('sepia(1)')
  else if (R.filtro === 'negativo') f.push('invert(1)')
  if (vale(R, 'sfoca')) f.push(`blur(${R.sfoca}px)`)
  if (R.effetto === 'ombra') f.push('drop-shadow(0 14px 16px rgba(0, 0, 0, .6))')
  else if (R.effetto === 'lime') f.push('drop-shadow(0 0 14px rgba(204, 255, 0, .85))')
  else if (R.effetto === 'viola') f.push('drop-shadow(0 0 14px rgba(157, 0, 255, .9))')
  return {
    giro: Number.isFinite(R.r) ? R.r : 0,
    specchio: R.fx || R.fy ? `${R.fx ? -1 : 1} ${R.fy ? -1 : 1}` : '',
    op: vale(R, 'op') ? n3(R.op / 100) : null,
    filtro: f.join(' '),
    svg: s.join(''),
  }
}
