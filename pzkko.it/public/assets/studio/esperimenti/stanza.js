// 09 · La stanza. Un posto piccolo che si accende con quello che succede:
// lampada se è online, casse se c'è Spotify, schermo con le app aperte, finestra
// con l'ora vera di Roma. SVG e CSS, niente disegni scaricati.
import { esc, notte } from '../utils.js'

const T = {
  it: {
    nota: 'La lampada segue lo stato, le casse seguono Spotify, lo schermo conta le app aperte e la finestra segue l’ora di Roma. È uno specchio, non una webcam.',
    pronta: 'specchio',
    online: 'online',
    offline: 'offline',
    musica: 'Spotify',
    apps: (n) => `${n} app`,
    giorno: 'giorno',
    notte: 'notte',
    spenta: 'stanza spenta',
  },
  en: {
    nota: 'The lamp follows the status, the speakers follow Spotify, the screen counts open apps and the window follows Rome time. It is a mirror, not a webcam.',
    pronta: 'mirror',
    online: 'online',
    offline: 'offline',
    musica: 'Spotify',
    apps: (n) => `${n} apps`,
    giorno: 'day',
    notte: 'night',
    spenta: 'room off',
  },
}
const t = (lang, k, ...a) => {
  const v = (T[lang] || T.en)[k] ?? T.en[k]
  return typeof v === 'function' ? v(...a) : v
}

