// «Chi sono», vivo (26.11.2026). pzkko: «fai questa zona stra animata e stra nel mio stile, animazione per cambio app,
// switch e transizione in base all'utilizzo».
//
// La UX è di DeepSeek (design/chi-sono-ux-deepseek.md): il riquadro è la scena di quello che pzkko sta facendo sul pc,
// «Adesso» lì accanto resta l'elenco dei fatti. Conta solo l'app in primo piano, e deve restarci 1,8 secondi prima di
// prendere la scena; tre passaggi diversi (app mai vista: annuncio pieno; app già vista: scambio svelto; cambio di luogo:
// si cambia tutto il foglio); dopo otto minuti sulla stessa app la scena si calma; la bio è lo stato di riposo.
// La grafica è di Claude Code: un foglio del muro col nastro, la chiocciola che cambia mestiere con l'app (gli adesivi
// della chat), la frase battuta a macchina, l'evidenziatore, il nastro di carta della musica, l'etichetta dello stato.
// Niente librerie; i disegni sono quelli veri del sito (public/art). Lo stile è chisono.css, qui accanto: lo carica
// questo modulo, così la zona non dipende da src/site.css (che il 26.11 un'altra sessione ha riscritto per intero).
import { ascolta, immagine } from './vetrina.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const ridotto = matchMedia('(prefers-reduced-motion: reduce)')
const puntatore = matchMedia('(hover: hover) and (pointer: fine)')

// lo stile della zona: finché non è arrivato, il posto resta tenuto e vuoto (niente salti, niente foglio nudo)
let vestita = false
const stile = document.createElement('link')
stile.rel = 'stylesheet'
stile.href = new URL('./chisono.css', import.meta.url).pathname
const vesti = () => { vestita = true; radice?.style.removeProperty('min-height'); radice?.style.removeProperty('visibility') }
stile.addEventListener('load', vesti)
stile.addEventListener('error', vesti)
document.head.append(stile)

// ── i tempi (dalla specifica UX) ──
const ATTESA = 1800 // quanto un'app deve restare in primo piano prima di prendere la scena
const CALMA = 8 * 60_000 // dopo quanto la scena smette di agitarsi
const PRIMA = 2500 // quanto si aspetta lo stato di Discord prima di mostrare la prima scena

// ── i modi: famiglie di app, riconosciute dal nome (mai dal titolo della finestra: non arriva nemmeno) ──
const MODI = [
  ['codice', /visual studio|vs ?code|\bcursor\b|terminal|powershell|prompt dei comandi|notepad\+\+|sublime|intellij|pycharm|webstorm|android studio|github|\bgit\b|claude/i],
  ['chat', /discord|whatsapp|telegram|\bteams\b|slack|signal|messenger/i],
  ['crea', /\bcamo\b|\bobs\b|premiere|davinci|capcut|clipchamp|audacity/i],
  ['disegno', /figma|autocad|photoshop|illustrator|blender|\bgimp\b|inkscape|paint|canva|lightroom/i],
  ['musica', /spotify|apple music|itunes|\bvlc\b|foobar|tidal|deezer/i],
  ['web', /chrom|\bedge\b|firefox|opera|brave|safari|vivaldi/i],
  ['file', /esplora|explorer|\bfile\b|7-zip|winrar/i],
  ['gioco', /steam|epic games|minecraft|roblox|fortnite|valorant|league of legends|\bgta\b|rockstar|riot|battle\.net|xbox|rocket league|counter-strike/i],
]
const modoDi = (nome) => MODI.find(([, re]) => re.test(nome))?.[0] || 'altro'

// ── i disegni: gli adesivi veri del sito. [file in /art, larghezza, altezza, a pixel grossi] ──
const ARTE = {
  codice: ['chat-mestieri/sviluppatore', 165, 171, 1],
  chat: ['chat-mestieri/streamer', 168, 132, 1],
  crea: ['chat-mestieri/influencer', 192, 174, 1],
  disegno: ['chat-mestieri/imbianchino', 165, 198, 1],
  musica: ['adesivi/concerto', 260, 280, 0],
  web: ['chat-mestieri/bagnino', 168, 150, 1],
  file: ['chat-mestieri/bidello', 186, 189, 1],
  gioco: ['chat-mestieri/biscazziere', 147, 162, 1],
  altro: ['chat-pzk/peluche', 186, 153, 1],
  pausa: ['chat-ufficio/tazza', 144, 153, 1],
  giro: ['chat-mestieri/rider', 168, 138, 1],
  offline: ['chat-pzk/peluche', 186, 153, 1],
  riposo: ['adesivi/hello', 276, 216, 0],
}

