// 03 · Diario di bordo. Quello che succede mentre sei qui finisce in IndexedDB,
// nel tuo browser e basta: stato, brano, apps, luogo, gioco. Si può esportare o
// cancellare. Nessuna riga parte verso un server.
// La grafica (27.11): un registro di bordo a spirale, a righe col margine rosso. Ogni evento salvato diventa una riga
// raccontata dalla chiocciola (le frasi sono solo il modo di leggere i dati veri: il dato vero è sempre evidenziato),
// con l'ora scritta a penna e un timbro di gomma per tipo. In fondo la chiocciola di bordo, che cambia faccia con lo
// stato di adesso. Il record in IndexedDB resta { ts, tipo, d }, il DB resta `pzkko-lab` → `diario`.
import { esc, ora, semi } from '../utils.js'

const DB = 'pzkko-lab'
const STORE = 'diario'
const MAX = 300

const m = (s) => `<mark>${esc(s)}</mark>`
const lista = (xs, e) => (xs.length > 1 ? `${xs.slice(0, -1).map(m).join(', ')} ${e} ${m(xs[xs.length - 1])}` : m(xs[0]))

const T = {
  it: {
    frasi: {
      inizio: [
        () => 'si apre il registro. Mare calmo, inchiostro pieno.',
        () => 'prima pagina: la chiocciola prende il timone.',
        () => 'diario varato. Rotta: da qui in avanti.',
      ],
      online: [
        () => `la chiocciola esce dal guscio: ${m('online')}`,
        () => `terra in vista! È ${m('online')}`,
        () => `accende il motore (2 km/h): ${m('online')}`,
      ],
      idle: [
        () => `si ferma a guardare il mare: ${m('in pausa')}`,
        () => `getta l’ancora per un caffè: ${m('in pausa')}`,
        () => `occhietti a mezz’asta: ${m('in pausa')}`,
      ],
      dnd: [
        () => `appende il cartello al guscio: ${m('non disturbare')}`,
        () => `nebbia fitta sul ponte: ${m('non disturbare')}`,
        () => `lavori in corso, ripassate dopo: ${m('non disturbare')}`,
      ],
      offline: [
        () => `rientra nel guscio e chiude la porta: ${m('offline')}`,
        () => `ammaina le vele: ${m('offline')}`,
        () => `si spegne la lanterna di bordo: ${m('offline')}`,
      ],
      musica: [
        (d) => `alla radio di bordo: ${m(`«${d.titolo}»`)}${d.artista ? ` di ${m(d.artista)}` : ''}`,
        (d) => `la ciurma canta ${m(`«${d.titolo}»`)}${d.artista ? ` (${m(d.artista)})` : ''}`,
        (d) => `il guscio vibra: ${m(`«${d.titolo}»`)}${d.artista ? `, ${m(d.artista)}` : ''}`,
      ],
      musicaNo: [() => 'silenzio radio. Si sentono solo i gabbiani.', () => 'musica spenta: sottocoperta tutto tace.'],
      app: [
        (d) => `sul ponte di comando: ${lista(d, 'e')}`,
        (d) => `strumenti di bordo accesi: ${lista(d, 'e')}`,
        (d) => `apre bottega con ${lista(d, 'e')}`,
      ],
      appNo: [() => 'chiude tutte le finestre: il ponte è sgombro.', () => 'zero app aperte. Si lava il ponte.'],
      ufficio: [() => `attracca in ${m('ufficio')}. Scrivania a dritta!`, () => `rotta verso l’${m('ufficio')}, rotta tenuta.`],
      giro: [() => `salpa: ${m('in giro per il mondo')}`, () => `fuori porto, ${m('in giro')}. Posizione ignota (apposta).`],
      gioco: [
        (d) => `si gioca a ${m(d)}. Il timone può aspettare.`,
        (d) => `ricreazione sul ponte: ${m(d)}`,
        (d) => `ciurma in pausa, parte ${m(d)}`,
      ],
      giocoNo: [() => 'game over: si torna al timone.', () => 'posa il joypad. Pausa finita.'],
      custom: [
        (d) => `scritto col gesso sulla lavagna di bordo: ${m(`«${d}»`)}`,
        (d) => `nuovo motto sulla bandiera: ${m(`«${d}»`)}`,
      ],
      customNo: [() => 'cancellata la lavagna di bordo.', () => 'ammainata la bandiera del motto.'],
    },
    vuoto: 'Pagina bianca. Il capitano è al bar: il diario scrive da solo appena succede qualcosa.',
    eventi: (n) => `${n} ${n === 1 ? 'evento' : 'eventi'} · solo in questo browser`,
    massimo: `Al massimo ${MAX} righe: poi le più vecchie volano fuori bordo.`,
    svuota: 'Svuota',
    sicuro: 'Sì, strappa!',
    avviso: 'Sei sicuro? Strappo tutte le pagine. Hai 3 secondi per pentirti.',
    salvo: 'Salvo per un pelo. Le pagine restano.',
    strappate: 'Strappate. Erano belle pagine.',
    esporta: 'Esporta',
    esportato: 'Messo in bottiglia: pzkko-diario.json',
    attendi: 'Sfoglio le pagine…',
    errore: 'Il browser non mi lascia aprire il diario (forse la navigazione privata).',
    erroreCl: 'Il lucchetto non si apre.',
    oggi: 'oggi',
    ieri: 'ieri',
    modulo: { titolo: 'registro di bordo', nave: 'nave', naveV: 'S.S. Chiocciola', porto: 'porto', portoV: 'questo browser', pag: 'pag.' },
    umore: {
      online: 'Scrivo tutto, capitano.',
      idle: 'Pausa caffè. Il mare aspetta.',
      dnd: 'Shh. Sto verbalizzando.',
      offline: 'Zzz… se torna, lo scrivo io.',
      musica: 'Scrivo a tempo di musica.',
    },
    chiocciola: 'La chiocciola di bordo: toccala',
    solletico: [
      'Ehi! Soffro il solletico.',
      'Vado a 0,03 km/h. Record di bordo.',
      'Il guscio è in affitto, il diario è mio.',
      'Niente parte da qui: resta nel tuo browser.',
      'Scrivo a mano. Più o meno.',
      'Capitano? Io sono il mozzo. E anche la nave.',
    ],
  },
  en: {
    frasi: {
      inizio: [
        () => 'log opened. Calm sea, full inkpot.',
        () => 'page one: the snail takes the helm.',
        () => 'diary launched. Course: onwards from here.',
      ],
      online: [
        () => `the snail pops out of its shell: ${m('online')}`,
        () => `land ho! ${m('Online')}`,
        () => `starts the engine (2 km/h): ${m('online')}`,
      ],
      idle: [
        () => `stops to stare at the sea: ${m('idle')}`,
        () => `drops anchor for a coffee: ${m('idle')}`,
        () => `eyes at half-mast: ${m('idle')}`,
      ],
      dnd: [
        () => `hangs a sign on the shell: ${m('do not disturb')}`,
        () => `thick fog on deck: ${m('do not disturb')}`,
        () => `work in progress, come back later: ${m('do not disturb')}`,
      ],
      offline: [
        () => `back in the shell, door shut: ${m('offline')}`,
        () => `sails lowered: ${m('offline')}`,
        () => `the ship’s lantern goes out: ${m('offline')}`,
      ],
      musica: [
        (d) => `on the ship’s radio: ${m(`“${d.titolo}”`)}${d.artista ? ` by ${m(d.artista)}` : ''}`,
        (d) => `the crew sings along to ${m(`“${d.titolo}”`)}${d.artista ? ` (${m(d.artista)})` : ''}`,
        (d) => `the shell is shaking: ${m(`“${d.titolo}”`)}${d.artista ? `, ${m(d.artista)}` : ''}`,
      ],
      musicaNo: [() => 'radio silence. Only seagulls now.', () => 'music off: all quiet below deck.'],
      app: [
        (d) => `on the bridge: ${lista(d, 'and')}`,
        (d) => `ship’s instruments on: ${lista(d, 'and')}`,
        (d) => `opens shop with ${lista(d, 'and')}`,
      ],
      appNo: [() => 'every window shut: the bridge is clear.', () => 'zero apps open. Swabbing the deck.'],
      ufficio: [() => `docks at the ${m('office')}. Desk to starboard!`, () => `course set for the ${m('office')}, holding steady.`],
      giro: [() => `sets sail: ${m('out in the world')}`, () => `off port, ${m('out and about')}. Position unknown (on purpose).`],
      gioco: [
        (d) => `playing ${m(d)}. The helm can wait.`,
        (d) => `recess on deck: ${m(d)}`,
        (d) => `crew on break, ${m(d)} starts`,
      ],
      giocoNo: [() => 'game over: back to the helm.', () => 'puts the controller down. Break’s over.'],
      custom: [
        (d) => `chalked on the ship’s board: ${m(`“${d}”`)}`,
        (d) => `new motto on the flag: ${m(`“${d}”`)}`,
      ],
      customNo: [() => 'the ship’s board wiped clean.', () => 'motto flag lowered.'],
    },
    vuoto: 'Blank page. The captain is at the bar: the diary writes itself as soon as something happens.',
    eventi: (n) => `${n} ${n === 1 ? 'event' : 'events'} · this browser only`,
    massimo: `${MAX} lines at most: then the oldest go overboard.`,
    svuota: 'Clear',
    sicuro: 'Yes, tear!',
    avviso: 'Are you sure? I’ll tear out every page. 3 seconds to change your mind.',
    salvo: 'Saved by a whisker. The pages stay.',
    strappate: 'Torn out. They were nice pages.',
    esporta: 'Export',
    esportato: 'Message in a bottle: pzkko-diario.json',
    attendi: 'Flipping pages…',
    errore: 'The browser will not open the diary (private browsing?).',
    erroreCl: 'The padlock won’t open.',
    oggi: 'today',
    ieri: 'yesterday',
    modulo: { titolo: 'ship’s log', nave: 'ship', naveV: 'S.S. Snail', porto: 'port', portoV: 'this browser', pag: 'page' },
    umore: {
      online: 'Writing it all down, captain.',
      idle: 'Coffee break. The sea can wait.',
      dnd: 'Shh. Taking minutes.',
      offline: 'Zzz… if they’re back, I’ll write it.',
      musica: 'Writing in time with the music.',
    },
    chiocciola: 'The ship’s snail: poke it',
    solletico: [
      'Hey! I’m ticklish.',
      '0.03 km/h. Ship’s record.',
      'The shell is rented, the diary is mine.',
      'Nothing leaves from here: it stays in your browser.',
      'All handwritten. More or less.',
      'Captain? I’m the cabin boy. And the ship.',
    ],
  },
}
const L = (lang) => T[lang] || T.en
const t = (lang, k, ...a) => {
  const v = L(lang)[k] ?? T.en[k]
  return typeof v === 'function' ? v(...a) : v
}

