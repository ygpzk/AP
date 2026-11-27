// miniature/conversioni.js — Convertitori (27.11.2026): bin·hex di pzk os, dal vivo.
// I conti sono quelli veri dell'app (telefono/app/conversioni.js: leggi, scritto, c2, passi, coi BigInt), la faccia è
// quella dell'lcd (telefono/zero/os/conversioni.js) rifatta con le parti di borsa.js: le righe (numero, scritto in, bit,
// dec, bin, oct, hex, come si fa verso), i risultati che si riscrivono da sinistra, poi OK su «come si fa verso binario»:
// le divisioni per 2 coi resti nelle fasce blu e l'esito in fondo. Il colpo: i resti, letti dal basso, volano fuori dallo
// schermo e accendono le lampadine del registro. Intorno la pioggia di cifre e la stampa della cattura vera.
// Col mouse sopra: il complemento a 2, −42 su 16 bit, col bit del segno rosso, anche sulle lampadine.
import { BASI, NOME, leggi, scritto, c2, intIn, gruppi, passi } from '../../telefono/app/conversioni.js'
import { glifo } from '../../telefono/zero/os/font.js'
import { Lcd8, LC, LW, LH, Vetro, nelQuad, pannello, angoli, icona, barra, testata, fotogramma } from './borsa.js'

const ICONA = 'M1 3h3v2H3v6h1v2H1z M12 3h3v10h-3v-2h1V5h-1z M5 4h2v8H5z M9 4h2v3H9v2h2v3H9v-2h1V7H9z' // os/icone.js
const CICLO = 14
const NUMERI = ['42', '2026', '255'] // uno per giro
const larg = Lcd8.larghezza
const pulito = (s) => String(s).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/[’‘]/g, "'")
function acapo(s, n) {
  const out = []
  let riga = ''
  for (const p of s.split(/\s+/).filter(Boolean)) {
    if (!riga) riga = p
    else if (riga.length + 1 + p.length <= n) riga += ' ' + p
    else { out.push(riga); riga = p }
  }
  if (riga) out.push(riga)
  return out
}
const corto = (s, n) => ([...s].length > n ? [...s].slice(0, n - 1).join('') + '…' : s)

/** le righe della lista (come righe() di os/conversioni.js) */
function righe(testo, bit) {
  const x = leggi(testo, 10), R = []
  R.push({ nome: 'numero', val: testo, numero: true, aiuto: 'OK scrive • ↑↓ righe' })
  R.push({ nome: 'scritto in', val: NOME[x.b ?? 10], gira: true, aiuto: '←→ cambia • ↑↓ righe' })
  R.push({ nome: 'bit (compl. a 2)', val: bit ? `${bit}` : 'no', gira: true, aiuto: '←→ cambia • ↑↓ righe' })
  if (x.errore) R.push({ nome: `! ${x.errore}`, val: '' })
  else {
    for (const [b, sigla] of BASI) R.push({ nome: sigla, val: scritto(x, b).vista, risultato: true, aiuto: 'OK lo vedi intero • ↑↓ righe' })
    if (bit) {
      const p = c2(x, bit)
      if (p !== null) {
        const bin = p.toString(2).padStart(bit, '0'), hex = intIn(p, 16).padStart(bit / 4, '0')
        R.push({ nome: `${bit} bit`, val: gruppi(bin, 4), risultato: true, segno: true, aiuto: 'OK lo vedi intero • ↑↓ righe' })
        R.push({ nome: `hex ${bit}`, val: gruppi(hex, 4), risultato: true, aiuto: 'OK lo vedi intero • ↑↓ righe' })
      }
    }
  }
  R.push({ nome: 'come si fa verso', val: 'binario', gira: true, aiuto: 'OK i passaggi • ←→ base' })
  return R
}
/** le righe dei passaggi (come righePassi di os/conversioni.js): testo a capo, la tabella a colonne, l'esito */
function righePassi(testo, verso) {
  const out = [], x = leggi(testo, 10)
  for (const b of passi(x, verso)) {
    if (b.p || b.nota) { out.push(...acapo(pulito(b.p ?? b.nota), 39).map((s) => ({ s }))); continue }
    if (b.fine) { out.push({ s: '' }, ...acapo(pulito(b.fine), 36).map((s) => ({ s, tipo: 'titolo' }))); continue }
    const T = [...(b.testa ? [b.testa] : []), ...b.tab.map((r) => r.map(pulito))]
    const L = T[0].map((_, i) => Math.max(...T.map((r) => [...r[i]].length))), sep = '   '
    T.forEach((r, k) => {
      const testa = k === 0 && !!b.testa, s = r.map((c, i) => (i < r.length - 1 ? c.padEnd(L[i]) : c)).join(sep)
      const da = L.slice(0, -1).reduce((a, n) => a + n, 0) + sep.length * (r.length - 1)
      out.push({ s, seg: testa ? null : [da, [...r.at(-1)].length], testa })
    })
  }
  return out
}

