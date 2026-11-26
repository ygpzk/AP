// DETTATURA (26.11): si parla e le parole finiscono sul foglio. Riconoscimento vocale del browser (Web Speech,
// SpeechRecognition) in cinque lingue, punteggiatura detta a voce, conteggio, copia e rilettura con SpeechSynthesis.
// Nei browser senza riconoscimento resta il foglio per scrivere a mano: l'app non si blocca.
//
//   apri()   apre il quaderno

import { creaFoglio, copia } from '/games/lab/lab.js'

const CHIAVE = 'pzkko-dettatura'
const LINGUE = [['it-IT', 'italiano'], ['en-US', 'inglese'], ['es-ES', 'spagnolo'], ['fr-FR', 'francese'], ['de-DE', 'tedesco']]
const S = { lingua: 'it-IT', punteggiatura: true, voce: '', velocita: 1 }
let dlg = null, el = {}
let rec = null, ascoltando = false, finale = '', provvisorio = ''
let parla = false

function ricorda() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (!s || typeof s !== 'object') return
    if (LINGUE.some(([l]) => l === s.lingua)) S.lingua = s.lingua
    if (typeof s.punteggiatura === 'boolean') S.punteggiatura = s.punteggiatura
    if (typeof s.voce === 'string') S.voce = s.voce
    if (Number.isFinite(s.velocita)) S.velocita = Math.min(2, Math.max(0.5, s.velocita))
  } catch {}
}
function ricordaAdesso() { try { localStorage.setItem(CHIAVE, JSON.stringify(S)) } catch {} }

const Riconoscimento = () => window.SpeechRecognition || window.webkitSpeechRecognition
const supportato = () => !!Riconoscimento()
const testo = () => (el.manuale && !el.manuale.hidden ? el.manuale.value : `${finale}${finale && provvisorio ? ' ' : ''}${provvisorio}`).trim()

function punteggia(t) {
  let s = ` ${t} `.replace(/\s+/g, ' ')
  s = s.replace(/\s+punto interrogativo\b/gi, '?')
  s = s.replace(/\s+punto esclamativo\b/gi, '!')
  s = s.replace(/\s+punto e virgola\b/gi, ';')
  s = s.replace(/\s+due punti\b/gi, ':')
  s = s.replace(/\s+virgola\b/gi, ',')
  s = s.replace(/\s+punto\b/gi, '.')
  s = s.replace(/\s+a capo\b/gi, '\n')
  s = s.replace(/\s+([,.!?;:])/g, '$1').replace(/([,.!?;:])(?=\S)/g, '$1 ')
  s = s.replace(/(^|[.!?]\s+|\n)([a-zà-ù])/g, (m, a, b) => a + b.toUpperCase())
  return s.replace(/^\s+/, '')
}

function mostraTesto() {
  if (!el.testo) return
  const t = testo()
  el.testo.innerHTML = `${finale ? `<span class="de-finale">${escapeHtml(finale)}</span>` : ''}${provvisorio ? `<span class="de-provvisorio">${escapeHtml(provvisorio)}</span>` : ''}`
  el.vuoto.hidden = !!t || !el.manuale?.hidden
  aggiornaConti()
}
function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }
function aggiornaConti() {
  const t = testo()
  const parole = t ? t.split(/\s+/).filter(Boolean).length : 0
  el.parole.textContent = `${parole} ${parole === 1 ? 'parola' : 'parole'}`
  el.caratteri.textContent = `${t.length} caratteri`
  if (el.parole2) el.parole2.textContent = `${parole} ${parole === 1 ? 'parola' : 'parole'}`
}

function stato(testo, led = '') {
  if (el.stato) el.stato.textContent = testo
  if (el.led) el.led.className = `lab-led${led ? ` ${led}` : ''}`
}