// ── i timbri di gomma, uno per tipo (e per stato): disegnati una volta, usati con <use> ──
const ANELLO = '<circle cx="16" cy="16" r="14"/><circle cx="16" cy="16" r="11.6" stroke-width=".8"/>'
const SIMBOLI = {
  inizio: '<circle cx="16" cy="9.2" r="1.9"/><path d="M16 11.1v13.2M12 14.2h8M9.6 18.6c.7 3.8 3.4 6 6.4 6s5.7-2.2 6.4-6M9.6 18.6l-1.6 1.4M9.6 18.6l2 .9M22.4 18.6l1.6 1.4M22.4 18.6l-2 .9"/>',
  online: '<path d="M13 24.6l1.7-11.4h2.6L19 24.6zM11.4 24.6h9.2M12.4 13.2h7.2M14.2 13.2v-2.8h3.6v2.8M15 10.4l1-1.8 1 1.8M14.3 17.2h3.4M13.8 21h4.4"/><path d="M20.6 10.6l3.8-1.6M20.6 12.4l3.8 1.4M11.4 10.6L7.6 9M11.4 12.4L7.6 13.8" stroke-width="1.1"/>',
  idle: '<path d="M19.5 8.6a7.8 7.8 0 1 0 4.6 12.6 6.2 6.2 0 0 1-4.6-12.6z"/><path d="M21.5 10.5h3l-3 3h3" stroke-width="1"/>',
  dnd: '<circle cx="16" cy="16" r="7.2"/><path d="M11.6 16h8.8" stroke-width="2.6"/>',
  offline: '<circle cx="14" cy="18" r="6"/><path d="M14 18a1.3 1.3 0 1 1 1.4 1.3 2.8 2.8 0 1 1-2.9-2.9M7.5 24.2h13"/><path d="M19.5 8.5h3.4l-3.4 3.6h3.4M23.5 12.6h2.2l-2.2 2.4h2.2" stroke-width="1"/>',
  musica: '<path d="M12.6 21.6V10.4l9.4-2v11.2M12.6 13.6l9.4-2"/><ellipse cx="10.6" cy="21.8" rx="2.2" ry="1.7"/><ellipse cx="20" cy="19.8" rx="2.2" ry="1.7"/>',
  app: '<rect x="7.6" y="9.4" width="16.8" height="13.2" rx="1.2"/><path d="M7.6 12.8h16.8M10.4 16h6M10.4 19h9"/><circle cx="9.8" cy="11.1" r=".5" fill="currentColor"/><circle cx="11.6" cy="11.1" r=".5" fill="currentColor"/>',
  ufficio: '<path d="M10 24.2V9.2h12v15M8 24.2h16M13 12.2h2M17 12.2h2M13 15.4h2M17 15.4h2M13 18.6h2M17 18.6h2M15 24.2v-3h2v3"/>',
  giro: '<circle cx="16" cy="16" r="7.4"/><path d="M16 10.2l2.2 5.8-2.2 5.8-2.2-5.8z" fill="currentColor" fill-opacity=".35"/><path d="M16 7v1.6M16 23.4V25M7 16h1.6M23.4 16H25"/>',
  gioco: '<path d="M10.6 11.6h10.8c2.6 0 4 2.4 4.4 6.4.3 2.6-.8 4-2.2 4-1.6 0-2.4-2.4-4.2-2.4h-6.8c-1.8 0-2.6 2.4-4.2 2.4-1.4 0-2.5-1.4-2.2-4 .4-4 1.8-6.4 4.4-6.4z"/><path d="M11.4 14.4v3.4M9.7 16.1h3.4"/><circle cx="19.8" cy="15" r=".9" fill="currentColor"/><circle cx="21.8" cy="17.2" r=".9" fill="currentColor"/>',
  custom: '<path d="M10.4 25V7.4M10.4 8.6h12.2l-3.2 4 3.2 4H10.4"/>',
}
const DEFS = `<svg class="lab-diario__defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>
  <filter id="lab-diario-gomma" x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.8 0 0 0 1.75" result="b"/>
    <feComposite in="d" in2="b" operator="in"/>
  </filter>
  ${Object.entries(SIMBOLI).map(([k, v]) => `<symbol id="lab-diario-i-${k}" viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ANELLO}${v}</g></symbol>`).join('')}
</defs></svg>`

