// Diretta OS: i pezzi del pc. Ognuno è un pezzo a sé, col suo indirizzo (/o/cpu, /o/gpu, /o/ram, /o/ssd, /o/hdd, /o/temp,
// /o/wifi, /o/app): li monta pezzi.js come gli altri, i dati arrivano dal server (macchina.mjs) 5 volte al secondo.
// Ognuno ha il suo colore, il nome vero del componente (al massimo 20 caratteri), solo la percentuale, e non sta mai
// fermo: l'anello si riempie, la scintilla ci corre sopra, il disegno del componente si muove con quello che fa (i thread
// della cpu si accendono uno per uno, la ventola della scheda video gira con il carico, la ram si riempie come un
// bicchiere, il disco a piatti gira e la testina cerca), e sotto scorre la storia degli ultimi 12 secondi.
// Le app aperte stanno in un rettangolo fisso: più app, icone più piccole, stesso spazio. Il gioco ha il suo logo.
//
// Leggeri: ogni disegno è diviso in due. La parte ferma (il chip, il telaio, il vetro…) ha il contorno scuro e l'alone,
// che sono filtri cari: si disegna una volta sola. La parte che si muove (le celle, le pale, l'acqua…) sta sopra, in un
// livello suo, senza filtri: a ogni giro si ridisegna solo lei. La corona di tacche gira con un transform (la sposta la
// scheda video), e i bagliori dell'anello sono tratti larghi e trasparenti, non ombre sfocate. Tutto a 60 al secondo
// (giro.js), la storia a 30.

import { ogniGiro } from '/giro.js'

export const PC = ['quadro', 'app', 'cpu', 'gpu', 'ram', 'ssd', 'hdd', 'temp', 'wifi']
export const PC_NOMI = { quadro: 'Resoconto del mio PC', app: 'App aperte', cpu: 'Processore', gpu: 'Scheda video', ram: 'RAM', ssd: 'SSD', hdd: 'Disco a piatti', temp: 'Temperatura', wifi: 'Wi-Fi' }
export const PC_DICE = {
  quadro: 'il resoconto completo del PC a schede automatiche e manuali: la macchina, il processore, la scheda video, RAM e SSD, schermi, casse, TV, PC secondario, driver, date, cache, software e i sensori di adesso (/o/quadro)',
  app: 'le icone dei programmi aperti, il gioco col suo logo, in un rettangolo fisso (/o/app)',
  cpu: 'uso del processore, coi 20 thread che si accendono (/o/cpu)',
  gpu: 'uso della scheda video, con la ventola che gira (/o/gpu)',
  ram: 'memoria usata (/o/ram)',
  ssd: 'attività dell’SSD (/o/ssd)',
  hdd: 'attività del disco a piatti (/o/hdd)',
  temp: 'temperatura del processore; /o/temp?di=gpu quella della scheda video',
  wifi: 'velocità del wi-fi: uno speedtest al minuto, in mezzo oscilla (/o/wifi)',
}
// i posti: quattro a sinistra sotto i follower, tre a destra sotto le spie, le app in basso al centro. Accesi tutti
// insieme si stringono con gli altri pezzi: si spostano dalla regia (trascina, rotella)
const sx = (i) => [40, 290 + i * 122, .85], dx = (i) => [1490, 170 + i * 122, .85]
const POSTI_PC = { quadro: [1130, 250, .72], app: [600, 936, 1], cpu: sx(0), gpu: sx(1), ram: sx(2), ssd: sx(3), hdd: dx(0), temp: dx(1), wifi: dx(2) }
// a 0,5× la destra è piena (spie, freccia, meme): il quadro sta in alto a sinistra; a 1,0× sta a destra, sotto la freccia
export const PC_POSTI = { '05': { ...POSTI_PC, quadro: [40, 196, .68] }, 10: POSTI_PC }

// tutti colori diversi: [colore, il suo compagno più scuro per la sfumatura]
const COLORI = { cpu: ['#ccff00', '#5cd600'], gpu: ['#c77dff', '#8a00ff'], ram: ['#ff73fa', '#eb459e'], ssd: ['#05e8e0', '#0090ff'], hdd: ['#ffa033', '#ff5a00'], temp: ['#ff4d5e', '#c8001e'], wifi: ['#8f98ff', '#5865f2'] }

const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }
const S = '#0b090e' // il contorno scuro di tutto
const tra = (a, b, x) => Math.min(b, Math.max(a, x))
const verso = (da, a, dt, tau) => da + (a - da) * (1 - Math.exp(-dt / tau))
// scrive un attributo o uno stile solo se è cambiato (ogni scrittura fa ridisegnare)
const attr = (e, k, v) => { if (e.getAttribute(k) !== v) e.setAttribute(k, v) }
const stile = (e, k, v) => { const c = e.__s ?? (e.__s = {}); if (c[k] !== v) { c[k] = v; e.style[k] = v } }
// (come nelle scene: il pezzo conta solo se è acceso e la regia non è in «dal vivo»)
const attivoOra = (el) => !!el.closest('.pezzo')?.classList.contains('su') && !document.getElementById('scena')?.classList.contains('dal-vivo')

// ── i dati ──
let dati = {}, nomi = null, app = []
const pezzi = [] // { p, el, giro(dt, t) }

// ── l'anello: 270°, da in basso a sinistra a in basso a destra, lungo 100 (pathLength) ──
const CX = 70, R = 54
const punto = (f, r = R) => { const a = (135 + 270 * f) * Math.PI / 180; return [CX + r * Math.cos(a), CX + r * Math.sin(a)] }
const [ax, ay] = punto(0), [bx, by] = punto(1)
const ARCO = `M${ax.toFixed(2)} ${ay.toFixed(2)}A${R} ${R} 0 1 1 ${bx.toFixed(2)} ${by.toFixed(2)}`

// ── i disegni dei componenti (viewBox 64 × 64): [la parte ferma, la parte che si muove] ──
const ICONE = {
  cpu: () => [`<g class="ic-pin">${[0, 1, 2, 3].map((i) => { const k = 19 + i * 8.7; return `<path d="M${k} 4v8M${k} 52v8M4 ${k}h8M52 ${k}h8"/>` }).join('')}</g>
    <rect class="ic-corpo" x="11" y="11" width="42" height="42" rx="7"/>`, '<g class="ic-celle"></g>'],
  gpu: () => ['<circle class="ic-telaio" cx="32" cy="32" r="29"/>',
    `<g class="ic-scia"></g><g class="ic-pale">${Array.from({ length: 9 }, (_, i) => `<path transform="rotate(${i * 40} 32 32)" d="M32 32C33 24 38 15 47 10C49 15 45 25 32 32Z"/>`).join('')}</g>
    <circle class="ic-mozzo" cx="32" cy="32" r="8.5"/><circle class="ic-punto" cx="32" cy="32" r="3"/>`],
  ram: () => ['<rect class="ic-banco" x="11" y="6" width="17" height="52" rx="3"/><rect class="ic-banco" x="36" y="6" width="17" height="52" rx="3"/>',
    `<defs><clipPath id="ram-cl"><rect x="11" y="6" width="17" height="52" rx="3"/><rect x="36" y="6" width="17" height="52" rx="3"/></clipPath></defs>
    <g clip-path="url(#ram-cl)"><path class="ic-liquido dietro"/><path class="ic-liquido"/></g>
    <g class="ic-chip">${[0, 1, 2, 3].map((i) => `<rect x="14" y="${10 + i * 11}" width="11" height="7" rx="1.5"/><rect x="39" y="${10 + i * 11}" width="11" height="7" rx="1.5"/>`).join('')}</g>
    <g class="ic-tacca"><path d="M18 58v-4M46 58v-4"/></g><path class="ic-bordo" d="M11 9a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v46a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3zM36 9a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v46a3 3 0 0 1-3 3H39a3 3 0 0 1-3-3z"/>`],
  ssd: () => [`<rect class="ic-scheda" x="5" y="19" width="54" height="26" rx="4"/><g class="ic-denti">${Array.from({ length: 6 }, (_, i) => `<rect x="2" y="${22 + i * 3.6}" width="5" height="2.2" rx=".6"/>`).join('')}</g>
    <circle class="ic-vite" cx="56" cy="32" r="3.2"/><rect class="ic-nand" x="13" y="24" width="16" height="16" rx="2"/><rect class="ic-nand" x="33" y="24" width="16" height="16" rx="2"/>`,
  `<g class="ic-luci">${[13, 33].flatMap((x) => [0, 1, 2].flatMap((c) => [0, 1, 2].map((r) => `<rect x="${x + 2.4 + c * 4.2}" y="${26.4 + r * 4.2}" width="3" height="3" rx=".8"/>`))).join('')}</g><g class="ic-bit"></g>`],
  hdd: () => [`<defs><radialGradient id="hdd-pi" cx=".5" cy=".5" r=".5"><stop offset=".2" stop-color="#3a3442"/><stop offset=".7" stop-color="#5b5366"/><stop offset="1" stop-color="#2a2530"/></radialGradient></defs>
    <rect class="ic-cassa" x="4" y="4" width="56" height="56" rx="8"/><circle cx="28" cy="29" r="21" fill="url(#hdd-pi)" class="ic-piatto"/>`,
  `<defs><linearGradient id="hdd-lu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g class="ic-gira"><path d="M28 29L28 8A21 21 0 0 1 40 12Z" fill="url(#hdd-lu)"/><path d="M28 29L28 50A21 21 0 0 1 16 46Z" fill="url(#hdd-lu)" opacity=".6"/><circle cx="28" cy="29" r="14" class="ic-solco"/><circle cx="28" cy="29" r="8" class="ic-solco"/></g>
    <circle cx="28" cy="29" r="4" class="ic-perno"/><g class="ic-braccio"><path d="M52 52L30 18"/><circle cx="30" cy="18" r="2.6"/></g><circle cx="52" cy="52" r="4.5" class="ic-snodo"/><circle cx="12" cy="54" r="2.3" class="ic-led"/>`],
  temp: () => ['<path class="ic-vetro" d="M25 13a7 7 0 0 1 14 0v26.5a11 11 0 1 1-14 0z"/><g class="ic-righe"><path d="M39 16h4M39 22h4M39 28h4M39 34h4"/></g>',
    `<g class="ic-calore">${[0, 1].map((i) => `<g><path class="sotto" d="M${47 + i * 8} ${44 + i * 2}c-3-4 3-7 0-11s3-7 0-11"/><path d="M${47 + i * 8} ${44 + i * 2}c-3-4 3-7 0-11s3-7 0-11"/></g>`).join('')}</g>
    <rect class="ic-colonna" x="28.5" width="7" rx="3.5"/><circle class="ic-bolla" cx="32" cy="48" r="7.5"/>`],
  wifi: () => [`<g class="ic-archi-fondo">${[10, 19, 28].map((r) => { const a = punto0(r); return `<path d="M${a[0]} ${a[1]}A${r} ${r} 0 0 1 ${a[2]} ${a[3]}"/>` }).join('')}</g><circle class="ic-fonte" cx="32" cy="50" r="5"/>`,
    `<g class="ic-archi">${[10, 19, 28].map((r) => { const a = punto0(r); return `<path d="M${a[0]} ${a[1]}A${r} ${r} 0 0 1 ${a[2]} ${a[3]}"/>` }).join('')}</g><g class="ic-onde"></g>`],
}
function punto0(r) { // un arco del wi-fi, da -135° a -45° attorno a (32, 50)
  const a1 = -135 * Math.PI / 180, a2 = -45 * Math.PI / 180
  return [32 + r * Math.cos(a1), 50 + r * Math.sin(a1), 32 + r * Math.cos(a2), 50 + r * Math.sin(a2)].map((v) => v.toFixed(2))
}

