// 07 · La stanza. La cameretta-studio della chiocciola, disegnata in SVG, che si accende con quello che succede:
// lampada (e lucine) se è online, casse se c'è Spotify, schermo con le app aperte, finestra e orologio con l'ora
// vera di Roma. La chiocciola lavora alla scrivania, balla con la musica, è in pausa o dorme nel letto.
// I disegni sono qui, i manifesti e l'adesivo vengono da /art/. Niente servizi esterni.
import { esc, notte } from '../utils.js'

const T = {
  it: {
    nota: 'La lampada segue lo stato, le casse seguono Spotify, lo schermo conta le app aperte, la finestra e l’orologio seguono l’ora di Roma. È uno specchio, non una webcam.',
    pronta: 'specchio',
    online: 'online',
    offline: 'offline',
    musica: 'Spotify',
    apps: (n) => `${n} app`,
    giorno: 'giorno',
    notte: 'notte',
    spenta: 'stanza spenta',
    bussa: 'Bussa alla porta',
    senzaBug: 'giorni senza bug',
    nonDisturbare: 'non disturbare',
    lavori: 'lavori in corso',
    pizza: 'pizza',
    battute: {
      musica: 'lavora a tempo di musica (soprattutto a tempo)',
      lavora: 'lavora. o finge benissimo.',
      troppe: 'più finestre aperte che idee',
      idle: 'pausa caffè. la terza.',
      dnd: 'non disturbare: sta facendo un sito',
      notteMusica: 'dorme con Spotify acceso: le casse fanno il turno per lui',
      dormePc: 'lui dorme. il pc no.',
      dorme: 'dorme come un sasso. un sasso col guscio.',
      pisolino: 'pisolino strategico, non disturbare',
    },
    risposte: {
      letto: ['zzz… cinque minuti…', 'non c’è nessuno, ripassate domani', 'sto sognando un sito senza bug', 'mmh? è già lunedì?'],
      musica: ['non ti sento, ho le cuffie!', 'questa è la mia canzone!!', 'alza! no, abbassa. no, alza.', 'sto lavorando. col bacino.'],
      lavora: ['sto facendo un sito, torna dopo', 'chi è? se è il cliente non ci sono', 'un attimo che salvo… Ctrl+S Ctrl+S Ctrl+S', 'funziona sul mio pc, giuro'],
      idle: ['sono in pausa. da un po’.', 'il caffè non si beve da solo', 'torno subito (forse)'],
      dnd: ['c’è scritto sul cartello.', 'NON. DISTURBARE.', 'sto deployando, non respirare'],
    },
  },
  en: {
    nota: 'The lamp follows the status, the speakers follow Spotify, the screen counts open apps, the window and the clock follow Rome time. It is a mirror, not a webcam.',
    pronta: 'mirror',
    online: 'online',
    offline: 'offline',
    musica: 'Spotify',
    apps: (n) => `${n} apps`,
    giorno: 'day',
    notte: 'night',
    spenta: 'room off',
    bussa: 'Knock on the door',
    senzaBug: 'days without bugs',
    nonDisturbare: 'do not disturb',
    lavori: 'work in progress',
    pizza: 'pizza',
    battute: {
      musica: 'working to the beat (mostly the beat)',
      lavora: 'working. or faking it really well.',
      troppe: 'more open windows than ideas',
      idle: 'coffee break. the third one.',
      dnd: 'do not disturb: building a website',
      notteMusica: 'asleep with Spotify on: the speakers are covering his shift',
      dormePc: 'he’s asleep. the pc isn’t.',
      dorme: 'sleeping like a rock. a rock with a shell.',
      pisolino: 'strategic nap, do not disturb',
    },
    risposte: {
      letto: ['zzz… five more minutes…', 'nobody’s home, come back tomorrow', 'dreaming of a site with no bugs', 'hm? is it monday already?'],
      musica: ['can’t hear you, headphones on!', 'this is my song!!', 'turn it up! no, down. no, up.', 'i am working. with my hips.'],
      lavora: ['making a website, come back later', 'who is it? if it’s the client, i’m out', 'hold on, saving… Ctrl+S Ctrl+S Ctrl+S', 'it works on my machine, i swear'],
      idle: ['on a break. for a while.', 'the coffee won’t drink itself', 'back soon (maybe)'],
      dnd: ['it says so on the sign.', 'DO. NOT. DISTURB.', 'deploying, don’t even breathe'],
    },
  },
}
const t = (lang, k, ...a) => {
  const v = (T[lang] || T.en)[k] ?? T.en[k]
  return typeof v === 'function' ? v(...a) : v
}

// l'ora di Roma, per l'orologio sul muro
function oraRoma() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
  return { h: Number(p.find((x) => x.type === 'hour')?.value || 0) % 24, m: Number(p.find((x) => x.type === 'minute')?.value || 0) }
}

// punti su una curva di secondo grado (le lucine)
const quad = (a, b, c, s) => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * b[0] + s * s * c[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * b[1] + s * s * c[1]]

