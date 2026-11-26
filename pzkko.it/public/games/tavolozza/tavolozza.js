// TAVOLOZZA (26.11): un banco di colore serio. Lavora in OKLCH (lo spazio percettivo di CSS Color 4), genera armonie,
// controlla il contrasto WCAG e simula daltonismo con matrici sul RGB lineare. Serve a scegliere i colori di una grafica,
// non a decorare: i codici sono veri e si copiano.
//
//   apri()   apre il banco

import { creaFoglio, clamp, copia } from '/games/lab/lab.js'

const CHIAVE = 'pzkko-tavolozza'
const ARMONIE = [['analoga', 'analoga'], ['complementare', 'complementare'], ['triade', 'triade'], ['tetrade', 'tetrade'], ['mono', 'monocroma'], ['libera', 'libera']]
const DALTONISMO = [
  ['normale', 'normale', null],
  ['protanopia', 'protanopia', [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998]],
  ['deuteranopia', 'deuteranopia', [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881]],
  ['tritanopia', 'tritanopia', [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900]],
]
const S = { base: '#b3121f', armonia: 'analoga', cromia: 1, ruota: 0, daltonismo: 'normale' }
let dlg = null, el = {}
let colori = []

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp01 = (n) => Math.max(0, Math.min(1, n))
const rgbHex = (r, g, b) => `#${[r, g, b].map((x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0')).join('')}`
const hexRgb = (h) => {
  let s = String(h || '').replace('#', '').trim()
  if (s.length === 3) s = s.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(s)) return null
  return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255]
}
function rgbOklab([r, g, b]) {
  const R = lin(r), G = lin(g), B = lin(b)
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}
function oklabRgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  return [
    gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ]
}
function rgbOklch(rgb) {
  const lab = rgbOklab(rgb)
  const C = Math.hypot(lab.a, lab.b)
  const h = ((Math.atan2(lab.b, lab.a) * 180 / Math.PI) + 360) % 360
  return { L: lab.L, C, h }
}
function oklchRgb(L, C, h) {
  const r = h * Math.PI / 180
  return oklabRgb({ L, a: Math.cos(r) * C, b: Math.sin(r) * C })
}
const dentro = (rgb) => rgb.every((x) => x >= -0.0001 && x <= 1.0001)
function oklchHex(L, C, h) {
  let rgb = oklchRgb(L, C, h)
  if (!dentro(rgb)) {
    let lo = 0, hi = C
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2
      if (dentro(oklchRgb(L, mid, h))) lo = mid
      else hi = mid
    }
    rgb = oklchRgb(L, lo, h)
  }
  return rgbHex(...rgb.map(clamp01))
}
const oklchTesto = (L, C, h) => `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${h.toFixed(1)})`
const luminanza = (rgb) => {
  const [r, g, b] = rgb.map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrasto = (rgb, rgb2) => {
  const a = luminanza(rgb), b = luminanza(rgb2)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
const testoSu = (rgb) => (contrasto(rgb, [1, 1, 1]) >= contrasto(rgb, [0, 0, 0]) ? '#ffffff' : '#161616')

function simula(hex, matrice) {
  if (!matrice) return hex
  const rgb = hexRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb.map(lin)
  const nr = matrice[0] * r + matrice[1] * g + matrice[2] * b
  const ng = matrice[3] * r + matrice[4] * g + matrice[5] * b
  const nb = matrice[6] * r + matrice[7] * g + matrice[8] * b
  return rgbHex(gam(clamp01(nr)), gam(clamp01(ng)), gam(clamp01(nb)))
}

function genera() {
  const base = hexRgb(S.base)
  if (!base) return []
  const b = rgbOklch(base)
  const h = (b.h + S.ruota + 360) % 360
  const offset = {
    analoga: [0, -26, 26, -50, 50],
    complementare: [0, 180, 12, 192, -12],
    triade: [0, 120, 240, 20, 140],
    tetrade: [0, 90, 180, 270, 45],
    mono: [0, 0, 0, 0, 0],
    libera: [0, 0, 0, 0, 0],
  }[S.armonia] || [0, -26, 26, -50, 50]
  const luce = [0.2, 0.1, 0, -0.1, -0.2]
  return offset.map((off, i) => {
    const hue = S.armonia === 'libera' ? (h + Math.random() * 360) % 360 : (h + off + 360) % 360
    const L = clamp(b.L + luce[i], 0.16, 0.97)
    const C = clamp(b.C * S.cromia * (1 - Math.abs(luce[i]) * 0.55), 0, 0.37)
    const hex = oklchHex(L, C, hue)
    return { hex, L, C, h: hue, rgb: hexRgb(hex) || [0, 0, 0], testo: oklchTesto(L, C, hue) }
  })
}

function disegna() {
  if (!el.contenitore) return
  colori = genera()
  if (!colori.length) { el.contenitore.innerHTML = '<p class="lab-avviso">il colore di partenza non è valido: scrivi un esadecimale come #b3121f.</p>'; return }
  const matrice = DALTONISMO.find(([id]) => id === S.daltonismo)?.[2]
  el.contenitore.innerHTML = colori.map((c, i) => {
    const mostrato = simula(c.hex, matrice)
    const su = testoSu(hexRgb(mostrato) || c.rgb)
    const cw = contrasto(c.rgb, [1, 1, 1]), cb = contrasto(c.rgb, [0, 0, 0])
    const aa = cw >= 4.5 || cb >= 4.5
    const aaa = cw >= 7 || cb >= 7
    return `<button type="button" class="tv-sw" data-copia="${c.hex}" style="--c:${mostrato};--t:${su}" aria-label="copia ${c.hex}">
      <span class="tv-num">${String(i + 1).padStart(2, '0')}</span>
      <b>${c.hex.toUpperCase()}</b>
      <small>${c.testo}</small>
      <span class="tv-contr">bianco ${cw.toFixed(1)} · nero ${cb.toFixed(1)} · <em class="${aaa ? 'is-aaa' : aa ? 'is-aa' : ''}">${aaa ? 'AAA' : aa ? 'AA' : '—'}</em></span>
    </button>`
  }).join('')
  // la prova di stampa: un pezzo di interfaccia con i colori veri
  const [c1, c2, c3, c4, c5] = colori
  const t1 = testoSu(c1.rgb), t3 = testoSu(c3.rgb)
  const m = simula(c1.hex, matrice), m2 = simula(c2.hex, matrice), m3 = simula(c3.hex, matrice), m4 = simula(c4.hex, matrice), m5 = simula(c5.hex, matrice)
  el.prova.style.background = m
  el.prova.style.color = t1
  el.prova.innerHTML = `<span class="tv-kicker" style="color:${m2}">tavolozza · ${S.armonia}</span>
    <h3>prova di stampa</h3>
    <p>Questo è il colore che hai scelto, con le sue ombre e le sue luci. Il testo prende il colore che si legge meglio.</p>
    <div class="tv-tasti"><button type="button" style="background:${m3};color:${t3};border-color:${m3}" data-copia="${c3.hex}">tasto</button><button type="button" style="color:${t1};border-color:${t1}" data-copia="${c5.hex}">secondario</button><span style="color:${m4}">un'ombra</span></div>`
  el.stato.textContent = S.daltonismo === 'normale' ? 'colori veri' : `simulazione: ${S.daltonismo}`
}

function ricorda() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (!s || typeof s !== 'object') return
    if (hexRgb(s.base)) S.base = s.base
    if (ARMONIE.some(([a]) => a === s.armonia)) S.armonia = s.armonia
    if (Number.isFinite(s.cromia)) S.cromia = clamp(s.cromia, 0.2, 1.4)
    if (Number.isFinite(s.ruota)) S.ruota = clamp(s.ruota, -180, 180)
  } catch {}
}
function ricordaAdesso() { try { localStorage.setItem(CHIAVE, JSON.stringify(S)) } catch {} }

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
}