function avvia() {
  if (!supportato()) return
  if (ascoltando) { ferma(); return }
  if (!rec) {
    const R = Riconoscimento()
    rec = new R()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = S.lingua
    rec.onresult = (e) => {
      let nuovo = ''
      provvisorio = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) nuovo += r[0].transcript
        else provvisorio += r[0].transcript
      }
      if (nuovo) finale += (finale && !/\s$/.test(finale) ? ' ' : '') + (S.punteggiatura ? punteggia(nuovo) : nuovo)
      mostraTesto()
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { ascoltando = false; stato('permesso negato', 'is-rosso') }
      else if (e.error === 'no-speech') stato('non ho sentito niente', 'is-attesa')
      else if (e.error === 'aborted') stato('fermato')
      else stato('errore del riconoscimento', 'is-rosso')
    }
    rec.onend = () => {
      if (ascoltando) { setTimeout(() => { if (ascoltando) { try { rec.start() } catch {} } }, 180) }
      else stato('fermo')
    }
  }
  rec.lang = S.lingua
  try { rec.start() } catch { /* già avviato */ }
  ascoltando = true
  el.avvia.textContent = 'ferma'
  el.avvia.setAttribute('aria-pressed', 'true')
  stato('ascolto…', 'is-on')
  dlg.voce('parla: le parole finiscono qui')
  if (el.manuale) el.manuale.hidden = true
}
function ferma() {
  ascoltando = false
  if (rec) { try { rec.stop() } catch {} }
  if (el.avvia) { el.avvia.textContent = 'ascolta'; el.avvia.setAttribute('aria-pressed', 'false') }
  provvisorio = ''
  mostraTesto()
  stato('fermo')
}

