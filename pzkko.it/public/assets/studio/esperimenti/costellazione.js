// 05 · Costellazione. I progetti del sito come stelle: due progetti si tengono
// per mano quando condividono una tecnologia. Si trascinano, si esplorano e si
// aprono con un clic o con Invio. Tutto in Canvas 2D, senza librerie.
import { PROJECTS } from '../../config.js'
import { esc } from '../utils.js'

const T = {
  it: {
    nota: 'Ogni filo è una tecnologia in comune. Trascina le stelle, passa sopra per il nome, clic o Invio per aprire il progetto.',
    pronta: 'pronta',
    fili: (n, m) => `${n} progetti · ${m} fili`,
    apri: 'Apri',
  },
  en: {
    nota: 'Every thread is a shared technology. Drag the stars, hover for the name, click or press Enter to open the project.',
    pronta: 'ready',
    fili: (n, m) => `${n} projects · ${m} threads`,
    apri: 'Open',
  },
}
const t = (lang, k, ...a) => {
  const v = (T[lang] || T.en)[k] ?? T.en[k]
  return typeof v === 'function' ? v(...a) : v
}
const KIND = { it: { game: 'gioco', tool: 'programma', site: 'sito' }, en: { game: 'game', tool: 'tool', site: 'site' } }
const kind = (lang, k) => (KIND[lang] || KIND.en)[k] || k