// ── lo strumento: anello + disegno + numero + nome + storia ──
function strumento(p, unita = '%') {
  const [c1, c2] = COLORI[p]
  const tacche = Array.from({ length: 36 }, (_, i) => { const a = i * 10 * Math.PI / 180, r1 = i % 3 ? 64 : 62, r2 = 67; return `<path d="M${(70 + r1 * Math.cos(a)).toFixed(1)} ${(70 + r1 * Math.sin(a)).toFixed(1)}L${(70 + r2 * Math.cos(a)).toFixed(1)} ${(70 + r2 * Math.sin(a)).toFixed(1)}"/>` }).join('')
  const [fermo, vivo] = ICONE[p]()
  const el = $(`<div class="pc" data-pc="${p}" style="--c:${c1};--cb:${c2}">
    <div class="pc-anello">
      <div class="pc-tacche"><svg viewBox="0 0 140 140">${tacche}</svg></div>
      <div class="pc-ico"><svg class="pc-ico-fermo" viewBox="0 0 64 64">${fermo}</svg><svg class="pc-ico-vivo" viewBox="0 0 64 64">${vivo}</svg></div>
      <svg class="pc-quadrante" viewBox="0 0 140 140">
        <defs><linearGradient id="pc-g-${p}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>
        <path class="pc-fondo" d="${ARCO}" pathLength="100"/><path class="pc-pista" d="${ARCO}" pathLength="100"/>
        <path class="pc-alone largo" d="${ARCO}" pathLength="100"/><path class="pc-alone" d="${ARCO}" pathLength="100"/>
        <path class="pc-arco" d="${ARCO}" pathLength="100" stroke="url(#pc-g-${p})"/>
        <path class="pc-scintilla largo" d="${ARCO}" pathLength="100"/><path class="pc-scintilla" d="${ARCO}" pathLength="100"/>
        <path class="pc-picco sotto" d=""/><path class="pc-picco" d=""/>
        <circle class="pc-testa alone" r="11"/><circle class="pc-testa" r="6.5"/>
      </svg>
    </div>
    <div class="pc-testi">
      <div class="pc-num"><b>–</b><small>${unita}</small></div>
      <div class="pc-nome"><i></i><span>${PC_NOMI[p]}</span></div>
      <canvas class="pc-storia" width="280" height="50"></canvas>
    </div></div>`)
  const q = (s) => el.querySelector(s), qq = (s) => [...el.querySelectorAll(s)]
  const archi = qq('.pc-arco, .pc-alone'), scintille = qq('.pc-scintilla'), teste = qq('.pc-testa'), picchi = qq('.pc-picco'), alone = qq('.pc-alone')
  const num = q('.pc-num b'), nome = q('.pc-nome span')
  const tela = q('.pc-storia'), cx = tela.getContext('2d')
  const storia = [] // [t, f] f = 0…1
  let f = 0, scritto = null, alto = 0, altoAlle = 0, ultimaStoria = 0, storiaDisegnata = 0, caldoPrima = null, vuoto = false
  return {
    el, c1, c2,
    // f: dove sta l'anello (0…1); testo: il numero; t: il tempo che scorre
    disegna(dt, t, vuole, testo, caldo) {
      if (vuole == null) { if (!vuoto) { vuoto = true; el.classList.add('vuoto') } return }
      if (vuoto) { vuoto = false; el.classList.remove('vuoto') }
      f = verso(f, tra(0, 1, vuole), dt, .11)
      const da = `${(f * 100).toFixed(1)} 200`
      for (const a of archi) stile(a, 'strokeDasharray', da)
      // la scintilla corre dall'inizio alla testa, sempre
      const lungo = Math.max(f * 100, 6), pos = ((t * 38) % (lungo + 14)) - 7, off = (-tra(0, Math.max(0, f * 100 - 5), pos)).toFixed(1), si = f > .04 ? '1' : '0'
      for (const s of scintille) { stile(s, 'strokeDashoffset', off); stile(s, 'opacity', si) }
      // la testa batte (prima lo faceva un'animazione CSS dentro l'SVG, che si ridisegnava 164 volte al secondo)
      const [hx, hy] = punto(f), batte = 1 + .3 * Math.max(0, Math.sin(t * Math.PI * 2 / 1.1)) ** 2
      teste.forEach((c, i) => { attr(c, 'cx', hx.toFixed(1)); attr(c, 'cy', hy.toFixed(1)); attr(c, 'r', ((i ? 6.5 : 11) * batte).toFixed(1)) })
      // il picco degli ultimi 4 secondi, poi scende piano
      if (vuole >= alto || t - altoAlle > 4) { if (vuole >= alto) { alto = vuole; altoAlle = t } else alto = Math.max(vuole, alto - dt * .25) }
      const [p1x, p1y] = punto(tra(0, 1, alto), R - 9), [p2x, p2y] = punto(tra(0, 1, alto), R + 9)
      const dp = `M${p1x.toFixed(1)} ${p1y.toFixed(1)}L${p2x.toFixed(1)} ${p2y.toFixed(1)}`, op = alto - f > .03 ? '1' : '0'
      for (const c of picchi) { attr(c, 'd', dp); stile(c, 'opacity', op) }
      if (testo !== scritto) { scritto = testo; num.textContent = testo }
      if (caldo !== caldoPrima) { caldoPrima = caldo; el.classList.toggle('caldo', !!caldo) }
      // sopra il 90% l'alone pulsa forte (a mano, non con un filtro animato)
      if (caldo) { const k = .5 + .5 * Math.sin(t * Math.PI * 2); stile(alone[0], 'strokeOpacity', (.18 + .3 * k).toFixed(2)); stile(alone[1], 'strokeOpacity', (.35 + .4 * k).toFixed(2)) }
      else for (const a of alone) stile(a, 'strokeOpacity', '')
      // la storia: un punto ogni 200 ms, scorre di continuo verso sinistra (si ridisegna 30 volte al secondo)
      if (t - ultimaStoria > .2) { ultimaStoria = t; storia.push([t, tra(0, 1, vuole)]); while (storia.length && t - storia[0][0] > 13) storia.shift() }
      if (t - storiaDisegnata >= 1 / 31) { storiaDisegnata = t; if (!el.closest('.qd') && !el.closest('.pr-mini-cella')) storiaDisegna(t) }
    },
    nome(n) { if (n && nome.textContent !== n) nome.textContent = n },
  }
  function storiaDisegna(t) {
    const W = tela.width, H = tela.height, span = 12, x = (tt) => W - 4 - (t - tt) / span * (W - 8), y = (v) => H - 5 - v * (H - 10)
    cx.clearRect(0, 0, W, H)
    if (storia.length < 2) return
    const g = cx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, c1 + '70'); g.addColorStop(1, c1 + '00')
    cx.beginPath(); cx.moveTo(x(storia[0][0]), H)
    for (const [tt, v] of storia) cx.lineTo(x(tt), y(v))
    cx.lineTo(x(storia.at(-1)[0]), y(f)); cx.lineTo(W - 4, y(f)); cx.lineTo(W - 4, H); cx.closePath()
    cx.fillStyle = g; cx.fill()
    const linea = () => { cx.beginPath(); storia.forEach(([tt, v], i) => (i ? cx.lineTo(x(tt), y(v)) : cx.moveTo(x(tt), y(v)))); cx.lineTo(W - 4, y(f)) }
    cx.lineJoin = cx.lineCap = 'round'
    linea(); cx.strokeStyle = S; cx.lineWidth = 6.5; cx.stroke()
    linea(); cx.strokeStyle = c1; cx.lineWidth = 3; cx.stroke()
    // il pallino che scrive, in fondo a destra
    cx.beginPath(); cx.arc(W - 4, y(f), 3.6, 0, 7); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = S; cx.stroke()
  }
}

const pct = (v) => v == null ? '–' : String(Math.round(v))