// la chiocciola di bordo, risograph a due inchiostri come i manifesti: guscio arancio, tratto blu
// la spirale del guscio: archimedea, tre giri e un quarto dentro il cerchio
const SPIRALE = (() => {
  const pt = []
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * Math.PI * 6.5, r = 1.5 + (a / (Math.PI * 6.5)) * 23
    pt.push(`${(54 + r * Math.cos(a + 2.2)).toFixed(1)} ${(47 + r * Math.sin(a + 2.2)).toFixed(1)}`)
  }
  return `M${pt.join('L')}`
})()
const CHIOCCIOLA = `<svg viewBox="0 0 132 92" aria-hidden="true" focusable="false">
  <g class="cl-note" fill="#1446a0"><path d="M18 22v-12l8-2v11" fill="none" stroke="#1446a0" stroke-width="2"/><ellipse cx="16" cy="22.5" rx="3" ry="2.3"/><ellipse cx="24" cy="19.5" rx="3" ry="2.3"/><path d="M36 14v-9" fill="none" stroke="#1446a0" stroke-width="2"/><ellipse cx="34" cy="14.4" rx="2.8" ry="2.1"/></g>
  <path class="cl-bava" d="M2 84c20-1.6 46-1.8 70-1.4" fill="none" stroke="#9fb7d8" stroke-width="3" stroke-linecap="round" opacity=".55"/>
  <g class="cl-corpo">
    <g class="cl-testa">
      <path d="M86 70c8-2 13-8 14-17 .8-7 1.8-13 6-15.6 4.4-2.6 9 .4 9.6 6 .8 7-1.6 15-4.6 20.4-3 5.4-8 9.2-15 10.2z" fill="#dfe6d2" stroke="#1446a0" stroke-width="2.2" stroke-linejoin="round"/>
      <g class="cl-antenne">
        <g class="cl-ant1"><path d="M107 39c-1.8-6-3.4-12-6.6-18.6" fill="none" stroke="#1446a0" stroke-width="2.2" stroke-linecap="round"/><circle cx="100.2" cy="19.4" r="3.8" fill="#fffdf6" stroke="#1446a0" stroke-width="1.6"/><circle class="cl-pup" cx="101.2" cy="19.8" r="1.8" fill="#161616"/><path class="cl-palpebre" d="M96.53 20.6a3.8 3.8 0 1 1 7.34 0z" fill="#dfe6d2" stroke="#1446a0" stroke-width="1.2"/></g>
        <g class="cl-ant2"><path d="M113 41c1.6-6.4 4-12.4 8.2-17.8" fill="none" stroke="#1446a0" stroke-width="2.2" stroke-linecap="round"/><circle cx="121.6" cy="22.4" r="3.8" fill="#fffdf6" stroke="#1446a0" stroke-width="1.6"/><circle class="cl-pup" cx="122.6" cy="22.8" r="1.8" fill="#161616"/><path class="cl-palpebre" d="M117.93 23.6a3.8 3.8 0 1 1 7.34 0z" fill="#dfe6d2" stroke="#1446a0" stroke-width="1.2"/></g>
      </g>
      <path class="cl-bocca" d="M110 53.4c1.6 1.6 3.6 1.6 5 0" fill="none" stroke="#1446a0" stroke-width="1.8" stroke-linecap="round"/>
      <g class="cl-matita"><path d="M104 70l18-20 3.2 2.8-18 20-4.8 2z" fill="#ffd400" stroke="#161616" stroke-width="1.4" stroke-linejoin="round"/><path d="M104 70l-1.6 4.8 4.8-2" fill="#161616"/><path d="M122 50l1.6-1.8 3.2 2.8-1.6 1.8" fill="#b3121f" stroke="#161616" stroke-width="1.4"/></g>
    </g>
    <path d="M12 80c4-6 12-9 24-10l52-1c4 0 7 2.6 8 5.6 1 3.4-1.6 6-6 6.4z" fill="#dfe6d2" stroke="#1446a0" stroke-width="2.2" stroke-linejoin="round"/>
    <g class="cl-guscio">
      <circle cx="54" cy="47" r="29" fill="#1446a0" opacity=".9" transform="translate(2.2 1.6)"/>
      <circle cx="54" cy="47" r="29" fill="#ef6a3a"/>
      <path d="${SPIRALE}" fill="none" stroke="#1446a0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M33 31c4-5 10-8 17-8.6" fill="none" stroke="#fffdf6" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <g class="cl-porta"><path d="M74 72V60c0-5 3-8 6.5-8s6.5 3 6.5 8v12z" fill="#8a5a2b" stroke="#1446a0" stroke-width="2"/><path d="M80.5 54v18" stroke="#5e3a17" stroke-width="1"/><circle cx="84" cy="64" r="1.2" fill="#ffd400"/></g>
      <g class="cl-cartello"><path d="M40 20l14-6 14 6" fill="none" stroke="#161616" stroke-width="1.4"/><rect x="36" y="20" width="36" height="15" rx="2" fill="#fffdf6" stroke="#b3121f" stroke-width="2" transform="rotate(-6 54 27)"/><text x="54" y="31.5" text-anchor="middle" transform="rotate(-6 54 27)" font-family="Anton, Impact, sans-serif" font-size="10" fill="#b3121f">SHH!</text></g>
    </g>
  </g>
  <g class="cl-zzz" fill="#1446a0" font-family="Permanent Marker, cursive"><text x="84" y="34" font-size="20">z</text><text x="98" y="20" font-size="15">z</text><text x="110" y="9" font-size="11">z</text></g>
</svg>`