// ── la chiocciola: di profilo, guarda a destra, il piede a y=0 ──
const BAVA = '#a9d3bd', RIGA = '#1e4a5c', GUSCIO = '#f0763a'
function lumaca(dorme) {
  const antenne = dorme
    ? 'M33 -36C30 -44 23 -49 16 -47M40 -36C41 -46 36 -53 29 -54'
    : 'M33 -37C31 -47 28 -55 27 -62M40 -37C41 -47 44 -54 46 -60'
  const occhi = dorme
    ? `<path class="stz-occhi stz-occhi--chiusi" d="M12 -48q4 3 8 0M25 -55q4 3 8 0" fill="none" stroke="${RIGA}" stroke-width="1.8" stroke-linecap="round"/>`
    : `<g class="stz-occhi stz-occhi--aperti">
        <circle cx="27" cy="-63" r="5.4" fill="#fff" stroke="${RIGA}" stroke-width="1.8"/><circle cx="46" cy="-61" r="5.4" fill="#fff" stroke="${RIGA}" stroke-width="1.8"/>
        <g class="stz-pupille"><circle cx="29" cy="-64.5" r="2.4" fill="#161616"/><circle cx="48" cy="-62.5" r="2.4" fill="#161616"/><circle cx="29.8" cy="-65.4" r=".8" fill="#fff"/><circle cx="48.8" cy="-63.4" r=".8" fill="#fff"/></g>
        <g class="stz-palpebre" fill="${BAVA}" stroke="${RIGA}" stroke-width="1.6"><path d="M21.6 -63a5.4 5.4 0 0 1 10.8 0z"/><path d="M40.6 -61a5.4 5.4 0 0 1 10.8 0z"/></g>
      </g>
      <path class="stz-occhi stz-occhi--felici" d="M23 -62q4 -5 8 0M42 -60q4 -5 8 0" fill="none" stroke="${RIGA}" stroke-width="2" stroke-linecap="round"/>`
  const cappello = dorme
    ? `<g class="stz-cappello"><path d="M22 -58l14 -2l-4 -12q-8 -2 -14 8z" fill="#1446a0" stroke="${RIGA}" stroke-width="1.4"/><path d="M21 -58l16 -2" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="-62" r="3" fill="#fff" stroke="${RIGA}" stroke-width="1.2"/></g>`
    : ''
  const cuffie = dorme
    ? `<g class="stz-cuffie"><path d="M24 -38C20 -52 40 -58 46 -44" fill="none" stroke="#161616" stroke-width="3" stroke-linecap="round"/><rect x="20" y="-42" width="7" height="10" rx="2.5" fill="#b3121f" stroke="#161616" stroke-width="1.2"/></g>`
    : `<g class="stz-cuffie"><path d="M25 -42C24 -60 50 -60 49 -40" fill="none" stroke="#161616" stroke-width="3.2" stroke-linecap="round"/><rect x="20.5" y="-46" width="8" height="12" rx="3" fill="#b3121f" stroke="#161616" stroke-width="1.2"/><rect x="45.5" y="-44" width="8" height="12" rx="3" fill="#b3121f" stroke="#161616" stroke-width="1.2"/></g>`
  return `<g class="stz-lumaca__corpo">
      <ellipse cx="0" cy="1.5" rx="48" ry="4" fill="#000" opacity=".2"/>
      <path d="M-50 0C-48 -5 -32 -9 -8 -9L19 -11C21 -27 24 -39 34 -41C46 -43 51 -31 49 -19C48 -9 47 -3 45 0Z" fill="${BAVA}" stroke="${RIGA}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M-42 -3C-20 -6 12 -6 42 -4" fill="none" stroke="#e4f4ea" stroke-width="2" stroke-linecap="round" opacity=".9"/>
      <g fill="${RIGA}" opacity=".35"><circle cx="-34" cy="-5" r="1.2"/><circle cx="24" cy="-24" r="1.3"/><circle cx="30" cy="-14" r="1"/><circle cx="-20" cy="-6" r="1"/></g>
      <g class="stz-guscio">
        <circle cx="-6" cy="-28" r="22" fill="${GUSCIO}" stroke="${RIGA}" stroke-width="2.2"/>
        <path d="M-6 -28a3 3 0 0 1 6 0a6 6 0 0 1 -12 0a9 9 0 0 1 18 0a12 12 0 0 1 -24 0a15 15 0 0 1 30 0a18 18 0 0 1 -36 0" fill="none" stroke="${RIGA}" stroke-width="2" stroke-linecap="round"/>
        <path d="M-22 -40a20 20 0 0 1 18 -9" fill="none" stroke="#ffd9b8" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        <g fill="#7a2a10" opacity=".25"><circle cx="-18" cy="-18" r="1.4"/><circle cx="8" cy="-16" r="1.2"/><circle cx="4" cy="-42" r="1.2"/><circle cx="-20" cy="-30" r="1"/></g>
      </g>
      <g class="stz-antenne"><path d="${antenne}" fill="none" stroke="${RIGA}" stroke-width="5.4" stroke-linecap="round"/><path d="${antenne}" fill="none" stroke="${BAVA}" stroke-width="2.6" stroke-linecap="round"/></g>
      ${occhi}
      <path d="M38 -25q4 4 8 0" fill="none" stroke="${RIGA}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="35" cy="-22" r="3" fill="#f39a7c" opacity=".55"/>
      ${cappello}${cuffie}
    </g>`
}