// ── ogni pezzo: da dove prende il numero e come muove il suo disegno ──
function creaCpu() {
  const s = strumento('cpu'), celle = s.el.querySelector('.ic-celle')
  let fili = [], acceso = []
  return { s, giro(dt, t) {
    const v = dati.cpu
    // i thread: tanti quanti ne ha il processore, in una griglia dentro il chip, ognuno acceso quanto lavora
    const n = dati.fili?.length ?? 0
    if (n && n !== fili.length) {
      const col = Math.ceil(Math.sqrt(n)), righe = Math.ceil(n / col), lato = 32 / Math.max(col, righe), g = lato * .22
      celle.innerHTML = Array.from({ length: n }, (_, i) => `<rect x="${(16 + (i % col) * lato + g / 2).toFixed(2)}" y="${(16 + Math.floor(i / col) * lato + g / 2 + (32 - righe * lato) / 2).toFixed(2)}" width="${(lato - g).toFixed(2)}" height="${(lato - g).toFixed(2)}" rx="1.2"/>`).join('')
      fili = [...celle.children]; acceso = fili.map(() => 0)
    }
    fili.forEach((c, i) => {
      acceso[i] = verso(acceso[i], (dati.fili[i] ?? 0) / 100, dt, .09)
      const a = acceso[i], scintilla = .06 * (.5 + .5 * Math.sin(t * 6 + i * 2.1)) // un filo di vita anche a riposo
      stile(c, 'opacity', (.16 + .84 * Math.min(1, a + scintilla)).toFixed(2))
      stile(c, 'fill', a > .85 ? '#fff' : '')
    })
    s.disegna(dt, t, v == null ? null : v / 100, pct(v), v >= 90)
  } }
}
function creaGpu() {
  const s = strumento('gpu'), pale = s.el.querySelector('.ic-pale'), scia = s.el.querySelector('.ic-scia')
  scia.innerHTML = pale.innerHTML
  let ang = 0, vel = 90
  return { s, giro(dt, t) {
    const g = dati.gpu, v = g?.uso
    // la ventola gira col carico (mai ferma: a riposo gira piano)
    vel = verso(vel, 80 + (v ?? 0) * 9, dt, .35)
    ang = (ang + vel * dt) % 360
    attr(pale, 'transform', `rotate(${ang.toFixed(1)} 32 32)`)
    attr(scia, 'transform', `rotate(${(ang - Math.min(26, vel / 28)).toFixed(1)} 32 32)`)
    stile(scia, 'opacity', tra(0, .45, (vel - 200) / 600).toFixed(2))
    s.disegna(dt, t, v == null ? null : v / 100, pct(v), v >= 95)
  } }
}
function creaRam() {
  const s = strumento('ram'), [dietro, davanti] = s.el.querySelectorAll('.ic-liquido')
  let liv = 0
  const onda = (y, t, fase, amp) => { let d = `M8 ${y.toFixed(1)}`; for (let x = 8; x <= 56; x += 3) d += `L${x} ${(y + Math.sin(x * .32 + t * 3.2 + fase) * amp).toFixed(1)}`; return d + 'L56 64L8 64Z' }
  return { s, giro(dt, t) {
    const v = dati.ram
    liv = verso(liv, (v ?? 0) / 100, dt, .25)
    const y = 58 - 52 * liv
    attr(dietro, 'd', onda(y - 1, t, 2.2, 1.8)); attr(davanti, 'd', onda(y, t * 1.25, 0, 1.6))
    s.disegna(dt, t, v == null ? null : v / 100, pct(v), v >= 90)
  } }
}
function creaDisco(p) {
  const s = strumento(p)
  const luci = [...s.el.querySelectorAll('.ic-luci rect')], bit = s.el.querySelector('.ic-bit')
  const braccio = s.el.querySelector('.ic-braccio'), gira = s.el.querySelector('.ic-gira'), led = s.el.querySelector('.ic-led')
  let att = 0, ang = 0, bersaglio = 0, testina = 0, cerca = 0, lampo = 0
  const punti = [], accese = luci.map(() => -9)
  return { s, giro(dt, t) {
    const n = nomi?.dischi?.[p], v = n == null ? null : dati.dischi?.[n]
    att = verso(att, (v ?? 0) / 100, dt, .12)
    if (p === 'ssd') {
      // le celle della nand si accendono a caso, tanto più spesso quanto lavora; e i bit corrono sulla scheda
      luci.forEach((l, i) => { if (Math.random() < dt * (1.2 + att * 40)) accese[i] = t; stile(l, 'opacity', (.18 + .82 * Math.max(0, 1 - (t - accese[i]) / .35)).toFixed(2)) })
      if (Math.random() < dt * (2.5 + att * 30) && punti.length < 14) { const b = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); b.setAttribute('r', '1.6'); bit.append(b); punti.push({ b, x: 6, y: 21 + Math.random() * 22, v: 30 + Math.random() * 30 + att * 120 }) }
      for (let i = punti.length - 1; i >= 0; i--) { const q = punti[i]; q.x += q.v * dt; if (q.x > 58) { q.b.remove(); punti.splice(i, 1) } else { q.b.setAttribute('cx', q.x.toFixed(1)); q.b.setAttribute('cy', q.y.toFixed(1)) } }
    } else {
      // il piatto gira sempre (7200 giri, più o meno); la testina cerca quando il disco lavora, se no torna a riposo
      ang = (ang + dt * 420) % 360
      attr(gira, 'transform', `rotate(${ang.toFixed(1)} 28 29)`)
      cerca -= dt
      if (cerca <= 0) { cerca = att > .02 ? .08 + Math.random() * (.5 - att * .4) : 1.2 + Math.random() * 2; bersaglio = att > .02 ? Math.random() : .15 * Math.random() }
      testina = verso(testina, bersaglio, dt, att > .02 ? .05 : .4)
      attr(braccio, 'transform', `rotate(${(-6 + testina * 34).toFixed(1)} 52 52)`)
      if (Math.random() < dt * att * 25) lampo = t
      stile(led, 'opacity', (.25 + .75 * Math.max(0, 1 - (t - lampo) / .12)).toFixed(2))
    }
    s.disegna(dt, t, v == null ? null : v / 100, pct(v), v >= 90)
  } }
}
function creaTemp(Q) {
  const di = Q.get('di') === 'gpu' ? 'gpu' : 'cpu'
  const s = strumento('temp', '°C'), colonna = s.el.querySelector('.ic-colonna'), calore = s.el.querySelector('.ic-calore'), fili = [...calore.children]
  let liv = 0, fase = 0
  return { s, giro(dt, t) {
    // il processore (la zona termica di Windows); se non c'è, la scheda video
    const da = di === 'gpu' || dati.temp == null ? 'gpu' : 'cpu', v = da === 'gpu' ? dati.gpu?.temp : dati.temp
    s.nome(da === 'gpu' ? nomi?.gpu : nomi?.cpu)
    const f = v == null ? 0 : tra(0, 1, (v - 20) / 80)
    liv = verso(liv, f, dt, .3)
    const cima = 44 - 34 * liv + Math.sin(t * 4.5) * .7
    attr(colonna, 'y', cima.toFixed(1)); attr(colonna, 'height', (50 - cima).toFixed(1))
    // il calore che sale: più caldo, più svelto; ogni filo parte da sotto, sale e sparisce
    fase += dt / Math.max(.6, 1.6 - liv)
    const forte = .15 + .85 * tra(0, 1, (v - 45) / 40)
    fili.forEach((g, i) => { const k = (fase + i * .5) % 1; attr(g, 'transform', `translate(0 ${(6 - 14 * k).toFixed(1)})`); stile(g, 'opacity', (forte * Math.min(1, k / .3) * (1 - k)).toFixed(2)) })
    s.disegna(dt, t, v == null ? null : f, v == null ? '–' : String(Math.round(v)), v >= 85)
  } }
}
function creaWifi() {
  const s = strumento('wifi', 'Mbps'), archi = [...s.el.querySelectorAll('.ic-archi path')], onde = s.el.querySelector('.ic-onde')
  let mostra = null, scritto = 0, testo = '–', fase = 0, ultimaOnda = 0
  const vive = [] // le onde che partono dalla fonte: { e, t0, dura }
  return { s, giro(dt, t) {
    const w = dati.wifi
    let v = null
    if (w) {
      // il numero finto: parte dalla misura di prima e scivola piano verso l'ultima, oscillando un po' attorno
      mostra ??= w.prima ?? w.mbps
      mostra = verso(mostra, w.mbps, dt, 14)
      const osc = .022 * Math.sin(t * .83) + .014 * Math.sin(t * 2.17 + 1.7) + .008 * Math.sin(t * 5.3 + .4)
      v = Math.max(0, mostra * (1 + osc))
      if (t - scritto > .16) { scritto = t; testo = v < 10 ? v.toFixed(1).replace('.', ',') : String(Math.round(v)) }
    }
    // le onde partono dalla fonte, tanto più svelte quanto è veloce
    const vel = .55 + (v ? Math.log10(1 + v) * .5 : 0)
    fase += dt * vel
    archi.forEach((a, i) => { const k = Math.max(0, Math.sin((fase - i * .22) * Math.PI * 2)); stile(a, 'opacity', (.35 + .65 * k).toFixed(2)) })
    if (v && t - ultimaOnda > 1 / vel) {
      ultimaOnda = t
      const o = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      o.setAttribute('d', 'M17.86 35.86A20 20 0 0 1 46.14 35.86'); onde.append(o)
      vive.push({ e: o, t0: t, dura: 1.6 / vel })
    }
    for (let i = vive.length - 1; i >= 0; i--) {
      const o = vive[i], k = (t - o.t0) / o.dura
      if (k >= 1) { o.e.remove(); vive.splice(i, 1); continue }
      const e = 1 - (1 - k) ** 3, sc = .35 + 1.4 * e
      o.e.setAttribute('transform', `translate(32 50) scale(${sc.toFixed(3)}) translate(-32 -50)`); o.e.style.opacity = (.95 * (1 - e)).toFixed(2)
    }
    // l'anello: scala logaritmica fino a 1000 Mbps (300 Mbps ≈ 83%)
    s.disegna(dt, t, v == null ? null : Math.log10(1 + v) / 3, testo, false)
  } }
}