// lo scarabocchio a margine: una barchetta di carta sulle onde, a biro
const BARCHETTA = `<svg class="lab-diario__barca" viewBox="0 0 64 40" aria-hidden="true" focusable="false"><g fill="none" stroke="#1446a0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <g class="lab-diario__barca-scafo"><path d="M8 24h44l-7 8H15z"/><path d="M16 24l12-17 10 17M28 7v17M22 15.5h12"/><path d="M33 4l6 3-6 2z" fill="#b3121f" stroke="#b3121f"/></g>
  <path d="M2 34c4-3 7-3 11 0s7 3 11 0 7-3 11 0 7 3 11 0 7-3 11 0"/></g></svg>`

// la macchia di caffè (tazzina appoggiata sul registro, ovviamente)
const CAFFE = `<svg class="lab-diario__caffe" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <path d="M60 14c26 0 46 20 45 46-1 25-21 45-47 44-25-1-44-21-43-46 1-24 20-44 45-44z" fill="none" stroke="#7a4a1c" stroke-width="5" stroke-opacity=".32" stroke-dasharray="70 4 40 3 90 6"/>
  <path d="M60 20c22 0 39 17 38 40" fill="none" stroke="#7a4a1c" stroke-width="2" stroke-opacity=".22"/>
  <circle cx="104" cy="98" r="4" fill="#7a4a1c" fill-opacity=".25"/><circle cx="112" cy="90" r="2" fill="#7a4a1c" fill-opacity=".2"/></svg>`

