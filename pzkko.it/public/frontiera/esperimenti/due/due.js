// due.js — «Due schede»: Pong fra due schede dello stesso browser.
//
// Tecnologia: BroadcastChannel. La prima scheda che arriva prende il campo e
// simula la partita; la seconda diventa la racchetta di destra e manda solo la
// posizione. Se resta sola, il campo gioca contro un muro che insegue la palla.
// Nessun server, nessun WebSocket, nessun account: le due schede si parlano
// dentro lo stesso browser.
//
//   apri()  apre il campo

import { creaDialogo, copia } from '../../shell.js'

const W = 900
const H = 520
const MURO = 18
const RAC = { w: 14, h: 92 }
const PALLA = { r: 9 }
const VITTORIA = 7
const CANALE = 'pzkko-lab-due'

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'due',
    titolo: 'Due schede',
    tech: 'BroadcastChannel',
    voce: 'Pong fra due schede dello stesso browser: una tiene il campo, l\'altra è la racchetta. Senza server, senza account.',
    larga: true,
    corpo: `
      <div class="lab-colonna">
        <div class="lab-riga lab-riga--tra">
          <div class="lab-riga">
            <span class="lab-badge" data-ruolo>in attesa…</span>
            <span class="lab-badge lab-badge--acceso" data-ospite hidden>seconda scheda collegata</span>
          </div>
          <div class="lab-riga">
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-apri-scheda>apri un'altra scheda</button>
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-copia>copia link</button>
            <button type="button" class="lab-tasto lab-tasto--piccolo" data-rigioca>rigioca</button>
          </div>
        </div>
        <div class="lab-telecamera lab-due-tela">
          <canvas class="lab-tela" width="${W}" height="${H}" tabindex="0" data-focus aria-label="il campo da pong"></canvas>
        </div>
        <div class="lab-riga lab-riga--tra">
          <p class="lab-nota"><b>Come si gioca:</b> il campo si muove con <b>W/S</b> o col puntatore; la racchetta con <b>frecce</b> o col puntatore. Se nessuno entra, il muro gioca da solo. Apri un'altra scheda su <b>/frontiera/#due</b> per il secondo giocatore.</p>
          <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-prendi hidden>prendi il campo</button>
        </div>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const tela = d.corpo.querySelector('canvas')
  const ctx = tela.getContext('2d')
  const badge = d.corpo.querySelector('[data-ruolo]')
  const badgeOspite = d.corpo.querySelector('[data-ospite]')
  if (!('BroadcastChannel' in window)) {
    d.nota('questo browser non ha BroadcastChannel', 'male')
    d.apri()
    return d
  }

  const canale = new BroadcastChannel(CANALE)
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  let ruolo = 'attesa' // attesa · host · ospite
  let ospiteId = null
  let ultimoOspite = 0
  let ultimoStato = 0
  let perso = false
  let raf = 0
  let fermo = false
  let ultimo = performance.now()
  let ultimoInvio = 0
  let p2locale = H / 2
  let attesaHost = 0
  let battito = 0
  const tasti = { su: false, giu: false, su2: false, giu2: false }

  const S = {
    p1: H / 2,
    p2: H / 2,
    p2Target: H / 2,
    palla: { x: W / 2, y: H / 2, vx: 5.4, vy: 2.7, r: PALLA.r },
    s1: 0,
    s2: 0,
    over: false,
    winner: 0,
  }

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

  function aggiornaBadge() {
    if (!badge) return
    badge.classList.toggle('lab-badge--acceso', ruolo !== 'attesa')
    if (ruolo === 'host') {
      badge.textContent = ospiteId ? 'campo · due giocatori' : 'campo · gioca il muro'
      badgeOspite.hidden = !ospiteId
    } else if (ruolo === 'ospite') {
      badge.textContent = 'racchetta · sei a destra'
      badgeOspite.hidden = true
    } else {
      badge.textContent = 'in attesa…'
      badgeOspite.hidden = true
    }
  }

  function resetPalla(dir = Math.random() < 0.5 ? -1 : 1) {
    const p = S.palla
    p.x = W / 2
    p.y = H / 2
    const ang = (Math.random() * 0.68 - 0.34) * Math.PI
    p.vx = Math.cos(ang) * 5.4 * dir
    p.vy = Math.sin(ang) * 5.4
  }

  function reset() {
    S.s1 = 0
    S.s2 = 0
    S.over = false
    S.winner = 0
    S.p1 = H / 2
    S.p2 = H / 2
    S.p2Target = H / 2
    p2locale = H / 2
    resetPalla()
  }

  function diventaHost() {
    if (ruolo === 'host') return
    clearTimeout(attesaHost)
    ruolo = 'host'
    ospiteId = null
    perso = false
    reset()
    invia({ t: 'sono' })
    aggiornaBadge()
    d.nota('hai il campo · aspetto la seconda scheda', 'ok')
  }

  function diventaOspite() {
    if (ruolo === 'ospite') return
    clearTimeout(attesaHost)
    ruolo = 'ospite'
    ospiteId = null
    perso = false
    ultimoStato = 0
    invia({ t: 'entra' })
    aggiornaBadge()
    d.nota('sei la racchetta · muoviti con le frecce', 'ok')
  }

  function invia(msg) {
    try { canale.postMessage({ ...msg, id }) } catch {}
  }

  function inviaInput(forza = false) {
    if (ruolo !== 'ospite') return
    const now = performance.now()
    if (!forza && now - ultimoInvio < 26) return
    ultimoInvio = now
    invia({ t: 'input', y: p2locale })
  }

  function applicaStato(s) {
    if (!s) return
    S.p1 = s.p1
    S.p2 = s.p2
    S.palla.x = s.x
    S.palla.y = s.y
    S.s1 = s.s1
    S.s2 = s.s2
    S.over = s.over
    S.winner = s.winner
  }

  function stato() {
    return {
      p1: S.p1, p2: S.p2,
      x: S.palla.x, y: S.palla.y,
      s1: S.s1, s2: S.s2,
      over: S.over, winner: S.winner,
    }
  }

  function aggiorna(dt) {
    if (S.over) return
    const k = clamp(dt / 16.6667, 0.1, 2.4)
    const mezzo = RAC.h / 2

    // la racchetta sinistra (il campo)
    let v = 0
    if (tasti.su) v -= 1
    if (tasti.giu) v += 1
    S.p1 = clamp(S.p1 + v * 7.4 * k, mezzo, H - mezzo)

    // la racchetta destra: il secondo giocatore, le frecce, o il muro
    if (ospiteId) {
      S.p2 = clamp(S.p2 + (S.p2Target - S.p2) * Math.min(1, 0.4 * k), mezzo, H - mezzo)
    } else {
      let v2 = 0
      if (tasti.su2) v2 -= 1
      if (tasti.giu2) v2 += 1
      if (v2) {
        S.p2 = clamp(S.p2 + v2 * 7.4 * k, mezzo, H - mezzo)
      } else {
        const bersaglio = S.palla.y + Math.sin(performance.now() / 900) * 16
        const max = 5.5 * k
        S.p2 = clamp(S.p2 + clamp(bersaglio - S.p2, -max, max), mezzo, H - mezzo)
      }
    }

    const p = S.palla
    p.x += p.vx * k
    p.y += p.vy * k

    if (p.y - p.r < 0) { p.y = p.r; p.vy = Math.abs(p.vy) }
    if (p.y + p.r > H) { p.y = H - p.r; p.vy = -Math.abs(p.vy) }

    // sinistra
    if (p.vx < 0 && p.x - p.r <= MURO + RAC.w && p.x - p.r >= MURO - 10 && Math.abs(p.y - S.p1) <= mezzo + p.r) {
      p.x = MURO + RAC.w + p.r
      p.vx = Math.abs(p.vx) * 1.035
      p.vy = clamp(p.vy + (p.y - S.p1) * 0.12, -7.8, 7.8)
    }
    // destra
    if (p.vx > 0 && p.x + p.r >= W - MURO - RAC.w && p.x + p.r <= W - MURO + 10 && Math.abs(p.y - S.p2) <= mezzo + p.r) {
      p.x = W - MURO - RAC.w - p.r
      p.vx = -Math.abs(p.vx) * 1.035
      p.vy = clamp(p.vy + (p.y - S.p2) * 0.12, -7.8, 7.8)
    }

    if (p.x < -p.r * 2) {
      S.s2++
      if (S.s2 >= VITTORIA) { S.over = true; S.winner = 2 } else resetPalla(1)
    } else if (p.x > W + p.r * 2) {
      S.s1++
      if (S.s1 >= VITTORIA) { S.over = true; S.winner = 1 } else resetPalla(-1)
    }
  }

  function rettangolo(x, y, w, h, r) {
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
    else ctx.rect(x, y, w, h)
    ctx.fill()
  }

  function testo(t, x, y, colore, font, allinea = 'center') {
    ctx.fillStyle = colore
    ctx.font = font
    ctx.textAlign = allinea
    ctx.textBaseline = 'middle'
    ctx.fillText(t, x, y)
  }

  function disegna() {
    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, W, H)

    // griglia
    ctx.strokeStyle = 'rgba(204,255,0,.055)'
    ctx.lineWidth = 1
    for (let x = 0; x <= W; x += W / 18) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y <= H; y += H / 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // linea di metà campo
    ctx.setLineDash([10, 12])
    ctx.strokeStyle = 'rgba(255,255,255,.14)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.setLineDash([])

    // punteggio
    ctx.globalAlpha = 0.18
    testo(String(S.s1), W / 2 - 70, 64, '#ccff00', '800 64px "Lab Sans", sans-serif')
    testo(String(S.s2), W / 2 + 70, 64, '#9d00ff', '800 64px "Lab Sans", sans-serif')
    ctx.globalAlpha = 1

    // racchette
    ctx.shadowColor = 'rgba(204,255,0,.75)'
    ctx.shadowBlur = 16
    ctx.fillStyle = '#ccff00'
    rettangolo(MURO, S.p1 - RAC.h / 2, RAC.w, RAC.h, 7)
    ctx.shadowColor = 'rgba(157,0,255,.8)'
    ctx.fillStyle = '#9d00ff'
    rettangolo(W - MURO - RAC.w, S.p2 - RAC.h / 2, RAC.w, RAC.h, 7)

    // palla
    const p = S.palla
    ctx.shadowColor = 'rgba(255,255,255,.9)'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // chi sei
    if (ruolo === 'host') {
      testo('tu', MURO + RAC.w + 16, S.p1, 'rgba(204,255,0,.9)', '700 11px "Lab Mono", monospace')
      testo(ospiteId ? 'ospite' : 'muro', W - MURO - RAC.w - 16, S.p2, 'rgba(195,150,255,.8)', '700 11px "Lab Mono", monospace', 'right')
    } else if (ruolo === 'ospite') {
      testo('tu', W - MURO - RAC.w - 16, S.p2, 'rgba(195,150,255,.95)', '700 11px "Lab Mono", monospace', 'right')
      testo('campo', MURO + RAC.w + 16, S.p1, 'rgba(204,255,0,.8)', '700 11px "Lab Mono", monospace')
    }

    // attese e fine partita
    if (ruolo === 'attesa') {
      velo('cerco il campo…')
    } else if (ruolo === 'ospite' && !ultimoStato) {
      velo('aspetto il campo…')
    } else if (S.over) {
      velo(`partita finita · ${S.s1} – ${S.s2}`)
    }
    if (perso) velo('il campo non risponde · prendi il campo')
  }

  function velo(t) {
    ctx.fillStyle = 'rgba(5,7,10,.72)'
    ctx.fillRect(0, 0, W, H)
    testo(t, W / 2, H / 2, '#e9f2e4', '700 20px "Lab Mono", monospace')
    testo('premi «rigioca» per ricominciare', W / 2, H / 2 + 32, 'rgba(167,179,166,.9)', '400 12px "Lab Mono", monospace')
  }

  function giro(now) {
    if (fermo) return
    raf = requestAnimationFrame(giro)
    const dt = Math.min(50, now - ultimo)
    ultimo = now

    if (ruolo === 'host') {
      aggiorna(dt)
      invia({ t: 'stato', s: stato() })
    } else if (ruolo === 'ospite') {
      let v = 0
      if (tasti.su2) v -= 1
      if (tasti.giu2) v += 1
      if (v) {
        p2locale = clamp(p2locale + v * 7.4 * (dt / 16.6667), RAC.h / 2, H - RAC.h / 2)
        inviaInput()
      }
      if (!perso && ultimoStato && now - ultimoStato > 2600) {
        perso = true
        d.nota('il campo non risponde più: puoi prendere il campo', 'attesa')
        d.corpo.querySelector('[data-prendi]').hidden = false
      }
    }
    disegna()
  }

  // ── i messaggi delle schede ──────────────────────────────────────────────
  canale.onmessage = (e) => {
    const m = e.data
    if (!m || m.id === id) return
    switch (m.t) {
      case 'ciao':
        if (ruolo === 'host') invia({ t: 'sono' })
        break
      case 'sono':
        if (ruolo === 'attesa') diventaOspite()
        else if (ruolo === 'host' && m.id < id) diventaOspite()
        break
      case 'entra':
        if (ruolo === 'host') {
          ospiteId = m.id
          ultimoOspite = performance.now()
          invia({ t: 'stato', s: stato() })
          aggiornaBadge()
          d.nota('seconda scheda collegata · si gioca in due', 'ok')
        }
        break
      case 'stato':
        if (ruolo === 'ospite') {
          applicaStato(m.s)
          ultimoStato = performance.now()
          if (perso) {
            perso = false
            d.corpo.querySelector('[data-prendi]').hidden = true
            d.nota('sei la racchetta · muoviti con le frecce', 'ok')
          }
        }
        break
      case 'input':
        if (ruolo === 'host' && m.id === ospiteId) {
          S.p2Target = clamp(Number(m.y) || H / 2, RAC.h / 2, H - RAC.h / 2)
          ultimoOspite = performance.now()
        }
        break
      case 'ping':
        if (ruolo === 'host' && m.id === ospiteId) ultimoOspite = performance.now()
        break
      case 'esce':
        if (ruolo === 'host' && m.id === ospiteId) {
          ospiteId = null
          aggiornaBadge()
          d.nota('la seconda scheda è uscita · gioca il muro', 'attesa')
        }
        break
      case 'rigioca':
        if (ruolo === 'host') {
          reset()
          invia({ t: 'stato', s: stato() })
        }
        break
    }
  }

  // ── i comandi ────────────────────────────────────────────────────────────
  const punto = (e) => {
    const r = tela.getBoundingClientRect()
    return clamp(((e.clientY - r.top) / Math.max(1, r.height)) * H, RAC.h / 2, H - RAC.h / 2)
  }
  tela.addEventListener('pointermove', (e) => {
    const y = punto(e)
    if (ruolo === 'host') S.p1 = y
    else if (ruolo === 'ospite') { p2locale = y; inviaInput() }
  })
  tela.addEventListener('pointerdown', (e) => {
    try { tela.setPointerCapture(e.pointerId) } catch {}
    const y = punto(e)
    if (ruolo === 'host') S.p1 = y
    else if (ruolo === 'ospite') { p2locale = y; inviaInput(true) }
  })

  const giu = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.target.closest('input, textarea, select, button')) return
    const k = e.key
    if (k === 'w' || k === 'W') { tasti.su = true; e.preventDefault() }
    else if (k === 's' || k === 'S') { tasti.giu = true; e.preventDefault() }
    else if (k === 'ArrowUp') { tasti.su2 = true; e.preventDefault() }
    else if (k === 'ArrowDown') { tasti.giu2 = true; e.preventDefault() }
  }
  const su = (e) => {
    const k = e.key
    if (k === 'w' || k === 'W') tasti.su = false
    else if (k === 's' || k === 'S') tasti.giu = false
    else if (k === 'ArrowUp') tasti.su2 = false
    else if (k === 'ArrowDown') tasti.giu2 = false
  }
  document.addEventListener('keydown', giu)
  document.addEventListener('keyup', su)

  d.corpo.addEventListener('click', (e) => {
    if (e.target.closest('[data-apri-scheda]')) {
      const w = window.open(`${location.origin}/frontiera/#due`, '_blank', 'noopener')
      if (!w) d.nota('il browser ha bloccato la scheda: aprila a mano su /frontiera/#due', 'male')
      return
    }
    if (e.target.closest('[data-copia]')) {
      copia(`${location.origin}/frontiera/#due`).then((ok) => d.nota(ok ? 'link copiato' : 'non riesco a copiare', ok ? 'ok' : 'male'))
      return
    }
    if (e.target.closest('[data-rigioca]')) {
      if (ruolo === 'host') { reset(); invia({ t: 'stato', s: stato() }) }
      else if (ruolo === 'ospite') invia({ t: 'rigioca' })
      else diventaHost()
      return
    }
    if (e.target.closest('[data-prendi]')) {
      diventaHost()
      d.corpo.querySelector('[data-prendi]').hidden = true
    }
  })

  // ── il battito e l'uscita ────────────────────────────────────────────────
  attesaHost = setTimeout(() => { if (ruolo === 'attesa') diventaHost() }, 650)
  invia({ t: 'ciao' })

  battito = setInterval(() => {
    if (ruolo === 'ospite') invia({ t: 'ping' })
    if (ruolo === 'host' && ospiteId && performance.now() - ultimoOspite > 3200) {
      ospiteId = null
      aggiornaBadge()
      d.nota('la seconda scheda non risponde · gioca il muro', 'attesa')
    }
  }, 1000)

  const esci = () => {
    try { invia({ t: 'esce' }) } catch {}
  }
  window.addEventListener('pagehide', esci)

  d.suPulizia(() => {
    fermo = true
    cancelAnimationFrame(raf)
    clearTimeout(attesaHost)
    clearInterval(battito)
    document.removeEventListener('keydown', giu)
    document.removeEventListener('keyup', su)
    window.removeEventListener('pagehide', esci)
    esci()
    canale.close()
  })

  d.apri()
  aggiornaBadge()
  disegna()
  raf = requestAnimationFrame(giro)
  return d
}