// ── le app aperte: un rettangolo fisso, le icone si stringono per starci tutte ──
// (l'onda che le fa ondeggiare è un'animazione CSS, che la scheda video fa da sola: niente lavoro qui a ogni giro)
function creaApp(Q) {
  const W = +Q.get('w') || 720, H = +Q.get('h') || 132
  const el = $(`<div class="ap-rett" style="width:${W}px;height:${H}px"><div class="ap-eroe"><div class="ap-logo"></div><div class="ap-gioca"><span class="app">IN GIOCO</span><b class="ap-tempo"></b></div></div><div class="ap-icone"></div></div>`)
  const eroe = el.querySelector('.ap-eroe'), logo = el.querySelector('.ap-logo'), icone = el.querySelector('.ap-icone'), tempo = el.querySelector('.ap-tempo')
  const tessere = new Map() // id → { el, i }
  let gioco = null, logoDi = null
  function ritaglia(src, w, h) {
    // il logo di Steam ha tanto vuoto attorno: si taglia dove finisce il trasparente, poi ci sta tutto nel suo spazio
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1
      for (let y = 0; y < c.height; y++) for (let k = 0; k < c.width; k++) if (d[(y * c.width + k) * 4 + 3] > 16) { if (k < x0) x0 = k; if (k > x1) x1 = k; if (y < y0) y0 = y; if (y > y1) y1 = y }
      c.width = c.height = 0 // (la tela grande non serve più)
      if (x1 < 0) return
      const lw = x1 - x0 + 1, lh = y1 - y0 + 1, sc = Math.min(w / lw, h / lh)
      const out = document.createElement('canvas'); out.width = Math.round(lw * sc); out.height = Math.round(lh * sc)
      const o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(img, x0, y0, lw, lh, 0, 0, out.width, out.height)
      logo.replaceChildren(out)
    }
    img.src = src
  }
  function disponi() {
    const giochi = app.filter((a) => a.gioco)
    gioco = giochi.find((a) => a.fg) ?? giochi[0] ?? null
    const lista = app.filter((a) => a !== gioco)
    // il gioco prende la sua parte a sinistra; le altre app si dividono il resto
    const EW = gioco ? Math.round(Math.min(W * .46, H * 3.4)) : 0, X0 = gioco ? EW + Math.round(H * .14) : 0
    el.classList.toggle('con-gioco', !!gioco)
    eroe.style.width = `${EW}px`
    if (gioco) {
      const chiave = gioco.gioco.logo ?? gioco.icona
      if (chiave !== logoDi) {
        logoDi = chiave
        if (gioco.gioco.logo) ritaglia(gioco.gioco.logo, EW - 10, H - 40)
        else { // (un gioco senza logo di Steam: l'icona grande e il nome)
          logo.innerHTML = `<div class="ap-senza">${gioco.icona ? `<img src="${gioco.icona}" alt="">` : ''}<b></b></div>`
          logo.querySelector('b').textContent = gioco.gioco.titolo ?? gioco.nome
        }
      }
    } else logoDi = null
    const n = lista.length, AW = W - X0, gap = .16
    let m = { s: 0, r: 1, c: 1 }
    for (let r = 1; r <= Math.max(1, n); r++) {
      const c = Math.ceil(n / r), s = Math.min(AW / (c + (c - 1) * gap), H / (r + (r - 1) * gap))
      if (s > m.s) m = { s, r, c }
    }
    const s = Math.floor(m.s), g = s * gap, alto = (H - (m.r * s + (m.r - 1) * g)) / 2
    const vive = new Set()
    lista.forEach((a, i) => {
      vive.add(a.id)
      let tl = tessere.get(a.id)
      if (!tl) {
        const e = $(`<div class="ap entra"><div class="ap-in"><div class="ap-su"><img alt=""><i class="ap-stato"></i></div></div></div>`)
        icone.append(e); tl = { el: e }; tessere.set(a.id, tl)
        requestAnimationFrame(() => requestAnimationFrame(() => e.classList.remove('entra')))
      }
      const riga = Math.floor(i / m.c), inRiga = Math.min(m.c, n - riga * m.c), largo = inRiga * s + (inRiga - 1) * g
      const x = X0 + (AW - largo) / 2 + (i - riga * m.c) * (s + g), y = alto + riga * (s + g)
      Object.assign(tl.el.style, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`, width: `${s}px`, height: `${s}px` })
      if (tl.i !== i) { tl.i = i; tl.el.style.setProperty('--i', i) }
      const img = tl.el.querySelector('img')
      if (a.icona && img.getAttribute('src') !== a.icona) img.src = a.icona
      tl.el.classList.toggle('fg', !!a.fg); tl.el.classList.toggle('giu', !!a.giu)
    })
    for (const [id, tl] of tessere) if (!vive.has(id)) { tessere.delete(id); tl.el.classList.add('esce'); setTimeout(() => tl.el.remove(), 600) }
  }
  const due = (n) => String(n).padStart(2, '0')
  return { s: { el }, disponi, giro() {
    if (gioco) {
      const s = Math.max(0, Math.floor((Date.now() - gioco.da) / 1000)), h = Math.floor(s / 3600)
      const txt = h ? `${h}:${due(Math.floor(s / 60) % 60)}:${due(s % 60)}` : `${Math.floor(s / 60)}:${due(s % 60)}`
      if (tempo.textContent !== txt) tempo.textContent = txt
    }
  } }
}

// ── il resoconto del PC: una tavola sola, a schede automatiche e manuali, con i dati veri di questa macchina ──
// (non è un disegno: legge i componenti da macchina-info.ps1, i sensori da macchina.mjs e le foto prodotto da
//  pubblico/scene/pc; se i dati non sono ancora arrivati, mostra la fotografia del PC con i valori di ripiego)
const RIPIEGO = {
  adesso: '2026-11-23T16:00:00',
  avvio: '2026-11-23T10:35:48',
  sistema: {
    os: 'Microsoft Windows 10 Home', versione: '10.0.19045', build: '19045', installato: '2026-10-25T20:27:12',
    host: 'DESKTOP-INPVHR2', sku: '74M20EA#ABZ', modello: 'Victus by HP 15L Gaming Desktop TG02-0xxx', produttore: 'HP',
    scheda: '89B5', schedaMarca: 'HP', bios: 'F.34', biosData: '2025-10-28T01:00:00', psu: '500 W · 80+ Bronze',
  },
  cpu: { modello: '12th Gen Intel(R) Core(TM) i7-12700F', core: 12, thread: 20, l2: 10240, l3: 25600, base: 2100, socket: 'LGA1700', turbo: 4900, tdp: 65, turboW: 180 },
  gpu: { modello: 'NVIDIA GeForce RTX 3060 Ti', vram: 8, cuda: 4864, boost: 1665, tdp: 200, driver: '32.0.16.1088', driverData: '2026-07-22T02:00:00', risoluzione: '1920x1080', hz: 165 },
  ram: { marca: 'Micron Technology', gb: 16, tipo: 'DDR4', mhz: 3200, mhzMax: 3200, banchi: 2, parti: ['8ATF1G64AZ-3G2R1', '8ATF1G64AZ-3G2R1'], slot: ['DIMM1', 'DIMM2'] },
  dischi: [{ n: 0, nome: 'NVMe INTEL SSDPEKNU512GZH', tipo: 'SSD', bus: 'RAID', gb: 512, salute: 'Healthy', firmware: 'HPS1', volume: 476, libero: 64 }],
  volumi: { C: { etichetta: '', fs: 'NTFS', gb: 476, libero: 64 } },
  monitor: [{ nome: 'HP 24f', marca: 'HPN', anno: 2018 }, { nome: 'HP X27', marca: 'HPN', anno: 2022 }],
  audio: ['Realtek High Definition Audio', 'USB Speakers', 'USB Speakers', 'NVIDIA High Definition Audio'],
  rete: { nome: 'Realtek RTL8822CE 802.11ac PCIe Adapter', velocita: '866.7 Mbps', ip: '10.1.114.45' },
  driver: [
    { nome: 'NVIDIA GeForce RTX 3060 Ti', versione: '32.0.16.1088', data: '2026-07-22', fornitore: 'NVIDIA' },
    { nome: 'Realtek High Definition Audio', versione: '6.0.9611.1', data: '2023-11-28', fornitore: 'Microsoft' },
    { nome: 'Realtek RTL8822CE 802.11ac PCIe Adapter', versione: '2024.0.10.209', data: '2019-04-12', fornitore: 'Realtek Semiconductor Corp.' },
    { nome: 'Intel RST VMD Controller 467F', versione: '20.0.0.1038', data: '2023-11-29', fornitore: 'Intel Corporation' },
    { nome: 'Intel(R) Management Engine Interface #1', versione: '2603.9.4.0', data: '2026-01-13', fornitore: 'Intel' },
    { nome: 'HP 24f Display', versione: '1.0.0.0', data: '2017-09-18', fornitore: 'HP' },
  ],
  software: [
    { nome: 'Camo Studio', versione: '2.9.5.26360', data: '2026-11-04' },
    { nome: 'Discord', versione: '1.0.9269', data: null },
    { nome: 'Microsoft Edge', versione: '158.0.4370.33', data: '2026-11-21' },
    { nome: 'OBS Studio', versione: '33.0.1', data: null },
    { nome: 'Steam', versione: '2.10.91.91', data: null },
    { nome: 'Microsoft Visual Studio Code (User)', versione: '1.147.0', data: '2026-11-20' },
    { nome: 'Node.js', versione: '24.22.1', data: '2026-10-26' },
    { nome: 'Tailscale', versione: '1.104.7', data: '2026-11-16' },
    { nome: 'NVIDIA Driver grafico 610.88', versione: '610.88', data: '2026-10-25' },
  ],
  processi: [
    { nome: 'steam', mb: 936 }, { nome: 'Discord', mb: 730 }, { nome: 'Acrobat', mb: 600 },
    { nome: 'MsMpEng', mb: 480 }, { nome: 'CamoStudio', mb: 344 }, { nome: 'msedgewebview2', mb: 280 },
  ],
  avvioProgrammi: ['Discord', 'Steam', 'Tailscale', 'Camo Studio', 'HP Omen'],
  cache: { nvidia: 6705, nvidiaGl: 22, edge: 392, discord: 324, windows: 309 },
  tv: { nome: '[LG] webOS TV QNED756RA', modello: 'QNED756RA', ip: '10.1.12.106' },
  secondario: { nome: 'Pavillion', tipo: 'HP Pavilion', rete: 'Wi-Fi · vista esterna' },
}

let reportDati = null
let quadroVivo = null

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const nf = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 })
const dataIt = (s) => {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const fmtMB = (v) => {
  if (v == null) return '—'
  return v >= 1024 ? `${nf.format(v / 1024)} GB` : `${Math.round(v)} MB`
}
const fmtGB = (v) => v == null ? '—' : `${nf.format(v)} GB`
const slideTitoli = ['Panoramica', 'Processore', 'Scheda video', 'Memoria e cache', 'Intorno al PC', 'Software e driver', 'Adesso', 'Colore e luci']
function fondi(base, extra) {
  if (!extra) return base
  return {
    ...base, ...extra,
    sistema: { ...base.sistema, ...(extra.sistema ?? {}) },
    cpu: { ...base.cpu, ...(extra.cpu ?? {}) },
    gpu: { ...base.gpu, ...(extra.gpu ?? {}) },
    ram: { ...base.ram, ...(extra.ram ?? {}) },
    rete: { ...base.rete, ...(extra.rete ?? {}) },
    cache: { ...base.cache, ...(extra.cache ?? {}) },
    tv: { ...base.tv, ...(extra.tv ?? {}) },
    secondario: { ...base.secondario, ...(extra.secondario ?? {}) },
    dischi: extra.dischi?.length ? extra.dischi : base.dischi ?? [],
  }
}

function creaQuadro(Q) {
  const el = $('<div class="pr" data-pr="1"></div>')
  let R = fondi(RIPIEGO, reportDati)
  let usatoReport = !!reportDati
  let idx = 0, auto = true, prossimo = 0, ultimoAgg = 0, ultimaOra = '', timerUscita = 0
  let nodi = {}, mini = {}, slides = []
  const DURATA = 8
  const N = slideTitoli.length

  function stimaW() {
    const cpu = tra(0, 100, dati.cpu ?? 0)
    const gpu = dati.gpu
    const gpuW = gpu?.potenza ?? (gpu ? 25 + (gpu.uso ?? 0) * 1.7 : 25)
    const cpuW = 18 + cpu / 100 * 112
    const wall = (cpuW + gpuW + 18) / 0.88
    return { cpuW, gpuW, wall, ampere: wall / 230, euro: wall / 1000 * 0.25 }
  }
  function uptime() {
    const b = new Date(R.avvio || Date.now())
    const ms = Math.max(0, Date.now() - b.getTime())
    const ore = Math.floor(ms / 3600000), min = Math.floor(ms / 60000) % 60
    return `${ore}h ${String(min).padStart(2, '0')}m`
  }
  const dataOra = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  const pct = (v) => v == null ? '—' : String(Math.round(v))
  const valore = (p) => {
    if (p === 'cpu') return dati.cpu
    if (p === 'gpu') return dati.gpu?.uso
    if (p === 'ram') return dati.ram
    if (p === 'ssd') return nomi?.dischi?.ssd != null ? dati.dischi?.[nomi.dischi.ssd] : dati.dischi?.[0]
    if (p === 'temp') return dati.temp ?? dati.gpu?.temp
    return dati.wifi?.mbps
  }

  function threads() {
    const n = R.cpu.thread || 20
    return Array.from({ length: n }, (_, i) => `<i data-th="${i}"></i>`).join('')
  }
  const ssd = () => (R.dischi?.[0] ?? {})
  const volume = () => ssd().volume ?? R.volumi?.C?.gb ?? 476
  const libero = () => ssd().libero ?? R.volumi?.C?.libero ?? 64
  const usedPct = () => Math.max(0, Math.min(100, Math.round((volume() - libero()) / Math.max(1, volume()) * 100)))
  const cache = (k) => fmtMB(R.cache?.[k])
  const pil = (v, max = 100) => Math.max(0, Math.min(100, (v / max) * 100))
  const soft = (R.software ?? []).filter((x) => x?.nome)

  function h() {
    const s = R.sistema, cpu = R.cpu, gpu = R.gpu, ram = R.ram, rete = R.rete
    const l2 = cpu.l2 > 1000 ? Math.round(cpu.l2 / 1024) : cpu.l2
    const l3 = cpu.l3 > 1000 ? Math.round(cpu.l3 / 1024) : cpu.l3
    const turbo = cpu.turbo ? nf.format(cpu.turbo / 1000) : '4,9'
    const base = cpu.base ? nf.format(cpu.base / 1000) : '2,1'
    const boost = gpu.boost ? nf.format(gpu.boost / 1000) : '1,67'
    const tv = R.tv ?? {}
    const secondario = R.secondario ?? {}
    const tuttiDriver = R.driver ?? []
    const ordineDriver = [/NVIDIA GeForce/, /Realtek High Definition/, /RTL8822/, /RST VMD Controller/, /Management Engine Interface/, /HP 24f/]
    const driver = ordineDriver.map((re) => tuttiDriver.find((x) => re.test(x.nome ?? ''))).filter(Boolean)
    const processi = (R.processi ?? []).slice(0, 5)
    const prog = soft.filter((x) => x.versione || x.data).slice(0, 10)
    const boot = dataIt(R.avvio)
    const usato = Math.max(0, volume() - libero())
    return `
    <div class="pr-topo">
      <div class="pr-marchio"><span class="app">PC</span><div><b>RESOCONTO PC</b><small>${esc(s.modello ?? 'HP Victus 15L')}</small></div></div>
      <div class="pr-topo-dx"><span class="pr-live"><i></i>LIVE</span><b class="pr-ora">--:--</b><span class="pr-cont"><b class="pr-num">1/${N}</b><span class="pr-slide-nome">${slideTitoli[0]}</span></span></div>
    </div>
    <div class="pr-scena">
      <div class="pr-slide attiva" data-slide="0">
        <div class="pr-hero">
          <div class="pr-hero-foto pr-entra" style="--i:0"><span class="pr-alone-foto"></span><img src="/scene/pc/victus.webp" alt="HP Victus 15L"><span class="pr-credito">foto prodotto · HP</span></div>
          <div class="pr-hero-testo">
            <span class="pr-occhiello pr-entra" style="--i:1">LA MACCHINA</span>
            <h2 class="pr-entra" style="--i:2">Victus 15L</h2>
            <p class="pr-sotto pr-entra" style="--i:3">HP TG02-0xxx · <b>Mica Silver</b> · SKU <b>${esc(s.sku ?? '—')}</b></p>
            <div class="pr-chip-riga pr-entra" style="--i:4"><span>Windows 10 Home</span><span>500 W 80+ Bronze</span><span>installato ${dataIt(s.installato)}</span></div>
            <div class="pr-spec-grid pr-entra" style="--i:5">
              <div class="pr-spec"><span>CPU</span><b>i7-12700F</b><small>${cpu.core}C · ${cpu.thread}T · ${l3} MB L3</small></div>
              <div class="pr-spec"><span>GPU</span><b>RTX 3060 Ti</b><small>${gpu.vram} GB · ${gpu.cuda} CUDA</small></div>
              <div class="pr-spec"><span>RAM</span><b>${ram.gb} GB</b><small>${esc(ram.tipo)}-${ram.mhz} · ${ram.banchi}/2 banchi</small></div>
              <div class="pr-spec"><span>SSD</span><b>${volume()} GB</b><small>${esc(ssd().nome ?? 'Intel 670p')}</small></div>
            </div>
            <div class="pr-colori-riga pr-entra" style="--i:6"><span>COLORE</span><i style="--c:#b9b7b2" title="Mica Silver"></i><i style="--c:#1b1b1f" title="nero grafite"></i><i style="--c:#ccff00" title="lime pzkko"></i><i style="--c:#9d00ff" title="viola"></i><small>Mica Silver · nero · lime pzkko</small></div>
          </div>
        </div>
      </div>
      <div class="pr-slide" data-slide="1">
        <div class="pr-grid-2">
          <div class="pr-card pr-entra" style="--i:0">
            <span class="pr-occhiello">IL CERVELLO</span>
            <h2>Intel Core i7-12700F</h2>
            <p class="pr-sotto">Alder Lake · 12ª generazione · ${esc(cpu.socket ?? 'LGA1700')}</p>
            <div class="pr-metriche">
              <div><b>${cpu.core}</b><span>core</span></div><div><b>${cpu.thread}</b><span>thread</span></div>
              <div><b>${l3}</b><span>MB L3</span></div><div><b>${l2}</b><span>MB L2</span></div>
              <div><b>${turbo}</b><span>GHz turbo</span></div><div><b>${cpu.tdp ?? 65}</b><span>W base</span></div>
            </div>
            <div class="pr-thread-titolo"><span>20 thread in tempo reale</span><b class="pr-thread-vivo">—</b></div>
            <div class="pr-thread">${threads()}</div>
            <div class="pr-nota">8 P-core + 4 E-core. La griglia si accende thread per thread, come il pezzo <code>/o/cpu</code>.</div>
          </div>
          <div class="pr-card pr-centro pr-entra" style="--i:1">
            <span class="pr-occhiello">ADESSO</span>
            <div class="pr-ghiera"><svg viewBox="0 0 120 120"><circle class="pr-anello-fondo" cx="60" cy="60" r="52" pathLength="100"/><circle class="pr-anello-val pr-cpu-arco" cx="60" cy="60" r="52" pathLength="100"/></svg><div class="pr-ghiera-num"><b class="pr-cpu-pct">—</b><small>%</small></div></div>
            <div class="pr-due"><div><b class="pr-cpu-temp">—</b><span>°C</span><small>temperatura</small></div><div><b class="pr-cpu-watt">—</b><span>W</span><small>stima CPU</small></div></div>
            <div class="pr-nota">${esc(cpu.modello ?? '')}</div>
          </div>
        </div>
      </div>
      <div class="pr-slide" data-slide="2">
        <div class="pr-grid-2">
          <div class="pr-card pr-centro pr-entra" style="--i:0">
            <span class="pr-occhiello">GLI OCCHI</span>
            <h2>GeForce RTX 3060 Ti</h2>
            <p class="pr-sotto">Ampere · 8 GB GDDR6 · PCIe 4.0 x16</p>
            <div class="pr-foto-gpu"><span class="pr-alone-foto"></span><img src="/scene/pc/gpu.webp" alt="NVIDIA GeForce RTX 3060 Ti"><div class="pr-ventola"><i></i><i></i><i></i></div></div>
            <div class="pr-credito">foto prodotto · NVIDIA</div>
          </div>
          <div class="pr-card pr-entra" style="--i:1">
            <div class="pr-riga-top"><span class="pr-occhiello">ADESSO</span><span class="pr-driver">driver ${esc(gpu.driver ?? '610.88')} · ${dataIt(gpu.driverData)}</span></div>
            <div class="pr-ghiera"><svg viewBox="0 0 120 120"><circle class="pr-anello-fondo" cx="60" cy="60" r="52" pathLength="100"/><circle class="pr-anello-val pr-gpu-arco" cx="60" cy="60" r="52" pathLength="100"/></svg><div class="pr-ghiera-num"><b class="pr-gpu-pct">—</b><small>%</small></div></div>
            <div class="pr-due"><div><b class="pr-gpu-temp">—</b><span>°C</span><small>temperatura</small></div><div><b class="pr-gpu-fan">—</b><span>%</span><small>ventola</small></div></div>
            <div class="pr-due"><div><b class="pr-gpu-vram">—</b><span>GB</span><small>VRAM usata</small></div><div><b class="pr-gpu-watt">—</b><span>W</span><small>assorbimento</small></div></div>
            <div class="pr-metriche piccole"><div><b>${gpu.cuda}</b><span>CUDA</span></div><div><b>${boost}</b><span>GHz boost</span></div><div><b>${gpu.tdp ?? 200}</b><span>W TGP</span></div><div><b>${gpu.vram}</b><span>GB GDDR6</span></div></div>
          </div>
        </div>
      </div>
      <div class="pr-slide" data-slide="3">
        <div class="pr-grid-2">
          <div class="pr-card pr-entra" style="--i:0">
            <span class="pr-occhiello">MEMORIA</span>
            <h2>${ram.gb} GB DDR4-${ram.mhz}</h2>
            <p class="pr-sotto">${esc(ram.marca ?? 'Micron')} · ${ram.banchi}/2 banchi · dual channel · max 32 GB</p>
            <div class="pr-ram"><span>USO RAM</span><b class="pr-ram-pct">—</b><div class="pr-barra"><i class="pr-ram-barra"></i></div><small class="pr-ram-usata">— GB di ${ram.gb} GB</small></div>
            <div class="pr-dimm"><i></i><i></i><span>DIMM1</span><span>DIMM2</span></div>
            <div class="pr-nota">${esc((ram.parti ?? []).filter(Boolean).slice(0, 2).join(' · ') || 'moduli reali')}</div>
          </div>
          <div class="pr-card pr-entra" style="--i:1">
            <span class="pr-occhiello">DISCO</span>
            <h2>Intel 670p 512 GB</h2>
            <p class="pr-sotto">${esc(ssd().tipo ?? 'SSD')} · ${esc(ssd().bus ?? 'NVMe')} · firmware ${esc(ssd().firmware ?? 'HPS1')} · ${esc(ssd().salute ?? 'Healthy')}</p>
            <div class="pr-donut"><svg viewBox="0 0 120 120"><circle class="pr-anello-fondo" cx="60" cy="60" r="48" pathLength="100"/><circle class="pr-anello-val pr-ssd-arco" cx="60" cy="60" r="48" pathLength="100" style="stroke:#05e8e0"/></svg><div class="pr-donut-num"><b class="pr-ssd-pct">${usedPct()}</b><small>% pieno</small></div></div>
            <div class="pr-due"><div><b>${volume()}</b><span>GB</span><small>volume C:</small></div><div><b>${libero()}</b><span>GB</span><small>liberi</small></div></div>
            <div class="pr-nota">${usato} GB usati · ${esc(ssd().nome ?? 'NVMe Intel')}</div>
          </div>
        </div>
        <div class="pr-cache-fila">
          <div class="pr-cache"><b>${cache('nvidia')}</b><span>shader NVIDIA</span></div>
          <div class="pr-cache"><b>${cache('edge')}</b><span>cache Edge</span></div>
          <div class="pr-cache"><b>${cache('discord')}</b><span>cache Discord</span></div>
          <div class="pr-cache"><b>${cache('windows')}</b><span>cache Windows</span></div>
          <div class="pr-cache"><b>${cache('nvidiaGl')}</b><span>shader OpenGL</span></div>
          <div class="pr-cache"><b>${l3} MB</b><span>cache L3 CPU</span></div>
        </div>
      </div>
      <div class="pr-slide" data-slide="4">
        <div class="pr-intorno">
          <div class="pr-prod pr-entra" style="--i:0"><img src="/scene/pc/x27.webp" alt="HP X27"><div><b>HP X27</b><small>27" · FHD · 165 Hz · IPS</small><em>2022</em></div></div>
          <div class="pr-prod pr-entra" style="--i:1"><img src="/scene/pc/24f-t.webp" alt="HP 24f"><div><b>HP 24f</b><small>23,8" · FHD · 75 Hz · IPS</small><em>2018</em></div></div>
          <div class="pr-prod pr-entra" style="--i:2"><img src="/scene/pc/tv-t.webp" alt="LG QNED756RA"><div><b>LG QNED756RA</b><small>4K QNED · webOS 23 · 20 W</small><em>TV</em></div></div>
          <div class="pr-prod pr-entra" style="--i:3"><img src="/scene/pc/casse-t.webp" alt="Casse USB"><div><b>Casse USB 2.0</b><small>Realtek · 2 canali</small><em>AUDIO</em></div></div>
          <div class="pr-prod pr-entra" style="--i:4"><img src="/scene/pc/pavilion-t.webp" alt="HP Pavilion"><div><b>HP Pavilion</b><small>${esc(secondario.nome ?? 'Pavillion')} · ${esc(secondario.rete ?? 'vista esterna')}</small><em>SECONDARIO</em></div></div>
          <div class="pr-prod pr-rete pr-entra" style="--i:5"><div class="pr-wifi-ico">${WIFI_ICO()}</div><div><b>Wi-Fi 5</b><small>${esc(rete.nome ?? 'Realtek RTL8822CE')}<br>${esc(rete.velocita ?? '866,7 Mbps')} · ${esc(rete.ip ?? '—')}</small><em>RETE</em></div></div>
        </div>
        <div class="pr-intorno-piede"><span>2 schermi FHD</span><span>1 TV 4K</span><span>2 PC</span><span>casse USB</span><span>${esc(rete.velocita ?? '866,7 Mbps')}</span><span>TV ${esc(tv.modello ?? 'QNED756RA')} · ${esc(tv.ip ?? '')}</span></div>
      </div>
      <div class="pr-slide" data-slide="5">
        <div class="pr-software">
          <div class="pr-card pr-entra" style="--i:0">
            <span class="pr-occhiello">DATE</span>
            <div class="pr-timeline">
              <div><i></i><b>Windows installato</b><span>${dataIt(s.installato)}</span></div>
              <div><i></i><b>BIOS ${esc(s.bios ?? 'F.34')}</b><span>${dataIt(s.biosData)}</span></div>
              <div><i></i><b>Driver NVIDIA</b><span>${dataIt(gpu.driverData)}</span></div>
              <div><i></i><b>NVIDIA 610.88</b><span>${dataIt((soft.find((x) => /NVIDIA Driver/.test(x.nome)) ?? {}).data)}</span></div>
              <div><i></i><b>Node.js 24</b><span>${dataIt((soft.find((x) => /Node/.test(x.nome)) ?? {}).data)}</span></div>
              <div><i></i><b>Camo Studio</b><span>${dataIt((soft.find((x) => /Camo/.test(x.nome)) ?? {}).data)}</span></div>
            </div>
            <div class="pr-nota">Build ${esc(s.build ?? '19045')} · ${esc(s.os ?? 'Windows')}</div>
            <div class="pr-sistema">
              <div><span>Scheda madre</span><b>HP ${esc(s.scheda ?? '89B5')}</b></div>
              <div><span>BIOS</span><b>${esc(s.bios ?? 'F.34')} · ${dataIt(s.biosData)}</b></div>
              <div><span>Alimentatore</span><b>${esc(s.psu ?? '500 W')}</b></div>
              <div><span>Host</span><b>${esc(s.host ?? '—')}</b></div>
            </div>
          </div>
          <div class="pr-card pr-entra" style="--i:1">
            <span class="pr-occhiello">DRIVER</span>
            <div class="pr-lista">${driver.map((d) => `<div><b>${esc(d.nome)}</b><span>${esc(d.versione ?? '—')} · ${dataIt(d.data)}</span></div>`).join('')}</div>
            <div class="pr-nota">${tuttiDriver.length} driver firmati · i più importanti per le prestazioni</div>
          </div>
          <div class="pr-card pr-entra" style="--i:2">
            <span class="pr-occhiello">PROGRAMMI</span>
            <div class="pr-chip-soft">${prog.map((x) => `<span>${esc(x.nome.replace(/\s*\(.*?\)\s*/g, ''))}<b>${esc(x.versione ?? '')}</b></span>`).join('')}</div>
            <span class="pr-occhiello" style="margin-top:12px">IN MEMORIA</span>
            <div class="pr-processi">${processi.map((x) => `<div><b>${esc(x.nome)}</b><span>${Math.round(x.mb)} MB</span></div>`).join('')}</div>
          </div>
        </div>
        <div class="pr-software-piede"><span>app aperte <b class="pr-app-n">—</b></span><span>cache shader <b>${cache('nvidia')}</b></span><span>cache browser <b>${cache('edge')}</b></span><span>cache Windows <b>${cache('windows')}</b></span><span>avvio <b>${(R.avvioProgrammi ?? []).length}</b> programmi</span></div>
      </div>
      <div class="pr-slide" data-slide="6">
        <div class="pr-adesso"><div class="pr-mini-griglia"></div>
          <div class="pr-live-basso">
            <div class="pr-card"><span class="pr-occhiello">ASSORBIMENTO · STIMA</span><b class="pr-live-watt">—</b><small>W · <span class="pr-live-ampere">—</span> A · <span class="pr-live-euro">—</span> €/h · 0,25 €/kWh</small><div class="pr-barra"><i class="pr-watt-barra"></i></div></div>
            <div class="pr-card"><span class="pr-occhiello">ACCESO DA</span><b class="pr-live-uptime">—</b><small>boot ${boot} · Windows ${dataIt(s.installato)}</small></div>
            <div class="pr-card"><span class="pr-occhiello">GPU</span><b class="pr-live-gpuw">—</b><small>W · ventola <span class="pr-live-fan">—</span>% · VRAM <span class="pr-live-vram">—</span> GB</small><small class="pr-live-clock">—</small></div>
            <div class="pr-card"><span class="pr-occhiello">RETE</span><b class="pr-live-wifi">—</b><small>Mbps · link <span class="pr-live-link">${esc(rete.velocita ?? '—')}</span></small><small>${esc(rete.ip ?? '')}</small></div>
          </div>
        </div>
      </div>
      <div class="pr-slide" data-slide="7">
        <div class="pr-colore">
          <div class="pr-colore-foto pr-entra" style="--i:0"><span class="pr-alone-foto"></span><img src="/scene/pc/victus.webp" alt="HP Victus 15L"><span class="pr-credito">il case · Mica Silver / nero</span></div>
          <div class="pr-card pr-entra" style="--i:1">
            <span class="pr-occhiello">COLORE & LUCI</span>
            <h2>Il rig è <span class="pr-lime">lime</span>, <span class="pr-viola">viola</span>, <span class="pr-bianco">notte</span>.</h2>
            <p class="pr-sotto">Il colore vero del PC è Mica Silver con frontale nero; le ventole frontali sono RGB e il tema della diretta è pzkko / Discord.</p>
            <div class="pr-palette">
              <div><i style="--c:#b9b7b2"></i><b>Mica Silver</b><span>#B9B7B2</span></div>
              <div><i style="--c:#1b1b1f"></i><b>Nero grafite</b><span>#1B1B1F</span></div>
              <div><i style="--c:#ccff00"></i><b>Lime pzkko</b><span>#CCFF00</span></div>
              <div><i style="--c:#9d00ff"></i><b>Viola</b><span>#9D00FF</span></div>
              <div><i style="--c:#0b090e"></i><b>Notte</b><span>#0B090E</span></div>
              <div><i style="--c:#5865f2"></i><b>Discord</b><span>#5865F2</span></div>
            </div>
            <div class="pr-luci"><span class="pr-orb a"></span><span class="pr-orb b"></span><span class="pr-orb c"></span><div><b>OMEN Gaming Hub</b><small>ventole RGB · profilo arcobaleno</small></div></div>
          </div>
        </div>
      </div>
      <div class="pr-lampo"></div>
    </div>
    <div class="pr-barra">
      <div class="pr-punti">${slideTitoli.map((t, i) => `<button class="pr-punto${i ? '' : ' attivo'}" data-i="${i}" aria-label="${t}" title="${t}"></button>`).join('')}</div>
      <div class="pr-progresso"><i></i></div>
      <div class="pr-comandi"><button data-pr-dir="-1" aria-label="Slide precedente" title="Slide precedente">‹</button><button data-pr-play aria-label="Pausa automatica" title="Pausa / riprendi">❚❚</button><button data-pr-dir="1" aria-label="Slide successiva" title="Slide successiva">›</button></div>
    </div>
    <div class="pr-piede"><span><i class="pr-led"></i> CPU <b class="pr-f-cpu">—</b>%</span><span>GPU <b class="pr-f-gpu">—</b>%</span><span>RAM <b class="pr-f-ram">—</b>%</span><span>TEMP <b class="pr-f-temp">—</b>°</span><span>POTENZA <b class="pr-f-watt">—</b> W</span><span class="pr-app">APP <b class="pr-app-n">—</b></span><span class="pr-dati">DATI REALI · 4 Hz</span></div>`
  }

  function WIFI_ICO() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="#8f98ff" stroke-width="2.6" stroke-linecap="round"><path d="M4 12a18 18 0 0 1 24 0"/><path d="M8 17a12 12 0 0 1 16 0"/><path d="M12 22a6 6 0 0 1 8 0"/></g><circle cx="16" cy="27" r="2.2" fill="#8f98ff"/></svg>'
  }

  function monta() {
    el.innerHTML = h()
    slides = [...el.querySelectorAll('.pr-slide')]
    nodi = {
      ora: el.querySelector('.pr-ora'), num: el.querySelector('.pr-num'), nome: el.querySelector('.pr-slide-nome'),
      barra: el.querySelector('.pr-progresso i'), dots: [...el.querySelectorAll('.pr-punto')],
      fCpu: el.querySelector('.pr-f-cpu'), fGpu: el.querySelector('.pr-f-gpu'), fRam: el.querySelector('.pr-f-ram'),
      fTemp: el.querySelector('.pr-f-temp'), fWatt: el.querySelector('.pr-f-watt'), appN: [...el.querySelectorAll('.pr-app-n')],
      cpuArco: el.querySelector('.pr-cpu-arco'), cpuPct: el.querySelector('.pr-cpu-pct'), cpuTemp: el.querySelector('.pr-cpu-temp'), cpuWatt: el.querySelector('.pr-cpu-watt'), thread: [...el.querySelectorAll('.pr-thread i')], threadVivo: el.querySelector('.pr-thread-vivo'),
      gpuArco: el.querySelector('.pr-gpu-arco'), gpuPct: el.querySelector('.pr-gpu-pct'), gpuTemp: el.querySelector('.pr-gpu-temp'), gpuFan: el.querySelector('.pr-gpu-fan'), gpuVram: el.querySelector('.pr-gpu-vram'), gpuWatt: el.querySelector('.pr-gpu-watt'),
      ramPct: el.querySelector('.pr-ram-pct'), ramBarra: el.querySelector('.pr-ram-barra'), ramUsata: el.querySelector('.pr-ram-usata'),
      ssdArco: el.querySelector('.pr-ssd-arco'), ssdPct: el.querySelector('.pr-ssd-pct'),
      liveWatt: el.querySelector('.pr-live-watt'), liveAmpere: el.querySelector('.pr-live-ampere'), liveEuro: el.querySelector('.pr-live-euro'), liveUptime: el.querySelector('.pr-live-uptime'),
      liveGpuW: el.querySelector('.pr-live-gpuw'), liveFan: el.querySelector('.pr-live-fan'), liveVram: el.querySelector('.pr-live-vram'), liveClock: el.querySelector('.pr-live-clock'),
      liveWifi: el.querySelector('.pr-live-wifi'), liveLink: el.querySelector('.pr-live-link'), wattBarra: el.querySelector('.pr-watt-barra'),
      lampo: el.querySelector('.pr-lampo'),
    }
    // i sei strumenti veri (gli stessi di /o/cpu…), rimpiccioliti nella slide «Adesso»
    mini = {}
    const griglia = el.querySelector('.pr-mini-griglia')
    for (const p of ['cpu', 'gpu', 'ram', 'ssd', 'temp', 'wifi']) {
      const st = strumento(p, p === 'wifi' ? 'Mbps' : p === 'temp' ? '°C' : '%')
      st.el.classList.add('pr-mini-pc')
      if (p === 'ssd') st.nome?.('SSD attività')
      if (p === 'temp') st.nome?.('Temp CPU')
      const cella = document.createElement('div')
      cella.className = 'pr-mini-cella'
      cella.append(st.el)
      griglia.append(cella)
      mini[p] = st
    }
    if (mini.temp) mini.temp.nome?.('Temp CPU')
    if (el.__tasti) { window.removeEventListener('keydown', el.__tasti); el.__tasti = null }
    bind()
    idx = -1
    mostra(0, 1, true)
    aggiorna(true)
  }

  function bind() {
    for (const b of el.querySelectorAll('[data-pr-dir]')) {
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation()
        auto = false; el.classList.add('fermo'); aggiornaPlay()
        mostra((idx + (b.dataset.prDir === '1' ? 1 : -1) + N) % N, b.dataset.prDir === '1' ? 1 : -1)
      })
    }
    for (const b of el.querySelectorAll('[data-pr-play]')) {
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation()
        auto = !auto
        el.classList.toggle('fermo', !auto)
        if (auto) { prossimo = performance.now() / 1000 + DURATA; riavviaBarra() }
        aggiornaPlay()
      })
    }
    for (const b of nodi.dots) {
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation()
        const n = +b.dataset.i
        auto = false; el.classList.add('fermo'); aggiornaPlay()
        mostra(n, n >= idx ? 1 : -1)
      })
    }
    if (location.pathname.endsWith('/quadro')) {
      const tasti = (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); auto = false; el.classList.add('fermo'); aggiornaPlay(); mostra((idx - 1 + N) % N, -1) }
        if (e.key === 'ArrowRight') { e.preventDefault(); auto = false; el.classList.add('fermo'); aggiornaPlay(); mostra((idx + 1) % N, 1) }
        if (e.key === ' ') { e.preventDefault(); auto = !auto; el.classList.toggle('fermo', !auto); if (auto) { prossimo = performance.now() / 1000 + DURATA; riavviaBarra() } aggiornaPlay() }
      }
      window.addEventListener('keydown', tasti)
      el.__tasti = tasti
    }
  }

  function aggiornaPlay() {
    const b = el.querySelector('[data-pr-play]')
    if (!b) return
    b.textContent = auto ? '❚❚' : '▶'
    b.setAttribute('aria-label', auto ? 'Pausa automatica' : 'Riprendi automatico')
    b.title = auto ? 'Pausa automatica' : 'Riprendi automatico'
  }
  function riavviaBarra() {
    const b = nodi.barra
    if (!b) return
    b.style.animation = 'none'
    void b.offsetWidth
    b.style.animation = ''
  }
  function mostra(n, dir = 1, subito = false) {
    if (n < 0 || n >= N || n === idx) return
    const vecchio = slides[idx], nuovo = slides[n]
    if (vecchio && !subito) {
      vecchio.classList.remove('attiva')
      vecchio.classList.add('uscita')
      vecchio.style.setProperty('--dx', dir > 0 ? '-34px' : '34px')
      clearTimeout(timerUscita)
      timerUscita = setTimeout(() => vecchio.classList.remove('uscita'), 700)
    }
    if (nuovo) {
      nuovo.style.setProperty('--dx', dir > 0 ? '34px' : '-34px')
      void nuovo.offsetWidth
      nuovo.classList.remove('uscita')
      nuovo.classList.add('attiva')
    }
    idx = n
    nodi.num.textContent = `${n + 1}/${N}`
    nodi.nome.textContent = slideTitoli[n]
    for (const d of nodi.dots) d.classList.toggle('attivo', +d.dataset.i === n)
    if (nodi.lampo) {
      nodi.lampo.classList.remove('via'); void nodi.lampo.offsetWidth; nodi.lampo.classList.add('via')
    }
    if (auto) prossimo = performance.now() / 1000 + DURATA
    riavviaBarra()
    aggiorna(true)
  }
  function setArco(e, f) {
    if (!e) return
    e.style.strokeDasharray = `${(Math.max(0, Math.min(1, f)) * 100).toFixed(1)} 100`
  }
  function aggiorna(forza = false) {
    if (!nodi || !nodi.ora) return
    const ora = dataOra()
    if (forza || ora !== ultimaOra) { ultimaOra = ora; nodi.ora.textContent = ora }
    const d = dati
    const cpu = d.cpu, gpuUso = d.gpu?.uso, ram = d.ram
    const sd = nomi?.dischi?.ssd != null ? d.dischi?.[nomi.dischi.ssd] : d.dischi?.[0]
    const temp = d.temp ?? d.gpu?.temp
    const wifi = d.wifi?.mbps
    const w = stimaW()
    nodi.fCpu.textContent = pct(cpu); nodi.fGpu.textContent = pct(gpuUso); nodi.fRam.textContent = pct(ram)
    nodi.fTemp.textContent = temp == null ? '—' : String(Math.round(temp)); nodi.fWatt.textContent = String(Math.round(w.wall))
    for (const a of nodi.appN) a.textContent = String(app.length)
    if (nodi.cpuPct) {
      nodi.cpuPct.textContent = pct(cpu)
      nodi.cpuTemp.textContent = temp == null ? '—' : String(Math.round(temp))
      nodi.cpuWatt.textContent = String(Math.round(w.cpuW))
      setArco(nodi.cpuArco, (cpu ?? 0) / 100)
      nodi.thread.forEach((e, i) => {
        const v = (d.fili?.[i] ?? 0) / 100
        e.style.opacity = (0.13 + Math.min(1, v + .05) * .87).toFixed(2)
        e.style.background = v > .85 ? '#fff' : ''
      })
      const fili = d.fili ?? []
      if (nodi.threadVivo) nodi.threadVivo.textContent = fili.length ? `${Math.round(fili.reduce((a, b) => a + b, 0) / fili.length)}% medio` : '—'
    }
    if (nodi.gpuPct) {
      nodi.gpuPct.textContent = pct(gpuUso)
      nodi.gpuTemp.textContent = d.gpu?.temp == null ? '—' : String(Math.round(d.gpu.temp))
      nodi.gpuFan.textContent = d.gpu?.ventola == null ? '—' : String(Math.round(d.gpu.ventola))
      nodi.gpuVram.textContent = d.gpu?.vram == null ? '—' : nf.format(d.gpu.vram / 1024)
      nodi.gpuWatt.textContent = d.gpu?.potenza == null ? '—' : String(Math.round(d.gpu.potenza))
      setArco(nodi.gpuArco, (gpuUso ?? 0) / 100)
    }
    if (nodi.ramPct) {
      const gb = R.ram.gb || 16, usata = (ram ?? 0) / 100 * gb
      nodi.ramPct.textContent = pct(ram); nodi.ramBarra.style.width = `${ram ?? 0}%`; nodi.ramUsata.textContent = `${nf.format(usata)} GB di ${gb} GB`
    }
    if (nodi.ssdPct) {
      const f = usedPct()
      nodi.ssdPct.textContent = String(f); setArco(nodi.ssdArco, f / 100)
    }
    if (nodi.liveWatt) {
      nodi.liveWatt.textContent = String(Math.round(w.wall))
      nodi.liveAmpere.textContent = nf.format(w.ampere)
      nodi.liveEuro.textContent = w.euro.toFixed(3).replace('.', ',')
      nodi.liveUptime.textContent = uptime()
      nodi.liveGpuW.textContent = d.gpu?.potenza == null ? '—' : String(Math.round(d.gpu.potenza))
      nodi.liveFan.textContent = d.gpu?.ventola == null ? '—' : String(Math.round(d.gpu.ventola))
      nodi.liveVram.textContent = d.gpu?.vram == null ? '—' : nf.format(d.gpu.vram / 1024)
      nodi.liveClock.textContent = d.gpu?.clock == null ? '—' : `${d.gpu.clock} MHz grafica · ${d.gpu.clockMem ?? '—'} MHz memoria`
      nodi.liveWifi.textContent = wifi == null ? '—' : nf.format(wifi)
      nodi.liveLink.textContent = R.rete?.velocita ?? '—'
      nodi.wattBarra.style.width = `${Math.min(100, w.wall / 500 * 100)}%`
    }
    if (idx === 6) {
      const st = (p) => mini[p]
      st('cpu')?.disegna(.2, performance.now() / 1000, cpu == null ? null : cpu / 100, pct(cpu), cpu >= 90)
      st('gpu')?.disegna(.2, performance.now() / 1000, gpuUso == null ? null : gpuUso / 100, pct(gpuUso), gpuUso >= 95)
      st('ram')?.disegna(.2, performance.now() / 1000, ram == null ? null : ram / 100, pct(ram), ram >= 90)
      st('ssd')?.disegna(.2, performance.now() / 1000, sd == null ? null : (sd ?? 0) / 100, pct(sd), (sd ?? 0) >= 90)
      st('temp')?.disegna(.2, performance.now() / 1000, temp == null ? null : tra(0, 1, (temp - 20) / 80), temp == null ? '—' : String(Math.round(temp)), temp >= 85)
      st('wifi')?.disegna(.2, performance.now() / 1000, wifi == null ? null : Math.log10(1 + wifi) / 3, wifi == null ? '—' : nf.format(wifi < 10 ? wifi : Math.round(wifi)), false)
    }
  }

  const api = {
    s: { el },
    giro(dt, t) {
      if (!attivoOra(el)) return
      if (t - ultimoAgg > .25) { ultimoAgg = t; aggiorna() }
      if (auto && t >= prossimo) mostra((idx + 1) % N, 1)
    },
    report(n) {
      if (!n || usatoReport) return
      R = fondi(RIPIEGO, n)
      usatoReport = true
      const prima = idx, primaAuto = auto
      monta()
      auto = primaAuto
      el.classList.toggle('fermo', !auto)
      aggiornaPlay()
      if (prima > 0) mostra(Math.max(0, Math.min(N - 1, prima)), 1, true)
    },
  }
  pezzi.push(api)
  quadroVivo = api
  monta()
  avviaGiro()
  return el
}

// ── per pezzi.js ──
const FA = { app: creaApp, cpu: creaCpu, gpu: creaGpu, ram: creaRam, ssd: () => creaDisco('ssd'), hdd: () => creaDisco('hdd'), temp: creaTemp, wifi: creaWifi }
let giroAvviato = false
function avviaGiro() { if (giroAvviato) return; giroAvviato = true; ogniGiro(giro) }
export function creaPc(p, Q) {
  if (!document.querySelector('link[href="/pc.css"]')) document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/pc.css' }))
  if (p === 'quadro') return creaQuadro(Q)
  const x = FA[p](Q)
  x.p = p
  pezzi.push(x)
  if (nomi && x.s.nome) x.s.nome(nomi[p])
  if (p === 'app') x.disponi()
  avviaGiro()
  return x.s.el
}
export function pcArriva(d) { dati = d }
export function pcNomi(n) {
  nomi = n
  for (const x of pezzi) if (x.s.nome && x.p !== 'temp') x.s.nome(n[x.p])
  if (n.report) { reportDati = n.report; quadroVivo?.report(n.report) }
}
export function appArriva(l) { app = l; for (const x of pezzi) x.disponi?.() }

// un solo giro di disegno per tutti i pezzi del pc (giro.js); chi è spento (o nascosto nell'anteprima dal vivo) non si
// disegna
function giro(dt, t) {
  const scena = document.getElementById('scena')
  if (scena?.classList.contains('dal-vivo')) return
  for (const x of pezzi) if (x.s.el.closest('.pezzo')?.classList.contains('su')) x.giro(dt, t)
}
