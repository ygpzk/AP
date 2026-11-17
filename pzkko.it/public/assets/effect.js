// pzkko.it: l'effetto del profilo, rifatto da zero in SVG e CSS.
// Cristalli verdi che crescono sul bordo alto della scheda (e un po' sui fianchi)
// e, ogni tanto, una vampata: luce verde, bolle, scintille e una falce di luna.

const NS = 'http://www.w3.org/2000/svg'
const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

// Un cristallo: prisma esagonale visto di lato, punta in alto, base in (0,0).
function crystal(w, h, tone, id) {
  const sh = h * 0.74, mid = w * (0.08 + tone * 0.1)
  return `
    <path d="M${-w / 2} 0 L${-w / 2} ${-sh} L${mid} ${-h} L${mid} 0 Z" fill="url(#cL${id})"/>
    <path d="M${mid} 0 L${mid} ${-h} L${w / 2} ${-sh} L${w / 2} 0 Z" fill="url(#cR${id})"/>
    <path d="M${-w / 2} ${-sh} L${mid} ${-h} L${mid - w * 0.12} ${-sh * 0.98} Z" fill="#eaffd9" opacity=".55"/>
    <path d="M${-w * 0.32} ${-sh * 0.92} L${-w * 0.26} ${-h * 0.2}" stroke="#f4ffe9" stroke-width="${Math.max(1, w * 0.06)}" stroke-linecap="round" opacity=".55"/>
    <path d="M${-w / 2} 0 L${-w / 2} ${-sh} L${mid} ${-h} L${w / 2} ${-sh} L${w / 2} 0" fill="none" stroke="#0a6b2c" stroke-opacity=".35" stroke-width="1"/>`
}

function crystalsSvg(W) {
  const r = rand(4242)
  const base = 58 // dove sta il bordo alto della scheda, dentro l'SVG
  const items = []
  // il grappolo sul bordo alto: più fitto e più alto verso il centro-sinistra e a destra
  let x = -6
  while (x < W + 6) {
    const t = x / W
    const tall = 0.55 + 0.45 * Math.max(Math.exp(-((t - 0.32) ** 2) / 0.03), Math.exp(-((t - 0.86) ** 2) / 0.02), 0.35)
    const h = (28 + r() * 46) * tall + 10
    const w = 10 + r() * 16
    const a = (r() - 0.5) * 50
    items.push({ x, y: base + 6 + r() * 8, w, h, a, tone: r(), z: r() })
    if (r() < 0.55) items.push({ x: x + w * 0.4, y: base + 10, w: w * 0.6, h: h * (0.45 + r() * 0.3), a: a + (r() - 0.5) * 50, tone: r(), z: r() + 1 })
    x += w * (0.55 + r() * 0.5)
  }
  // i fianchi, in alto: puntano verso l'esterno
  for (let i = 0; i < 7; i++) {
    const y = base + 18 + i * 17 + r() * 8, w = 8 + r() * 10, h = (34 - i * 3.5) * (0.7 + r() * 0.5)
    items.push({ x: 6, y, w, h, a: -78 + (r() - 0.5) * 30, tone: r(), z: r() })
    items.push({ x: W - 6, y: y + 6, w, h: h * 0.9, a: 78 + (r() - 0.5) * 30, tone: r(), z: r() })
  }
  items.sort((p, q) => p.z - q.z)
  const defs = items.map((c, i) => {
    const l = 62 + c.tone * 20
    return `<linearGradient id="cL${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="hsl(${138 + c.tone * 12} 62% ${l - 26}%)" stop-opacity=".82"/><stop offset=".55" stop-color="hsl(${128 + c.tone * 10} 70% ${l + 2}%)" stop-opacity=".7"/><stop offset="1" stop-color="hsl(105 90% ${Math.min(94, l + 22)}%)" stop-opacity=".9"/></linearGradient>
      <linearGradient id="cR${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="hsl(${146 + c.tone * 10} 70% ${l - 40}%)" stop-opacity=".88"/><stop offset="1" stop-color="hsl(${128 + c.tone * 10} 64% ${l - 12}%)" stop-opacity=".78"/></linearGradient>`
  }).join('')
  const shapes = items.map((c, i) => `<g class="fx-crystal" style="--i:${i % 9}" transform="translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.a.toFixed(1)})">${crystal(c.w, c.h, c.tone, i)}</g>`).join('')
  const glints = Array.from({ length: 6 }, (_, i) => {
    const gx = 20 + r() * (W - 40), gy = base - 14 - r() * 40
    return `<path class="fx-glint" style="--g:${i}" transform="translate(${gx.toFixed(1)} ${gy.toFixed(1)})" d="M0 -7C1 -1 1 -1 7 0C1 1 1 1 0 7C-1 1 -1 1 -7 0C-1 -1 -1 -1 0 -7Z" fill="#f6ffe4"/>`
  }).join('')
  return `<svg xmlns="${NS}" viewBox="0 0 ${W} 200" width="${W}" height="200" aria-hidden="true"><defs>${defs}<filter id="cGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#cGlow)">${shapes}</g>${glints}</svg>`
}