// ── quello che si muove intorno alla chiocciola, modo per modo (tutto decorativo: aria-hidden) ──
const onda = '<svg class="chi__onda" viewBox="0 0 240 20" preserveAspectRatio="none"><path d="M0 10q10-9 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"/></svg>'
const VIVO = {
  codice: '<i class="chi__g" style="--k:0">{ }</i><i class="chi__g" style="--k:1">&lt;/&gt;</i><i class="chi__g" style="--k:2">;</i>',
  chat: '<span class="chi__nuvola"><i></i><i></i><i></i></span><span class="chi__nuvola chi__nuvola--due"><i></i><i></i></span>',
  crea: '<span class="chi__rec"><i></i>rec</span><span class="chi__mirino"><i></i><i></i><i></i><i></i></span>',
  disegno: '<svg class="chi__pennellata" viewBox="0 0 120 40" preserveAspectRatio="none"><path d="M6 30C22 8 34 34 50 16s28 16 40 2 16-8 24-10"/></svg>',
  musica: '<span class="chi__eq"><i></i><i></i><i></i><i></i><i></i></span><i class="chi__g" style="--k:0">♪</i><i class="chi__g" style="--k:1">♫</i><i class="chi__g" style="--k:2">♪</i>',
  web: onda,
  file: '<span class="chi__carte"><i></i><i></i><i></i></span>',
  gioco: '<i class="chi__stella" style="--k:0">✦</i><i class="chi__stella" style="--k:1">✦</i><i class="chi__stella" style="--k:2">✦</i>',
  altro: '',
  pausa: '<svg class="chi__vapore" viewBox="0 0 60 60"><path d="M16 56c-8-10 8-16 0-26s6-14 2-24"/><path d="M32 56c-8-10 8-16 0-26s6-14 2-24"/><path d="M48 56c-8-10 8-16 0-26s6-14 2-24"/></svg>',
  giro: '<svg class="chi__strada" viewBox="0 0 240 12" preserveAspectRatio="none"><path d="M2 6h236"/></svg>',
  offline: '<i class="chi__g" style="--k:0">z</i><i class="chi__g" style="--k:1">z</i><i class="chi__g" style="--k:2">z</i>',
  riposo: '',
}