// ── la stanza ──
function disegno(lang) {
  const VP = [320, 150]
  // le assi del pavimento, verso il punto di fuga
  const assi = Array.from({ length: 13 }, (_, i) => {
    const x = 100 + i * (440 / 12), k = (440 - VP[1]) / (272 - VP[1])
    return `<path d="M${x.toFixed(1)} 272L${(VP[0] + (x - VP[0]) * k).toFixed(1)} 440"/>`
  }).join('') + [286, 304, 328, 360, 402].map((y) => `<path d="M0 ${y}H640"/>`).join('')
  // le lucine sul muro di fondo
  const tratti = [[[104, 34], [176, 60], [248, 36]], [[248, 36], [320, 60], [392, 36]], [[392, 36], [464, 60], [536, 34]]]
  const colori = ['#ffd400', '#ff5a4f', '#7fe0ff', '#ccff00']
  let k = 0
  const lucine = tratti.flatMap(([a, b, c]) => [0.12, 0.3, 0.5, 0.7, 0.88].map((s) => {
    const [x, y] = quad(a, b, c, s)
    const col = colori[k % colori.length], d = (k++ * 0.37) % 2.4
    return { x: x.toFixed(1), y: (y + 3).toFixed(1), col, d: d.toFixed(2) }
  }))
  // le sei finestre sullo schermo
  const tinte = ['#b3121f', '#1446a0', '#23864a', '#c96a00', '#7a3fb0', '#161616']
  const finestre = [0, 1, 2, 3, 4, 5].map((i) => {
    const x = 388 + (i % 3) * 29, y = 158 + Math.floor(i / 3) * 23
    return `<g class="stz-app" data-n="${i}" style="--d:${(i * 0.09).toFixed(2)}s">
      <rect data-app="${i}" x="${x}" y="${y}" width="26" height="19" rx="1.5" fill="#f6f2e8" stroke="${tinte[i]}" stroke-width="1"/>
      <rect class="stz-app__barra" x="${x}" y="${y}" width="26" height="4" rx="1.5" fill="${tinte[i]}"/>
      <g class="stz-app__dentro" stroke="${tinte[i]}" stroke-width="1.2" stroke-linecap="round" opacity=".55">
        <path d="M${x + 3} ${y + 8}h${12 + (i * 5) % 8}M${x + 3} ${y + 11.5}h${16 - (i * 3) % 7}M${x + 3} ${y + 15}h${8 + (i * 7) % 9}"/>
      </g>
      <circle cx="${x + 22.5}" cy="${y + 2}" r=".9" fill="#fff"/>
    </g>`
  }).join('')
  const nota = (x, y, dx, d, col, s = 1) => `<use href="#stz-nota" x="${x}" y="${y}" width="${12 * s}" height="${16 * s}" style="--dx:${dx}px;--d:${d}s;color:${col}"/>`
  const stelle = Array.from({ length: 14 }, (_, i) => `<circle class="stz-stella" cx="${(138 + (i * 37) % 98).toFixed(0)}" cy="${(64 + (i * 23) % 56).toFixed(0)}" r="${i % 4 ? 0.9 : 1.5}" fill="#fff" style="--d:${((i * 0.53) % 3).toFixed(2)}s"/>`).join('')
  const finestrelle = [[148, 140], [156, 140], [172, 133], [196, 128], [204, 136], [222, 142], [230, 132], [164, 150], [212, 150]]
    .map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="4" fill="#ffd66b" opacity="${i % 3 ? 0.9 : 0.5}"/>`).join('')

  return `<svg class="lab-stanza__svg" viewBox="0 0 640 440" role="img" aria-label="${esc(t(lang, 'nota'))}">
    <defs>
      <symbol id="stz-nota" viewBox="0 0 12 16"><path d="M7 1.5v10.8" stroke="#161616" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="4.4" cy="12.6" rx="3.6" ry="2.7" transform="rotate(-22 4.4 12.6)" fill="#161616"/><path d="M7 1.5c2 1.6 4.5 2.6 3.8 6" fill="none" stroke="#161616" stroke-width="3.2" stroke-linecap="round"/><path d="M7 1.5v10.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="4.4" cy="12.6" rx="2.6" ry="1.8" transform="rotate(-22 4.4 12.6)" fill="currentColor"/><path d="M7 1.5c2 1.6 4.5 2.6 3.8 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></symbol>
      <linearGradient id="stz-cielo-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d8fd1"/><stop offset=".7" stop-color="#9fd3f2"/><stop offset="1" stop-color="#ffe2b0"/></linearGradient>
      <linearGradient id="stz-cielo-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816"/><stop offset=".75" stop-color="#14204a"/><stop offset="1" stop-color="#3a2f5c"/></linearGradient>
      <linearGradient id="stz-muro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d6b2"/><stop offset="1" stop-color="#d4c098"/></linearGradient>
      <linearGradient id="stz-muro-s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9a47c"/><stop offset="1" stop-color="#cfbb92"/></linearGradient>
      <linearGradient id="stz-muro-d" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#bda880"/><stop offset="1" stop-color="#d2be96"/></linearGradient>
      <linearGradient id="stz-legno" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8754b"/><stop offset="1" stop-color="#7f5232"/></linearGradient>
      <linearGradient id="stz-schermo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d5a6e"/><stop offset="1" stop-color="#0d2633"/></linearGradient>
      <linearGradient id="stz-cono-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></linearGradient>
      <linearGradient id="stz-raggio-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
      <linearGradient id="stz-luna-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8c8ff" stop-opacity=".22"/><stop offset="1" stop-color="#b8c8ff" stop-opacity="0"/></linearGradient>
      <radialGradient id="stz-lume"><stop offset="0" stop-color="#ffcf6b" stop-opacity=".55"/><stop offset=".55" stop-color="#ffb347" stop-opacity=".18"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <radialGradient id="stz-blu"><stop offset="0" stop-color="#8fe6ff" stop-opacity=".5"/><stop offset="1" stop-color="#8fe6ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="stz-buco"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#000" stop-opacity=".75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="stz-sole-g"><stop offset="0" stop-color="#fff4c2"/><stop offset=".45" stop-color="#ffd76a"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient>
      <clipPath id="stz-vetro"><rect x="134" y="60" width="104" height="102"/></clipPath>
      <clipPath id="stz-display"><rect x="385" y="154" width="90" height="56" rx="2"/></clipPath>
      <mask id="stz-maschera" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="440">
        <rect width="640" height="440" fill="#fff"/>
        <rect x="134" y="60" width="104" height="102" fill="#000"/>
        <ellipse class="stz-m-luna" cx="170" cy="250" rx="120" ry="70" fill="url(#stz-buco)" opacity=".42"/>
        <rect class="stz-m-schermo" x="385" y="154" width="90" height="56" fill="#000"/>
        <ellipse class="stz-m-lampada" cx="470" cy="236" rx="200" ry="130" fill="url(#stz-buco)"/>
        <ellipse class="stz-m-riverbero" cx="316" cy="258" rx="74" ry="62" fill="url(#stz-buco)" opacity=".55"/>
        <g class="stz-m-lucine">${lucine.map((l) => `<circle cx="${l.x}" cy="${l.y}" r="10" fill="url(#stz-buco)"/>`).join('')}</g>
      </mask>
    </defs>

    <!-- soffitto e pareti -->
    <polygon points="0,0 640,0 540,26 100,26" fill="#efe5cc"/>
    <g class="stz-ragno" transform="translate(640 0) scale(-1 1)" fill="none" stroke="#8a7550" stroke-width=".7" opacity=".7"><path d="M100 26L100 62M100 26L136 26M100 26L128 52M100 26L118 58M100 26L132 38"/><path d="M100 38q6 0 8 -4q4 2 8 -2M100 48q10 0 14 -6q8 2 12 -6q4 0 8 -6M100 56q12 -2 20 -10q8 -2 10 -10"/></g>
    <g transform="translate(640 0) scale(-1 1)"><g class="stz-ragnetto"><path d="M122 28V47" stroke="#3b3326" stroke-width=".6"/><g class="stz-ragnetto__corpo"><circle cx="122" cy="49" r="2.4" fill="#161616"/><path d="M119 47l-3 -2M119 49h-4M119 51l-3 2M125 47l3 -2M125 49h4M125 51l3 2" stroke="#161616" stroke-width=".7"/></g></g></g>
    <polygon points="0,-30 100,26 100,272 0,328" fill="url(#stz-muro-s)"/>
    <polygon points="640,-30 540,26 540,272 640,328" fill="url(#stz-muro-d)"/>
    <rect x="100" y="26" width="440" height="246" fill="url(#stz-muro)"/>
    <g fill="none" stroke="#8a7550" opacity=".22" stroke-width="1">
      <path d="M160 26v236M220 26v236M280 26v236M340 26v236M400 26v236M460 26v236M520 26v236" stroke-dasharray="2 9"/>
    </g>
    <path d="M100 26L0 -30M540 26L640 -30" stroke="#a8936a" stroke-width="1.5"/>
    <path d="M100 26V272M540 26V272" stroke="#9c875f" stroke-width="2" opacity=".6"/>
    <!-- macchie, crepe e scritte sul muro -->
    <g opacity=".5"><ellipse cx="300" cy="44" rx="26" ry="9" fill="#c9b07f" opacity=".4"/><path d="M520 120l-8 14l4 10l-6 12" fill="none" stroke="#8a7550" stroke-width="1"/></g>
    <!-- pavimento -->
    <polygon points="0,328 100,272 540,272 640,328 640,440 0,440" fill="url(#stz-legno)"/>
    <g stroke="#5e3b22" stroke-width="1.1" opacity=".45">${assi}</g>
    <polygon points="0,328 100,272 540,272 640,328 640,334 540,276 100,276 0,334" fill="#000" opacity=".12"/>
    <rect x="100" y="264" width="440" height="8" fill="#efe2c4"/><path d="M100 272H540" stroke="#6b5233" stroke-width="1.4" opacity=".6"/>
    <polygon points="0,320 100,264 100,272 0,328" fill="#d8c8a4"/><polygon points="640,320 540,264 540,272 640,328" fill="#ddcea9"/>

    <!-- le lucine: il filo (le lampadine sono più giù, sopra il buio) -->
    <path d="M104 34Q176 60 248 36Q320 60 392 36Q464 60 536 34" fill="none" stroke="#3b3326" stroke-width="1.2"/>
    ${lucine.map((l) => `<rect x="${(+l.x - 1.6).toFixed(1)}" y="${(+l.y - 4.5).toFixed(1)}" width="3.2" height="3" fill="#3b3326"/>`).join('')}

    <!-- la finestra col cielo vero di Roma -->
    <g class="lab-stanza__finestra">
      <rect x="126" y="52" width="120" height="118" rx="2" fill="#f7f1e2" stroke="#b9a47c" stroke-width="1.5"/>
      <g clip-path="url(#stz-vetro)">
        <rect x="134" y="60" width="104" height="102" fill="url(#stz-cielo-g)"/>
        <g class="lab-stanza__giorno">
          <circle cx="212" cy="86" r="26" fill="url(#stz-sole-g)"/><circle cx="212" cy="86" r="10" fill="#fff1b0"/>
          <g class="stz-nuvole" fill="#fff" opacity=".92">
            <g class="stz-nuvola"><ellipse cx="160" cy="84" rx="14" ry="6"/><ellipse cx="168" cy="80" rx="9" ry="7"/><ellipse cx="153" cy="82" rx="7" ry="5"/></g>
            <g class="stz-nuvola stz-nuvola--2"><ellipse cx="200" cy="112" rx="12" ry="4.5"/><ellipse cx="206" cy="108.5" rx="7" ry="5"/></g>
          </g>
        </g>
        <g class="lab-stanza__notte">
          <rect x="134" y="60" width="104" height="102" fill="url(#stz-cielo-n)"/>
          ${stelle}
          <circle cx="206" cy="84" r="11" fill="#f3f0d8"/><circle cx="212" cy="80" r="10" fill="#0a1027"/>
          <circle cx="206" cy="84" r="20" fill="#f3f0d8" opacity=".08"/>
        </g>
        <g class="stz-evento stz-evento--piccione"><path d="M0 0q4 -5 8 0q4 -5 8 0" fill="none" stroke="#2b2b2b" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="1.5" r="1.8" fill="#2b2b2b"/></g>
        <g class="stz-evento stz-evento--stella"><path d="M0 0l-26 10" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><circle cx="0" cy="0" r="1.8" fill="#fff"/></g>
        <!-- i tetti di fronte -->
        <g class="stz-tetti">
          <path d="M134 162V138h12v-8h10v14h8v-22l8 -6l8 6v18h10v-10h14v-6h4v6h10v14h8v-10h12v28Z" fill="#6f7f93"/>
          <path d="M150 130v-8M182 116v-10M178 108h8M216 132v-12" stroke="#6f7f93" stroke-width="1.4"/>
          <g class="stz-tetti__luci">${finestrelle}</g>
        </g>
      </g>
      <path d="M186 60V162M134 110H238" stroke="#f7f1e2" stroke-width="4"/>
      <path d="M134 60H238V162H134Z" fill="none" stroke="#c9b48a" stroke-width="1"/>
      <path d="M140 66l18 -4M140 74l10 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/>
      <!-- tende e bastone -->
      <path d="M114 46H258" stroke="#5e3b22" stroke-width="3" stroke-linecap="round"/><circle cx="114" cy="46" r="3.4" fill="#5e3b22"/><circle cx="258" cy="46" r="3.4" fill="#5e3b22"/>
      <path d="M116 46h26c-4 30 4 62 -4 100c-3 14 -6 24 -4 32h-20c-2 -40 -2 -90 2 -132z" fill="#e2683a"/>
      <path d="M124 52c-2 40 -2 80 -2 122M134 52c-3 40 0 84 -4 122" stroke="#a8431c" stroke-width="1.4" fill="none" opacity=".6"/>
      <path d="M256 46h-24c4 30 -4 62 4 100c3 14 6 24 4 32h18c2 -40 2 -90 -2 -132z" fill="#e2683a"/>
      <path d="M248 52c2 40 2 80 2 122M238 52c3 40 0 84 4 122" stroke="#a8431c" stroke-width="1.4" fill="none" opacity=".6"/>
      <!-- davanzale col cactus -->
      <rect x="122" y="168" width="128" height="6" rx="1" fill="#f7f1e2" stroke="#b9a47c" stroke-width="1"/>
      <g transform="translate(222 168)"><path d="M-7 0l1 -9h12l1 9z" fill="#c96a00"/><path d="M-3 -9v-12a3 3 0 0 1 6 0v12" fill="#4f9a5c" stroke="#2c5e36" stroke-width="1"/><path d="M3 -15h3v-4a1.5 1.5 0 0 1 3 0v5a2 2 0 0 1 -2 2h-4" fill="#4f9a5c" stroke="#2c5e36" stroke-width="1"/><circle cx="0" cy="-22" r="1.6" fill="#ff5a4f"/></g>
      <g transform="translate(150 168)"><rect x="-6" y="-10" width="12" height="10" rx="1" fill="#fffdf6" stroke="#8a7550" stroke-width=".8"/><path d="M-3 -6h6M-3 -3h4" stroke="#8a7550" stroke-width=".8"/></g>
    </g>

    <!-- il manifesto del concerto e le scritte -->
    <g transform="rotate(-3 282 92)">
      <image href="/art/manifesti1/concerto.webp" x="258" y="58" width="48" height="66" preserveAspectRatio="none"/>
      <rect x="270" y="54" width="22" height="7" fill="#eadeb6" opacity=".85" transform="rotate(4 281 57)"/>
    </g>
    <g class="stz-cartello-bug" transform="rotate(2 280 196)">
      <rect x="254" y="176" width="54" height="36" fill="#fffdf6" stroke="#161616" stroke-width="1"/>
      <text x="281" y="186.5" text-anchor="middle" class="stz-t stz-t--mac" font-size="6" textLength="48" lengthAdjust="spacingAndGlyphs">${esc(t(lang, 'senzaBug'))}</text>
      <text x="281" y="208" text-anchor="middle" class="stz-t stz-t--marker" font-size="20" fill="#b3121f">0</text>
      <circle cx="281" cy="202" r="10" fill="none" stroke="#b3121f" stroke-width="1.2" stroke-dasharray="40 6"/>
      <circle cx="281" cy="174" r="2" fill="#b3121f"/>
    </g>
    <!-- sul muro di sinistra: il manifesto della sagra e la tag -->
    <image href="/art/manifesti1/sagra.webp" width="1" height="1" preserveAspectRatio="none" transform="matrix(44 10 0 62 28 70)"/>
    <path d="M44 70l12 4" stroke="#eadeb6" stroke-width="6" opacity=".85"/>
    <g transform="matrix(.82 .2 0 1 14 214)" class="stz-tag">
      <text x="0" y="0" class="stz-t stz-t--marker" font-size="28" fill="#b3121f" transform="rotate(-8)">pzk</text>
      <path d="M8 2v9M30 -2v13M50 -6v7" stroke="#b3121f" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
    </g>

    <!-- la mensola -->
    <g class="stz-mensola">
      <path d="M340 118H480l4 6H336Z" fill="#7f5232"/><path d="M350 124l6 10M470 124l-6 10" stroke="#5e3b22" stroke-width="2.4"/>
      <rect x="344" y="90" width="7" height="28" fill="#1446a0"/><rect x="351" y="94" width="6" height="24" fill="#c96a00"/><rect x="357" y="88" width="8" height="30" fill="#23864a"/><rect x="365" y="96" width="5" height="22" fill="#fffdf6" stroke="#161616" stroke-width=".6"/>
      <rect x="370" y="92" width="7" height="26" fill="#b3121f" transform="rotate(12 373 118)"/>
      <path d="M346 96h5M358 94h7M346 112h5" stroke="#fff" stroke-width=".8" opacity=".6"/>
      <g transform="translate(398 118)"><path d="M-6 0h12l-2 -4h-8z" fill="#5e3b22"/><path d="M-5 -4h10v-2h-10z" fill="#c8a22a"/><path d="M-6 -20h12c0 8 -3 12 -6 14c-3 -2 -6 -6 -6 -14z" fill="#e6c040"/><path d="M-6 -17c-4 0 -4 6 1 6M6 -17c4 0 4 6 -1 6" fill="none" stroke="#e6c040" stroke-width="1.4"/><text x="0" y="-11" text-anchor="middle" class="stz-t stz-t--fa" font-size="6" fill="#7a5a10">1°</text></g>
      <g transform="translate(440 118) rotate(-6)"><rect x="-14" y="-28" width="28" height="28" fill="#161616"/><circle cx="0" cy="-14" r="11" fill="#2a2a2a"/><circle cx="0" cy="-14" r="4" fill="#b3121f"/><circle cx="0" cy="-14" r="7.5" fill="none" stroke="#3a3a3a" stroke-width=".6"/></g>
      <g transform="translate(468 118)"><path d="M-6 0l1 -8h10l1 8z" fill="#c96a00"/><path d="M0 -8c-6 6 -8 18 -10 30M2 -8c4 8 4 16 8 26M0 -8c-1 8 -2 20 -3 34" fill="none" stroke="#3f7a4a" stroke-width="1.2"/>
        <g fill="#4f9a5c"><ellipse cx="-8" cy="8" rx="3" ry="1.8" transform="rotate(-30 -8 8)"/><ellipse cx="-10" cy="18" rx="3" ry="1.8" transform="rotate(20 -10 18)"/><ellipse cx="6" cy="6" rx="3" ry="1.8" transform="rotate(30 6 6)"/><ellipse cx="9" cy="15" rx="3" ry="1.8"/><ellipse cx="-2" cy="22" rx="3" ry="1.8" transform="rotate(-40 -2 22)"/><ellipse cx="-4" cy="-4" rx="3" ry="2" transform="rotate(-50 -4 -4)"/><ellipse cx="4" cy="-5" rx="3" ry="2" transform="rotate(40 4 -5)"/></g></g>
    </g>
    <!-- l'orologio, con l'ora vera di Roma -->
    <g class="lab-stanza__orologio" transform="translate(508 76)">
      <circle r="17" fill="#fffdf6" stroke="#161616" stroke-width="2.4"/>
      <g stroke="#161616" stroke-width="1.2">${Array.from({ length: 12 }, (_, i) => `<path d="M0 -14v${i % 3 ? 2 : 4}" transform="rotate(${i * 30})"/>`).join('')}</g>
      <path data-ore d="M0 2V-8" stroke="#161616" stroke-width="2.4" stroke-linecap="round"/>
      <path data-minuti d="M0 3V-12" stroke="#b3121f" stroke-width="1.4" stroke-linecap="round"/>
      <circle r="1.6" fill="#161616"/>
    </g>

    <!-- il letto sotto la finestra -->
    <g class="stz-letto">
      <path d="M104 252V222q0 -10 10 -10h112q10 0 10 10V252Z" fill="#7f5232" stroke="#5e3b22" stroke-width="1.5"/>
      <path d="M114 220h112" stroke="#a8754b" stroke-width="3" stroke-linecap="round"/>
      <polygon points="236,250 202,288 202,322 236,276" fill="#6a4228"/>
      <polygon points="104,248 236,248 202,288 18,288" fill="#f3ead6"/>
      <polygon points="18,288 202,288 202,322 18,322" fill="#7f5232"/>
      <path d="M18 288h184" stroke="#5e3b22" stroke-width="1.5"/>
      <path d="M116 260c-4 -10 2 -14 12 -14h40c10 0 14 4 10 14c-2 4 -60 4 -62 0z" fill="#fffdf6" stroke="#c9b48a" stroke-width="1.2"/>
    </g>
    <g transform="translate(178 268) scale(-.92 .92)"><g class="stz-lumaca stz-lumaca--letto">${lumaca(true)}</g></g>
    <g class="stz-coperta">
      <path d="M70 263C96 262 118 259 140 259C168 258 196 252 226 260L238 255V281L204 321C150 324 70 324 15 321V291Z" fill="#1446a0"/>
      <path d="M204 321V291L238 255V281Z" fill="#0d2f6e" opacity=".55"/>
      <path d="M15 291L70 263M15 291H204L238 255" fill="none" stroke="#0d2f6e" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M52 272H216M35 281H210M15 302H204M15 312H204" fill="none" stroke="#f0763a" stroke-width="2.6" opacity=".85"/>
      <path d="M70 263C96 262 118 259 140 259C168 258 196 252 226 260" fill="none" stroke="#f3ead6" stroke-width="6" stroke-linecap="round"/>
      <path d="M90 300c6 4 16 6 24 4M150 306c8 3 18 3 26 0" fill="none" stroke="#0d2f6e" stroke-width="1.4" opacity=".7"/>
    </g>
    <!-- il calzino perso -->
    <path d="M226 334l10 -2l2 8q8 0 10 6l-14 2q-4 -6 -6 -10z" fill="#fffdf6" stroke="#161616" stroke-width="1"/><path d="M226 334l10 -2l.6 3l-10 2z" fill="#b3121f"/>

    <!-- la scrivania -->
    <g class="stz-scrivania">
      <rect x="302" y="232" width="6" height="40" fill="#4b2f1c"/>
      <polygon points="300,232 536,232 604,258 294,258" fill="#a8754b"/>
      <path d="M300 232H536" stroke="#c99466" stroke-width="1.5"/>
      <rect x="294" y="258" width="310" height="10" fill="#7f5232"/>
      <rect x="296" y="268" width="8" height="44" fill="#6a4228"/>
      <rect x="520" y="268" width="80" height="44" fill="#8f603c" stroke="#5e3b22" stroke-width="1"/>
      <path d="M520 282H600M520 296H600" stroke="#5e3b22" stroke-width="1"/>
      <g fill="#d8c8a4"><rect x="552" y="273" width="16" height="3" rx="1.5"/><rect x="552" y="287" width="16" height="3" rx="1.5"/><rect x="552" y="301" width="16" height="3" rx="1.5"/></g>
      <image href="/art/adesivi/pzkkonet.webp" x="524" y="280" width="30" height="18" transform="rotate(-6 539 289)"/>
    </g>
    <!-- i cavi e la ciabatta -->
    <g fill="none" stroke="#1f1f24" stroke-width="2" stroke-linecap="round">
      <path d="M430 268c-4 20 10 26 2 40c-6 10 8 14 24 14"/><path d="M500 268c6 14 -12 18 -4 30c6 8 -6 18 -30 24"/><path d="M362 268c0 24 30 20 40 34c6 8 30 16 60 18"/>
      <path d="M470 268c-2 6 6 8 2 14c-3 4 3 6 0 10" stroke="#ffffff" stroke-width="1.4"/>
    </g>
    <rect x="452" y="318" width="52" height="9" rx="2" fill="#fffdf6" stroke="#161616" stroke-width="1"/><circle cx="498" cy="322.5" r="2" fill="#ff5a4f" class="stz-ciabatta"/>
    <g fill="#161616"><rect x="458" y="315" width="6" height="6" rx="1"/><rect x="470" y="315" width="6" height="6" rx="1"/><rect x="482" y="315" width="6" height="6" rx="1"/></g>

    <!-- carte, tazza, tastiera, mouse -->
    <g class="stz-carte"><polygon points="306,240 334,236 340,252 310,256" fill="#fffdf6" stroke="#c9b48a" stroke-width=".8"/><polygon points="310,238 336,240 336,254 308,252" fill="#f3ead6" stroke="#c9b48a" stroke-width=".8"/><path d="M314 244h16M314 247h12M314 250h18" stroke="#8a7550" stroke-width=".7"/><circle cx="326" cy="246" r="5" fill="none" stroke="#8f603c" stroke-width="1" opacity=".5"/></g>
    <g class="stz-tazza" transform="translate(342 236)">
      <path d="M0 0h12v12a3 3 0 0 1 -3 3h-6a3 3 0 0 1 -3 -3z" fill="#b3121f" stroke="#161616" stroke-width="1"/><path d="M12 3h2a3 3 0 0 1 0 6h-2" fill="none" stroke="#161616" stroke-width="1.4"/>
      <ellipse cx="6" cy="0" rx="6" ry="1.6" fill="#4b2f1c"/><text x="6" y="10" text-anchor="middle" class="stz-t stz-t--fa" font-size="5" fill="#fff">pzk</text>
      <g class="stz-vapore" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M3 -3c-3 -4 3 -6 0 -10"/><path d="M8 -3c-3 -4 3 -6 0 -10"/></g>
    </g>
    <polygon points="392,244 462,244 468,256 386,256" fill="#2d2d33"/>
    <g stroke="#55555f" stroke-width="1.4" stroke-dasharray="3 1.4"><path d="M393 247.5h68M391 250.5h72M389 253.5h76"/></g>
    <polygon points="474,246 506,246 512,258 472,258" fill="#1446a0" opacity=".9"/><ellipse cx="492" cy="251" rx="5" ry="3.4" fill="#e8e2d2" stroke="#161616" stroke-width=".8"/>

    <!-- il monitor con le finestre delle app -->
    <g class="lab-stanza__monitor">
      <ellipse cx="430" cy="244" rx="20" ry="3.6" fill="#1b1b1f"/><rect x="424" y="214" width="12" height="30" fill="#2a2a30"/>
      <rect x="380" y="149" width="100" height="66" rx="4" fill="#1b1b1f"/>
      <rect x="385" y="154" width="90" height="56" rx="2" fill="#0a0a0c"/>
      <g class="lab-stanza__display" clip-path="url(#stz-display)">
        <rect x="385" y="154" width="90" height="56" fill="url(#stz-schermo)"/>
        <g transform="translate(430 196) scale(.3)" opacity=".35"><circle cx="-6" cy="-28" r="22" fill="none" stroke="#ccff00" stroke-width="5"/><path d="M-50 0H45" stroke="#ccff00" stroke-width="5"/></g>
        <g class="lab-stanza__apps">${finestre}</g>
        <rect x="385" y="205" width="90" height="5" fill="#0d1b22" opacity=".9"/>
        <rect class="stz-cursore" x="389" y="206.5" width="4" height="2" fill="#ccff00"/>
      </g>
      <g class="stz-spento"><path d="M392 160l20 -4M392 168l10 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".12"/><circle cx="472" cy="212" r="1.4" fill="#ff9a2a"/></g>
      <rect x="377" y="145" width="13" height="13" fill="#ffd400" transform="rotate(-7 383 151)"/><path d="M379 150h8M379 153h6" stroke="#161616" stroke-width=".7" transform="rotate(-7 383 151)"/>
      <g class="stz-badge" transform="rotate(-8 482 152)"><circle cx="482" cy="152" r="8.5" fill="#b3121f" stroke="#fffdf6" stroke-width="1.6"/><text class="lab-stanza__piu" x="482" y="155.6" text-anchor="middle" font-size="9.5"></text></g>
      <rect x="376" y="196" width="12" height="12" fill="#ccff00" transform="rotate(-8 382 202)"/><path d="M378 201h7M378 204h5" stroke="#161616" stroke-width=".7" transform="rotate(-8 382 202)"/>
    </g>
    <!-- le casse -->
    <g class="lab-stanza__cassa">
      <g class="stz-cassa"><rect x="350" y="186" width="25" height="58" rx="3" fill="#2a2a30" stroke="#111" stroke-width="1"/><circle cx="362.5" cy="199" r="4.5" fill="#444" stroke="#111"/><g class="stz-woofer"><circle cx="362.5" cy="224" r="9.5" fill="#3a3a42" stroke="#111"/><circle cx="362.5" cy="224" r="6" fill="#26262b"/><circle cx="362.5" cy="224" r="2.4" fill="#55555f"/></g></g>
      <g class="stz-cassa stz-cassa--2"><rect x="486" y="186" width="25" height="58" rx="3" fill="#2a2a30" stroke="#111" stroke-width="1"/><circle cx="498.5" cy="199" r="4.5" fill="#444" stroke="#111"/><g class="stz-woofer"><circle cx="498.5" cy="224" r="9.5" fill="#3a3a42" stroke="#111"/><circle cx="498.5" cy="224" r="6" fill="#26262b"/><circle cx="498.5" cy="224" r="2.4" fill="#55555f"/></g></g>
    </g>
    <!-- la lampada da tavolo -->
    <g class="lab-stanza__lampada">
      <ellipse cx="560" cy="252" rx="14" ry="4" fill="#161616"/>
      <path d="M560 250L574 198L540 168" fill="none" stroke="#161616" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M566 226l8 -2M570 212l8 -2" stroke="#55555f" stroke-width="1.4"/><circle cx="574" cy="198" r="3" fill="#b3121f"/>
      <path d="M534 158L550 166L540 190Q526 192 516 182Z" fill="#b3121f" stroke="#161616" stroke-width="1.4" stroke-linejoin="round"/>
      <ellipse class="stz-lampadina" cx="528" cy="186" rx="7" ry="3.5" fill="#6b6459" transform="rotate(25 528 186)"/>
    </g>

    <!-- la sedia e la chiocciola al lavoro -->
    <g class="stz-sedia-dietro">
      <ellipse cx="270" cy="362" rx="48" ry="8" fill="#000" opacity=".2"/>
      <path d="M268 312v42" stroke="#2a2a30" stroke-width="7"/>
      <g stroke="#2a2a30" stroke-width="4" stroke-linecap="round"><path d="M268 352l-30 6M268 352l30 6M268 352l-14 12M268 352l14 12"/></g>
      <g fill="#161616"><circle cx="236" cy="360" r="3.4"/><circle cx="300" cy="360" r="3.4"/><circle cx="253" cy="366" r="3.4"/><circle cx="283" cy="366" r="3.4"/></g>
      <path d="M218 304V236q0 -12 12 -12h6q12 0 12 12V304Z" fill="#b3121f" stroke="#161616" stroke-width="1.6"/>
      <path d="M233 228v74" stroke="#fffdf6" stroke-width="3"/>
      <g class="stz-cartello" transform="rotate(6 232 240)"><path d="M232 236l-26 16h16z" fill="none" stroke="#161616" stroke-width=".8"/><rect x="190" y="252" width="48" height="22" rx="2" fill="#fffdf6" stroke="#161616" stroke-width="1"/><text x="214" y="261" text-anchor="middle" class="stz-t stz-t--fa" font-size="6.4" fill="#b3121f">${esc(t(lang, 'nonDisturbare').split(' ')[0])}</text><text x="214" y="270" text-anchor="middle" class="stz-t stz-t--fa" font-size="6.4" fill="#b3121f">${esc(t(lang, 'nonDisturbare').split(' ').slice(1).join(' '))}</text></g>
      <path d="M226 306q42 -6 82 0v8q-40 6 -82 0z" fill="#8a0d17" stroke="#161616" stroke-width="1.4"/>
    </g>
    <g class="lab-stanza__riverbero"><ellipse cx="318" cy="256" rx="50" ry="42" fill="url(#stz-blu)"/></g>
    <g transform="translate(266 306)"><g class="stz-lumaca stz-lumaca--sedia">${lumaca(false)}</g></g>
    <g class="stz-codice" font-size="9">
      <text x="400" y="240" class="stz-t stz-t--mac" fill="#1446a0" style="--d:0s">&lt;/&gt;</text>
      <text x="432" y="232" class="stz-t stz-t--mac" fill="#23864a" style="--d:.8s">{ }</text>
      <text x="420" y="222" class="stz-t stz-t--mac" fill="#b3121f" style="--d:1.6s">;</text>
    </g>
    <g class="stz-pausa" fill="#fffdf6" stroke="#161616" stroke-width="1"><circle cx="306" cy="230" r="3"/><circle cx="314" cy="222" r="4"/><circle cx="324" cy="212" r="5"/></g>

    <!-- tappeto, cartone della pizza, cestino, pallina di carta -->
    <g class="stz-tappeto"><ellipse cx="330" cy="392" rx="150" ry="30" fill="#b3121f" opacity=".9"/><ellipse cx="330" cy="392" rx="126" ry="23" fill="none" stroke="#f3ead6" stroke-width="3" stroke-dasharray="10 6"/><ellipse cx="330" cy="392" rx="96" ry="16" fill="none" stroke="#1446a0" stroke-width="4"/></g>
    <g class="stz-pizza" transform="translate(62 382)">
      <polygon points="0,10 56,4 72,22 14,30" fill="#e9d6ad" stroke="#a8875a" stroke-width="1"/>
      <polygon points="0,10 56,4 50,-14 -6,-8" fill="#f3e4c0" stroke="#a8875a" stroke-width="1"/>
      <text x="22" y="-1" text-anchor="middle" class="stz-t stz-t--fa" font-size="9" fill="#b3121f" transform="rotate(-6 22 -1)">${esc(t(lang, 'pizza'))}</text>
      <circle cx="40" cy="18" r="3" fill="#c96a00" opacity=".6"/>
    </g>
    <g class="stz-cestino"><path d="M570 352h40l-5 50h-30z" fill="#55555f" stroke="#161616" stroke-width="1"/><ellipse cx="590" cy="352" rx="20" ry="5" fill="#2a2a30"/><g fill="#fffdf6" stroke="#8a7550" stroke-width=".8"><circle cx="584" cy="348" r="5"/><circle cx="595" cy="346" r="4.5"/></g><path d="M578 360l2 38M590 360v40M602 360l-2 38" stroke="#3a3a42"/></g>
    <circle cx="548" cy="412" r="6" fill="#fffdf6" stroke="#8a7550" stroke-width=".9"/><path d="M545 409l4 3l-2 3M550 408l1 5" stroke="#8a7550" stroke-width=".6" fill="none"/>

    <!-- la porta sul muro di destra, col cartello -->
    <g class="stz-porta">
      <polygon points="592,88 640,77 640,329 592,302" fill="#8f603c" stroke="#5e3b22" stroke-width="2"/>
      <polygon points="598,104 634,96 634,180 598,184" fill="none" stroke="#6a4228" stroke-width="1.4"/>
      <polygon points="598,200 634,198 634,300 598,284" fill="none" stroke="#6a4228" stroke-width="1.4"/>
      <circle cx="600" cy="198" r="3" fill="#e6c040" stroke="#7a5a10"/>
      <g transform="matrix(.9 -.12 0 1 586 210)"><path d="M14 -10l-10 12h22z" fill="none" stroke="#161616" stroke-width=".8"/><rect x="0" y="0" width="30" height="24" rx="2" fill="#ffd400" stroke="#161616" stroke-width="1"/><text x="15" y="10" text-anchor="middle" class="stz-t stz-t--fa" font-size="5.6">${esc(t(lang, 'lavori').split(' ')[0])}</text><text x="15" y="18" text-anchor="middle" class="stz-t stz-t--fa" font-size="5.6">${esc(t(lang, 'lavori').split(' ').slice(1).join(' '))}</text></g>
    </g>
    <image href="/art/manifesti2/gatto.webp" width="1" height="1" preserveAspectRatio="none" transform="matrix(32 -12 0 70 550 70)"/>
    <!-- la pianta davanti, a cornice -->
    <g class="stz-pianta">
      <path d="M0 440V410h40l-6 30z" fill="#c96a00"/><path d="M0 410h42" stroke="#8a4a00" stroke-width="2"/>
      <g fill="#2f6e3c" stroke="#1d4a27" stroke-width="1.2">
        <path d="M14 410C-4 390 -10 360 4 340C20 360 24 390 14 410Z"/>
        <path d="M20 410C24 380 44 360 70 356C66 382 48 402 20 410Z"/>
        <path d="M8 410C-10 400 -24 384 -26 366C-6 372 4 390 8 410Z"/>
      </g>
      <path d="M14 410C10 390 6 370 4 340M20 410C34 390 50 372 70 356" fill="none" stroke="#1d4a27" stroke-width="1"/>
    </g>

    <!-- il buio, con i buchi dove c'è luce -->
    <rect class="lab-stanza__buio" width="640" height="440" mask="url(#stz-maschera)"/>
    <!-- le luci, sopra il buio -->
    <g class="lab-stanza__raggio"><polygon points="134,162 238,162 330,360 150,380" fill="url(#stz-raggio-g)"/></g>
    <g class="lab-stanza__luna"><polygon points="134,162 238,162 250,300 70,320" fill="url(#stz-luna-g)"/></g>
    <polygon class="lab-stanza__cono" points="516,184 540,190 590,260 430,260" fill="url(#stz-cono-g)"/>
    <g class="lab-stanza__alone"><ellipse cx="510" cy="232" rx="170" ry="110" fill="url(#stz-lume)"/><circle cx="528" cy="186" r="12" fill="#fff6c8" opacity=".9"/></g>
    <g class="lab-stanza__lucine">${lucine.map((l) => `<g style="--d:${l.d}s"><circle cx="${l.x}" cy="${l.y}" r="7" fill="${l.col}" opacity=".25"/><circle cx="${l.x}" cy="${l.y}" r="2.6" fill="${l.col}"/></g>`).join('')}</g>
    <g class="lab-stanza__onde">
      <g fill="none" stroke="#ccff00" stroke-width="2" stroke-linecap="round" class="stz-archi">
        <path d="M344 206q-8 12 0 24"/><path d="M338 200q-12 18 0 36"/><path d="M517 206q8 12 0 24"/><path d="M523 200q12 18 0 36"/>
      </g>
      <g class="stz-note">
        ${nota(338, 176, -30, 0, '#ccff00')}${nota(352, 170, -14, 0.9, '#ffd400', 0.85)}${nota(330, 186, -40, 1.8, '#fffdf6', 0.8)}
        ${nota(504, 172, 26, 0.45, '#ccff00')}${nota(492, 166, 12, 1.35, '#ffd400', 0.85)}${nota(512, 184, 36, 2.25, '#fffdf6', 0.8)}
      </g>
    </g>
    <g class="stz-zzz">
      <text x="128" y="218" class="stz-t stz-t--marker" font-size="16" fill="#fffdf6" stroke="#161616" stroke-width=".8" style="--d:0s">z</text>
      <text x="140" y="204" class="stz-t stz-t--marker" font-size="12" fill="#fffdf6" stroke="#161616" stroke-width=".8" style="--d:1.1s">z</text>
      <text x="150" y="192" class="stz-t stz-t--marker" font-size="9" fill="#fffdf6" stroke="#161616" stroke-width=".8" style="--d:2.2s">z</text>
    </g>
  </svg>`
}

function battuta(lang, a, n, buio) {
  const b = (T[lang] || T.en).battute
  if (!a.online) {
    if (a.track) return b.notteMusica
    if (n) return b.dormePc
    return buio ? b.dorme : b.pisolino
  }
  if (a.status === 'dnd') return b.dnd
  if (a.status === 'idle') return b.idle
  if (a.track) return b.musica
  if (n > 6) return b.troppe
  return b.lavora
}

export default {
  id: 'stanza',
  titolo: { it: 'La stanza', en: 'The room' },
  testo: {
    it: 'Una stanza in SVG che si accende con i dati veri: lampada, casse, schermo, finestra. Ci abita una chiocciola che lavora, balla o dorme, a seconda.',
    en: 'An SVG room that lights up with real data: lamp, speakers, screen, window. A snail lives here: it works, dances or sleeps, depending.',
  },
  tecnologie: ['SVG', 'CSS animations', 'Lanyard'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-stanza" data-online="false" data-music="false" data-notte="false" data-stato="offline" data-schermo="off" data-ferma="false">
      <div class="lab-stanza__foto">
        ${disegno(lang)}
        <p class="lab-stanza__fumetto" role="status" aria-live="polite" data-fumetto></p>
      </div>
      <p class="lab-stanza__didascalia" data-didascalia>—</p>
    </div>
    <div class="lab-stanza__sotto">
      <button type="button" class="lab__bottone lab__bottone--fantasma lab-stanza__bussa" data-bussa>✊ ${esc(t(lang, 'bussa'))}</button>
      <p class="lab-stanza__battuta" data-battuta></p>
    </div>
    <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const box = el.querySelector('.lab-stanza')
    const dida = el.querySelector('[data-didascalia]')
    const post = el.querySelector('[data-battuta]')
    const fumetto = el.querySelector('[data-fumetto]')
    const piu = el.querySelector('.lab-stanza__piu')
    const lancetteO = el.querySelector('[data-ore]')
    const lancetteM = el.querySelector('[data-minuti]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let corrente = api.adesso()
    let visibile = true, tFumetto = 0, tSalto = 0, tEvento = 0, giro = 0

    function aggiorna(a) {
      corrente = a
      const n = a.apps.length
      const buio = notte()
      box.dataset.online = String(a.online)
      box.dataset.music = String(!!a.track)
      box.dataset.notte = String(buio)
      box.dataset.stato = a.online ? (a.status || 'online') : 'offline'
      box.dataset.schermo = n > 0 || a.online ? 'on' : 'off'
      for (const r of box.querySelectorAll('[data-app]')) {
        const acceso = Number(r.dataset.app) < n
        r.closest('.stz-app')?.setAttribute('data-on', String(acceso))
      }
      piu.textContent = n > 6 ? `+${n - 6}` : ''
      box.dataset.troppe = String(n > 6)
      const { h, m } = oraRoma()
      lancetteO.setAttribute('transform', `rotate(${(h % 12) * 30 + m * 0.5})`)
      lancetteM.setAttribute('transform', `rotate(${m * 6})`)
      const pezzi = [a.online ? t(lang, 'online') : t(lang, 'offline')]
      if (a.track) pezzi.push(`${t(lang, 'musica')} · ${a.track.titolo}`)
      if (n) pezzi.push(t(lang, 'apps', n))
      pezzi.push(buio ? t(lang, 'notte') : t(lang, 'giorno'))
      dida.textContent = pezzi.join(' · ')
      post.textContent = battuta(lang, a, n, buio)
      api.stato(stato, a.online ? t(lang, 'pronta') : t(lang, 'spenta'), a.online ? 'ok' : '')
    }

    // bussare: la chiocciola risponde secondo quello che sta facendo
    function bussa() {
      const a = corrente || {}
      const r = (T[lang] || T.en).risposte
      const lista = !a.online ? r.letto : a.status === 'dnd' ? r.dnd : a.status === 'idle' ? r.idle : a.track ? r.musica : r.lavora
      const frase = lista[giro++ % lista.length]
      fumetto.textContent = frase
      box.dataset.fumetto = a.online ? 'sedia' : 'letto'
      box.dataset.salto = 'false'
      void box.offsetWidth
      box.dataset.salto = 'true'
      clearTimeout(tFumetto); clearTimeout(tSalto)
      tSalto = setTimeout(() => { box.dataset.salto = 'false' }, 900)
      tFumetto = setTimeout(() => { delete box.dataset.fumetto; fumetto.textContent = '' }, 3200)
    }
    const bottone = el.querySelector('[data-bussa]')
    bottone.addEventListener('click', bussa)
    const lumache = [...box.querySelectorAll('.stz-lumaca')]
    for (const l of lumache) l.addEventListener('click', bussa)

    // ogni tanto, se si vede, passa qualcosa davanti alla finestra (un piccione o una stella cadente)
    const finestra = box.querySelector('.lab-stanza__finestra')
    function evento() {
      if (!visibile || api.reduced() || box.dataset.evento) return
      box.dataset.evento = box.dataset.notte === 'true' ? 'stella' : 'piccione'
      clearTimeout(tEvento)
      tEvento = setTimeout(() => { delete box.dataset.evento }, 2600)
    }
    finestra.addEventListener('pointerenter', evento)
    const fineVisibile = api.quandoVisibile(box, (si) => { visibile = si; box.dataset.ferma = String(!si) })

    const togli = api.onAdesso(aggiorna)
    aggiorna(corrente)
    const timer = setInterval(() => { if (!document.hidden) aggiorna(corrente) }, 60_000)
    const timerEvento = setInterval(evento, 37_000)
    return () => {
      togli(); clearInterval(timer); clearInterval(timerEvento)
      clearTimeout(tFumetto); clearTimeout(tSalto); clearTimeout(tEvento)
      bottone.removeEventListener('click', bussa)
      for (const l of lumache) l.removeEventListener('click', bussa)
      finestra.removeEventListener('pointerenter', evento)
      fineVisibile?.()
    }
  },
}