async function costruisci() {
  ricorda()
  const pannello = (t, c) => `<section class="lab-pannello">${t ? `<h3>${t}</h3>` : ''}${c}</section>`
  dlg = await creaFoglio({
    chiave: 'tavolozza',
    titolo: 'tavolozza',
    voce: 'colori veri, contrasti misurati, daltonismo simulato',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-pannello tv-comandi">
          <div class="lab-fila lab-fila--tra">
            <div class="lab-fila"><input class="tv-colore" type="color" data-colore value="${S.base}" aria-label="il colore di partenza"><input class="tv-hex" type="text" data-hex value="${S.base}" spellcheck="false" aria-label="il colore in esadecimale"><button type="button" class="lab-tasto" data-caso>a caso</button></div>
            <div class="lab-fila"><button type="button" class="lab-tasto" data-copia-css>copia le variabili</button><span class="lab-etichetta" data-stato>colori veri</span></div>
          </div>
        </div>
        <div class="tv-swatches" data-swatches></div>
        <div class="tv-prova" data-prova></div>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        ${pannello('armonia', `<div class="tv-armonie" role="group" aria-label="l'armonia">${ARMONIE.map(([a, n]) => `<button type="button" class="lab-tasto" data-armonia="${a}" aria-pressed="${S.armonia === a}">${n}</button>`).join('')}</div>`)}
        ${pannello('cromia e rotazione', `<label class="tv-riga">cromia<input class="lab-range" type="range" data-cromia min="0.2" max="1.4" step="0.01" value="${S.cromia}" aria-label="la cromia"><b class="lab-valore" data-cromia-val>${S.cromia.toFixed(2)}</b></label><label class="tv-riga">ruota<input class="lab-range" type="range" data-ruota min="-180" max="180" step="1" value="${S.ruota}" aria-label="la rotazione"><b class="lab-valore" data-ruota-val>${S.ruota}°</b></label>`)}
        ${pannello('daltonismo', `<div class="tv-daltonismo" role="group" aria-label="la simulazione">${DALTONISMO.map(([id, n]) => `<button type="button" class="lab-tasto" data-dalto="${id}" aria-pressed="${S.daltonismo === id}">${n}</button>`).join('')}</div><p class="lab-nota">Le matrici sono applicate al RGB lineare: è una simulazione, non un test clinico.</p>`)}
        ${pannello('come si legge', `<p class="lab-nota"><b>oklch(L C h)</b>: L è la luce (0…1), C la cromia (0 è grigio), h l'angolo del colore. Il contrasto è quello WCAG: <b>AA</b> da 4,5:1, <b>AAA</b> da 7:1. Il testo di ogni riquadro prende il bianco o il nero che si legge meglio.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    contenitore: q('[data-swatches]'), prova: q('[data-prova]'), stato: q('[data-stato]'), colore: q('[data-colore]'),
    hex: q('[data-hex]'), cromia: q('[data-cromia]'), ruota: q('[data-ruota]'),
  }
  const cromiaVal = q('[data-cromia-val]'), ruotaVal = q('[data-ruota-val]')
  const cambiaBase = (hex) => {
    const rgb = hexRgb(hex)
    if (!rgb) return false
    S.base = rgbHex(...rgb)
    el.colore.value = S.base
    el.hex.value = S.base
    ricordaAdesso()
    disegna()
    return true
  }
  el.colore.addEventListener('input', () => cambiaBase(el.colore.value))
  el.hex.addEventListener('input', () => {
    const rgb = hexRgb(el.hex.value.trim())
    if (!rgb) return
    S.base = rgbHex(...rgb)
    el.colore.value = S.base
    ricordaAdesso(); disegna()
  })
  el.cromia.addEventListener('input', () => { S.cromia = Number(el.cromia.value); cromiaVal.textContent = S.cromia.toFixed(2); ricordaAdesso(); disegna() })
  el.ruota.addEventListener('input', () => { S.ruota = Number(el.ruota.value); ruotaVal.textContent = `${S.ruota}°`; ricordaAdesso(); disegna() })
  dlg.corpo.addEventListener('click', (e) => {
    const ar = e.target.closest('[data-armonia]')
    if (ar) {
      S.armonia = ar.dataset.armonia
      for (const b of dlg.corpo.querySelectorAll('[data-armonia]')) b.setAttribute('aria-pressed', String(b === ar))
      ricordaAdesso(); disegna(); return
    }
    const da = e.target.closest('[data-dalto]')
    if (da) {
      S.daltonismo = da.dataset.dalto
      for (const b of dlg.corpo.querySelectorAll('[data-dalto]')) b.setAttribute('aria-pressed', String(b === da))
      disegna(); return
    }
    if (e.target.closest('[data-caso]')) {
      const h = Math.random() * 360, C = 0.14 + Math.random() * 0.16, L = 0.42 + Math.random() * 0.26
      return cambiaBase(oklchHex(L, C, h))
    }
    if (e.target.closest('[data-copia-css]')) {
      const css = `:root{\n${colori.map((c, i) => `  --colore-${i + 1}: ${c.hex};`).join('\n')}\n}`
      copia(css).then((ok) => dlg.voce(ok ? 'variabili CSS copiate' : 'non riesco a copiare', !ok))
      return
    }
    const copiabile = e.target.closest('[data-copia]')
    if (copiabile) {
      copia(copiabile.dataset.copia).then((ok) => dlg.voce(ok ? `${copiabile.dataset.copia} copiato` : 'non riesco a copiare', !ok))
    }
  })
  dlg.alChiudere(() => { dlg?.dlg.remove(); dlg = null })
  disegna()
}