// ── le scritte, nelle nove lingue: [inizio, parola forte]; {app} è il nome vero dell'app ──
const TX = {
  it: { voce: 'adesso', codice: ['sto scrivendo', 'codice'], chat: ['sono su', '{app}'], web: ['sto', 'navigando'], crea: ['sto', 'registrando'], disegno: ['sto', 'disegnando'], musica: ['sto', 'ascoltando'], file: ['sto', 'sistemando'], gioco: ['sto', 'giocando'], altro: ['sto al', 'pc'], pausa: ['sono al', 'pc'], giro: ['sono in giro', 'per il mondo'], offline: ['sono', 'offline'], suona: 'Cerca su Spotify' },
  en: { voce: 'right now', codice: ["I'm writing", 'code'], chat: ["I'm on", '{app}'], web: ["I'm", 'browsing'], crea: ["I'm", 'recording'], disegno: ["I'm", 'drawing'], musica: ["I'm", 'listening'], file: ["I'm", 'tidying up'], gioco: ["I'm", 'gaming'], altro: ["I'm at the", 'pc'], pausa: ["I'm at the", 'pc'], giro: ["I'm out", 'in the world'], offline: ["I'm", 'offline'], suona: 'Search on Spotify' },
  es: { voce: 'ahora', codice: ['estoy escribiendo', 'código'], chat: ['estoy en', '{app}'], web: ['estoy', 'navegando'], crea: ['estoy', 'grabando'], disegno: ['estoy', 'dibujando'], musica: ['estoy', 'escuchando'], file: ['estoy', 'ordenando'], gioco: ['estoy', 'jugando'], altro: ['estoy en el', 'pc'], pausa: ['estoy en el', 'pc'], giro: ['ando', 'por el mundo'], offline: ['estoy', 'desconectado'], suona: 'Buscar en Spotify' },
  fr: { voce: 'maintenant', codice: ["j'écris du", 'code'], chat: ['je suis sur', '{app}'], web: ['je', 'navigue'], crea: ['', "j'enregistre"], disegno: ['je', 'dessine'], musica: ['', "j'écoute"], file: ['je', 'range'], gioco: ['je', 'joue'], altro: ['je suis au', 'pc'], pausa: ['je suis au', 'pc'], giro: ['je suis quelque part', 'dans le monde'], offline: ['je suis', 'hors ligne'], suona: 'Chercher sur Spotify' },
  de: { voce: 'jetzt', codice: ['ich schreibe', 'Code'], chat: ['ich bin auf', '{app}'], web: ['ich', 'surfe'], crea: ['ich', 'nehme auf'], disegno: ['ich', 'zeichne'], musica: ['ich höre', 'Musik'], file: ['ich', 'räume auf'], gioco: ['ich', 'spiele'], altro: ['ich bin am', 'PC'], pausa: ['ich bin am', 'PC'], giro: ['ich bin irgendwo', 'auf der Welt'], offline: ['ich bin', 'offline'], suona: 'Auf Spotify suchen' },
  pt: { voce: 'agora', codice: ['estou a escrever', 'código'], chat: ['estou no', '{app}'], web: ['estou a', 'navegar'], crea: ['estou a', 'gravar'], disegno: ['estou a', 'desenhar'], musica: ['estou a', 'ouvir'], file: ['estou a', 'arrumar'], gioco: ['estou a', 'jogar'], altro: ['estou no', 'pc'], pausa: ['estou no', 'pc'], giro: ['ando', 'pelo mundo fora'], offline: ['estou', 'offline'], suona: 'Procurar no Spotify' },
  ru: { voce: 'сейчас', codice: ['пишу', 'код'], chat: ['сижу в', '{app}'], web: ['сижу в', 'интернете'], crea: ['', 'записываю'], disegno: ['', 'рисую'], musica: ['', 'слушаю'], file: ['навожу', 'порядок'], gioco: ['', 'играю'], altro: ['я за', 'компом'], pausa: ['я за', 'компом'], giro: ['я где-то', 'в мире'], offline: ['я', 'не в сети'], suona: 'Найти в Spotify' },
  ja: { voce: 'いま', codice: ['コードを', '書いています'], chat: ['{app}に', 'います'], web: ['ネットを', '見ています'], crea: ['', '録画中です'], disegno: ['', 'デザイン中です'], musica: ['音楽を', '聴いています'], file: ['ファイルを', '整理中です'], gioco: ['', 'ゲーム中です'], altro: ['PCの前に', 'います'], pausa: ['PCの前に', 'います'], giro: ['世界の', 'どこかにいます'], offline: ['', 'オフラインです'], suona: 'Spotifyで検索' },
  zh: { voce: '现在', codice: ['正在写', '代码'], chat: ['正在用', '{app}'], web: ['正在', '上网'], crea: ['正在', '录制'], disegno: ['正在', '画图'], musica: ['正在', '听歌'], file: ['正在', '整理文件'], gioco: ['正在', '玩游戏'], altro: ['在', '电脑前'], pausa: ['在', '电脑前'], giro: ['在世界的', '某个地方'], offline: ['', '离线中'], suona: '在 Spotify 搜索' },
}

// ── lo stato del modulo: sopravvive quando la bacheca viene riscritta (cambio di scheda, di lingua) ──
let radice = null, opz = { lang: 'it', titolo: 'Chi sono', bio: '', stati: {} }
let dati = null, disc = null, discNoto = false, finto = false
let scena = null // quella che si vede
let attesa = null, inAttesa = null, calma = null, primaScena = null, giro = 0
let brano = ''
const viste = new Set((() => { try { return JSON.parse(sessionStorage.getItem('pzkko-chi-viste') || '[]') } catch { return [] } })())
const ricorda = (k) => { viste.add(k); try { sessionStorage.setItem('pzkko-chi-viste', JSON.stringify([...viste].slice(-40))) } catch {} }
const tx = () => TX[opz.lang] || TX.en