export default {
  id: 'costellazione',
  titolo: { it: 'Costellazione', en: 'Constellation' },
  testo: {
    it: 'Tutti i progetti in una mappa: le stelle vicine condividono una tecnologia, i fili lo dicono. Si trascina, si guarda e si apre.',
    en: 'All projects on one map: nearby stars share a technology, the threads say which. Drag them, look around and open one.',
  },
  tecnologie: ['Canvas 2D', 'Force layout', 'Pointer Events'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-cost">
      <canvas class="lab-cost__tela" tabindex="0" role="application" aria-label="${esc(t(lang, 'nota'))}"></canvas>
      <div class="lab-cost__tip" hidden></div>
    </div><p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const canvas = el.querySelector('canvas')
    const tip = el.querySelector('.lab-cost__tip')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')

    const nodi = PROJECTS.map((p, i) => {
      const ang = (i / PROJECTS.length) * Math.PI * 2
      return {
        key: p.key, titolo: p.title, kind: p.kind,
        colore: p.art?.[0] || '#9d00ff',
        gioca: !!(p.play?.length),
        featured: !!p.featured,
        x: Math.cos(ang) * 160 + (i % 3) * 6, y: Math.sin(ang) * 160 + (i % 4) * 6,
        vx: 0, vy: 0, r: p.featured ? 8 : p.play?.length ? 6.5 : 5.5,
      }
    })
    const per = new Map()
    for (const p of PROJECTS) for (const [tag] of p.tags || []) {
      if (!per.has(tag)) per.set(tag, [])
      per.get(tag).push(p.key)
    }
    const archi = []
    for (const [tag, lista] of per) {
      for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
        const a = nodi.find((n) => n.key === lista[i]), b = nodi.find((n) => n.key === lista[j])
        if (!a || !b) continue
        const già = archi.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))
        if (già) { già.peso++; già.tag.push(tag) } else archi.push({ a, b, peso: 1, tag: [tag] })
      }
    }
    // qualche progetto resta isolato: lo si lega al più vicino per tipo, così la mappa non si sfalda
    for (const n of nodi) {
      if (archi.some((e) => e.a === n || e.b === n)) continue
      const vicino = nodi.filter((x) => x !== n).sort((a, b) => (a.kind === n.kind ? -1 : 1) - (b.kind === n.kind ? -1 : 1))[0]
      if (vicino) archi.push({ a: n, b: vicino, peso: 0.5, tag: ['stessa famiglia'] })
    }

    let W = 320, H = 300, raf = 0, caldo = 60, attivo = true, vivo = true
    let sopra = null, scelto = null, trascino = null, partenza = null, mosso = false
    let inchiostro = '#2e3035', tenue = 'rgba(0,0,0,.16)', accento = '#ccff00'
    let tema = 'light'

    function leggiTema() {
      const s = getComputedStyle(canvas) // il foglio dello Studio: inchiostro e matita sulla carta
      inchiostro = s.getPropertyValue('--text').trim() || '#2e3035'
      tenue = s.getPropertyValue('--line').trim() || 'rgba(0,0,0,.16)'
      accento = s.getPropertyValue('--p').trim() || '#ccff00'
      tema = document.documentElement.dataset.theme || 'light'
      disegna()
    }

    function misura() {
      const r = canvas.getBoundingClientRect()
      W = Math.max(220, r.width)
      H = Math.max(240, r.height)
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
        for (const n of nodi) { n.x *= W / 640; n.y *= H / 480 }
        caldo = Math.max(caldo, 30)
      }
      disegna()
    }

    const centro = () => ({ x: W / 2, y: H / 2 })
    function fisica() {
      const c = centro(), k = Math.min(W, H) / 640
      for (const n of nodi) {
        n.vx += (c.x - n.x) * 0.0012
        n.vy += (c.y - n.y) * 0.0012
      }
      for (let i = 0; i < nodi.length; i++) for (let j = i + 1; j < nodi.length; j++) {
        const a = nodi[i], b = nodi[j]
        let dx = b.x - a.x, dy = b.y - a.y
        let d2 = dx * dx + dy * dy
        if (d2 < 1) { dx = 0.5; dy = 0.5; d2 = 0.5 }
        const f = (5200 * k) / d2
        const d = Math.sqrt(d2)
        a.vx -= (dx / d) * f; a.vy -= (dy / d) * f
        b.vx += (dx / d) * f; b.vy += (dy / d) * f
      }
      for (const e of archi) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y
        const d = Math.max(1, Math.hypot(dx, dy))
        const riposo = 92 * k + (e.peso > 1 ? -6 : 0)
        const f = (d - riposo) * 0.008 * Math.min(2, e.peso)
        const ux = dx / d, uy = dy / d
        e.a.vx += ux * f; e.a.vy += uy * f
        e.b.vx -= ux * f; e.b.vy -= uy * f
      }
      for (const n of nodi) {
        if (n === trascino) continue
        n.vx *= 0.82; n.vy *= 0.82
        n.x += n.vx; n.y += n.vy
        n.x = Math.max(34, Math.min(W - 54, n.x))
        n.y = Math.max(28, Math.min(H - 28, n.y))
      }
    }

    function disegna() {
      const c = canvas.getContext('2d')
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, W, H)
      // i fili
      for (const e of archi) {
        const forte = sopra === e.a || sopra === e.b || scelto === e.a || scelto === e.b
        c.strokeStyle = forte ? accento : tenue
        c.globalAlpha = forte ? 0.85 : Math.min(0.4, 0.1 + e.peso * 0.08)
        c.lineWidth = forte ? 1.6 : 1
        c.beginPath(); c.moveTo(e.a.x, e.a.y); c.lineTo(e.b.x, e.b.y); c.stroke()
      }
      c.globalAlpha = 1
      // le stelle (prima tutte, poi le scritte: così nessuna finisce sotto un'altra stella)
      for (const n of nodi) {
        const forte = n === sopra || n === scelto
        const r = n.r + (forte ? 3 : 0)
        n._r = r
        c.beginPath(); c.arc(n.x, n.y, r + 4, 0, Math.PI * 2)
        c.fillStyle = n.colore; c.globalAlpha = forte ? 0.22 : 0.1; c.fill()
        c.beginPath(); c.arc(n.x, n.y, r, 0, Math.PI * 2)
        c.fillStyle = n.colore; c.globalAlpha = 1; c.fill()
        c.strokeStyle = forte ? inchiostro : 'rgba(255,255,255,.55)'
        c.lineWidth = forte ? 2 : 1; c.stroke()
        if (n === scelto) { c.beginPath(); c.arc(n.x, n.y, r + 8, 0, Math.PI * 2); c.strokeStyle = accento; c.lineWidth = 1.5; c.stroke() }
      }
      // le scritte: si prova a destra, a sinistra, sopra, sotto; se non c'è posto, si salta
      const occupati = []
      const prova = (x, y, w) => {
        if (x < 2 || y < 12 || x + w > W - 2 || y > H - 2) return false
        const r = { x: x - 2, y: y - 11, w: w + 4, h: 14 }
        return !occupati.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y)
      }
      const ordinati = [...nodi].sort((a, b) => Number(b === sopra || b === scelto) - Number(a === sopra || a === scelto))
      for (const n of ordinati) {
        const forte = n === sopra || n === scelto
        c.font = `400 ${forte ? 12.5 : 11.5}px "Special Elite", "Courier New", monospace`
        const w = c.measureText(n.titolo).width
        const r = n._r || 6
        const posti = [
          { x: n.x + r + 6, y: n.y + 4 },
          { x: n.x - r - 6 - w, y: n.y + 4 },
          { x: n.x - w / 2, y: n.y - r - 6 },
          { x: n.x - w / 2, y: n.y + r + 15 },
        ]
        let posto = posti.find((p) => prova(p.x, p.y, w))
        if (!posto && (forte || n.featured)) posto = posti.find((p) => p.x >= 2 && p.x + w <= W - 2) || posti[0]
        if (!posto) continue
        occupati.push({ x: posto.x - 2, y: posto.y - 11, w: w + 4, h: 14 })
        c.fillStyle = inchiostro
        c.globalAlpha = forte ? 1 : 0.76
        c.fillText(n.titolo, posto.x, posto.y)
        c.globalAlpha = 1
      }
    }
    function ciclo() {
      if (!vivo || !attivo || caldo <= 0) { raf = 0; return }
      fisica(); caldo--; disegna()
      raf = requestAnimationFrame(ciclo)
    }
    function scalda(n = 30) { caldo = Math.max(caldo, n); if (!raf) raf = requestAnimationFrame(ciclo) }

    const punto = (e) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
    }
    const trova = (p) => nodi.reduce((m, n) => {
      const d = Math.hypot(n.x - p.x, n.y - p.y)
      return d < n.r + 14 && d < m.d ? { n, d } : m
    }, { n: null, d: 30 }).n
    const mostraTip = (n) => {
      if (!n) { tip.hidden = true; return }
      const r = canvas.getBoundingClientRect(), cr = el.getBoundingClientRect()
      tip.hidden = false
      tip.innerHTML = `<b>${esc(n.titolo)}</b><span>${esc(kind(lang, n.kind))} · ${esc(t(lang, 'apri'))}</span>`
      tip.style.left = `${n.x / W * r.width + (r.left - cr.left) + 12}px`
      tip.style.top = `${n.y / H * r.height + (r.top - cr.top) - 10}px`
    }

    canvas.addEventListener('pointermove', (e) => {
      const p = punto(e)
      if (trascino) {
        trascino.x = p.x; trascino.y = p.y
        if (Math.hypot(p.x - partenza.x, p.y - partenza.y) > 4) mosso = true
        caldo = Math.max(caldo, 18)
        if (!raf) raf = requestAnimationFrame(ciclo)
        return
      }
      const n = trova(p)
      if (n !== sopra) { sopra = n; canvas.style.cursor = n ? 'pointer' : 'grab'; mostraTip(n); disegna() }
    })
    canvas.addEventListener('pointerleave', () => { if (!trascino) { sopra = null; tip.hidden = true; disegna() } })
    canvas.addEventListener('pointerdown', (e) => {
      const p = punto(e), n = trova(p)
      if (!n) return
      trascino = n; partenza = p; mosso = false
      canvas.setPointerCapture?.(e.pointerId)
      n.vx = n.vy = 0
      scalda(20)
    })
    canvas.addEventListener('pointerup', (e) => {
      const n = trascino
      trascino = null
      if (n && !mosso) { api.open(n.key); }
      try { canvas.releasePointerCapture?.(e.pointerId) } catch {}
      scalda(20)
    })
    canvas.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) return
      e.preventDefault()
      const i = scelto ? nodi.indexOf(scelto) : -1
      if (e.key === 'Enter' || e.key === ' ') { if (scelto) api.open(scelto.key); return }
      const salto = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      scelto = nodi[(i + salto + nodi.length) % nodi.length]
      sopra = scelto
      mostraTip(scelto)
      disegna()
    })
    canvas.addEventListener('focus', () => { if (!scelto) scelto = nodi[0]; sopra = scelto; disegna(); mostraTip(scelto) })
    canvas.addEventListener('blur', () => { scelto = null; sopra = null; tip.hidden = true; disegna() })

    const ro = new ResizeObserver(misura)
    ro.observe(canvas)
    const mo = new MutationObserver(() => leggiTema())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    api.quandoVisibile(el, (v) => { attivo = v; if (v && !raf) raf = requestAnimationFrame(ciclo); if (!v) { cancelAnimationFrame(raf); raf = 0 } })
    api.stato(stato, t(lang, 'fili', nodi.length, archi.length), 'ok')
    misura(); leggiTema(); scalda(220)

    return () => {
      vivo = false; cancelAnimationFrame(raf); raf = 0
      ro.disconnect(); mo.disconnect()
    }
  },
}
