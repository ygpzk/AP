// 01 · Adesso, sempre. La scheda «Adesso» in una finestra sempre sopra le altre,
// con la Picture-in-Picture del documento (Chrome/Edge 116+). Dentro si aggiorna
// da sola: stato, musica, apps aperte e avanzamento del brano.
// La grafica (27.11): un biglietto «adesso» del muro con la matrice, il tratteggio e le forbici; dentro c'è un
// tamagotchi a cristalli liquidi dove vive la chiocciola, che cambia umore con lo stato (striscia, balla col
// mangianastri sul guscio, gioca, prende il caffè, si chiude nel guscio, dorme sotto la luna). Quando si apre la
// finestra il biglietto si strappa dal foglio e vola sopra le altre app; quando si chiude torna giù con lo scotch.
// Tutto il disegno è CSS + SVG a pixel: nessun loop di animazione in JS (solo il battito di 1 s della barra).
import { esc, ferma, ora } from '../utils.js'

const STATO = {
  online: { it: 'Online', en: 'Online' },
  idle: { it: 'In pausa', en: 'Idle' },
  dnd: { it: 'Non disturbare', en: 'Do not disturb' },
  offline: { it: 'Offline', en: 'Offline' },
}
const T = {
  it: {
    apri: 'Apri la finestra',
    chiudi: 'Chiudi la finestra',
    attivita: 'Apri Attività',
    pronto: 'pronto',
    no: 'non supportato',
    supporto: 'Serve Chrome o Edge 116 o più recente: la finestra resta sopra le altre app, anche fuori dal browser.',
    nulla: 'Nessuna attività in corso.',
    app: 'Aperte sul PC',
    ufficio: 'in ufficio',
    giro: 'in giro per il mondo',
    adesso: 'ADESSO',
    live: 'dal vivo',
    sopra: 'La finestra resta sopra le altre app',
    chiusa: 'Finestra chiusa',
    errore: 'Non riesco ad aprire la finestra.',
    aperta: 'staccato',
    biglietto: 'biglietto «adesso»',
    matrice: 'matrice · da conservare',
    valido: 'valido: sempre',
    strappa: 'strappa qui',
    volato: 'è volato sopra tutte le finestre',
    volatoSotto: 'lo trovi in primo piano, anche fuori dal browser. Chiudilo e torna qui.',
    passo: 'a passo di lumaca',
    dice: 'dice:',
    cartuccia: 'nella cartuccia',
    piede: 'valido sempre · non cedibile · la direzione non risponde dei ritardi della chiocciola',
    cartello: 'non disturbare',
    cartello2: 'sto pensando',
    timbro: 'chiuso per letargo',
    tocca: 'Tocca la chiocciola',
    lcd: { online: 'SVEGLIA', musica: 'BALLA', gioco: 'GIOCA', idle: 'PAUSA', dnd: 'SSST!', offline: 'DORME' },
    battuta: {
      online: 'sveglia e operativa. a 0,03 km/h.',
      musica: 'il guscio fa da cassa: balla.',
      gioco: 'sta giocando. non ditelo al capo.',
      idle: 'pausa caffè. lunga. molto lunga.',
      dnd: 'chiusa nel guscio a concentrarsi. non bussare.',
      offline: 'dorme nel guscio. richiamare all’alba.',
    },
    tocchi: ['ahia!', 'solletico!', 'giù le mani dal guscio', 'sto lavorando, giuro', 'il guscio non è in affitto', 'ok, mi nascondo'],
    basta: 'basta! chiamo il sindacato lumache',
    toccoDorme: 'zzz… (dorme)',
    toccoDnd: 'avevo scritto non disturbare',
    toc: 'TOC TOC',
    margine: 'si stacca davvero!',
    margine2: 'e resta sopra a tutto. anche a Excel.',
  },
  en: {
    apri: 'Open the window',
    chiudi: 'Close the window',
    attivita: 'Open Activity',
    pronto: 'ready',
    no: 'not supported',
    supporto: 'Needs Chrome or Edge 116 or newer: the window stays above other apps, even outside the browser.',
    nulla: 'Nothing happening right now.',
    app: 'Open on my PC',
    ufficio: 'at the office',
    giro: 'somewhere in the world',
    adesso: 'NOW',
    live: 'live',
    sopra: 'The window stays above other apps',
    chiusa: 'Window closed',
    errore: 'I cannot open the window.',
    aperta: 'torn off',
    biglietto: '“now” ticket',
    matrice: 'stub · keep this',
    valido: 'valid: forever',
    strappa: 'tear here',
    volato: 'it flew above every window',
    volatoSotto: 'it stays on top, even outside the browser. Close it to bring it back.',
    passo: 'at a snail’s pace',
    dice: 'says:',
    cartuccia: 'in the cartridge',
    piede: 'valid forever · non-transferable · management is not liable for snail delays',
    cartello: 'do not disturb',
    cartello2: 'thinking',
    timbro: 'closed for hibernation',
    tocca: 'Poke the snail',
    lcd: { online: 'AWAKE', musica: 'DANCING', gioco: 'PLAYING', idle: 'IDLE', dnd: 'SHHH!', offline: 'ASLEEP' },
    battuta: {
      online: 'awake and operational. at 0.03 km/h.',
      musica: 'the shell is the subwoofer: dancing.',
      gioco: 'gaming. don’t tell the boss.',
      idle: 'coffee break. a long one. a very long one.',
      dnd: 'locked in the shell, concentrating. don’t knock.',
      offline: 'asleep in the shell. call back at dawn.',
    },
    tocchi: ['ouch!', 'that tickles!', 'hands off the shell', 'i am working, i swear', 'the shell is not for rent', 'ok, hiding now'],
    basta: 'enough! calling the snail union',
    toccoDorme: 'zzz… (asleep)',
    toccoDnd: 'it says do not disturb',
    toc: 'KNOCK KNOCK',
    margine: 'it really tears off!',
    margine2: 'and stays on top of everything. even Excel.',
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k]

function statoTesto(a, lang) {
  const s = STATO[a.status] || STATO.offline
  return s[lang] || s.en
}

// ── i pixel: ogni sprite è una griglia di righe, X = inchiostro pieno, o = mezzo tono dei cristalli liquidi ──
function pixel(righe, ox, oy, c) {
  let d = ''
  righe.forEach((r, y) => {
    for (let x = 0; x < r.length;) {
      if (r[x] !== c) { x++; continue }
      let w = 1
      while (r[x + w] === c) w++
      d += `M${ox + x} ${oy + y}h${w}v1h-${w}z`
      x += w
    }
  })
  return d
}
const sprite = (righe, ox = 0, oy = 0, cls = '') => {
  const mezzo = pixel(righe, ox, oy, 'o'), pieno = pixel(righe, ox, oy, 'X')
  return `<g${cls ? ` class="${cls}"` : ''}>${mezzo ? `<path class="lab-pip__px2" d="${mezzo}"/>` : ''}<path class="lab-pip__px" d="${pieno}"/></g>`
}

// la chiocciola di profilo, verso destra (27 × 16): guscio a spirale dietro, testa col sorriso davanti
const CORPO = [
  '',
  '',
  '....XXXX',
  '..XXooooXX',
  '.XooXXXXooX',
  '.XoXooooXoX.......XXXXXX',
  'XoXoXXXooXoX.....XooooooX',
  'XoXoXooXoXoX....XooooooooX',
  'XoXoXXoXoXoX....XooooooooX',
  'XoXooooXoXoX....XooXoooXoX',
  'XooXXXXooXoX....XoooXXXooX',
  '.XooooooXooX...XoooooooooX',
  '..XXXXXXooX..XoooooooooX',
  '.XXXXXXXXXXXXXooooooooooX',
  'XooooooooooooooooooooooooX',
  '.XXXXXXXXXXXXXXXXXXXXXXXX',
]
// le antenne con gli occhi: due pose per l'animazione, una giù (stanca), una corta (dentro e fuori dal guscio)
const ANTENNE_A = [
  '.................XX....XX',
  '.................XX....XX',
  '..................X...X',
  '..................X...X',
  '...................X.X',
]
const ANTENNE_B = [
  '..................XX....XX',
  '..................XX....XX',
  '..................X.....X',
  '...................X...X',
  '...................X.X',
]
const ANTENNE_GIU = [
  '',
  '',
  '..............XX.........XX',
  '...............XXX.....XXX',
  '..................XX.XX',
]
const ANTENNE_CORTE = [
  '',
  '',
  '',
  '..................XX..XX',
  '...................X.X',
]
// solo il guscio, poggiato per terra (dorme, non disturbare)
const GUSCIO = [
  '....XXXX......',
  '..XXooooXX....',
  '.XooXXXXooX...',
  '.XoXooooXoX...',
  'XoXoXXXooXoX..',
  'XoXoXooXoXoX..',
  'XoXoXXoXoXoX..',
  'XoXooooXoXoX..',
  'XooXXXXooXoX..',
  '.XooooooXooX..',
  '..XXXXXXooXXX.',
  '.XXXXXXXXXXooX',
  'XooooooooooooX',
  '.XXXXXXXXXXXX.',
]
const STEREO = [
  '..XXXXXXXX',
  '..X......X',
  'XXXXXXXXXXXX',
  'XoooXXXXoooX',
  'XoXoXooXoXoX',
  'XoooXXXXoooX',
  'XXXXXXXXXXXX',
]
const STEREO_B = [
  '..XXXXXXXX',
  '..X......X',
  'XXXXXXXXXXXX',
  'XoXoXXXXoXoX',
  'XXXXXooXXXXX',
  'XoXoXXXXoXoX',
  'XXXXXXXXXXXX',
]
const NOTA = ['..XX', '..XX', '..X.', '..X.', 'XXX.', 'XXX.']
const NOTA2 = ['.XXXX', '.X..X', '.X..X', 'XX.XX', 'XX.XX']
const ZETA = ['XXXX', '..X.', '.X..', 'XXXX']
const LUNA = ['..XXX.', '.XXo..', 'XXo...', 'XXo...', 'XXo...', '.XXo..', '..XXX.']
const STELLA = ['.X.', 'XXX', '.X.']
const TAZZA = ['XXXXXX..', 'XooooXXX', 'XooooX.X', 'XooooXXX', '.XooX...', 'XXXXXX..']
const VAPORE_A = ['.X..', 'X.X.', '.X.X', 'X.X.']
const VAPORE_B = ['X.X.', '.X.X', 'X.X.', '.X..']
const PAD = ['.XXXXXXXXX.', 'XX.XXXXXoXX', 'X...XXXoXoX', 'XX.XXXXXoXX', '.XXX...XXX.']
const TV = [
  'XXXXXXXXXXXX',
  'X..........X',
  'X..........X',
  'X..........X',
  'X..........X',
  'X.........oX',
  'Xo.....ooooX',
  'XoooXX.ooooX',
  'XXXXXXXXXXXX',
  '...X....X...',
]
const PEZZO = ['XX', 'XX', '.X', '.X']
const INSALATA = ['..XXX..', '.XoXoX.', 'XoXoXoX', 'XooXooX', '.XoXoX.', '..XXX..']
const CUORE = ['XX.XX', 'XXXXX', '.XXX.', '..X..']

// il suolo dei cristalli: un tratteggio a pixel
const TERRA = `<path class="lab-pip__px2" d="${Array.from({ length: 27 }, (_, i) => `M${i * 3} 31h2v1h-2z`).join('')}"/>`

/** La scena del tamagotchi per un umore. È tutto decorativo (aria-hidden): il testo vero sta sotto, sul biglietto. */
function scena(umore, lang) {
  const chiocciola = (antenne) => `${sprite(CORPO)}${antenne}`
  let dentro = ''
  if (umore === 'offline') {
    dentro = `<g class="lab-pip__stelle">${sprite(STELLA, 6, 12, 'lab-pip__f1')}${sprite(STELLA, 18, 8, 'lab-pip__f2')}${sprite(STELLA, 54, 15, 'lab-pip__f1')}${sprite(STELLA, 28, 13, 'lab-pip__f2')}${sprite(STELLA, 72, 19, 'lab-pip__f2')}</g>
      ${sprite(LUNA, 62, 8)}
      <g class="lab-pip__respiro">${sprite(GUSCIO, 33, 17)}</g>
      <g class="lab-pip__zeta">${sprite(ZETA, 46, 13, 'lab-pip__z1')}${sprite(ZETA, 46, 13, 'lab-pip__z2')}${sprite(ZETA, 46, 13, 'lab-pip__z3')}</g>`
  } else if (umore === 'dnd') {
    dentro = `<g class="lab-pip__tremo">${sprite(GUSCIO, 33, 17)}</g>
      <text class="lab-pip__toc" x="49" y="13">${esc(t(lang, 'toc'))}</text>`
  } else if (umore === 'musica') {
    dentro = `<g class="lab-pip__balla"><g transform="translate(26 15)">${chiocciola(`${sprite(ANTENNE_A, 0, 0, 'lab-pip__f1')}${sprite(ANTENNE_B, 0, 0, 'lab-pip__f2')}`)}
        ${sprite(STEREO, 0, -5, 'lab-pip__f1')}${sprite(STEREO_B, 0, -5, 'lab-pip__f2')}</g></g>
      <g class="lab-pip__note">${sprite(NOTA, 58, 20, 'lab-pip__n1')}${sprite(NOTA2, 66, 22, 'lab-pip__n2')}${sprite(NOTA, 14, 22, 'lab-pip__n3')}${sprite(NOTA2, 6, 18, 'lab-pip__n4')}</g>`
  } else if (umore === 'gioco') {
    dentro = `<g transform="translate(14 15)">${chiocciola(`${sprite(ANTENNE_A, 0, 0, 'lab-pip__f1')}${sprite(ANTENNE_B, 0, 0, 'lab-pip__f2')}`)}</g>
      ${sprite(PAD, 44, 25, 'lab-pip__pad')}
      ${sprite(TV, 62, 21)}
      <g class="lab-pip__cade">${sprite(PEZZO, 67, 22)}</g>
      ${sprite(CUORE, 4, 8, 'lab-pip__f1')}${sprite(CUORE, 11, 8)}${sprite(CUORE, 18, 8)}`
  } else if (umore === 'idle') {
    dentro = `<g transform="translate(18 15)">${chiocciola(`${sprite(ANTENNE_GIU, 0, 0, 'lab-pip__f1')}${sprite(ANTENNE_CORTE, 0, 0, 'lab-pip__f2')}`)}</g>
      ${sprite(TAZZA, 52, 25)}
      <g class="lab-pip__vapore">${sprite(VAPORE_A, 53, 19, 'lab-pip__f1')}${sprite(VAPORE_B, 53, 19, 'lab-pip__f2')}</g>
      <g class="lab-pip__zeta">${sprite(ZETA, 64, 10, 'lab-pip__z1')}</g>`
  } else {
    // online: striscia avanti e indietro lasciando la bava
    dentro = `<g transform="translate(26 15)"><g class="lab-pip__striscia">
        <path class="lab-pip__px2 lab-pip__bava lab-pip__bava--dx" d="M-15 15h2v1h-2zM-10 15h3v1h-3zM-5 15h4v1h-4z"/>
        <path class="lab-pip__px2 lab-pip__bava lab-pip__bava--sx" d="M29 15h4v1h-4zM35 15h3v1h-3zM40 15h2v1h-2z"/>
        <g class="lab-pip__gira">${chiocciola(`${sprite(ANTENNE_A, 0, 0, 'lab-pip__f1')}${sprite(ANTENNE_B, 0, 0, 'lab-pip__f2')}`)}</g></g></g>
      ${sprite(INSALATA, 70, 25)}${sprite(CUORE, 4, 8)}${sprite(CUORE, 11, 8)}${sprite(CUORE, 18, 8)}`
  }
  return `<svg class="lab-pip__scena" viewBox="0 0 80 34" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${TERRA}${dentro}</svg>`
}

const umoreDi = (a) => (a.track ? 'musica' : a.gioco ? 'gioco' : (['online', 'idle', 'dnd', 'offline'].includes(a.status) ? a.status : 'offline'))

// la chiocciolina che striscia sulla barra del brano (vettoriale, piccola)
const LUMACHINA = `<svg class="lab-pip__lumachina" viewBox="0 0 30 20" aria-hidden="true" focusable="false">
  <path class="lab-pip__lm-corpo" d="M2 17.5c4 0 9-.4 15-.4 3 0 5-1.6 6-5l.6-2.6c.4-1.5 1.8-2.4 3.2-1.9 1.3.5 1.7 1.9 1.3 3.2L26.6 16c-.7 2.2-2.4 3.4-5 3.4H3c-1.2 0-1.8-.6-1-1.9z"/>
  <path class="lab-pip__lm-ant" d="M24.6 8.6 23 2.4M26.8 9.2l2-6"/><circle cx="23" cy="2.2" r="1.5"/><circle cx="28.8" cy="3" r="1.5"/>
  <circle class="lab-pip__lm-guscio" cx="12" cy="10.5" r="7.2"/><path class="lab-pip__lm-spira" d="M12 10.5c1.4 0 1.9 1.6.9 2.5-1.6 1.4-4.2.1-4.1-2 .1-3 3.6-4.4 6-2.7 3 2.1 2 6.8-1.5 7.6"/>
</svg>`

const FORBICI = `<svg class="lab-pip__forbici" viewBox="0 0 32 20" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="5" r="3.6"/><circle cx="6" cy="15" r="3.6"/><path d="M9 7l20 8M9 13l20-8"/></g><circle cx="16.5" cy="10" r="1.3" fill="currentColor"/></svg>`

function scheletro(a, lang, piccolo = false) {
  const m = a.track
  const umore = umoreDi(a)
  const luogo = a.luogo === 'ufficio' ? t(lang, 'ufficio') : a.luogo === 'giro' ? t(lang, 'giro') : ''
  const custom = a.custom?.state ? `<p class="lab-pip__custom"><span>${esc(t(lang, 'dice'))}</span> <mark>${esc(a.custom.state)}</mark></p>` : ''
  const apps = a.apps.length ? `<div class="lab-pip__apps"><span>${esc(t(lang, 'app'))} <em>×${a.apps.length}</em></span><ul>${a.apps.slice(0, 7).map((x) => `<li title="${esc(x.n)}"${x.su ? ' data-su="1"' : ''}>${x.i ? `<img src="${esc('/api/vetrina/?img=' + encodeURIComponent(x.i))}" alt="" loading="lazy">` : `<b>${esc(x.n.slice(0, 1))}</b>`}<span class="sr">${esc(x.n)}</span></li>`).join('')}</ul></div>` : ''
  const musica = m ? `<div class="lab-pip__musica">
      <div class="lab-pip__arte">${m.img ? `<img src="${esc('/api/vetrina/?img=' + encodeURIComponent(m.img))}" alt="" loading="lazy">` : '<span aria-hidden="true">♪</span>'}</div>
      <div class="lab-pip__brano"><b>${esc(m.titolo)}</b><span>${esc(m.artista)}</span>${m.album ? `<span>${esc(m.album)}</span>` : ''}</div>
    </div>${m.inizio && m.fine ? `<div class="lab-pip__barra" data-inizio="${m.inizio}" data-fine="${m.fine}"><span class="lab-pip__tempo" data-passato>0:00</span><i><b></b>${LUMACHINA}<em>${esc(t(lang, 'passo'))}</em></i><span class="lab-pip__tempo" data-totale>${ferma(m.fine - m.inizio)}</span></div>` : ''}` : ''
  const gioco = a.gioco ? `<div class="lab-pip__gioco"><small aria-hidden="true">${esc(t(lang, 'cartuccia'))}</small><b>${esc(a.gioco.name)}</b>${a.gioco.details ? `<span>${esc(a.gioco.details)}</span>` : ''}</div>` : ''
  const cartello = a.status === 'dnd' ? `<span class="lab-pip__cartello" aria-hidden="true"><b>${esc(t(lang, 'cartello'))}</b><small>${esc(t(lang, 'cartello2'))}…</small></span>` : ''
  const timbro = a.status === 'offline' ? `<span class="lab-pip__timbro" aria-hidden="true">${esc(t(lang, 'timbro'))}</span>` : ''
  return `<div class="lab-pip${piccolo ? ' lab-pip--mini' : ''}" data-online="${a.online}" data-stato="${esc(a.status)}" data-umore="${umore}">
    <header class="lab-pip__capo"><span class="lab-pip__marca"><b>pzkko</b> ${esc(t(lang, 'biglietto'))}</span><span class="lab-pip__live"><i></i>${esc(t(lang, 'live'))}</span></header>
    <div class="lab-pip__schermo">
      ${scena(umore, lang)}
      <span class="lab-pip__lcd" aria-hidden="true">${esc(t(lang, 'lcd')[umore])}</span>
      <span class="lab-pip__ora" aria-hidden="true" data-ora>${esc(ora(Date.now(), lang))}</span>
      <button type="button" class="lab-pip__bestia" data-bestia aria-label="${esc(t(lang, 'tocca'))}"></button>
      <span class="lab-pip__fumetto" data-fumetto aria-live="polite"></span>
      ${cartello}
    </div>
    <p class="lab-pip__battuta">${esc(t(lang, 'battuta')[umore])}</p>
    <div class="lab-pip__riga"><i class="lab-pip__punto" data-stato="${esc(a.status)}"></i><b>${esc(statoTesto(a, lang))}</b>${luogo ? `<span>· ${esc(luogo)}</span>` : ''}</div>
    ${custom}
    ${musica}${gioco}${musica || gioco ? '' : `<p class="lab-pip__vuoto">${esc(t(lang, 'nulla'))}</p>`}
    ${apps}
    <footer class="lab-pip__piede"><span>${esc(t(lang, 'piede'))}</span><i aria-hidden="true"></i></footer>
    ${timbro}
  </div>`
}

export default {
  id: 'pip',
  titolo: { it: 'Adesso, sempre', en: 'Now, always' },
  testo: {
    it: 'La scheda «Adesso» staccata dal browser e messa in una finestra che resta sopra le altre app: musica, stato, apps aperte e barra che avanza.',
    en: 'The “Now” card pulled out of the browser into a window that stays above other apps: music, status, open apps and a moving progress bar.',
  },
  tecnologie: ['Document Picture-in-Picture', 'Lanyard', 'Vetrina'],
  monta(el, api) {
    const lang = api.lang
    const supportato = 'documentPictureInPicture' in window
    let finestra = null, host = null, battitoPip = 0, battito = 0, visibile = false, corrente = api.adesso()
    let ultimoHtml = '', scotch = 0, tocchi = 0, timerTocco = 0, timerStacco = 0

    el.innerHTML = `<p class="lab__nota">${esc(t(lang, 'supporto'))}</p>
      <div class="lab-pip__anteprima" data-ante data-staccato="0" data-scotch="0">
        <div class="lab-pip__matrice" aria-hidden="true"><b>${esc(t(lang, 'adesso'))}</b><span>${esc(t(lang, 'matrice'))}</span><em>${esc(t(lang, 'valido'))}</em><i></i></div>
        <div class="lab-pip__taglio" aria-hidden="true">${FORBICI}<span>${esc(t(lang, 'strappa'))}</span></div>
        <div class="lab-pip__posto" data-biglietto></div>
        <div class="lab-pip__fantasma" aria-hidden="true"><b>${esc(t(lang, 'volato'))} <span>↗</span></b><span>${esc(t(lang, 'volatoSotto'))}</span></div>
        <div class="lab-pip__scotch" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>
      <p class="lab-pip__margine" aria-hidden="true"><b>${esc(t(lang, 'margine'))}</b><span>${esc(t(lang, 'margine2'))}</span><svg viewBox="0 0 90 70"><path d="M78 4c8 22-4 46-34 54-12 3-24 2-36-2"/><path d="M18 46 7 56l14 5"/></svg></p>
      <div class="lab__azioni">
        <button type="button" class="lab__bottone" data-apri ${supportato ? '' : 'disabled'}>${esc(t(lang, 'apri'))}</button>
        <button type="button" class="lab__bottone lab__bottone--fantasma" data-att>${esc(t(lang, 'attivita'))}</button>
      </div>`
    const ante = el.querySelector('[data-ante]')
    const posto = el.querySelector('[data-biglietto]')
    const bottone = el.querySelector('[data-apri]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')

    const disegna = (a) => {
      corrente = a
      const mini = scheletro(a, lang, true)
      // si ridisegna solo se è cambiato qualcosa (così le animazioni non ripartono a ogni giro della vetrina)
      if (mini !== ultimoHtml) {
        ultimoHtml = mini
        posto.innerHTML = mini
        batti(posto)
        if (host) { host.innerHTML = scheletro(a, lang); batti(host) }
      }
    }
    api.stato(stato, supportato ? t(lang, 'pronto') : t(lang, 'no'), supportato ? 'ok' : 'no')

    // la barra del brano (con la chiocciolina che striscia) e l'orologio dei cristalli: una volta al secondo
    function batti(dove) {
      if (!dove) return
      const ora_ = Date.now()
      for (const barra of dove.querySelectorAll('.lab-pip__barra')) {
        const inizio = Number(barra.dataset.inizio), fine = Number(barra.dataset.fine)
        const totale = Math.max(1, fine - inizio), fatto = Math.min(totale, Math.max(0, ora_ - inizio))
        const passa = barra.querySelector('[data-passato]')
        if (passa) passa.textContent = ferma(fatto)
        barra.style.setProperty('--fatto', (fatto / totale).toFixed(4))
      }
      const orologio = dove.querySelector('[data-ora]')
      if (orologio) orologio.textContent = ora(ora_, lang)
    }
    const vaPagina = () => {
      clearInterval(battito)
      battito = visibile ? setInterval(() => batti(posto), 1000) : 0
      if (visibile) batti(posto)
    }
    api.quandoVisibile(el, (si) => { visibile = si; vaPagina() })

    // il tocco sulla chiocciola: si nasconde nel guscio e dice qualcosa (nella pagina e nella finestra)
    function tocca(e) {
      const b = e.target.closest?.('[data-bestia]')
      if (!b) return
      const pip = b.closest('.lab-pip')
      const fumetto = pip?.querySelector('[data-fumetto]')
      if (!pip || !fumetto) return
      tocchi++
      const s = pip.dataset.stato
      const pool = t(lang, 'tocchi')
      fumetto.textContent = s === 'offline' ? t(lang, 'toccoDorme')
        : s === 'dnd' ? t(lang, 'toccoDnd')
        : tocchi > 6 && tocchi % 4 === 3 ? t(lang, 'basta')
        : pool[(tocchi - 1) % pool.length]
      pip.dataset.tocco = ''
      void pip.offsetWidth
      pip.dataset.tocco = '1'
      clearTimeout(timerTocco)
      timerTocco = setTimeout(() => { for (const p of [posto, host]) p?.querySelector('.lab-pip')?.removeAttribute('data-tocco') }, 1900)
    }
    ante.addEventListener('click', tocca)

    function stacca(si) {
      clearTimeout(timerStacco)
      if (si) { ante.dataset.staccato = '1'; return }
      // torna giù col suo pezzo di scotch in più (al massimo tre)
      scotch = Math.min(3, scotch + 1)
      ante.dataset.staccato = 'torna'
      ante.dataset.scotch = String(scotch)
      timerStacco = setTimeout(() => { ante.dataset.staccato = '0' }, 900)
    }

    function battiPip() {
      if (!finestra) return
      try { finestra.clearInterval(battitoPip) } catch {}
      // il battito sta nella finestra: lì il documento è sempre visibile, anche se la scheda del browser no
      battitoPip = finestra.setInterval(() => batti(host), 1000)
      batti(host)
    }

    async function apri() {
      if (!supportato || finestra) return
      try {
        finestra = await documentPictureInPicture.requestWindow({ width: 360, height: 560 })
        const doc = finestra.document
        doc.documentElement.lang = lang
        doc.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light'
        const stile = doc.createElement('style')
        stile.textContent = `html,body{margin:0;min-height:100%;background:#8e8e8a url(/art/muro.webp) 0 0/900px auto;color:#161616;font-family:"Special Elite","Courier New",monospace}body{padding:22px 14px 16px;box-sizing:border-box}.lab-pip{margin:0 auto;max-width:420px}`
        const link = doc.createElement('link')
        link.rel = 'stylesheet'
        link.href = new URL('/assets/site.css', location.href).href
        const studio = doc.createElement('link')
        studio.rel = 'stylesheet'
        studio.href = new URL('/assets/studio/studio.css', location.href).href
        doc.head.append(link, studio, stile)
        for (const k of ['--p', '--a', '--tint', '--page', '--box-3', '--text', '--muted', '--line']) {
          const v = getComputedStyle(document.documentElement).getPropertyValue(k)
          if (v) doc.documentElement.style.setProperty(k, v)
        }
        host = doc.createElement('div')
        host.className = 'lab-pip__finestra'
        doc.body.append(host)
        doc.title = 'pzkko · adesso'
        host.innerHTML = scheletro(corrente, lang)
        host.addEventListener('click', tocca)
        battiPip()
        stacca(true)
        bottone.textContent = t(lang, 'chiudi')
        bottone.dataset.on = '1'
        api.stato(stato, t(lang, 'aperta'), 'ok')
        finestra.addEventListener('pagehide', () => {
          if (!finestra) return
          finestra = null; host = null
          bottone.textContent = t(lang, 'apri')
          bottone.dataset.on = ''
          stacca(false)
          api.stato(stato, t(lang, 'chiusa'), 'ok')
        })
      } catch (e) {
        console.error(e)
        finestra = null; host = null
        api.stato(stato, t(lang, 'errore'), 'no')
      }
    }

    function chiudi() {
      if (!finestra) return
      const f = finestra
      finestra = null; host = null
      try { f.clearInterval(battitoPip) } catch {}
      try { f.close() } catch {}
      bottone.textContent = t(lang, 'apri')
      bottone.dataset.on = ''
      stacca(false)
      api.stato(stato, t(lang, 'pronto'), 'ok')
    }

    bottone.addEventListener('click', () => (finestra ? chiudi() : apri()))
    el.querySelector('[data-att]').addEventListener('click', () => { location.hash = '#attivita' })
    const togli = api.onAdesso(disegna)
    disegna(api.adesso())
    return () => {
      togli()
      chiudi()
      clearInterval(battito); clearTimeout(timerTocco); clearTimeout(timerStacco)
      ante.removeEventListener('click', tocca)
    }
  },
}
