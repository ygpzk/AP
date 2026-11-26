/* pzkko.it — chiaro di giorno, scuro di notte (26.11.2026, pzkko: «metti light e dark mode in automatico al
   tramonto/alba»).

   Alba e tramonto sono quelli di Mantova, con lo stesso calcolo NOAA della serranda (/serranda/): il sito si
   scurisce all'ora di lì, da qualunque posto lo si guardi. Script classico e sincrono nell'<head>, prima del primo
   disegno, così la pagina non lampeggia nel tema sbagliato.

   Il tasto del sole/della luna cambia tema solo fino al prossimo cambio del sole, poi torna l'automatico: nel
   browser resta `pzkko-theme` = "dark@<ms>" (il tema e fino a quando vale). I valori di prima ("dark", "light",
   per sempre) non valgono più: dal 26.11 comanda il sole.

   Per app.js: window.pzkkoTema.adesso() → 'light' | 'dark'; .scegli(t) → la scelta a mano fino al prossimo
   cambio; .segui(fn) → fn(t) quando il sole cambia il tema a pagina aperta; .sole() → { alba, tramonto, prossimo }.
   Prove: ?tema=dark|light (senza salvare niente), ?ora=HH:MM (l'ora di Mantova di oggi, ferma). */
(function () {
  var LAT = 45.1564, LON = 10.7914, R = Math.PI / 180, MIN = 60000, GIORNO = 86400000, CHIAVE = 'pzkko-theme'
  var q = new URLSearchParams(location.search)

  // il calcolo della serranda: per il giorno UTC dell'istante, prima stima a mezzogiorno e poi tre giri all'ora
  // dell'evento; 90,833° = l'orizzonte con la rifrazione
  function evento(ms, tramonto) {
    var g0 = Math.floor(ms / GIORNO) * GIORNO, t = g0 + 12 * 3600000
    for (var i = 0; i < 3; i++) {
      var T = (t / GIORNO + 2440587.5 - 2451545) / 36525
      var L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360
      var M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
      var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
      var C = Math.sin(M * R) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * R) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * R) * 0.000289
      var om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * R)
      var eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * R)
      var decl = Math.asin(Math.sin(eps * R) * Math.sin(lam * R))
      var y = Math.pow(Math.tan((eps / 2) * R), 2)
      var eq = (4 / R) * (y * Math.sin(2 * L0 * R) - 2 * e * Math.sin(M * R) + 4 * e * y * Math.sin(M * R) * Math.cos(2 * L0 * R) - 0.5 * y * y * Math.sin(4 * L0 * R) - 1.25 * e * e * Math.sin(2 * M * R))
      var ha = Math.acos(Math.max(-1, Math.min(1, Math.cos(90.833 * R) / (Math.cos(LAT * R) * Math.cos(decl)) - Math.tan(LAT * R) * Math.tan(decl)))) / R
      t = g0 + (720 - 4 * LON - eq + (tramonto ? ha * 4 : -ha * 4)) * MIN
    }
    return t
  }

  // l'ora: quella vera, o per le prove l'HH:MM di Mantova di oggi (ferma)
  var prova = /^(\d{1,2}):(\d{2})$/.exec(q.get('ora') || ''), fermo = null
  if (prova) {
    try {
      var roma = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }))
      fermo = new Date(roma.getFullYear(), roma.getMonth(), roma.getDate(), +prova[1], +prova[2]).getTime() + (Date.now() - roma.getTime())
    } catch (e) {}
  }
  function ora() { return fermo || Date.now() }

  // a Mantova il giorno UTC contiene sempre l'alba e il tramonto: prima dell'alba e dopo il tramonto è notte
  function sole(ms) {
    var alba = evento(ms, false), tramonto = evento(ms, true)
    return { alba: alba, tramonto: tramonto, notte: ms < alba || ms >= tramonto, prossimo: ms < alba ? alba : ms < tramonto ? tramonto : evento(ms + GIORNO, false) }
  }

  function leggi() { try { return localStorage.getItem(CHIAVE) } catch (e) { return null } }
  function scrivi(v) { try { v == null ? localStorage.removeItem(CHIAVE) : localStorage.setItem(CHIAVE, v) } catch (e) {} }

  var forzato = q.get('tema') === 'dark' || q.get('tema') === 'light' ? q.get('tema') : null
  function adesso() {
    if (forzato) return forzato
    var adess = ora(), s = sole(adess), v = leggi(), m = /^(dark|light)@(\d+)$/.exec(v || '')
    if (m && +m[2] > adess) return m[1]
    if (v) scrivi(null) // scaduta, o del formato di prima
    return s.notte ? 'dark' : 'light'
  }

  var corrente = adesso(), timer = 0, chi = []
  document.documentElement.dataset.theme = corrente

  function controlla() {
    var t = adesso()
    if (t !== corrente) { corrente = t; for (var i = 0; i < chi.length; i++) try { chi[i](t) } catch (e) {} }
    clearTimeout(timer)
    // al prossimo cambio del sole (con un secondo di margine), e comunque ogni ora: i timer delle schede in
    // secondo piano rallentano, e al ritorno sulla pagina si ricontrolla subito
    var s = sole(ora())
    timer = setTimeout(controlla, Math.max(1000, Math.min(s.prossimo - ora() + 1000, 3600000)))
  }

  window.pzkkoTema = {
    adesso: adesso,
    sole: function () { return sole(ora()) },
    scegli: function (t) {
      if (t !== 'dark' && t !== 'light') return
      corrente = t
      if (!forzato) scrivi(t + '@' + Math.round(sole(ora()).prossimo))
    },
    segui: function (fn) {
      chi.push(fn)
      if (chi.length === 1) {
        controlla()
        document.addEventListener('visibilitychange', function () { if (!document.hidden) controlla() })
      }
    },
  }
})()