const chiaveGiorno = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ts)
const nomeGiorno = (ts, lang) => new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long' }).format(ts)

function apri() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => {
      const db = r.result
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        s.createIndex('ts', 'ts')
      }
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error || new Error('IndexedDB'))
    r.onblocked = () => rej(new Error('IndexedDB bloccato'))
  })
}
const store = (db, modo = 'readonly') => db.transaction(STORE, modo).objectStore(STORE)

function aggiungi(db, ev) {
  return new Promise((res, rej) => {
    const r = store(db, 'readwrite').add(ev)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
function leggi(db, n = 80) {
  return new Promise((res, rej) => {
    const out = []
    const cur = store(db).index('ts').openCursor(null, 'prev')
    cur.onsuccess = () => {
      const c = cur.result
      if (!c || out.length >= n) return res(out.reverse())
      out.push(c.value)
      c.continue()
    }
    cur.onerror = () => rej(cur.error)
  })
}
function svuota(db) {
  return new Promise((res, rej) => {
    const r = store(db, 'readwrite').clear()
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}
async function pota(db) {
  const n = await new Promise((res, rej) => {
    const r = store(db).count()
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  if (n <= MAX) return
  await new Promise((res, rej) => {
    let via = n - MAX
    const cur = store(db, 'readwrite').index('ts').openCursor()
    cur.onsuccess = () => {
      const c = cur.result
      if (!c || via-- <= 0) return res()
      c.delete()
      c.continue()
    }
    cur.onerror = () => rej(cur.error)
  })
}

export default {
  id: 'diario',
  titolo: { it: 'Diario di bordo', en: 'Ship’s log' },
  testo: {
    it: 'Quello che succede mentre sei nello Studio diventa una riga di diario: online, offline, che brano, che app, dove. Resta nel tuo browser.',
    en: 'What happens while you are in the Studio becomes a diary line: online, offline, which track, which apps, where. It stays in your browser.',
  },
  tecnologie: ['IndexedDB', 'Lanyard', 'Vetrina'],
  monta(el, api) {
    const lang = api.lang
    const tx = L(lang)
    const F = tx.frasi
    el.innerHTML = `<div class="lab-diario__testa"><span class="lab-diario__conta" data-conteggio title="${esc(tx.massimo)}"></span><span class="lab__azioni"><button type="button" class="lab__bottone lab__bottone--fantasma lab-diario__esporta" data-esporta>${esc(t(lang, 'esporta'))}</button><button type="button" class="lab__bottone lab__bottone--fantasma lab-diario__svuota" data-svuota>${esc(t(lang, 'svuota'))}</button></span></div>
      <p class="lab-diario__avviso" data-avviso role="status" hidden><span data-avviso-testo></span><span class="lab-diario__miccia" aria-hidden="true"><i></i></span></p>
      <div class="lab-diario__quaderno" data-quaderno data-umore="online">
        ${DEFS}
        <div class="lab-diario__spirale" aria-hidden="true"></div>
        <div class="lab-diario__segnalibro" aria-hidden="true"></div>
        ${CAFFE}
        <header class="lab-diario__modulo">
          <b class="lab-diario__intestazione">${esc(tx.modulo.titolo)}</b>
          <span class="lab-diario__campo"><small>${esc(tx.modulo.nave)}</small><em>${esc(tx.modulo.naveV)}</em></span>
          <span class="lab-diario__campo"><small>${esc(tx.modulo.porto)}</small><em>${esc(tx.modulo.portoV)}</em></span>
          <span class="lab-diario__campo lab-diario__campo--pag"><small>${esc(tx.modulo.pag)}</small><em data-pagina>1</em></span>
          ${BARCHETTA}
        </header>
        <div class="lab-diario__pagina">
          <ol class="lab-diario" data-lista><li class="lab-diario__vuoto lab-diario__vuoto--attesa">${esc(t(lang, 'attendi'))}</li></ol>
          <b class="lab-diario__allarme" aria-hidden="true">${lang === 'it' ? 'da strappare' : 'tear out'}</b>
        </div>
        <div class="lab-diario__piede">
          <p class="lab-diario__fumetto" data-fumetto aria-live="polite"></p>
          <button type="button" class="lab-diario__chiocciola" data-chiocciola aria-label="${esc(tx.chiocciola)}">${CHIOCCIOLA}</button>
        </div>
      </div>`
    const lista = el.querySelector('[data-lista]')
    const conteggio = el.querySelector('[data-conteggio]')
    const quaderno = el.querySelector('[data-quaderno]')
    const fumetto = el.querySelector('[data-fumetto]')
    const pagina = el.querySelector('[data-pagina]')
    const avviso = el.querySelector('[data-avviso]')
    const avvisoTesto = el.querySelector('[data-avviso-testo]')
    const chiocciola = el.querySelector('[data-chiocciola]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const btnSvuota = el.querySelector('[data-svuota]')
    const btnEsporta = el.querySelector('[data-esporta]')
    let db = null, eventi = [], snap = null, timer = 0, armato = 0, vivo = true
    let umore = 'online', musica = false, battuta = 0, scrive = 0, strappo = 0, nSolletico = 0
    const timers = new Set()
    const dopo = (ms, f) => { const k = setTimeout(() => { timers.delete(k); if (vivo) f() }, ms); timers.add(k); return k }

    const scegli = (arr, e) => arr[semi(`${e.ts}·${e.tipo}`) % arr.length]
    // la frase (HTML: i dati veri sono già passati da esc dentro m())
    const testo = (e) => {
      const d = e.d
      switch (e.tipo) {
        case 'inizio': return scegli(F.inizio, e)()
        case 'stato': return scegli(F[F[d?.stato] ? d.stato : 'offline'], e)()
        case 'musica': return d && d.titolo ? scegli(F.musica, e)(d) : scegli(F.musicaNo, e)()
        case 'app': return Array.isArray(d) && d.length ? scegli(F.app, e)(d) : scegli(F.appNo, e)()
        case 'luogo': return scegli(d === 'ufficio' ? F.ufficio : F.giro, e)()
        case 'gioco': return d ? scegli(F.gioco, e)(d) : scegli(F.giocoNo, e)()
        case 'custom': return d ? scegli(F.custom, e)(d) : scegli(F.customNo, e)()
        default: return ''
      }
    }
    // quale timbro, e se è «spento» (barrato)
    const timbro = (e) => {
      const d = e.d
      switch (e.tipo) {
        case 'stato': return [SIMBOLI[d?.stato] ? d.stato : 'offline', d?.stato || 'offline', false]
        case 'luogo': return [d === 'ufficio' ? 'ufficio' : 'giro', d === 'ufficio' ? 'ufficio' : 'giro', false]
        case 'musica': return ['musica', d ? 'si' : 'no', !d]
        case 'app': return ['app', Array.isArray(d) && d.length ? 'si' : 'no', !(Array.isArray(d) && d.length)]
        case 'gioco': case 'custom': return [e.tipo, d ? 'si' : 'no', !d]
        case 'inizio': return ['inizio', 'si', false]
        default: return ['custom', 'si', false]
      }
    }
    const riga = (e, nuova, ultima) => {
      const [sim, v, spento] = timbro(e)
      const g = (semi(String(e.ts)) % 17) - 8
      return `<li class="lab-diario__riga${nuova ? ' is-nuova' : ''}${ultima ? ' is-ultima' : ''}" data-tipo="${esc(e.tipo)}" data-v="${esc(v)}" style="--g:${g}deg">`
        + `<time datetime="${new Date(e.ts).toISOString()}">${esc(ora(e.ts, lang))}</time>`
        + `<i aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><use href="#lab-diario-i-${sim}"/>${spento ? '<path class="lab-diario__x" d="M6.5 25.5L25.5 6.5"/>' : ''}</svg></i>`
        + `<span>${testo(e)}</span></li>`
    }
    const disegna = (nuovoId = null) => {
      conteggio.textContent = t(lang, 'eventi', eventi.length)
      pagina.textContent = String(Math.max(1, Math.ceil(eventi.length / 12)))
      if (!eventi.length) { lista.innerHTML = `<li class="lab-diario__vuoto">${esc(t(lang, 'vuoto'))}</li>`; return }
      const oggiK = chiaveGiorno(Date.now()), ieriK = chiaveGiorno(Date.now() - 86_400_000)
      let giorno = '', html = ''
      eventi.slice().reverse().forEach((e, i) => {
        const k = chiaveGiorno(e.ts)
        if (k !== giorno) {
          giorno = k
          const pre = k === oggiK ? `${t(lang, 'oggi')} · ` : k === ieriK ? `${t(lang, 'ieri')} · ` : ''
          html += `<li class="lab-diario__giorno">${esc(pre + nomeGiorno(e.ts, lang))}</li>`
        }
        html += riga(e, e.id != null && e.id === nuovoId, i === 0)
      })
      lista.innerHTML = html
    }

    // la chiocciola di bordo: la faccia viene dallo stato di adesso, la battuta dal clic
    const parla = (testo, ms = 0) => {
      fumetto.textContent = testo
      fumetto.classList.remove('is-detto'); void fumetto.offsetWidth; fumetto.classList.add('is-detto')
      clearTimeout(battuta); timers.delete(battuta); battuta = 0
      if (ms) battuta = dopo(ms, () => { battuta = 0; parla(frase()) })
    }
    const frase = () => (umore === 'online' && musica ? tx.umore.musica : tx.umore[umore] || tx.umore.online)
    const umoreDa = (x) => {
      const u = x?.online ? (x.status || 'online') : 'offline'
      const mus = !!(x?.online && x.track && x.track.titolo)
      if (u === umore && mus === musica && fumetto.textContent) return
      umore = tx.umore[u] ? u : 'online'; musica = mus
      quaderno.dataset.umore = umore
      quaderno.dataset.musica = musica ? '1' : ''
      if (!battuta) parla(frase())
    }
    const scarabocchia = () => {
      quaderno.dataset.scrive = '1'
      clearTimeout(scrive); timers.delete(scrive)
      scrive = dopo(1400, () => { quaderno.dataset.scrive = '' })
    }

    const scrivi = async (tipo, d) => {
      if (!db) return
      const ev = { ts: Date.now(), tipo, d }
      try {
        ev.id = await aggiungi(db, ev)
        if (!vivo) return
        eventi.push(ev)
        if (eventi.length > MAX) eventi = eventi.slice(-MAX)
        disegna(ev.id)
        scarabocchia()
        api.stato(stato, t(lang, 'eventi', eventi.length), 'ok')
        pota(db).catch(() => {})
      } catch (e) { console.warn('diario:', e) }
    }
    const istantanea = (x) => ({
      stato: x.online ? x.status : 'offline',
      musica: x.track && x.track.titolo ? `${x.track.titolo}|${x.track.artista}` : '',
      app: (x.apps || []).map((y) => y.n).filter(Boolean).sort().join('|'),
      luogo: x.luogo || '',
      gioco: x.gioco?.name || '',
      custom: x.custom?.state || '',
    })
    const confronta = (x) => {
      const adesso = istantanea(x)
      if (!snap) { snap = adesso; return }
      if (adesso.stato !== snap.stato) { scrivi('stato', { stato: adesso.stato }); snap.stato = adesso.stato }
      if (adesso.musica !== snap.musica) {
        const [titolo, artista] = adesso.musica ? adesso.musica.split('|') : ['', '']
        scrivi('musica', adesso.musica ? { titolo, artista } : null); snap.musica = adesso.musica
      }
      if (adesso.app !== snap.app) {
        scrivi('app', adesso.app ? adesso.app.split('|') : []); snap.app = adesso.app
      }
      if (adesso.luogo !== snap.luogo) { scrivi('luogo', adesso.luogo); snap.luogo = adesso.luogo }
      if (adesso.gioco !== snap.gioco) { scrivi('gioco', adesso.gioco || null); snap.gioco = adesso.gioco }
      if (adesso.custom !== snap.custom) { scrivi('custom', adesso.custom || null); snap.custom = adesso.custom }
    }

    apri().then(async (d) => {
      db = d
      eventi = await leggi(db)
      if (!eventi.length) {
        const ev = { ts: Date.now(), tipo: 'inizio', d: {} }
        ev.id = await aggiungi(db, ev)
        eventi = [ev]
      }
      if (!vivo) return
      quaderno.dataset.aperto = '1'
      disegna()
      api.stato(stato, t(lang, 'eventi', eventi.length), 'ok')
      snap = istantanea(api.adesso())
    }).catch((e) => {
      console.warn(e)
      if (!vivo) return
      quaderno.dataset.chiuso = '1'
      lista.innerHTML = `<li class="lab-diario__vuoto lab-diario__vuoto--errore">${esc(t(lang, 'errore'))}</li>`
      api.stato(stato, t(lang, 'errore'), 'no')
      parla(tx.erroreCl)
    })

    const togli = api.onAdesso((x) => {
      umoreDa(x)
      if (!db) return
      clearTimeout(timer)
      timer = setTimeout(() => { if (vivo) confronta(x) }, 500)
    })
    // le animazioni a ciclo continuo (antenne, barchetta, note) si fermano quando il foglio non si vede
    const togliVis = api.quandoVisibile(quaderno, (si) => { quaderno.dataset.fermo = si ? '' : '1' })

    const disarma = (salvo) => {
      clearTimeout(armato); armato = 0
      btnSvuota.textContent = t(lang, 'svuota')
      btnSvuota.dataset.on = ''
      quaderno.dataset.armato = ''
      avviso.hidden = true
      if (salvo) parla(tx.salvo, 3500)
    }
    btnSvuota.addEventListener('click', async () => {
      if (!db || strappo) return
      if (!armato) {
        armato = setTimeout(() => { if (vivo) disarma(true) }, 3000)
        btnSvuota.textContent = t(lang, 'sicuro')
        btnSvuota.dataset.on = '1'
        quaderno.dataset.armato = '1'
        avvisoTesto.textContent = tx.avviso
        avviso.hidden = false
        return
      }
      disarma(false)
      // lo strappo: la pagina vola via, i brandelli cadono, poi pagina nuova
      const lento = !api.reduced()
      if (lento) {
        quaderno.dataset.strappo = '1'
        const pezzi = Array.from({ length: 9 }, (_, i) => `<i class="lab-diario__brandello" aria-hidden="true" style="--x:${12 + i * 10}%;--dx:${(i % 3 - 1) * 30 + (i * 7) % 13}px;--r:${(i * 47) % 160 - 80}deg;--t:${(i % 4) * 60}ms"></i>`).join('')
        quaderno.insertAdjacentHTML('beforeend', pezzi)
      }
      strappo = dopo(lento ? 700 : 0, async () => {
        try { await svuota(db) } catch (e) { console.warn('diario:', e) }
        if (!vivo) return
        eventi = []
        quaderno.dataset.strappo = lento ? 'nuova' : ''
        await scrivi('inizio', {})
        if (!eventi.length) disegna()
        parla(tx.strappate, 4000)
        dopo(900, () => { quaderno.dataset.strappo = ''; strappo = 0; for (const p of quaderno.querySelectorAll('.lab-diario__brandello')) p.remove() })
        if (!lento) strappo = 0
      })
    })
    btnEsporta.addEventListener('click', () => {
      const b = new Blob([JSON.stringify(eventi, null, 2)], { type: 'application/json' })
      api.scarica(b, 'pzkko-diario.json')
      parla(tx.esportato, 3500)
    })
    chiocciola.addEventListener('click', () => {
      const s = tx.solletico
      parla(s[nSolletico++ % s.length], 3800)
      chiocciola.classList.remove('is-salta'); void chiocciola.offsetWidth; chiocciola.classList.add('is-salta')
    })

    return () => {
      vivo = false
      clearTimeout(timer); clearTimeout(armato)
      for (const k of timers) clearTimeout(k)
      timers.clear()
      togli(); togliVis()
      try { db?.close() } catch {}
    }
  },
}