export default {
  id: 'stanza',
  titolo: { it: 'La stanza', en: 'The room' },
  testo: {
    it: 'Una stanza in SVG che si accende con i dati veri: lampada, casse, schermo, finestra. Quattro oggetti, un solo stato.',
    en: 'An SVG room that lights up with real data: lamp, speakers, screen, window. Four objects, one state.',
  },
  tecnologie: ['SVG', 'CSS animations', 'Lanyard'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-stanza" data-online="false" data-music="false" data-notte="false">
      <svg class="lab-stanza__svg" viewBox="0 0 640 400" role="img" aria-label="${esc(t(lang, 'nota'))}">
        <defs>
          <linearGradient id="st-par" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241d30"/><stop offset="1" stop-color="#191521"/></linearGradient>
          <linearGradient id="st-pav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2537"/><stop offset="1" stop-color="#17131e"/></linearGradient>
          <linearGradient id="st-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d9bd6"/><stop offset="1" stop-color="#bfe6ff"/></linearGradient>
          <linearGradient id="st-notte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a1c"/><stop offset="1" stop-color="#17233d"/></linearGradient>
          <radialGradient id="st-lume"><stop offset="0" stop-color="#ffe9a3" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a3" stop-opacity="0"/></radialGradient>
          <radialGradient id="st-glow"><stop offset="0" stop-color="#ccff00" stop-opacity=".55"/><stop offset="1" stop-color="#ccff00" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="640" height="400" fill="url(#st-par)"/>
        <rect y="300" width="640" height="100" fill="url(#st-pav)"/>
        <g class="lab-stanza__finestra">
          <rect x="48" y="48" width="176" height="132" rx="6" fill="#0d0b12"/>
          <rect x="56" y="56" width="160" height="116" rx="3" fill="url(#st-cielo)"/>
          <g class="lab-stanza__giorno"><circle cx="154" cy="96" r="18" fill="#ffe08a"/><circle cx="154" cy="96" r="30" fill="#ffe08a" opacity=".18"/></g>
          <g class="lab-stanza__notte"><rect x="56" y="56" width="160" height="116" fill="url(#st-notte)"/><circle cx="166" cy="90" r="14" fill="#e8ecff"/><circle cx="172" cy="86" r="12" fill="#17233d"/>${Array.from({ length: 8 }, (_, i) => `<circle cx="${68 + (i * 41) % 140}" cy="${64 + (i * 29) % 98}" r="1.2" fill="#fff" opacity=".7"/>`).join('')}</g>
          <line x1="136" y1="56" x2="136" y2="172" stroke="#3a3046" stroke-width="3"/><line x1="56" y1="114" x2="216" y2="114" stroke="#3a3046" stroke-width="3"/>
        </g>
        <ellipse cx="360" cy="344" rx="164" ry="34" fill="#3a2b46" opacity=".55"/>
        <g class="lab-stanza__scrivania">
          <rect x="236" y="236" width="316" height="14" rx="4" fill="#4a3a54"/><rect x="252" y="250" width="12" height="72" fill="#3a2d43"/><rect x="524" y="250" width="12" height="72" fill="#3a2d43"/>
        </g>
        <g class="lab-stanza__monitor">
          <rect x="324" y="140" width="160" height="100" rx="8" fill="#0c0a11" stroke="#574663" stroke-width="3"/>
          <rect x="334" y="150" width="140" height="80" rx="4" fill="#111722"/>
          <g class="lab-stanza__apps">${[0, 1, 2, 3, 4, 5].map((i) => `<rect data-app="${i}" x="${342 + (i % 3) * 44}" y="${160 + Math.floor(i / 3) * 30}" width="34" height="20" rx="4" fill="${i % 2 ? '#9d00ff' : '#ccff00'}" opacity=".12"/>`).join('')}</g>
          <rect x="392" y="240" width="24" height="16" fill="#3a2d43"/><rect x="358" y="256" width="92" height="8" rx="3" fill="#4a3a54"/>
        </g>
        <g class="lab-stanza__tastiera"><rect x="340" y="268" width="128" height="10" rx="3" fill="#6a5878"/></g>
        <g class="lab-stanza__cassa">
          <rect x="508" y="198" width="44" height="44" rx="7" fill="#0d0a12" stroke="#574663" stroke-width="2"/>
          <circle cx="530" cy="214" r="7" fill="#2c2537"/><circle cx="530" cy="232" r="5" fill="#2c2537"/>
        </g>
        <g class="lab-stanza__onde" fill="none" stroke="#ccff00" stroke-width="2" stroke-linecap="round">
          <path d="M558 210q10 12 0 24"/><path d="M566 203q16 19 0 38" opacity=".6"/><path d="M574 196q22 26 0 52" opacity=".35"/>
        </g>
        <g class="lab-stanza__lampada">
          <ellipse cx="292" cy="250" rx="20" ry="5" fill="#2c2537"/>
          <path d="M292 248V190l-26-14" fill="none" stroke="#6a5878" stroke-width="4" stroke-linecap="round"/>
          <path d="M246 164h38l-8 28h-22z" fill="#d8c9a8"/>
          <circle cx="266" cy="198" r="42" fill="url(#st-lume)" class="lab-stanza__alone"/>
        </g>
        <g class="lab-stanza__sedia"><rect x="288" y="286" width="42" height="8" rx="3" fill="#4a3a54"/><rect x="292" y="294" width="6" height="38" fill="#3a2d43"/><rect x="320" y="294" width="6" height="38" fill="#3a2d43"/><rect x="318" y="260" width="6" height="30" fill="#3a2d43"/></g>
        <g class="lab-stanza__pianta"><path d="M576 300h30l-4 28h-22z" fill="#6b4b3a"/><path d="M591 300c-12-20 2-34 0-48 12 12 16 30 0 48" fill="#3f7a4a"/><path d="M591 300c10-16-2-30 6-40 6 14 6 28-6 40" fill="#4f9a5c"/></g>
        <rect x="0" y="296" width="640" height="4" fill="#110e16" opacity=".6"/>
      </svg>
      <p class="lab-stanza__didascalia" data-didascalia>—</p>
    </div>
    <p class="lab__nota">${esc(t(lang, 'nota'))}</p>`
    const box = el.querySelector('.lab-stanza')
    const dida = el.querySelector('[data-didascalia]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    let corrente = api.adesso()

    function aggiorna(a) {
      corrente = a
      const n = a.apps.length
      box.dataset.online = String(a.online)
      box.dataset.music = String(!!a.track)
      box.dataset.notte = String(notte())
      for (const r of box.querySelectorAll('[data-app]')) {
        const i = Number(r.dataset.app)
        r.style.opacity = i < n ? '0.95' : '0.12'
        r.style.filter = i < n ? 'none' : 'grayscale(1)'
      }
      const pezzi = [a.online ? t(lang, 'online') : t(lang, 'offline')]
      if (a.track) pezzi.push(`${t(lang, 'musica')} · ${a.track.titolo}`)
      if (n) pezzi.push(t(lang, 'apps', n))
      pezzi.push(notte() ? t(lang, 'notte') : t(lang, 'giorno'))
      dida.textContent = pezzi.join(' · ')
      api.stato(stato, a.online ? t(lang, 'pronta') : t(lang, 'spenta'), a.online ? 'ok' : '')
    }
    const togli = api.onAdesso(aggiorna)
    aggiorna(corrente)
    const timer = setInterval(() => { if (!document.hidden) aggiorna(corrente) }, 60_000)
    return () => { togli(); clearInterval(timer) }
  },
}