/** La scena che i dati di adesso chiedono (in ordine: app in primo piano, in ufficio, offline, in giro; senza dati: la bio). */
function scenaDi() {
  if (!dati) return { chiave: 'riposo', stato: 'riposo', modo: 'riposo', app: null }
  const su = (dati.app || []).find((a) => a.su)
  if (su) return { chiave: `app:${su.n}`, stato: 'app', modo: modoDi(su.n), app: su }
  if (dati.luogo === 'ufficio') return { chiave: 'pausa', stato: 'pausa', modo: 'pausa', app: null }
  if (disc === 'offline') return { chiave: 'offline', stato: 'offline', modo: 'offline', app: null }
  return { chiave: 'giro', stato: 'giro', modo: 'giro', app: null }
}

// quanto è larga una parola, a occhio: i caratteri cinesi e giapponesi valgono due
const larga = (s) => [...s].reduce((n, c) => n + (/[⺀-鿿豈-﫿＀-￯]/.test(c) ? 2.2 : 1), 0)
const lettere = (s, da = 0) => [...s].map((c, k) => `<span class="c" style="--k:${da + k}">${esc(c)}</span>`).join('')
function fraseDi(s) {
  if (s.stato === 'riposo') return ['', opz.titolo]
  const [a, b] = tx()[s.modo] || tx().altro
  const n = s.app?.n || ''
  return [a.replace('{app}', n), b.replace('{app}', n)]
}
const detta = (s) => { const [a, b] = fraseDi(s); return `${a} ${b}`.trim() }

// il bollino bianco con l'icona vera dell'app (o l'iniziale, finché l'icona non c'è)
const iconaHtml = (a) => (a.i ? `<img src="${esc(immagine(a.i))}" alt="" width="40" height="40" draggable="false">` : `<b>${esc(a.n.slice(0, 1))}</b>`)
function foglioHtml(s) {
  const [a, b] = fraseDi(s), [file, w, h, px] = ARTE[s.modo] || ARTE.altro
  const bio = s.stato === 'riposo' || s.stato === 'giro' || s.stato === 'offline'
  const na = [...a].length, nb = [...b].length
  const icona = s.app ? `<span class="chi__icona">${iconaHtml(s.app)}</span>` : ''
  // in pausa, la fila delle app aperte appena accesa (i nomi li dice già «Adesso»: qui è solo scrivania)
  const fila = s.stato === 'pausa' ? (dati?.app || []).filter((x) => x.i).slice(0, 6).map((x) => `<img src="${esc(immagine(x.i))}" alt="" width="26" height="26" draggable="false" loading="lazy">`).join('') : ''
  return `${s.stato === 'riposo' ? '' : `<div class="chi__testa" aria-hidden="true"><span class="chi__capo">${esc(opz.titolo)}</span><span class="chi__voce">${esc(tx().voce)}<svg viewBox="0 0 34 14"><path d="M1 8c9-4 19-4 30-1M24 2l8 5-8 5"/></svg></span></div>`}
    <h2 class="chi__frase" aria-label="${esc(detta(s))}">${a ? `<span class="chi__pre" aria-hidden="true">${lettere(a)}</span> ` : ''}<span class="chi__chiave" aria-hidden="true" style="--n:${Math.max(larga(b), 4)}"><span class="chi__hl">${lettere(b, na)}</span></span></h2>
    ${s.app ? `<p class="chi__app">${icona}<span>${esc(s.app.n)}</span></p>` : ''}
    ${bio && opz.bio ? `<p class="chi__bio">${esc(opz.bio)}</p>` : ''}
    ${fila ? `<span class="chi__fila" aria-hidden="true">${fila}</span>` : ''}
    <span class="chi__eroe" aria-hidden="true"><span class="chi__vivo">${VIVO[s.modo] || ''}</span><img class="chi__adesivo${px ? ' is-px' : ''}" src="/art/${file}.webp" alt="" width="${w}" height="${h}" draggable="false" decoding="async"></span>`
}