function voci() {
  const tutte = window.speechSynthesis?.getVoices?.() || []
  return tutte.filter((v) => v.lang?.toLowerCase().startsWith(S.lingua.slice(0, 2).toLowerCase()))
}
function riempiVoci() {
  if (!el.voce) return
  const lista = voci()
  if (!lista.length) {
    el.voce.innerHTML = `<option value="">voce del sistema</option>`
    return
  }
  if (!S.voce || !lista.some((v) => v.name === S.voce)) S.voce = lista[0].name
  el.voce.innerHTML = lista.map((v) => `<option value="${escapeHtml(v.name)}" ${v.name === S.voce ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')
}
function leggi() {
  if (!('speechSynthesis' in window)) { dlg.voce('questo browser non sa leggere ad alta voce', true); return }
  if (parla) { window.speechSynthesis.cancel(); parla = false; el.leggi.textContent = 'leggi'; return }
  const t = testo()
  if (!t) { dlg.voce('non c’è niente da leggere', true); return }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(t)
  u.lang = S.lingua
  u.rate = S.velocita
  const v = voci().find((x) => x.name === S.voce)
  if (v) u.voice = v
  u.onend = () => { parla = false; if (el.leggi) el.leggi.textContent = 'leggi'; stato('fermo') }
  u.onerror = () => { parla = false; if (el.leggi) el.leggi.textContent = 'leggi'; stato('lettura interrotta') }
  window.speechSynthesis.speak(u)
  parla = true
  el.leggi.textContent = 'ferma la voce'
  stato('lettura…', 'is-attesa')
}

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
  riempiVoci()
}

async function costruisci() {
  ricorda()
  const pannello = (t, c) => `<section class="lab-pannello">${t ? `<h3>${t}</h3>` : ''}${c}</section>`
  const ok = supportato()
  dlg = await creaFoglio({
    chiave: 'dettatura',
    titolo: 'dettatura',
    voce: ok ? 'parla e guarda il foglio riempirsi' : 'questo browser non ascolta: scrivi a mano',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-pannello de-comandi">
          <div class="lab-fila lab-fila--tra">
            <div class="lab-fila">
              ${ok ? `<button type="button" class="lab-tasto lab-tasto--pieno" data-avvia aria-pressed="false">ascolta</button>` : ''}
              <button type="button" class="lab-tasto" data-pulisci>pulisci</button>
              <span class="lab-led" data-led></span><span class="lab-etichetta" data-stato>${ok ? 'fermo' : 'a mano'}</span>
            </div>
            <div class="lab-fila"><span class="lab-etichetta" data-parole>0 parole</span><span class="lab-etichetta" data-caratteri>0 caratteri</span></div>
          </div>
          <div class="lab-fila" style="margin-top:6px">
            <label class="lab-etichetta">lingua <select class="de-sel" data-lingua>${LINGUE.map(([l, n]) => `<option value="${l}" ${l === S.lingua ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="lab-etichetta"><input type="checkbox" data-punteggiatura ${S.punteggiatura ? 'checked' : ''}> punteggiatura a voce</label>
            <button type="button" class="lab-tasto" data-copia>copia</button>
            <button type="button" class="lab-tasto" data-leggi ${'speechSynthesis' in window ? '' : 'disabled'}>leggi</button>
          </div>
        </div>
        <div class="de-foglio">
          <div class="de-testo" data-testo aria-live="polite"></div>
          <textarea class="de-manuale" data-manuale aria-label="scrivi a mano" ${ok ? 'hidden' : ''} placeholder="scrivi qui…"></textarea>
          <p class="de-vuoto" data-vuoto>${ok ? 'premi «ascolta» e parla: le parole arrivano qui.' : 'il riconoscimento vocale non c’è in questo browser: puoi scrivere a mano.'}</p>
        </div>
        <p class="lab-nota"><b data-parole2>0 parole</b> · la punteggiatura si dice: «punto», «virgola», «punto interrogativo», «a capo».</p>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        ${pannello('la voce', `<label class="de-riga">voce<select class="de-sel" data-voce></select></label><label class="de-riga">velocità<input class="lab-range" type="range" data-velocita min="0.5" max="2" step="0.05" value="${S.velocita}" aria-label="la velocità della voce"><b class="lab-valore" data-velocita-val>${S.velocita.toFixed(2)}×</b></label>`)}
        ${pannello('come funziona', `<p class="lab-nota">Il riconoscimento è quello del browser (Web Speech). In Chrome e Edge l'audio viene riconosciuto dal servizio del browser; in altri browser l'API non c'è e resta il foglio a mano. La rilettura usa le voci già installate nel sistema.</p>`)}
        ${pannello('privacy', `<p class="lab-nota">Il testo resta nel foglio: non si salva sul sito e non si manda a pzkko. Se copi, va negli appunti del tuo computer.</p>`)}
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    testo: q('[data-testo]'), manuale: q('[data-manuale]'), vuoto: q('[data-vuoto]'), avvia: q('[data-avvia]'),
    stato: q('[data-stato]'), led: q('[data-led]'), parole: q('[data-parole]'), caratteri: q('[data-caratteri]'),
    parole2: q('[data-parole2]'), voce: q('[data-voce]'), leggi: q('[data-leggi]'),
  }
  if (!ok) { el.vuoto.hidden = true; el.testo.hidden = true }
  el.manuale?.addEventListener('input', aggiornaConti)
  dlg.corpo.addEventListener('click', (e) => {
    if (e.target.closest('[data-avvia]')) return avvia()
    if (e.target.closest('[data-pulisci]')) {
      finale = ''; provvisorio = ''
      if (el.manuale) el.manuale.value = ''
      mostraTesto(); dlg.voce('foglio pulito'); return
    }
    if (e.target.closest('[data-copia]')) {
      copia(testo()).then((ok) => dlg.voce(ok ? 'testo copiato' : 'non riesco a copiare', !ok))
      return
    }
    if (e.target.closest('[data-leggi]')) return leggi()
  })
  const lingua = q('[data-lingua]')
  lingua?.addEventListener('change', () => { S.lingua = lingua.value; ricordaAdesso(); riempiVoci(); if (ascoltando) { ferma(); avvia() } })
  const punte = q('[data-punteggiatura]')
  punte?.addEventListener('change', () => { S.punteggiatura = punte.checked; ricordaAdesso() })
  const voce = q('[data-voce]')
  voce?.addEventListener('change', () => { S.voce = voce.value; ricordaAdesso() })
  const vel = q('[data-velocita]'), velVal = q('[data-velocita-val]')
  vel?.addEventListener('input', () => { S.velocita = Number(vel.value); velVal.textContent = `${S.velocita.toFixed(2)}×`; ricordaAdesso() })
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = riempiVoci
  }
  riempiVoci()
  dlg.alChiudere(() => {
    ascoltando = false
    if (rec) { try { rec.abort() } catch {}; rec = null }
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); window.speechSynthesis.onvoiceschanged = null }
    parla = false
    dlg?.dlg.remove(); dlg = null
  })
  mostraTesto()
}
