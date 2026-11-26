// 01 · Adesso, sempre. La scheda «Adesso» in una finestra sempre sopra le altre,
// con la Picture-in-Picture del documento (Chrome/Edge 116+). Dentro si aggiorna
// da sola: stato, musica, apps aperte e avanzamento del brano.
import { esc, ferma } from '../utils.js'

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
  },
}
const t = (lang, k) => (T[lang] || T.en)[k] || T.en[k]

function statoTesto(a, lang) {
  const s = STATO[a.status] || STATO.offline
  return s[lang] || s.en
}

function scheletro(a, lang, piccolo = false) {
  const m = a.track
  const luogo = a.luogo === 'ufficio' ? t(lang, 'ufficio') : a.luogo === 'giro' ? t(lang, 'giro') : ''
  const custom = a.custom?.state ? `<p class="lab-pip__custom">${esc(a.custom.state)}</p>` : ''
  const apps = a.apps.length ? `<div class="lab-pip__apps"><span>${esc(t(lang, 'app'))}</span><ul>${a.apps.slice(0, 7).map((x) => `<li title="${esc(x.n)}">${x.i ? `<img src="${esc('/api/vetrina/?img=' + encodeURIComponent(x.i))}" alt="" loading="lazy">` : `<b>${esc(x.n.slice(0, 1))}</b>`}</li>`).join('')}</ul></div>` : ''
  const musica = m ? `<div class="lab-pip__musica">
      <div class="lab-pip__arte">${m.img ? `<img src="${esc('/api/vetrina/?img=' + encodeURIComponent(m.img))}" alt="" loading="lazy">` : '<span aria-hidden="true">♪</span>'}</div>
      <div class="lab-pip__brano"><b>${esc(m.titolo)}</b><span>${esc(m.artista)}</span>${m.album ? `<span>${esc(m.album)}</span>` : ''}</div>
    </div>${m.inizio && m.fine ? `<div class="lab-pip__barra" data-inizio="${m.inizio}" data-fine="${m.fine}"><span class="lab-pip__tempo" data-passato>0:00</span><i><b></b></i><span class="lab-pip__tempo" data-totale>${ferma(m.fine - m.inizio)}</span></div>` : ''}` : ''
  const gioco = !m && a.gioco ? `<div class="lab-pip__gioco"><b>${esc(a.gioco.name)}</b>${a.gioco.details ? `<span>${esc(a.gioco.details)}</span>` : ''}</div>` : ''
  return `<div class="lab-pip${piccolo ? ' lab-pip--mini' : ''}" data-online="${a.online}">
    <header class="lab-pip__capo"><span>${esc(t(lang, 'adesso'))}</span><span class="lab-pip__live"><i></i>${esc(t(lang, 'live'))}</span></header>
    <div class="lab-pip__riga"><i class="lab-pip__punto" data-stato="${esc(a.status)}"></i><b>${esc(statoTesto(a, lang))}</b>${luogo ? `<span>· ${esc(luogo)}</span>` : ''}</div>
    ${custom}
    ${musica || gioco || `<p class="lab-pip__vuoto">${esc(t(lang, 'nulla'))}</p>`}
    ${apps}
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
    let finestra = null, host = null, battito = 0, corrente = api.adesso()

    el.innerHTML = `<p class="lab__nota">${esc(t(lang, 'supporto'))}</p>
      <div class="lab-pip__anteprima" data-ante></div>
      <div class="lab__azioni">
        <button type="button" class="lab__bottone" data-apri ${supportato ? '' : 'disabled'}>${esc(t(lang, 'apri'))}</button>
        <button type="button" class="lab__bottone lab__bottone--fantasma" data-att>${esc(t(lang, 'attivita'))}</button>
      </div>`
    const ante = el.querySelector('[data-ante]')
    const bottone = el.querySelector('[data-apri]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const disegna = (a) => {
      corrente = a
      ante.innerHTML = scheletro(a, lang, true)
      if (host) {
        host.innerHTML = scheletro(a, lang)
        avviaBarra()
      }
    }
    api.stato(stato, supportato ? t(lang, 'pronto') : t(lang, 'no'), supportato ? 'ok' : 'no')

    function avviaBarra() {
      clearInterval(battito)
      if (!host) return
      const barra = host.querySelector('.lab-pip__barra')
      if (!barra) return
      const inizio = Number(barra.dataset.inizio), fine = Number(barra.dataset.fine)
      const passa = barra.querySelector('[data-passato]'), riempi = barra.querySelector('i b')
      const aggiorna = () => {
        if (!host) return
        const ora = Date.now(), totale = Math.max(1, fine - inizio), fatto = Math.min(totale, Math.max(0, ora - inizio))
        if (passa) passa.textContent = ferma(fatto)
        if (riempi) riempi.style.width = `${(fatto / totale) * 100}%`
      }
      aggiorna()
      battito = setInterval(aggiorna, 1000)
    }

    async function apri() {
      if (!supportato || finestra) return
      try {
        finestra = await documentPictureInPicture.requestWindow({ width: 360, height: 520 })
        const doc = finestra.document
        doc.documentElement.lang = lang
        doc.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light'
        const stile = doc.createElement('style')
        stile.textContent = `html,body{margin:0;min-height:100%;background:#8e8e8a url(/art/muro.webp) 0 0/900px auto;color:#161616;font-family:"Special Elite","Courier New",monospace}body{padding:14px}.lab-pip{box-shadow:4px 5px 0 rgba(0,0,0,.28),0 14px 24px -10px rgba(0,0,0,.6)}`
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
        doc.body.append(host)
        doc.title = 'pzkko · adesso'
        host.innerHTML = scheletro(corrente, lang)
        avviaBarra()
        bottone.textContent = t(lang, 'chiudi')
        bottone.dataset.on = '1'
        finestra.addEventListener('pagehide', () => {
          if (!finestra) return
          finestra = null; host = null
          bottone.textContent = t(lang, 'apri')
          bottone.dataset.on = ''
          clearInterval(battito)
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
      clearInterval(battito)
      try { f.close() } catch {}
      bottone.textContent = t(lang, 'apri')
      bottone.dataset.on = ''
      api.stato(stato, t(lang, 'pronto'), 'ok')
    }

    bottone.addEventListener('click', () => (finestra ? chiudi() : apri()))
    el.querySelector('[data-att]').addEventListener('click', () => { location.hash = '#attivita' })
    const togli = api.onAdesso(disegna)
    disegna(api.adesso())
    return () => { togli(); clearInterval(battito); chiudi() }
  },
}
