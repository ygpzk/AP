// Giugnoh's Cast sulla tv: la pagina che si muove. Scritto «vecchio» (niente ?. ??, niente moduli), perché il browser
// delle tv è spesso indietro di qualche anno. I tempi dell'argomento e della fine sono quelli di cast.js, come in
// diretta; l'ora la dà il pc (la tv può avere l'orologio un po' avanti o indietro).
(function () {
  var C = window.Cast
  var $ = function (id) { return document.getElementById(id) }
  var corpo = document.body, palco = $('palco')
  var pc = null // il podcast, dal pc
  var scarto = 0 // ora del pc − ora della tv (ms)
  var adesso = function () { return Date.now() + scarto }
  var scrivi = function (e, t) { if (e && e.textContent !== t) e.textContent = t }
  var stili = function (e, k, v) { var c = e.__s || (e.__s = {}); if (c[k] !== v) { c[k] = v; e.style[k] = v } }

  // ── 4K: un rem è un decimo di pixel di uno schermo 3840 × 2160, qualunque sia lo schermo; il palco sta in mezzo ──
  function adatta() {
    var W = window.innerWidth, H = window.innerHeight, f = Math.min(W / 384, H / 216)
    document.documentElement.style.fontSize = f + 'px'
    palco.style.left = Math.round((W - 384 * f) / 2) + 'px'
    palco.style.top = Math.round((H - 216 * f) / 2) + 'px'
  }
  window.addEventListener('resize', adatta)
  adatta()

  // ── tiene lo schermo acceso: se il browser della tv supporta la Screen Wake Lock, la tv non va in sospensione per
  // inattività mentre questa pagina è in onda. Non può niente contro un timer di spegnimento impostato sulla tv. ──
  var sveglia = null
  function tieniSveglia() {
    if (!('wakeLock' in navigator) || document.hidden) return
    try {
      navigator.wakeLock.request('screen').then(function (l) {
        sveglia = l
        l.addEventListener('release', function () { sveglia = null })
      }).catch(function () {})
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tieniSveglia() })
  document.addEventListener('pointerdown', tieniSveglia)
  setTimeout(tieniSveglia, 1000)
  setInterval(function () { if (!sveglia) tieniSveglia() }, 30000)

  // ── le lettere: «Giugnoh's Cast» e «grazie a tutti!» ──
  function lettere(box, testo, bianche) {
    var h = '', n = 0
    for (var i = 0; i < testo.length; i++) {
      var c = testo[i]
      if (c === ' ') { h += '<i class="sp"></i>'; continue }
      h += '<span class="' + (bianche && i >= bianche ? 'b' : '') + '" style="--i:' + n + '">' + C.pulito(c) + '</span>'
      n++
    }
    box.innerHTML = h
  }
  lettere($('logo'), C.NOME, 10)
  lettere($('fi-grazie'), 'grazie a tutti!', 0)
  lettere($('s-logo-n'), C.NOME, 10) // (la schermata «solo il logo»)
  lettere($('s-nome-n'), 'Giugnoh', 0) // (la schermata «il nome»)

  // ── le barre ──
  var BARRE = 64, barre = [], eq = $('eq')
  for (var i = 0; i < BARRE; i++) { var b = document.createElement('i'); eq.appendChild(b); barre.push({ el: b, f: 1.3 + C.caso(i) * 2.6, g: C.caso(i + 50) * 6.28, h: -1 }) }
  var voce = 0, voceVuole = 0, voceAlle = 0

  // ── il nastro in basso: la puntata e gli argomenti ──
  function nastro() {
    var p = pc || {}, pezzi = ['<span class="m">' + C.pulito(C.NOME) + '</span>']
    var fase = C.fase(p)
    if (fase === 'onda') pezzi.push('<span>puntata ' + p.puntata + ' · in diretta</span>')
    else if (fase === 'finita') pezzi.push('<span>puntata ' + p.puntata + ' · finita, grazie a tutti</span>')
    else pezzi.push('<span>prossima puntata: n. ' + ((p.puntata || 0) + 1) + '</span>')
    var l = p.scaletta || []
    for (var i = 0; i < l.length; i++) pezzi.push('<span>' + (i + 1) + '. ' + C.pulito(l[i].testo) + '</span>')
    if (!l.length) pezzi.push('<span>il podcast di Giugnoh</span>', '<span>argomenti a caso, zero copione</span>')
    pezzi.push('<span>pzkko.it</span>')
    var h = pezzi.join('<i></i>') + '<i></i>'
    var s = $('scorre')
    if (s.__h === h) return
    s.__h = h
    s.innerHTML = h + h // (due volte: scorre in tondo senza salti)
    var w = s.scrollWidth / 2, rem = parseFloat(document.documentElement.style.fontSize) || 5
    s.style.animation = 'none'; void s.offsetWidth
    s.style.animation = 'scorre ' + Math.max(20, w / rem / 26).toFixed(1) + 's linear infinite'
  }

  // ── l'argomento: il rullo, lo stesso della diretta ──
  var RIGA = 30 // rem fra una voce e l'altra (= l'altezza di .voce in tv.css)
  var argo = $('argo'), nastri = argo.querySelectorAll('.nastro'), frecce = argo.querySelectorAll('.freccia')
  var rulloDi = 0, presoDi = 0
  function rullo(a) {
    var h = ''
    for (var i = 0; i < a.rullo.length; i++) h += '<div class="voce' + (i === a.indice ? ' scelta' : '') + '" style="top:' + (i * RIGA) + 'rem"><span>' + C.pulito(a.rullo[i]) + '</span></div>'
    for (var k = 0; k < nastri.length; k++) nastri[k].innerHTML = h
    $('titolo').textContent = a.testo
    stringi()
  }
  // le voci troppo larghe si stringono, il titolo sta in due righe al massimo
  function stringi() {
    var rem = parseFloat(document.documentElement.style.fontSize) || 5
    var vere = nastri[nastri.length - 1].children
    for (var i = 0; i < vere.length; i++) {
      var s = vere[i].firstChild
      s.style.fontSize = ''
      var w = s.offsetWidth / rem, f = w > 332 ? Math.max(11, 21 * 332 / w).toFixed(1) + 'rem' : '' // (la finestra del rullo è larga 348 rem: 384 − 3 − 3 − 15 − 15; 21 rem = .voce span in tv.css)
      for (var k = 0; k < nastri.length; k++) nastri[k].children[i].firstChild.style.fontSize = f
    }
    var t = $('titolo')
    t.style.fontSize = ''
    for (var g = 27; g > 12 && (t.offsetHeight / rem > g * 1.1 * 2 + 1 || t.scrollWidth / rem > 374); g -= 1) t.style.fontSize = (g - 1) + 'rem' // (27 rem e 372 rem: .titolo span in tv.css)
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (pc && pc.argomento) stringi(); nastro() })
  function faseRullo(t) { return t < C.GIRA_DA ? 'entra' : t < C.GIRA_FINO + 0.32 ? 'gira' : t < C.PRESO + 2.5 ? 'preso' : 'fermo' }
  function rulloGiro() {
    var a = pc && pc.argomento
    if (!a || corpo.getAttribute('data-argo') !== 'si') return
    var t = (adesso() - a.da) / 1000
    var fase = faseRullo(t)
    if (argo.getAttribute('data-rullo') !== fase) {
      argo.setAttribute('data-rullo', fase)
      if (fase === 'preso' && presoDi !== a.da) { presoDi = a.da; botto(a.da) }
    }
    if (fase === 'fermo') return
    var pos = C.posizione(t, a.indice), v = C.velocita(t, a.indice), y = -pos * RIGA - RIGA / 2
    stili(nastri[2], 'transform', 'translateY(' + y.toFixed(2) + 'rem)')
    var k = Math.min(1, Math.abs(v) / 12)
    stili(nastri[1], 'transform', 'translateY(' + (y + v * RIGA * 0.022).toFixed(2) + 'rem)'); stili(nastri[1], 'opacity', (k * 0.45).toFixed(2))
    stili(nastri[0], 'transform', 'translateY(' + (y + v * RIGA * 0.045).toFixed(2) + 'rem)'); stili(nastri[0], 'opacity', (k * 0.22).toFixed(2))
    var f = pos - Math.floor(pos), scatto = Math.exp(-f * 9) * Math.min(1, Math.abs(v) / 1.5)
    stili(frecce[0], 'transform', 'rotate(' + (-scatto * 26).toFixed(1) + 'deg)')
    stili(frecce[1], 'transform', 'scaleX(-1) rotate(' + (-scatto * 26).toFixed(1) + 'deg)')
  }
  // lo scatto: lampo su tutto lo schermo, la scritta che trema, i coriandoli
  function riparte(e, cl) { e.classList.remove(cl); void e.offsetWidth; e.classList.add(cl) }
  function botto(seme) {
    riparte(argo, 'botto'); riparte($('flash'), 'va')
    coriandoli(seme % 1000, 110, 150)
  }
  function coriandoli(seme, n, lontano) {
    var h = ''
    for (var i = 0; i < n; i++) {
      var a = C.caso(seme + i) * Math.PI * 2, d = lontano * (0.35 + C.caso(seme + i + 99) * 0.75)
      var dx = Math.cos(a) * d * 1.6, dy = Math.sin(a) * d * 0.7 - 30, r = Math.round(C.caso(seme + i + 7) * 1000 - 500)
      h += '<i style="--mx:' + (dx * 0.7).toFixed(1) + 'rem;--my:' + dy.toFixed(1) + 'rem;--mr:' + (r / 2) + 'deg;--dx:' + dx.toFixed(1) + 'rem;--dy:' + (dy + 90).toFixed(1) + 'rem;--r:' + r + 'deg;background:' + C.COLORI[i % C.COLORI.length] + ';animation-delay:' + (C.caso(seme + i + 5) * 0.15).toFixed(2) + 's;width:' + (2 + C.caso(seme + i + 3) * 3).toFixed(1) + 'rem"></i>'
    }
    var cor = $('cor'), g = document.createElement('div')
    g.innerHTML = h
    cor.appendChild(g)
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g) }, 2800)
  }

  // ── la fine ──
  var fineDi = 0
  function fine(p) {
    var l = p.scaletta || []
    var chiave = JSON.stringify(l.map(function (x) { return x.testo }))
    var s = $('fi-scorre')
    if (s.__c !== chiave) {
      s.__c = chiave
      var righe = ''
      for (var i = 0; i < l.length; i++) righe += '<div><b>' + (i + 1) + '</b>' + C.pulito(l[i].testo) + '</div>'
      if (!l.length) righe = '<div>niente argomenti a caso: solo chiacchiere</div>'
      s.innerHTML = '<div class="fi-lista">' + righe + '</div><div class="fi-lista">' + righe + '</div>'
      s.style.animationDuration = Math.max(9, l.length * 3) + 's'
      s.classList.toggle('ferma', l.length <= 3)
    }
    $('fi-dice').innerHTML = 'fine della puntata <b>' + p.puntata + '</b> di ' + C.pulito(C.NOME) + ' · alla prossima!'
    scrivi($('fi-ora'), C.ora(p.fine))
    if (fineDi !== p.fine) {
      fineDi = p.fine
      var t = (adesso() - p.fine) / 1000
      if (t < 3) { // (appena finita: le strisce, l'insegna che si spegne, le lettere che cadono, i coriandoli)
        riparte($('tenda'), 'va'); riparte(corpo, 'si-spegne'); riparte($('fine'), 'entra')
        setTimeout(function () { coriandoli(p.fine % 1000, 120, 170) }, 1300)
        setTimeout(function () { $('fine').classList.remove('entra') }, 4200) // (poi le lettere ondeggiano)
      } else $('fine').classList.remove('entra')
    }
  }
  function fineGiro() {
    if (!pc || !pc.fine) return
    var t = (adesso() - pc.fine) / 1000
    if (t > 4.5 && $('fi-durata').__fatto === pc.fine) return
    var k = Math.min(1, Math.max(0, (t - 1.3) / 1.8)), e = 1 - Math.pow(1 - k, 3)
    scrivi($('fi-durata'), C.tempo((pc.fine - (pc.inizio || pc.fine)) / 1000 * e))
    scrivi($('fi-n'), String(Math.round(((pc.scaletta || []).length) * e)))
    if (t > 4.5) $('fi-durata').__fatto = pc.fine
  }

  // ── le schermate scelte dalla regia: podcast, logo, ora, nome, parla, testo, meteo ──
  // una scritta grande quanto ci sta in un riquadro largo «w» e alto «h» (rem), fra «min» e «max» rem
  function grandeQuanto(el, w, h, max, min) {
    var rem = parseFloat(document.documentElement.style.fontSize) || 5, lo = min, hi = max
    for (var k = 0; k < 16; k++) {
      var m = (lo + hi) / 2
      el.style.fontSize = m + 'rem'
      if (el.scrollWidth <= w * rem + 1 && el.scrollHeight <= h * rem + 1) lo = m; else hi = m
    }
    el.style.fontSize = lo.toFixed(2) + 'rem'
  }
  function misura() { // (dopo un cambio di testo, di schermo o dei caratteri)
    grandeQuanto($('s-ora-h').parentNode, 372, 140, 140, 20)
    grandeQuanto($('s-nome-n'), 372, 150, 130, 20)
    grandeQuanto($('s-parla-n'), 372, 110, 100, 12)
    grandeQuanto($('s-testo-n'), 372, 190, 120, 6)
  }
  window.addEventListener('resize', misura)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(misura)

  var METEO = {
    sole: '<svg class="raggi" viewBox="0 0 64 64"><g stroke="#ccff00" stroke-width="5" stroke-linecap="round"><path d="M32 5v8M32 51v8M5 32h8M51 32h8M12.9 12.9l5.7 5.7M45.4 45.4l5.7 5.7M12.9 51.1l5.7-5.7M45.4 18.6l5.7-5.7"/></g></svg><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="12.5" fill="#ccff00"/></svg>',
    luna: '<svg viewBox="0 0 64 64"><path d="M44 40.5A20 20 0 0 1 23.5 12a21 21 0 1 0 26.8 27.4 20 20 0 0 1-6.3 1.1z" fill="#ccff00"/><circle cx="46" cy="16" r="2.5" fill="#e2b3ff"/><circle cx="54" cy="27" r="1.8" fill="#e2b3ff"/></svg>',
    nuvolo: '<svg class="raggi" viewBox="0 0 64 64"><circle cx="23" cy="22" r="11" fill="#ccff00"/></svg><svg class="nuvola-su" viewBox="0 0 64 64"><path d="M20 52a11 11 0 0 1-1-21.9A15 15 0 0 1 48 31a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/></svg>',
    nuvole: '<svg viewBox="0 0 64 64"><path d="M30 34a9 9 0 0 1 0-18 12 12 0 0 1 23 2 8 8 0 0 1 1 16z" fill="#8f86a0"/></svg><svg class="nuvola-su" viewBox="0 0 64 64"><path d="M17 54a11 11 0 0 1-1-21.9A15 15 0 0 1 45 33a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/></svg>',
    nebbia: '<svg class="nuvola-su" viewBox="0 0 64 64"><path d="M20 34a11 11 0 0 1-1-21.9A15 15 0 0 1 48 13a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g stroke="#c9a3ff" stroke-width="5" stroke-linecap="round"><path d="M10 43h44M16 53h32"/></g></svg>',
    pioggia: '<svg class="nuvola-su" viewBox="0 0 64 64"><path d="M20 38a11 11 0 0 1-1-21.9A15 15 0 0 1 48 17a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g stroke="#8ea1ff" stroke-width="5" stroke-linecap="round"><path d="M22 46l-3 9M33 46l-3 9M44 46l-3 9"/></g></svg>',
    neve: '<svg class="nuvola-su" viewBox="0 0 64 64"><path d="M20 38a11 11 0 0 1-1-21.9A15 15 0 0 1 48 17a10.5 10.5 0 0 1 0 21z" fill="#f6f4f8"/><g fill="#c9e4ff"><circle cx="21" cy="50" r="3.6"/><circle cx="33" cy="54" r="3.6"/><circle cx="45" cy="50" r="3.6"/></g></svg>',
    temporale: '<svg class="nuvola-su" viewBox="0 0 64 64"><path d="M20 36a11 11 0 0 1-1-21.9A15 15 0 0 1 48 15a10.5 10.5 0 0 1 0 21z" fill="#8f86a0"/><path d="M35 33l-11 15h8l-4 13 13-17h-8z" fill="#ccff00"/></svg>'
  }
  var cieloM = document.createElement('div')
  cieloM.className = 'sc-m-cielo'
  $('s-meteo').insertBefore(cieloM, $('s-meteo').firstChild)
  var meteoTipo = '', schermoPrima = '', testoPrima = null, parlaPrima = null
  function meteo(m) {
    if (!m) return
    var tipo = METEO[m.icona] ? m.icona : 'nuvole'
    if (tipo !== meteoTipo) {
      meteoTipo = tipo
      $('s-m-ico').innerHTML = METEO[tipo]
      // il cielo dietro: la pioggia, la neve, le stelle (sempre uguali: C.caso)
      var h = '', i
      if (tipo === 'pioggia' || tipo === 'temporale') for (i = 0; i < 70; i++) h += '<i class="goccia" style="left:' + (C.caso(i) * 100).toFixed(1) + '%;animation-delay:' + (-C.caso(i + 50)).toFixed(2) + 's;animation-duration:' + (0.7 + C.caso(i + 9) * 0.4).toFixed(2) + 's"></i>'
      if (tipo === 'neve') for (i = 0; i < 60; i++) h += '<i class="fiocco" style="left:' + (C.caso(i) * 100).toFixed(1) + '%;animation-delay:' + (-C.caso(i + 50) * 9).toFixed(2) + 's;animation-duration:' + (7 + C.caso(i + 9) * 5).toFixed(2) + 's"></i>'
      if (tipo === 'luna') for (i = 0; i < 40; i++) h += '<i class="stella" style="left:' + (C.caso(i) * 100).toFixed(1) + '%;top:' + (C.caso(i + 20) * 90).toFixed(1) + '%;animation-delay:' + (-C.caso(i + 40) * 3).toFixed(2) + 's"></i>'
      cieloM.innerHTML = h
    }
    scrivi($('s-m-gradi'), m.gradi + '°')
    scrivi($('s-m-citta'), m.nome || 'Mantova')
    scrivi($('s-m-testo'), m.testo || '')
    scrivi($('s-m-min'), m.min + '°'); scrivi($('s-m-max'), m.max + '°')
    scrivi($('s-m-perc'), (m.percepiti == null ? m.gradi : m.percepiti) + '°'); scrivi($('s-m-vento'), String(m.vento))
  }
  function schermate(p) {
    var S = p.schermo || { s: 'podcast' }
    corpo.setAttribute('data-schermo', S.s)
    var cambia = false
    if (S.testo !== testoPrima) { testoPrima = S.testo; $('s-testo-n').textContent = S.testo || 'Giugnoh'; cambia = true }
    var chi = S.parla || 'Giugnoh'
    if (chi !== parlaPrima) { parlaPrima = chi; $('s-parla-n').textContent = chi; cambia = true }
    if (S.s !== schermoPrima) { schermoPrima = S.s; cambia = true }
    if (cambia) misura()
    meteo(p.meteo)
  }

  // ── lo stato del podcast dal pc ──
  var versione = '' // (cambia quando il server riparte o cambiano i file della tv: allora si ricarica da sola)
  function arriva(p) {
    if (p.versione) { if (!versione) versione = p.versione; else if (p.versione !== versione) { setTimeout(function () { location.reload() }, 400); return } }
    var prima = pc
    pc = p
    if (typeof p.ora === 'number') scarto = p.ora - Date.now()
    var fase = C.fase(p)
    if (prima && C.fase(prima) === 'onda' && fase === 'finita') corpo.classList.add('si-spegne')
    if (fase === 'onda') corpo.classList.remove('si-spegne')
    corpo.setAttribute('data-fase', fase)
    corpo.setAttribute('data-argo', fase === 'onda' && p.argomento ? 'si' : 'no')
    palco.classList.toggle('specchio', !!p.specchio)
    schermate(p)
    scrivi($('ep'), fase === 'spento' ? 'prossima: n. ' + ((p.puntata || 0) + 1) : 'puntata ' + p.puntata)
    var a = p.argomento
    if (a && rulloDi !== a.da) {
      rulloDi = a.da; rullo(a)
      var t = (adesso() - a.da) / 1000
      argo.setAttribute('data-rullo', faseRullo(t))
      if (t > C.PRESO + 1) presoDi = a.da // (caricata dopo lo scatto: niente coriandoli)
    }
    if (a) {
      scrivi($('ar-chip'), 'argomento ' + a.n)
      var dopo = p.quanti ? (p.quanti - (p.scaletta || []).length) : 0
      scrivi($('ar-dopo'), dopo > 0 ? 'ne restano ' + dopo + ' nel cappello' : 'il cappello è vuoto: si ricomincia')
    }
    if (fase === 'finita') fine(p)
    nastro()
    orologio()
  }
  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
  function orologio() {
    var ora = adesso()
    scrivi($('orologio'), C.ora(ora))
    // la schermata «solo l'ora»
    var hm = C.ora(ora).split(':'), d = new Date(ora)
    scrivi($('s-ora-h'), hm[0]); scrivi($('s-ora-m'), hm[1])
    scrivi($('s-data'), GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()])
    if (!pc) return
    var fase = C.fase(pc)
    scrivi($('in-onda'), fase === 'onda' ? C.tempo((ora - pc.inizio) / 1000) : '')
    if (pc.argomento) {
      var t = (ora - pc.argomento.da) / 1000
      scrivi($('ar-chip'), t < C.GIRA_FINO + 0.3 ? 'argomento a caso' : 'argomento ' + pc.argomento.n)
      scrivi($('ar-da'), 'da ' + C.tempo(t))
    }
  }
  setInterval(orologio, 250)

  // ── un giro di disegno solo, al massimo 60 al secondo ──
  var ultimo = 0, cuffie = palco.querySelector('.cuffie'), luci = palco.querySelectorAll('.lu'), nomeParla = $('s-parla-n')
  function giro(ms) {
    requestAnimationFrame(giro)
    if (ms - ultimo < 15) return
    var dt = Math.min(0.1, (ms - ultimo) / 1000)
    ultimo = ms
    var t = ms / 1000
    // la voce: sale subito, scende piano; se il pc tace da un secondo, niente voce
    if (Date.now() - voceAlle > 1000) voceVuole = 0
    voce = Math.max(voceVuole, voce - dt * 1.5)
    var acceso = pc && C.fase(pc) === 'onda'
    for (var i = 0; i < BARRE; i++) {
      var b = barre[i], x = (i - (BARRE - 1) / 2) / (BARRE / 2.6)
      var forma = 0.3 + 0.7 * Math.exp(-x * x)
      var onda = 0.5 + 0.25 * Math.sin(t * b.f * 2.2 + b.g) + 0.25 * Math.sin(t * (b.f + 1.7) * 3.1 + i)
      var calma = (acceso ? 0.07 : 0.045) + 0.035 * Math.sin(t * 1.4 - i * 0.22)
      var h = Math.min(1, Math.max(0.03, calma + voce * forma * (0.35 + 0.65 * onda)))
      if (Math.abs(h - b.h) > 0.004) { b.h = h; b.el.style.transform = 'scaleY(' + h.toFixed(3) + ')' }
    }
    stili(cuffie, 'transform', 'translateY(' + (-Math.abs(Math.sin(t * 1.6)) * 1.2 - voce * 2).toFixed(2) + 'rem) scale(' + (1 + voce * 0.12).toFixed(3) + ')')
    if (schermoPrima === 'parla') stili(nomeParla, 'transform', 'scale(' + (1 + voce * 0.06 + 0.012 * Math.sin(t * 2.4)).toFixed(3) + ')') // (chi parla batte con la voce)
    rulloGiro()
    fineGiro()
  }
  requestAnimationFrame(giro)

  // ── il filo col pc ──
  var filo = null
  function collega() {
    filo = new EventSource('/api/tv')
    filo.addEventListener('podcast', function (e) { arriva(JSON.parse(e.data)) })
    filo.addEventListener('picco', function (e) { var v = JSON.parse(e.data).mic || 0; voceVuole = Math.pow(Math.min(1, Math.max(0, (v - 0.012) / 0.3)), 0.55); voceAlle = Date.now() })
    filo.addEventListener('batti', function (e) { var d = JSON.parse(e.data); if (typeof d.ora === 'number') scarto = d.ora - Date.now() })
    filo.onopen = function () { $('filo').classList.remove('su') }
    filo.onerror = function () { $('filo').classList.add('su') }
  }
  collega()
  nastro()
  orologio()
  misura()

  // ── lo schermo intero: il browser della tv lo dà solo dopo un tasto ──
  var pieno = function () { return document.fullscreenElement || document.webkitFullscreenElement }
  function chiediPieno() {
    if (pieno()) return
    var d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen
    if (f) try { var r = f.call(d); if (r && r.catch) r.catch(function () {}) } catch (e) {}
  }
  if (!pieno()) { $('schermo').classList.add('su'); setTimeout(function () { $('schermo').classList.remove('su') }, 9000) }
  document.addEventListener('keydown', function () { $('schermo').classList.remove('su'); chiediPieno() })
  document.addEventListener('click', function () { $('schermo').classList.remove('su'); chiediPieno() })
  // (lo schermo acceso: dove si può, il browser lo tiene sveglio)
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(function () {}) } catch (e) {}
})()