/** Mette in scena `s`. tipo: 'nuova' (annuncio pieno), 'ritorno' (scambio svelto), 'luogo' (cambia tutto il foglio), 'fermo' (niente passaggio). */
function mostra(s, tipo) {
  scena = s
  if (!radice) return
  const pila = radice.querySelector('.chi__pila')
  if (!pila) return
  if (document.hidden || ridotto.matches) tipo = tipo === 'fermo' ? 'fermo' : 'piano'
  for (const v of pila.querySelectorAll('.chi__foglio.is-esce')) v.remove()
  const vecchio = pila.querySelector('.chi__foglio')
  const f = document.createElement('article')
  f.className = 'chi__foglio'
  f.dataset.tr = tipo
  f.style.setProperty('--r', `${[-1.3, 0.9, -0.6, 1.4][giro++ % 4]}deg`)
  const [, aw, ah] = ARTE[s.modo] || ARTE.altro
  f.dataset.modo = s.modo
  f.dataset.stato = s.stato
  f.style.setProperty('--ar', (aw / ah).toFixed(3))
  f.style.setProperty('--fine', [...detta(s)].length)
  f.innerHTML = foglioHtml(s)
  pila.append(f)
  if (vecchio) {
    if (tipo === 'fermo') vecchio.remove()
    else {
      vecchio.classList.add('is-esce')
      vecchio.dataset.tr = tipo
      vecchio.setAttribute('aria-hidden', 'true')
      vecchio.inert = true
      const via = () => vecchio.remove()
      vecchio.addEventListener('animationend', (e) => { if (e.target === vecchio) via() })
      setTimeout(via, 900)
    }
  }
  radice.dataset.stato = s.stato
  radice.dataset.modo = s.modo
  delete radice.dataset.calma
  clearTimeout(calma)
  // (se un giorno il pc dirà da quando l'app è davanti, il conto parte da lì; oggi parte da quando la vede chi guarda)
  const gia = Number.isFinite(s.app?.da) ? Math.max(0, Date.now() - s.app.da) : 0
  calma = setTimeout(() => { if (radice) radice.dataset.calma = '1' }, Math.max(0, CALMA - gia))
  etichetta()
}

/** Un dato nuovo: si decide se e quando cambiare scena. */
function valuta() {
  const s = scenaDi()
  if (!scena) return
  if (s.chiave === scena.chiave) {
    clearTimeout(attesa); inAttesa = null
    // stessa scena, ma l'icona può essere arrivata dopo: si cambia solo il bollino, il foglio resta com'è
    // (revisione di DeepSeek: rifarlo tutto troncava la battitura e faceva ripartire il conto della calma)
    if (s.app && scena.app && s.app.i !== scena.app.i) {
      scena = { ...scena, app: s.app }
      const b = [...(radice?.querySelectorAll('.chi__foglio:not(.is-esce) .chi__icona') || [])].at(-1)
      if (b) b.innerHTML = iconaHtml(s.app)
    }
    return
  }
  // la prima scena viva: appena ci sono i dati e lo stato di Discord (o dopo un po', se Discord tace)
  if (scena.stato === 'riposo') {
    if (!discNoto && !primaScena) { primaScena = setTimeout(() => { discNoto = true; valuta() }, PRIMA); return }
    if (!discNoto) return
    clearTimeout(primaScena)
    ricorda(s.chiave)
    mostra(s, 'nuova')
    annuncia(s)
    return
  }
  // tra stati senza app (ufficio, in giro, offline) non c'è niente da aspettare: cambia il foglio
  if (s.stato !== 'app' && scena.stato !== 'app') { clearTimeout(attesa); inAttesa = null; cambia(s); return }
  // un'app deve restare davanti 1,8 s: gli alt-tab veloci non contano, e vince l'ultima
  if (inAttesa === s.chiave) return
  clearTimeout(attesa)
  inAttesa = s.chiave
  attesa = setTimeout(() => { inAttesa = null; const ora = scenaDi(); if (ora.chiave !== scena.chiave) cambia(ora) }, finto ? Math.min(ATTESA, finto) : ATTESA)
}
function cambia(s) {
  const tipo = s.stato !== 'app' || scena.stato !== 'app' ? 'luogo' : viste.has(s.chiave) ? 'ritorno' : 'nuova'
  ricorda(s.chiave)
  mostra(s, tipo)
  // il ritorno a un'app già vista è uno scambio svelto e muto (revisione di DeepSeek: niente annunci a ogni alt-tab)
  if (tipo !== 'ritorno') annuncia(s)
}
/** Un solo annuncio, gentile, per chi ascolta la pagina: la prima scena viva, un'app nuova, un cambio di luogo. */
function annuncia(s) {
  const voce = radice?.querySelector('.chi__dice')
  if (voce) voce.textContent = s.app && s.modo !== 'chat' ? `${detta(s)}: ${s.app.n}` : detta(s)
}

