// Giugnoh's Cast: i tempi dell'estrazione dell'argomento e della fine puntata, uguali per la diretta (/o/argomento,
// /o/fine) e per la tv (/tv). L'estrazione la fa il server (podcast.mjs): manda il rullo (le voci che passano, con
// quella scelta all'indice «indice») e l'ora in cui è partita; ogni pagina calcola da lì dov'è il rullo in questo
// istante, così Camo, la regia e la tv vedono la stessa cosa anche se una pagina si ricarica a metà.
// Script normale, scritto «vecchio» (niente ?. ??, niente moduli): lo legge anche il browser della tv. pezzi.js lo
// importa e lo trova in window.Cast.
(function () {
  var C = {
    NOME: "Giugnoh's Cast",
    GIRA_DA: 0.75, // secondi dall'estrazione: prima entra la scritta, poi il rullo parte
    GIRA_FINO: 5.2, // qui si ferma sulla voce scelta (con lo scatto)
    PRESO: 5.2,
    FINE_TENDA: 1.1, // la fine puntata: le strisce che passano davanti, poi i saluti
  }
  // dov'è il rullo al secondo t (in voci: 0 = la prima voce, indice = quella scelta). Parte forte e frena piano; quando
  // arriva va un filo oltre e torna, come uno scatto
  C.posizione = function (t, indice) {
    if (t <= C.GIRA_DA) return 0
    if (t < C.GIRA_FINO) {
      var u = (t - C.GIRA_DA) / (C.GIRA_FINO - C.GIRA_DA)
      return indice * (1 - Math.pow(1 - u, 3.6))
    }
    var d = t - C.GIRA_FINO
    return indice + 0.2 * Math.sin(d * 21) * Math.exp(-d * 7)
  }
  // quanto corre (voci al secondo), per la scia e per le frecce
  C.velocita = function (t, indice) { return (C.posizione(t + 0.02, indice) - C.posizione(t - 0.02, indice)) / 0.04 }
  // in onda, finita o spenta
  C.fase = function (p) { return !p || !p.inizio ? 'spento' : p.fine ? 'finita' : 'onda' }
  var due = function (n) { return (n < 10 ? '0' : '') + n }
  C.tempo = function (s) {
    s = Math.max(0, Math.floor(s))
    var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60
    return h ? h + ':' + due(m) + ':' + due(s % 60) : m + ':' + due(s % 60)
  }
  C.ora = function (t) { var d = new Date(t); return due(d.getHours()) + ':' + due(d.getMinutes()) }
  C.pulito = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  // sempre lo stesso per lo stesso n (i coriandoli escono uguali su tutte le pagine)
  C.caso = function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  C.COLORI = ['#ccff00', '#9d00ff', '#eb459e', '#2dff7a', '#f0b232', '#ffffff', '#c77dff', '#05d9e8']
  window.Cast = C
})()