export default async function crea(m) {
  const { kit } = m
  const [cattura] = await Promise.all([m.cattura ? kit.imgForse(m.cattura) : null, kit.font('Permanent Marker'), kit.font('gg mono'), kit.font('gg mono', 700)])
  const lcd = new Lcd8(), vetro = new Vetro(lcd, 2), ic = icona(ICONA, '#33cc33')
  let W = 0, H = 0, alone = null, fondo = null, sopra = null, pioggia = [], stampa = null, bitC = {}

  function rifai(w, h) {
    W = w; H = h
    const dpr = m.dpr
    fondo = kit.strato(w, h, dpr, (g) => {
      const l = g.createLinearGradient(0, 0, w, h)
      l.addColorStop(0, '#0b4a46'); l.addColorStop(0.5, '#062a2a'); l.addColorStop(1, '#031717')
      g.fillStyle = l; g.fillRect(0, 0, w, h)
      // i puntini della copertina
      g.fillStyle = 'rgba(0,184,169,.10)'
      const p = w / 26
      for (let y = p / 2; y < h; y += p) for (let x = p / 2; x < w; x += p) { g.beginPath(); g.arc(x, y, p * 0.16, 0, Math.PI * 2); g.fill() }
      const r = g.createRadialGradient(w * 0.62, h * 0.7, 0, w * 0.62, h * 0.7, w * 0.5)
      r.addColorStop(0, 'rgba(255,150,40,.16)'); r.addColorStop(1, 'rgba(255,150,40,0)')
      g.fillStyle = r; g.fillRect(0, 0, w, h)
      kit.granella(g, w, h, 0.06, 0)
    })
    sopra = kit.strato(w, h, dpr, (g) => kit.vignetta(g, w, h, 0.45))
    // la pioggia di cifre: tre piani, ognuno un foglio alto due schermi che scorre (cifre a pixel del carattere di pzk os)
    pioggia = [[0.5, 0.05, 0.16, 11], [0.8, 0.09, 0.26, 23], [1.25, 0.15, 0.36, 37]].map(([k, vel, a, seme]) => {
      const r = kit.rng(seme), pd = Math.max(1, (w / 480) * 1.3 * k), passo = 9 * pd, colonne = Math.floor(w / (passo * 1.6))
      const c = kit.strato(w, h * 2, dpr, (g) => {
        for (let i = 0; i < colonne; i++) {
          if (r() < 0.35) continue
          const x = (i + r() * 0.5) * passo * 1.6, hex = r() < 0.25
          let y = r() * h * 2
          const n = 4 + Math.floor(r() * 10)
          for (let j = 0; j < n; j++) {
            const ch = hex ? '0123456789ABCDEF'[Math.floor(r() * 16)] : r() < 0.5 ? '0' : '1', gl = glifo(ch)
            g.fillStyle = `rgba(${j === n - 1 ? '190,255,245' : '0,184,169'},${a * (0.35 + (j / n) * 0.65) / 0.36})`
            for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 5; xx++) if (gl[yy][xx] === '#') g.fillRect(x + xx * pd, ((y + yy * pd) % (h * 2)), pd * 0.85, pd * 0.85)
            y += passo
          }
        }
      })
      return { c, vel }
    })
    // la stampa della cattura vera
    const sw = w * 0.25, sh = sw * (412 / 804) + w * 0.05
    stampa = { w: sw + 24, h: sh + 24 }
    stampa.c = kit.strato(stampa.w, stampa.h, dpr, (g) => {
      g.translate(12, 12)
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 3
      g.fillStyle = '#f4efe1'; g.fillRect(0, 0, sw, sh)
      g.shadowColor = 'transparent'
      const fw = sw - w * 0.016, fh = fw * (412 / 804), fx = w * 0.008, fy = w * 0.008
      if (cattura) g.drawImage(cattura, 238, 124, 804, 412, fx, fy, fw, fh)
      else { g.fillStyle = '#ff902a'; g.fillRect(fx, fy, fw, fh) }
      g.strokeStyle = 'rgba(208,32,28,.9)'; g.lineWidth = Math.max(1.2, w * 0.004); g.lineCap = 'round'
      g.beginPath(); g.ellipse(fx + fw * 0.86, fy + fh * 0.62, fw * 0.12, fh * 0.07, 0.05, 0.3, Math.PI * 2.15); g.stroke()
      g.fillStyle = '#c0201c'
      g.font = `400 ${Math.max(7, w * 0.023)}px "Permanent Marker"`
      g.textBaseline = 'middle'
      g.fillText('42 = 10 1010 · 19.11', fx + 2, fy + fh + (sh - fh - fy) / 2)
    })
    // le cifre che volano: 0 e 1 a pixel, accese
    const pd = w * 0.0075
    for (const ch of ['0', '1']) {
      bitC[ch] = kit.strato(pd * 9, pd * 11, dpr, (g) => {
        const gl = glifo(ch)
        g.shadowColor = 'rgba(120,255,240,.95)'; g.shadowBlur = pd * 2
        g.fillStyle = '#d8fff9'
        for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (gl[y][x] === '#') g.fillRect(pd * 2 + x * pd, pd * 2 + y * pd, pd * 0.9, pd * 0.9)
      })
    }
    bitC.pd = pd
    // l'alone delle lampadine, fatto una volta
    const al = (c) => kit.strato(64, 64, 1, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${c},.55)`); r.addColorStop(1, `rgba(${c},0)`); g.fillStyle = r; g.fillRect(0, 0, 64, 64) })
    alone = { acqua: al('90,255,230'), rosso: al('255,70,60') }
  }

  // ── l'lcd: la lista o i passaggi, secondo il momento del giro ──
  function disegnaLista(l, R, sel, testo, scrive, lampo) {
    const vis = 8, n = R.length
    const da = Math.max(0, Math.min(sel - vis + 1, n - vis))
    const conBarra = n > vis, w = LW - 12 - (conBarra ? 8 : 0)
    for (let i = 0; i < vis && da + i < n; i++) {
      const k = da + i, y = 34 + i * 10, on = k === sel, r = R[k], c = on ? l.fondo : LC.ink, x0 = 10, ww = w - 8
      if (on) l.riempi(6, y, w, 9)
      l.testo(x0, y + 1, corto(r.nome, r.val ? 18 : 37), { col: c })
      if (!r.val && !r.numero) continue
      const spazio = Math.floor((ww - larg(corto(r.nome, 18)) - 10) / 6)
      if (r.gira) {
        const s = corto(r.val, spazio - 4)
        if (on) l.destra(x0 + ww, y + 1, `◀ ${s} ▶`, { col: c }); else l.destra(x0 + ww, y + 1, s, { col: c })
        continue
      }
      if (r.numero) {
        if (!testo) { const mm = 'scrivi un numero'; l.destra(x0 + ww, y + 1, mm, { col: c }); if (on && lampo) l.testo(x0 + ww - larg(mm) - 7, y + 1, '_', { col: c }); continue }
        l.destra(x0 + ww - 7, y + 1, testo, { col: c })
        if (on && lampo) l.testo(x0 + ww - 6, y + 1, '_', { col: c })
        continue
      }
      const v = [...r.val], quanti = r.risultato ? Math.ceil((v.length * scrive) / 4) : v.length
      const s = corto(v.slice(0, quanti).join(''), spazio)
      l.destra(x0 + ww, y + 1, s, { col: c })
      if (r.segno && s[0] === '1') { const xs = x0 + ww - larg(s); l.riempi(xs - 1, y, 7, 9, LC.rosso); l.testo(xs, y + 1, '1', { col: LC.bianco }) }
    }
    if (conBarra) {
      const hb = Math.max(6, Math.round((80 * vis) / n))
      l.vert(LW - 9, 34, 79)
      l.riempi(LW - 10, 34 + Math.round(((79 - hb) * sel) / Math.max(1, n - 1)), 3, hb)
    }
    l.centro(LH - 9, R[sel]?.aiuto ?? '↑↓ righe')
  }
  function disegnaPassi(l, RP, quante, giu, leggi) {
    // leggi: la riga della tabella (dall'alto) il cui resto si sta leggendo, o -1
    const out = []
    for (let i = 0; i < 9; i++) {
      const k = giu + i
      if (k >= quante || k >= RP.length) break
      const r = RP[k], y = 34 + i * 9
      if (r.tipo === 'titolo') { l.riempi(8, y - 1, 232, 9, LC.blu); l.testo(10, y, r.s, { col: LC.bianco }) }
      else {
        l.testo(10, y, r.s)
        if (r.seg) {
          const s = [...r.s].slice(r.seg[0], r.seg[0] + r.seg[1]).join(''), x = 10 + r.seg[0] * 6, accesa = k === leggi
          l.riempi(x - 1, y - 1, larg(s) + 2, 9, accesa ? LC.giallo : LC.blu); l.testo(x, y, s, { col: accesa ? LC.nero : LC.bianco })
          out.push({ k, x: x + larg(s) / 2, y: y + 3 })
        }
      }
    }
    l.centro(LH - 9, RP.length > 9 ? '↑↓ legge • ←→ base • OK torna' : '←→ base • OK torna')
    return out
  }

  let chiave = '', resti = []
  const api = { titolo: true, fermo: 7.5, ridimensiona: rifai, frame: fotogramma(m, disegna) }
  return api

  function disegna(t) {
    const { g, w, h, dpr } = m, su = m.su
    if (w !== W || h !== H || !fondo) rifai(w, h)
    const giro = Math.floor(t / CICLO), ph = t - giro * CICLO
    const curs = su > 0.5
    const numero = curs ? '-42' : NUMERI[giro % NUMERI.length], bit = curs ? 16 : 0
    const x = leggi(numero, 10)

    // ── il momento del giro ──
    // 0–0.5 vuota · 0.5→ le cifre una a una · poi ↓ sulle righe · 5.6 OK: i passaggi · 9 i resti letti dal basso · 12.6 torna
    const R = righe(numero, bit)
    let pagina = 'lista', testo = numero, sel = 0, scrive = 4
    const digita = 0.5 + numero.length * 0.28
    if (!curs) {
      if (ph < 0.5) testo = ''
      else if (ph < digita) testo = numero.slice(0, Math.floor((ph - 0.5) / 0.28) + 1)
      if (ph >= 0.5 && ph < digita + 0.3) scrive = Math.min(4, Math.floor(Math.max(0, ph - 0.5 - Math.min(numero.length - 1, Math.floor((ph - 0.5) / 0.28)) * 0.28) / 0.07)) // (a ogni cifra i risultati si riscrivono da sinistra)
      if (ph >= digita + 0.6) sel = Math.min(R.length - 1, Math.floor((ph - digita - 0.6) / 0.3))
      if (ph >= 5.6 && ph < 12.6) pagina = 'passi'
    } else sel = R.findIndex((r) => r.segno) // il complemento a 2: la riga dei 16 bit
    if (sel < 0) sel = 0
    const RP = righePassi(numero, 2)
    const nTab = RP.filter((r) => r.seg).length
    const primaTab = RP.findIndex((r) => r.seg)
    let quante = RP.length, giu = 0, leggiRiga = -1
    if (pagina === 'passi') {
      quante = Math.min(RP.length, 1 + Math.floor((ph - 5.6) / 0.2))
      giu = Math.max(0, Math.min(quante, RP.length) - 9)
      const kl = Math.floor((ph - 9) / 0.32) // i resti letti dal basso in alto
      if (ph >= 9 && kl < nTab) leggiRiga = primaTab + nTab - 1 - kl
    }
    const k = `${pagina}|${testo}|${sel}|${scrive}|${quante}|${giu}|${leggiRiga}|${Math.floor(t * 2.5) % 2}|${curs}`
    if (k !== chiave) {
      chiave = k
      lcd.pulisci()
      barra(lcd, '18:59', 'ospite')
      if (pagina === 'lista') { testata(lcd, ic, 'bin•hex'); disegnaLista(lcd, R, sel, testo, scrive, Math.floor(t * 2.5) % 2 === 0) }
      else { testata(lcd, ic, 'verso binario', 4, 1); resti = disegnaPassi(lcd, RP, quante, giu, leggiRiga) }
      vetro.aggiorna()
    }

    // ── lo sfondo, la pioggia ──
    kit.metti(g, fondo, 0, 0, w, h)
    const acc = 1 + su * 1.5
    for (const p of pioggia) {
      const y = ((t * p.vel * h * acc) % (h * 2)) - h * 2
      g.drawImage(p.c, 0, y, w, h * 2); g.drawImage(p.c, 0, y + h * 2, w, h * 2)
    }

    // ── la stampa vera in alto a destra ──
    g.save(); g.translate(w * 0.85, h * 0.255 - su * h * 0.02); g.rotate(-0.06 + Math.sin(t * 0.6) * 0.008 - su * 0.03)
    g.drawImage(stampa.c, -stampa.w / 2, -stampa.h / 2, stampa.w, stampa.h)
    kit.nastro(g, 0, -stampa.h / 2 + 12, w * 0.09, w * 0.024, 0.06)
    g.restore()

    // ── il registro: le lampadine dei bit, in basso a sinistra ──
    const nb = curs ? 16 : Math.max(8, Math.ceil(intIn(x.int ?? 0n, 2).length / 4) * 4)
    const val = curs ? c2(x, 16) : x.int ?? 0n
    const rx = w * 0.04, rw = w * 0.32, ry = h * 0.78, cella = rw / nb, rr = Math.min(cella * 0.4, h * 0.036)
    g.fillStyle = 'rgba(2,14,14,.85)'; kit.tondo(g, rx - cella * 0.35, ry - rr * 2 - h * 0.075, rw + cella * 0.7, rr * 4 + h * 0.135, 6); g.fill()
    g.strokeStyle = 'rgba(0,184,169,.35)'; g.lineWidth = 1; g.stroke()
    // i voli: dal resto letto (o dall'esito) alla sua lampadina
    const bin = val.toString(2).padStart(nb, '0')
    const L = []
    for (let i = 0; i < nb; i++) L.push([rx + cella * (i + 0.5), ry])
    const voli = []
    const t0 = 9 // i resti dal basso: il più significativo per primo
    for (let j = 0; j < nb; j++) {
      const bitN = nb - 1 - j // il bit di quella lampadina (0 = l'ultimo a destra)
      voli[j] = curs ? -1 : t0 + (nTab - 1 - bitN) * 0.32 + 0.75 // quando arriva
    }
    for (let i = 0; i < nb; i++) {
      const on = bin[i] === '1', arrivato = curs || (ph >= voli[i] && ph < 13.2)
      const acceso = on && arrivato, segno = curs && i === 0 && on
      const [lx, ly] = L[i]
      if (acceso) g.drawImage(segno ? alone.rosso : alone.acqua, lx - rr * 2.6, ly - rr * 2.6, rr * 5.2, rr * 5.2)
      g.fillStyle = acceso ? (segno ? '#ff6a5a' : '#c8fff6') : 'rgba(0,184,169,.16)'
      g.beginPath(); g.arc(lx, ly, rr, 0, Math.PI * 2); g.fill()
      if (acceso) { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(lx - rr * 0.3, ly - rr * 0.3, rr * 0.3, 0, Math.PI * 2); g.fill() }
      if ((nb - 1 - i) % 4 === 0 && i < nb - 1) { g.fillStyle = 'rgba(0,184,169,.3)'; g.fillRect(lx + cella * 0.5 - 0.5, ly - rr, 1, rr * 2) }
    }
    // sopra le lampadine: il numero nelle tre scritture, quando l'ultimo bit è arrivato (o col complemento a 2)
    const fatto = curs ? 1 : kit.smooth(voli[nb - 1], voli[nb - 1] + 0.3, ph) * (ph < 13.2 ? 1 : 0)
    if (fatto > 0) {
      const sc = curs ? `0x${intIn(val, 16)} = ${numero}` : `${numero} = 0b${intIn(val, 2)} = 0x${intIn(val, 16)}`
      kit.scritta(g, sc, rx + rw / 2, ry - rr - h * 0.03, { font: 'gg mono', size: Math.max(7, h * 0.042) * (0.9 + 0.1 * fatto), color: `rgba(${curs ? '255,140,120' : '200,255,248'},${fatto})`, align: 'center', peso: 700 })
    }
    const pesi = curs ? 'segno · 16 bit, compl. a 2' : nb === 8 ? '128  64  32  16   8   4   2   1' : `${nb} bit · 2^${nb - 1} … 2^0`
    kit.scritta(g, pesi, rx + rw / 2, ry + rr + h * 0.045, { font: 'gg mono', size: Math.max(7, h * 0.034), color: 'rgba(160,255,240,.6)', align: 'center' })

    // ── il pannello con bin·hex ──
    const pw = w * (0.575 + su * 0.05), ph2 = pw * (412 / 804)
    const pcx = w * 0.64 - su * w * 0.02, pcy = h * 0.68 - su * h * 0.025 + Math.sin(t * 0.7 + 1) * h * 0.006
    const gira = (-0.18 + Math.sin(t * 0.3) * 0.04) * (1 - su * 0.85), rot = 0.03 * (1 - su * 0.6) + Math.sin(t * 0.45) * 0.004
    const Q = angoli(pcx, pcy, pw, ph2, gira, rot, 0.1 * (1 - su))
    const colpo = ph - 9
    const fl = !curs && colpo > 0 && colpo < nTab * 0.32 + 0.6 ? 0.5 + 0.5 * Math.sin(colpo * 20) : 0
    const lum = g.createRadialGradient(pcx, pcy, 0, pcx, pcy, pw * 0.75)
    lum.addColorStop(0, `rgba(255,150,40,${0.16 + su * 0.06})`); lum.addColorStop(1, 'rgba(255,150,40,0)')
    g.fillStyle = lum; g.fillRect(pcx - pw * 0.8, pcy - pw * 0.8, pw * 1.6, pw * 1.6)
    const spegne = curs ? 0 : ph > 13.4 ? kit.smooth(13.4, 13.95, ph) : ph < 0.2 ? 1 - ph / 0.2 : 0
    const Lq = pannello(g, Q, vetro, dpr, { luce: 1 - spegne * 0.7, riflesso: kit.fract(t * 0.05 + 0.4) * 1.6 - 0.2, lampo: fl * 0.25 })

    // ── i bit che volano fuori dallo schermo ──
    if (!curs && ph > t0 && ph < 13) {
      for (let i = 0; i < nb; i++) {
        const arr = voli[i], parte = arr - 0.75, kk = (ph - parte) / 0.75
        if (kk <= 0 || kk >= 1 || i < nb - nTab) continue
        // da dove parte: il resto che si sta leggendo (in fondo alla tabella, sullo schermo)
        const rg = resti.find((r) => r.k === primaTab + (nb - 1 - i)) ?? resti[resti.length - 1] ?? { x: 200, y: 90 }
        const o = nelQuad(Lq, rg.x / LW, rg.y / LH), d = L[i], e = kit.ease.inOut(kk)
        const xx = kit.lerp(o[0], d[0], e), yy = kit.lerp(o[1], d[1], e) - Math.sin(kk * Math.PI) * h * 0.22
        const sz = bitC.pd * 9 * (0.7 + Math.sin(kk * Math.PI) * 0.9)
        g.globalAlpha = Math.min(1, kk * 4)
        g.drawImage(bitC[bin[i]], xx - sz / 2, yy - sz * 0.6, sz, sz * 11 / 9)
        g.globalAlpha = 1
      }
    }
    kit.metti(g, sopra, 0, 0, w, h)
  }
}