function burstHtml() {
  const r = rand(777)
  const rings = Array.from({ length: 11 }, (_, i) => {
    const s = 26 + r() * 70
    return `<i class="fx-ring" style="left:${(r() * 92).toFixed(1)}%;top:${(4 + r() * 70).toFixed(1)}%;width:${s.toFixed(0)}px;height:${s.toFixed(0)}px;--d:${(r() * 0.9).toFixed(2)}s"></i>`
  }).join('')
  const sparks = Array.from({ length: 9 }, () => {
    const s = 10 + r() * 22
    return `<svg class="fx-spark" style="left:${(r() * 94).toFixed(1)}%;top:${(r() * 80).toFixed(1)}%;width:${s.toFixed(0)}px;height:${s.toFixed(0)}px;--d:${(0.2 + r() * 1.4).toFixed(2)}s" viewBox="-10 -10 20 20"><path d="M0 -10C1.4 -1.4 1.4 -1.4 10 0C1.4 1.4 1.4 1.4 0 10C-1.4 1.4 -1.4 1.4 -10 0C-1.4 -1.4 -1.4 -1.4 0 -10Z" fill="#fbffe8"/></svg>`
  }).join('')
  const moon = `<svg class="fx-moon" viewBox="0 0 100 100"><defs><radialGradient id="mG" cx=".35" cy=".4" r=".75"><stop offset="0" stop-color="#f3ff9a"/><stop offset=".6" stop-color="#c9ef00"/><stop offset="1" stop-color="#8fc400"/></radialGradient></defs><path d="M62 8A42 42 0 1 0 92 70A34 34 0 1 1 62 8Z" fill="url(#mG)"/></svg>`
  return `<div class="fx-wash"></div>${rings}${moon}${sparks}`
}

export function mountEffect(card) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = document.createElement('div')
  top.className = 'fx-crystals'
  const burst = document.createElement('div')
  burst.className = 'fx-burst'
  burst.innerHTML = burstHtml()
  card.prepend(top)
  card.appendChild(burst)

  let lastW = 0
  const draw = () => {
    const W = Math.round(card.getBoundingClientRect().width + 28)
    if (Math.abs(W - lastW) < 2) return
    lastW = W
    top.innerHTML = crystalsSvg(W)
  }
  draw()
  new ResizeObserver(draw).observe(card)

  let playing = false, last = 0
  const play = () => {
    if (reduce || playing || document.hidden) return
    playing = true
    last = Date.now()
    burst.classList.remove('is-on')
    void burst.offsetWidth
    burst.classList.add('is-on')
    setTimeout(() => { burst.classList.remove('is-on'); playing = false }, 3400)
  }
  setTimeout(play, 900)
  setInterval(() => { if (Date.now() - last > 13000) play() }, 14000)
  card.addEventListener('pointerenter', () => { if (Date.now() - last > 6000) play() })
  return { play }
}