/** Il nastro di carta con la musica: accompagna, non prende la scena. */
function musica() {
  const el = radice?.querySelector('.chi__musica')
  if (!el) return
  const m = dati?.musica
  const k = m ? `${m.titolo}\n${m.artista}` : ''
  if (k === brano && el.dataset.k === k) return
  brano = k
  el.dataset.k = k
  if (!m) { el.hidden = true; return }
  el.href = `https://open.spotify.com/search/${encodeURIComponent(`${m.artista} ${m.titolo}`)}`
  el.setAttribute('aria-label', `${m.titolo} · ${m.artista} — ${tx().suona}`)
  const eraNascosto = el.hidden
  el.hidden = false
  el.querySelector('.chi__brano').innerHTML = `<b>${esc(m.titolo)}</b> · ${esc(m.artista)}`
  el.classList.remove('is-entra', 'is-cambia')
  void el.offsetWidth
  el.classList.add(eraNascosto ? 'is-entra' : 'is-cambia')
}

/** L'etichetta dello stato di Discord (assente, non disturbare, offline): sta sopra la scena, non è una scena. */
function etichetta() {
  if (!radice) return
  const el = radice.querySelector('.chi__dymo')
  const st = ['idle', 'dnd', 'offline'].includes(disc) ? disc : ''
  radice.dataset.disc = disc || ''
  if (!el) return
  // (offline con la scena «sono offline»: l'etichetta direbbe la stessa cosa due volte)
  const serve = st && !(st === 'offline' && scena?.stato === 'offline') && scena?.stato !== 'riposo'
  el.hidden = !serve
  if (serve) el.textContent = opz.stati?.[st] || st
}

function ricevuto(d) {
  dati = d
  valuta()
  musica()
  etichetta()
}

// il foglio segue appena il puntatore (solo col mouse, e non a movimento ridotto)
let rafP = 0
function segui(e) {
  if (!radice || ridotto.matches || !puntatore.matches) return
  const r = radice.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2
  cancelAnimationFrame(rafP)
  rafP = requestAnimationFrame(() => { radice?.style.setProperty('--mx', x.toFixed(3)); radice?.style.setProperty('--my', y.toFixed(3)) })
}
function lascia() { cancelAnimationFrame(rafP); radice?.style.removeProperty('--mx'); radice?.style.removeProperty('--my') }

let ascoltando = false
/**
 * Monta la zona in `nodo` (la bacheca la riscrive a ogni cambio di scheda o di lingua: lo stato resta qui).
 * `o`: { lang, titolo, bio, stati: { idle, dnd, offline }, stato: lo stato di Discord se è già noto }.
 */
export function monta(nodo, o = {}) {
  radice = nodo
  opz = { ...opz, ...o }
  if (o.stato) { disc = o.stato; discNoto = true }
  nodo.classList.add('is-viva')
  if (!vestita) { nodo.style.minHeight = '324px'; nodo.style.visibility = 'hidden' }
  nodo.innerHTML = `<div class="chi__pila"></div>
    <a class="chi__musica" target="_blank" rel="noopener noreferrer" hidden><span class="chi__nota" aria-hidden="true">♫</span><span class="chi__brano"></span></a>
    <span class="chi__dymo" hidden></span>
    <p class="sr chi__dice" aria-live="polite" aria-atomic="true"></p>`
  nodo.addEventListener('pointermove', segui)
  nodo.addEventListener('pointerleave', lascia)
  // si riparte dalla scena che c'era (la prima volta: la bio, poi arriva il dato e il foglio cambia)
  mostra(scena || scenaDi(), 'fermo')
  brano = ''
  musica()
  etichetta()
  if (!ascoltando) { ascoltando = true; ascolta((d) => { if (!finto) ricevuto(d) }) }
  else valuta()
}

/** Lo stato di Discord (online, idle, dnd, offline), a ogni cambio di presenza. */
export function presenza(st) {
  if (!st) return
  const primo = !discNoto
  disc = st
  discNoto = true
  if (primo || dati) valuta()
  etichetta()
}

/** Per le prove: import('/assets/chisono.js').then((m) => m.prova({ luogo, app, musica }, 'online', 300)) — `attesa` accorcia gli 1,8 s. */
export function prova(d, st, attesaMs = ATTESA) {
  finto = attesaMs || 1
  if (st) { disc = st; discNoto = true }
  ricevuto(d)
}
