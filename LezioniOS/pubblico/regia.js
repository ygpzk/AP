// Lezioni OS · la regia. Una pagina sola, quattro viste (regia, galleria, orario, modelli). Lo stato dal vivo arriva
// dal server una volta al secondo (/api/flusso); tutto quello che si decide qui passa da /api/azione.

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const due = (n) => String(n).padStart(2, '0')
const hms = (t) => { t = Math.max(0, Math.floor(t)); const o = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return o ? `${o}:${due(m)}:${due(s)}` : `${due(m)}:${due(s)}` }
const durata = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${due(m % 60)}` : `${m} min` }
const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const giorno = (iso) => new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const oraDi = (iso) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const minuti = (x) => +x.slice(0, 2) * 60 + +x.slice(3, 5)
const fraQuanto = (s) => s < 90 ? 'fra un minuto' : s < 3600 ? `fra ${Math.round(s / 60)} min` : s < 86400 ? `fra ${Math.floor(s / 3600)} h ${due(Math.round(s % 3600 / 60))}` : `fra ${Math.round(s / 86400)} giorni`

async function azione(a) {
  try {
    const r = await fetch('/api/azione', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) })
    const d = await r.json()
    if (d && d.ok === false && d.errore) avviso(d.errore)
    return d
  } catch { avviso('Il server di Lezioni OS non risponde.'); return { ok: false } }
}
const prendi = (u) => fetch(u).then((r) => r.ok ? r.json() : null).catch(() => null)
let avvisoT = 0
function avviso(testo) { $('#aiuto').innerHTML = `<b style="color:var(--rosso)">${h(testo)}</b>`; avvisoT = Date.now() + 6000 }

let S = null // lo stato dal vivo
let orario = { materie: {}, lezioni: [] }
let lezioni = []
let modelli = []
let scelta = null // la sorgente selezionata nella regia
let vista = 'regia'

// ══ le viste ══
const NOMI_VISTE = { regia: 'Regia', galleria: 'Galleria', orario: 'Orario', modelli: 'Modelli' }
function vai(v) {
  vista = v
  document.body.dataset.vista = v
  $('#barra-vista').textContent = NOMI_VISTE[v]
  for (const b of $$('.rail [data-vista]')) b.setAttribute('aria-current', b.dataset.vista === v)
  try { localStorage.setItem('lezioni-vista', v) } catch {}
  if (v === 'galleria') caricaLezioni()
  if (v === 'orario') disegnaOrario()
  if (v === 'modelli') caricaModelli()
  if (v !== 'galleria') suono.pause()
}
for (const b of $$('.rail [data-vista]')) b.onclick = () => vai(b.dataset.vista)
$('#apri-base').onclick = () => azione({ tipo: 'apri' })
$('#tema').onclick = () => { const t = document.documentElement.dataset.tema === 'scuro' ? 'discord' : 'scuro'; document.documentElement.dataset.tema = t; try { localStorage.setItem('regia-tema', t) } catch {}; if (aperta) disegnaLinea() }

// ══ la regia ══
const SORGENTI = [
  { g: 'Cattura', id: 'audio', nome: 'Audio del PC', fisso: true, dice: 'Quello che esce dalle cuffie o dalle casse (loopback WASAPI), in pezzi da dieci secondi. I buchi diventano silenzio: il tempo dell’audio resta quello dell’orologio.' },
  { g: 'Cattura', id: 'finestra', nome: 'Finestra della lezione', dice: 'Si fotografa la finestra della lezione, non lo schermo: anche se sopra c’è un’altra finestra o un gioco. Se nel browser cambi scheda i fotogrammi si fermano e ripartono quando torni. Spenta: solo audio.' },
  { g: 'Voce', id: 'voce', nome: 'Trascrizione', dice: 'La voce diventa testo mentre si registra, parola per parola, sugli stessi tempi dei fotogrammi.' },
  { g: 'Voce', id: 'lessico', nome: 'Lessico della materia', dice: 'Le parole della materia vanno al trascrittore come parole attese: «simbolo di Landau», «x con zero». Vale per Whisper.' },
  { g: 'Lavagna', id: 'pulita', nome: 'Lavagna senza prof', dice: 'A lezione finita un modello che ritaglia le persone dice dov’è il docente: lì resta la lavagna dell’ultima volta che si vedeva. Ne esce anche la versione «nitida», con la luce spianata.' },
  { g: 'Lavagna', id: 'lettura', nome: 'Lettura delle formule', dice: 'Sperimentale. Un modello che vede legge la lavagna ripulita e la riscrive in LaTeX, sul PC (Ollama). Lento (due-tre minuti a lavagna) e non sempre arriva alla risposta. Dalla galleria si può leggere anche una lavagna sola.' },
  { g: 'Archivio', id: 'archivio', nome: 'Audio in Opus', dice: 'A lezione finita i pezzi WAV diventano un solo audio.opus: un ventesimo dello spazio, e in galleria si scorre. I WAV restano finché non li togli tu.' },
  { g: 'Archivio', id: 'ascolto', nome: 'Ascolto pulito', dice: 'Una seconda copia per le orecchie: via il ronzio dell’aula, volume costante. La trascrizione si fa sempre sull’originale.' },
]
const MOTORI = {
  'whisper-large-v3': { nome: 'Whisper large-v3', breve: 'large-v3', dove: 'GPU · 3 GB', dice: 'Il più preciso in italiano: sulla lezione di prova ha preso anche la domanda dello studente.' },
  'whisper-large-v3-turbo': { nome: 'Whisper large-v3 turbo', breve: 'turbo', dove: 'GPU · 1,5 GB', dice: 'Più svelto e metà memoria, un filo meno preciso. Si scarica al primo uso (1,6 GB).' },
  'parakeet-v3': { nome: 'Parakeet TDT v3', breve: 'parakeet', dove: 'CPU', dice: 'La scheda video resta libera. In aula sbaglia di più e sui rumori scrive paroline in inglese.' },
}
const SFONDI = {
  rvm: { nome: 'Robust Video Matting', breve: 'RVM', dove: 'CPU · 0,1 s', dice: 'Leggero e fatto per le persone: non inventa niente sulle schermate che non sono lezione.' },
  birefnet: { nome: 'BiRefNet lite', breve: 'BiRefNet', dove: 'CPU · 13 s', dice: 'Il ritaglio più fine, cento volte più lento: per la lavagna non serve, c’è per chi vuole provarlo.' },
}
const accesa = (id) => id === 'audio' || !!S?.imp.sorgenti[id]
function etichetta(id) {
  if (id === 'voce') return MOTORI[S.imp.motore]?.breve
  if (id === 'pulita') return SFONDI[S.imp.sfondo]?.breve
  if (id === 'finestra') return S.imp.finestra.modo === 'schermo' ? 'schermo' : ''
  if (id === 'lettura') return 'Ollama'
  return ''
}
let firmaSorgenti = ''
function disegnaSorgenti() {
  const firma = JSON.stringify([S.imp, scelta])
  if (firma === firmaSorgenti) return
  firmaSorgenti = firma
  let g = '', html = ''
  for (const s of SORGENTI) {
    if (s.g !== g) { html += `${g ? '</div>' : ''}<h2>${s.g}</h2><div class="box">`; g = s.g }
    const su = accesa(s.id), tag = etichetta(s.id)
    html += `<div class="pezzo-r${su ? ' su' : ''}${scelta === s.id ? ' scelto' : ''}${s.fisso ? ' fisso' : ''}" data-id="${s.id}">
      <div class="vai"><i class="led"></i><b>${s.nome}</b></div>${tag ? `<span class="tag" data-tag="${s.id}">${h(tag)}</span>` : `<span class="tag" data-tag="${s.id}" hidden></span>`}
      <div role="switch" tabindex="0" aria-checked="${su}" aria-label="${s.nome}" data-leva="${s.id}" ${s.fisso ? 'title="C’è sempre"' : ''}><div class="leva"></div></div></div>`
  }
  $('#lista').innerHTML = `${html}</div>`
  $('#conta-accese').textContent = `${SORGENTI.filter((s) => accesa(s.id)).length}/${SORGENTI.length} attive`
}
$('#lista').onclick = (e) => {
  const leva = e.target.closest('[data-leva]')
  if (leva) { if (leva.dataset.leva !== 'audio') azione({ tipo: 'sorgente', id: leva.dataset.leva, acceso: leva.getAttribute('aria-checked') !== 'true' }); return }
  const r = e.target.closest('.pezzo-r')
  if (r) { scelta = scelta === r.dataset.id ? null : r.dataset.id; firmaProp = ''; aggiorna() }
}
$('#deseleziona').onclick = () => { scelta = null; firmaProp = ''; aggiorna() }

// la materia del prossimo avvio
let firmaMaterie = ''
function disegnaMaterie() {
  const firma = JSON.stringify([orario.materie, S.adesso?.materia, S.imp.materia])
  if (firma === firmaMaterie) return
  firmaMaterie = firma
  const ora = orario.materie[S.adesso?.materia]
  $('#materia').innerHTML = `<option value="">Dall’orario${ora ? ` · ${h(ora.breve)}` : ''}</option>` + Object.entries(orario.materie).map(([id, m]) => `<option value="${id}">${h(m.breve ?? m.nome)}</option>`).join('')
  $('#materia').value = S.imp.materia
}
$('#materia').onchange = (e) => azione({ tipo: 'imposta', materia: e.target.value })
$('#rec').onclick = () => azione({ tipo: S?.reg ? 'ferma' : 'avvia' })
$('#apri-corrente').onclick = () => azione({ tipo: 'apri', id: S?.reg?.id ?? S?.ultimaFinita?.id })

// il dock
let dock = 'voce'
for (const b of $$('.dock-t [data-dock]')) b.onclick = () => { dock = b.dataset.dock; for (const x of $$('.dock-t [data-dock]')) x.setAttribute('aria-selected', x === b); for (const p of $$('[data-dock-p]')) p.hidden = p.dataset.dockP !== dock; firmaDock = ''; aggiorna(); if (dock === 'registro') registro(); if (dock === 'tempo') striscia() }
let firmaDock = ''
async function registro() {
  if (vista !== 'regia' || dock !== 'registro') return
  const r = await prendi('/api/registro')
  $('#registro').textContent = r?.id ? ['registra', 'trascrivi', 'sviluppa', 'leggi'].filter((n) => r[n]).map((n) => `── ${n} · ${r.id}\n${r[n]}`).join('\n\n') || 'I registri sono vuoti.' : 'Nessuna lezione registrata da quando la regia è accesa.'
  const el = $('#registro'); el.scrollTop = el.scrollHeight
}
async function striscia() {
  if (vista !== 'regia' || dock !== 'tempo') return
  const id = S?.reg?.id ?? S?.ultimaFinita?.id
  const d = id && await prendi(`/api/lezione/${id}`)
  const ff = (d?.frames ?? []).filter((f) => !f.fuori).slice(-14)
  $('#striscia').innerHTML = ff.length ? ff.map((f) => `<a href="/f/${id}/${f.file}" target="_blank" title="${h(f.ora ?? '')}"><img src="/f/${id}/${f.mini ?? f.file}" alt="" loading="lazy"><span>${hms(f.t)}</span></a>`).join('') : '<p class="nota">Qui si mettono in fila i fotogrammi della lezione: uno ogni volta che la lavagna cambia e si ferma.</p>'
  const el = $('#striscia'); el.scrollLeft = el.scrollWidth
}
setInterval(() => { registro(); striscia() }, 6000)

function disegnaOggi() {
  const ora = new Date(), m = ora.getHours() * 60 + ora.getMinutes()
  const oggi = orario.lezioni.filter((l) => l.giorno === ora.getDay())
  const firma = JSON.stringify([oggi, Math.floor(m / 1), S.reg?.id])
  if (firma === firmaDock) return
  firmaDock = firma
  $('#oggi').innerHTML = oggi.length ? oggi.map((l) => {
    const mat = orario.materie[l.materia] ?? {}, adesso = minuti(l.da) <= m && m < minuti(l.a), passata = m >= minuti(l.a)
    return `<div class="oggi-r${adesso ? ' ora' : ''}${passata ? ' passata' : ''}"><i class="tinta" style="background:${h(mat.colore ?? '#ccc')};margin:0"></i><time>${l.da}–${l.a}</time><b>${h(mat.nome ?? l.materia)}</b><small>${h(mat.docente ?? '')}${l.aula ? ` · ${h(l.aula)}` : ''}</small><small>${adesso ? (S.reg ? 'in registrazione' : 'adesso') : passata ? 'finita' : fraQuanto((minuti(l.da) - m) * 60)}</small></div>`
  }).join('') : `<p class="nota">Oggi (${GIORNI[ora.getDay()].toLowerCase()}) non ci sono lezioni in orario.${S.prossima ? ` La prossima: <b>${h(orario.materie[S.prossima.materia]?.breve ?? '')}</b>, ${GIORNI[S.prossima.giorno].toLowerCase()} alle ${S.prossima.da}.` : ''}</p>`
}

// le proprietà della sorgente selezionata
let firmaProp = ''
let prova = null // l'ultima prova di cattura
function disegnaProp() {
  const mat = orario.materie[S.reg?.materia?.id ?? (S.imp.materia || S.adesso?.materia)] ?? null
  const firma = JSON.stringify([scelta, S.imp, prova, mat && [mat.nome, mat.lessico, mat.come], !!S.reg, S.python])
  $('#deseleziona').hidden = !scelta
  if (firma === firmaProp) { vivoProp(); return }
  firmaProp = firma
  const el = $('#prop-regia')
  if (!scelta) {
    el.className = 'prop-c vuota-p'
    el.innerHTML = `<p class="nota">Nessuna sorgente selezionata. Selezionane una dall’elenco: qui compaiono il suo modello e i suoi parametri.</p>
      <details class="sez" open><summary>Sessione</summary><div class="sez-c"><dl class="dati" id="p-sessione"></dl></div></details>
      <details class="sez" open><summary>Come va una lezione</summary><div class="sez-c"><dl class="tasti">
        <dt><kbd>1</kbd></dt><dd>apri la lezione (Teams nel browser o nell’app)</dd>
        <dt><kbd>2</kbd></dt><dd><b>Registra</b>: audio, finestra e trascrizione partono insieme</dd>
        <dt><kbd>3</kbd></dt><dd><b>Ferma</b>: la lezione si sviluppa da sola (lavagna pulita, audio in Opus)</dd>
        <dt><kbd>4</kbd></dt><dd>la ritrovi in <b>Galleria</b>, con voce e lavagna sugli stessi tempi</dd>
      </dl><p class="nota">Con l’<b>avvio automatico</b> (vista Orario) i passi 2 e 3 li fa l’orario.</p></div></details>
      ${S.python ? '' : '<div class="errore" style="margin:12px 14px">Manca l’ambiente Python di Lezioni OS: lancia <code>installa.ps1</code>.</div>'}`
    vivoProp(); return
  }
  const s = SORGENTI.find((x) => x.id === scelta), su = accesa(scelta)
  let corpo = ''
  if (scelta === 'audio') corpo = `<details class="sez" open><summary>Dispositivo</summary><div class="sez-c"><dl class="dati" id="p-audio"></dl><p class="nota">Si registra l’uscita <b>predefinita</b> di Windows: non mettere in muto la lezione e non cambiare uscita a metà. Il volume del PC non conta.</p></div></details>`
  if (scelta === 'finestra') {
    const f = S.imp.finestra
    corpo = `<details class="sez" open><summary>Quale finestra</summary><div class="sez-c">
        <div class="scelta" id="p-modo"><button data-modo="finestra" aria-pressed="${f.modo !== 'schermo'}" title="Solo la finestra della lezione, anche se coperta">Finestra</button><button data-modo="schermo" aria-pressed="${f.modo === 'schermo'}" title="Come il vecchio Lezioni: tutto lo schermo dove c’è la finestra">Schermo intero</button></div>
        <label class="campo-l"><span>Il titolo contiene (espressione regolare)</span><input type="text" id="p-titolo" value="${h(f.titolo)}" spellcheck="false"></label>
        <label class="campo-l"><span>Solo questo programma (vuoto: tutti)</span><input type="text" id="p-programma" value="${h(f.programma ?? '')}" placeholder="opera.exe" spellcheck="false"></label>
        <div class="riga sc-bottoni"><button id="p-prova" class="forte">Prova cattura</button></div>
        <div id="p-prova-esito">${provaHtml()}</div>
      </div></details>
      <details class="sez" open><summary>Stato</summary><div class="sez-c"><dl class="dati" id="p-video"></dl></div></details>`
  }
  if (scelta === 'voce') corpo = `<details class="sez" open><summary>Modello</summary><div class="sez-c"><div class="opz" id="p-motori">${Object.entries(MOTORI).map(([id, m]) => `<button data-motore="${id}" aria-pressed="${S.imp.motore === id}"><b>${m.nome}<em>${m.dove}</em></b><small>${m.dice}</small></button>`).join('')}</div>
      <p class="nota">Vale dalla prossima registrazione.</p></div></details>
      <details class="sez" open><summary>Dove gira</summary><div class="sez-c"><div class="scelta" id="p-disp">${[['auto', 'Auto'], ['gpu', 'Scheda video'], ['cpu', 'CPU']].map(([v, n]) => `<button data-disp="${v}" aria-pressed="${S.imp.dispositivo === v}">${n}</button>`).join('')}</div>
      <p class="nota">Auto: Whisper sulla scheda video, Parakeet sulla CPU. Senza scheda video Whisper passa al modello «small».</p></div></details>
      <details class="sez" open><summary>Adesso</summary><div class="sez-c"><dl class="dati" id="p-voce"></dl></div></details>`
  if (scelta === 'lessico') corpo = `<details class="sez" open><summary>${h(mat?.nome ?? 'Nessuna materia')}</summary><div class="sez-c">${mat ? `<p class="nota" style="margin-top:0">Le parole che il trascrittore si aspetta in questa materia${mat.come ? ` (le stesse di «${h(orario.materie[mat.come]?.breve ?? mat.come)}»)` : ''}.</p><textarea id="p-lessico" spellcheck="false" ${mat.come ? 'disabled' : ''}>${h(mat.lessico ?? orario.materie[mat.come]?.lessico ?? '')}</textarea><div class="riga sc-bottoni"><button id="p-lessico-salva" ${mat.come ? 'disabled' : ''}>Salva il lessico</button></div>` : '<p class="nota" style="margin-top:0">Scegli una materia (in alto, o nell’orario): ognuna ha il suo lessico.</p>'}</div></details>`
  if (scelta === 'pulita') corpo = `<details class="sez" open><summary>Modello</summary><div class="sez-c"><div class="opz" id="p-sfondi">${Object.entries(SFONDI).map(([id, m]) => `<button data-sfondo="${id}" aria-pressed="${S.imp.sfondo === id}"><b>${m.nome}<em>${m.dove}</em></b><small>${m.dice}</small></button>`).join('')}</div>
      <p class="nota">Dietro la persona resta la lavagna vista negli ultimi due minuti e mezzo; se nel frattempo è stata cancellata, o non si è mai vista, resta la persona: meglio lei che una lavagna vecchia.</p></div></details>`
  if (scelta === 'lettura') corpo = `<details class="sez" open><summary>Modello</summary><div class="sez-c"><dl class="dati"><dt>Sul PC</dt><dd class="mono">qwen3-vl:4b · Ollama</dd><dt>Tempo</dt><dd>2–3 min a lavagna</dd><dt>Memoria video</dt><dd>~5 GB, poi si libera</dd></dl>
      <p class="nota">Accesa: a lezione sviluppata legge una lavagna ogni due minuti. Per le formule fa fede <b>Claude</b> (con la chiave API <code>ocr_claude.py</code>, senza chiave Claude Code): questa è la lettura di riserva, gratis e senza cloud.</p></div></details>`
  if (scelta === 'archivio') corpo = `<details class="sez" open><summary>Formato</summary><div class="sez-c"><dl class="dati"><dt>Codec</dt><dd class="mono">Opus 40 kb/s mono</dd><dt>Sei minuti</dt><dd>35 MB → 1,3 MB</dd><dt>Una lezione di 4 h</dt><dd>1,3 GB → ~70 MB</dd></dl>
      <p class="nota">I WAV non si toccano: li togli tu dalla galleria (<b>Libera spazio</b>), e solo se l’Opus è buono e la trascrizione è finita.</p></div></details>`
  if (scelta === 'ascolto') corpo = `<details class="sez" open><summary>Filtri</summary><div class="sez-c"><dl class="dati"><dt>Passa-alto</dt><dd class="mono">80 Hz</dd><dt>Rumore</dt><dd class="mono">FFT · −14 dB</dd><dt>Volume</dt><dd class="mono">EBU R128 · −18 LUFS</dd></dl>
      <p class="nota">In galleria scegli fra «Originale» e «Pulito». Serve «Audio in Opus» acceso.</p></div></details>`
  el.className = 'prop-c scheda'
  el.innerHTML = `<div class="sc-testa"><div class="sc-titolo"><i class="led${su ? ' su' : ''}"></i><h3>${s.nome}</h3>${s.fisso ? '' : `<div role="switch" tabindex="0" aria-checked="${su}" id="p-acceso"><span>${su ? 'Attiva' : 'Spenta'}</span><div class="leva"></div></div>`}</div>
    <div class="sc-id"><span>${s.g.toLowerCase()} / ${s.id}</span></div><p class="nota sc-dice">${s.dice}</p></div>${corpo}`
  $('#p-acceso') && ($('#p-acceso').onclick = () => azione({ tipo: 'sorgente', id: scelta, acceso: !su }))
  for (const b of $$('#p-motori button')) b.onclick = () => azione({ tipo: 'imposta', motore: b.dataset.motore })
  for (const b of $$('#p-disp button')) b.onclick = () => azione({ tipo: 'imposta', dispositivo: b.dataset.disp })
  for (const b of $$('#p-sfondi button')) b.onclick = () => azione({ tipo: 'imposta', sfondo: b.dataset.sfondo })
  for (const b of $$('#p-modo button')) b.onclick = () => azione({ tipo: 'imposta', finestra: { modo: b.dataset.modo } })
  if ($('#p-titolo')) {
    $('#p-titolo').onchange = (e) => azione({ tipo: 'imposta', finestra: { titolo: e.target.value } })
    $('#p-programma').onchange = (e) => azione({ tipo: 'imposta', finestra: { programma: e.target.value.trim() } })
    $('#p-prova').onclick = async (e) => { e.target.disabled = true; e.target.textContent = 'Guardo…'; prova = await azione({ tipo: 'prova' }); firmaProp = ''; aggiorna() }
  }
  $('#p-lessico-salva') && ($('#p-lessico-salva').onclick = async (e) => {
    const id = S.reg?.materia?.id ?? (S.imp.materia || S.adesso?.materia)
    orario.materie[id].lessico = $('#p-lessico').value.replace(/\s+/g, ' ').trim()
    await salvaOrario(); e.target.textContent = 'Salvato'; e.target.classList.add('fatto')
  })
  vivoProp()
}
function provaHtml() {
  if (!prova) return '<p class="nota">La prova dice quale finestra prenderebbe adesso e te la fa vedere com’è, anche se è coperta.</p>'
  if (!prova.ok) return '<div class="errore">La prova non è riuscita.</div>'
  const sc = prova.scelta
  return `${sc ? (sc.foto ? `<img class="prova-foto" src="${prova.foto}" alt="La finestra che registrerebbe"><p class="nota"><b>${h(sc.titolo)}</b> · ${sc.foto[0]}×${sc.foto[1]}${sc.riquadro ? ' · video di Teams trovato' : ''}</p>` : `<div class="avviso">Trovata «${h(sc.titolo)}», ma non si lascia fotografare (è ridotta a icona?).</div>`) : '<div class="avviso">Nessuna finestra aperta ha un titolo da lezione. Apri la lezione, o cambia il titolo qui sopra.</div>'}
    <div class="finestre">${(prova.finestre ?? []).map((f) => `<div class="${sc && f.titolo === sc.titolo ? 'scelta-f' : ''}"><b>${h(f.titolo)}</b><small>${h(f.programma)} · ${f.area[2]}×${f.area[3]}</small></div>`).join('')}</div>`
}
// le parti delle proprietà che cambiano ogni secondo
function vivoProp() {
  const r = S.reg
  const metti = (id, righe) => { const el = $(id); if (el) el.innerHTML = righe.map(([k, v, mono]) => `<dt>${k}</dt><dd${mono ? ' class="mono"' : ''}>${h(v)}</dd>`).join('') }
  const mat = orario.materie[r?.materia?.id ?? (S.imp.materia || S.adesso?.materia)]
  metti('#p-sessione', [['Stato', r ? (r.fermando ? 'chiude…' : r.auto ? 'registra (dall’orario)' : 'registra') : 'pronta'], ['Materia', mat?.breve ?? mat?.nome ?? 'nessuna'], ['Docente', mat?.docente ?? '–'],
    ['Cartella', r?.id ?? '–', 1], ['Voce', MOTORI[S.imp.motore]?.nome ?? '–'], ['Avvio automatico', S.imp.automatico ? 'acceso' : 'spento'],
    ['Prossima lezione', S.prossima ? `${orario.materie[S.prossima.materia]?.breve ?? ''} · ${GIORNI[S.prossima.giorno].slice(0, 3).toLowerCase()} ${S.prossima.da}` : '–']])
  metti('#p-audio', [['Dispositivo', r?.audio.dispositivo ?? (r ? '…' : 'si vede registrando')], ['Frequenza', r?.audio.rate ? `${r.audio.rate} Hz` : '–', 1], ['Livello', r?.audio.livello_db != null ? `${r.audio.livello_db} dB` : '–', 1], ['Silenzio da', r?.audio.silenzio_s != null ? `${r.audio.silenzio_s} s` : '–', 1], ['Pezzi scritti', r?.audio.pezzi ?? '–', 1]])
  metti('#p-video', [['Finestra', r ? (r.video.finestra ?? 'non trovata') : 'si vede registrando'], ['Misura', r?.video.misura ? `${r.video.misura[0]}×${r.video.misura[1]}` : '–', 1], ['Fotogrammi', r?.video.fotogrammi ?? '–', 1], ['Lezione visibile', r ? hms(r.video.vista_s ?? 0) : '–', 1], ['Fuori', r ? hms(r.video.fuori_s ?? 0) : '–', 1]])
  metti('#p-voce', [['Motore', r?.voce?.motore ?? (r?.voce ? 'si sta caricando…' : '–')], ['Trascritto fino a', r?.voce ? hms(r.voce.fatto_s) : '–', 1], ['Dietro la diretta', r?.voce ? `${r.voce.ritardo_s} s` : '–', 1], ['Velocità', r?.voce?.calcolo ? `${String(r.voce.calcolo).replace('.', ',')}× il tempo reale` : '–', 1]])
}

// il monitor, una volta al secondo
let ultimaAnteprima = 0
function disegnaMonitor() {
  const r = S.reg, rec = $('#rec')
  rec.classList.toggle('su', !!r); rec.classList.toggle('chiude', !!r?.fermando)
  rec.querySelector('span').textContent = r ? (r.fermando ? 'Chiudo…' : 'Ferma') : 'Registra'
  rec.title = r ? 'Ferma la registrazione: la trascrizione finisce l’audio rimasto, poi la lezione si sviluppa' : 'Avvia la registrazione'
  rec.disabled = !!r?.fermando || !S.python
  $('#tempo').textContent = hms(r?.durata_s ?? 0); $('#tempo').classList.toggle('su', !!r)
  $('.rail .casa').classList.toggle('viva', !!r)
  $('#materia').disabled = !!r
  const img = $('#vista-img'), vuoto = $('#vuoto-m')
  const vede = r && r.anteprima && r.video.finestra
  if (vede && r.anteprima !== ultimaAnteprima) { ultimaAnteprima = r.anteprima; img.src = `/f/${r.id}/vivo.jpg?${r.anteprima}` }
  img.hidden = !vede; vuoto.hidden = !!vede
  if (!vede) {
    const p = S.prossima, pm = p && orario.materie[p.materia]
    vuoto.innerHTML = r
      ? (S.imp.sorgenti.finestra ? `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M9 8l6 5M15 8l-6 5"/></svg><b>La finestra della lezione non si vede</b><span>L’audio si registra lo stesso. I fotogrammi ripartono quando torna una finestra col titolo da lezione (${h(S.imp.finestra.titolo)}) e non è ridotta a icona.</span>` : '<svg viewBox="0 0 24 24"><path d="M12 3v10M8 7v6a4 4 0 0 0 8 0V7M5 12a7 7 0 0 0 14 0M12 19v2"/></svg><b>Solo audio</b><span>La finestra della lezione è spenta: si registra e si trascrive la voce.</span>')
      : `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="12" cy="10.500" r="2.500"/></svg><b>Pronta a registrare</b><span>Apri la lezione e premi <b style="font-size:inherit">Registra</b>: l’audio del PC, la finestra della lezione e la trascrizione partono insieme.</span>${p ? `<span class="prox">Prossima lezione: ${h(pm?.breve ?? p.materia)} · ${GIORNI[p.giorno].toLowerCase()} alle ${p.da} · ${fraQuanto(p.fra_s)}</span>` : ''}`
  }
  $('#su-m').innerHTML = r ? [`<span class="rosso"><i></i>${r.fermando ? 'Chiudo' : 'Rec'}${r.materia ? ` · ${h(r.materia.breve ?? r.materia.nome)}` : ''}</span>`,
    r.video.finestra ? `<span><i></i>${h(r.video.finestra)}</span>` : (S.imp.sorgenti.finestra ? '<span class="giallo"><i></i>Finestra non trovata</span>' : ''),
    r.video.fotogrammi ? `<span>${r.video.fotogrammi} fotogrammi</span>` : '', r.voce ? `<span>Voce −${r.voce.ritardo_s} s</span>` : ''].join('') : ''
  $('#sottotitolo').textContent = r?.frasi.at(-1)?.testo ?? ''
  const vu = $('#vu'); vu.hidden = !r
  if (r) { const db = r.audio.livello_db ?? -90; vu.firstElementChild.style.height = `${Math.max(0, Math.min(100, (db + 60) / 60 * 100))}%`; vu.style.setProperty('--vu-h', `${vu.clientHeight}px`) }
  $('#apri-corrente').hidden = !(r || S.ultimaFinita)
  if (Date.now() > avvisoT) {
    const l = S.lavoro
    $('#aiuto').innerHTML = r ? (r.fermando ? 'Chiudo la lezione: l’ultimo pezzo di audio, poi la trascrizione finisce quello che resta.' : `Registro in <b>${h(r.id)}</b>${r.auto ? ' (avviata dall’orario)' : ''} · livello ${r.audio.livello_db ?? '–'} dB${(r.audio.silenzio_s ?? 0) > 20 ? ` · <b>silenzio da ${r.audio.silenzio_s} s</b>` : ''}`)
      : l ? `Sviluppo <b>${h(l.id ?? l.cosa)}</b>: la trovi in Galleria appena finito.`
      : S.ultimaFinita ? `Lezione <b>${h(S.ultimaFinita.id)}</b> chiusa: è in Galleria.` : `Le lezioni vanno in <b>${h(S.base)}</b>.`
  }
  // la voce
  if (dock === 'voce') {
    const ff = r?.frasi ?? [], firma = `${r?.id}${ff.length}${ff.at(-1)?.t0}`
    if (firma !== firmaDock) {
      firmaDock = firma
      const el = $('#voce-l')
      el.innerHTML = ff.length ? ff.map((s) => `<p><time>${hms(s.t0)}</time><span>${h(s.testo)}</span></p>`).join('') : `<p class="nota">${r ? (r.voce ? 'La voce arriva fra quindici e quaranta secondi dopo la diretta: il modello si sta caricando, o non ha ancora parlato nessuno.' : 'La trascrizione è spenta.') : 'Qui scorre quello che viene detto, mentre viene detto.'}</p>`
      el.scrollTop = el.scrollHeight
    }
  }
  if (dock === 'oggi') disegnaOggi()
  $('.dock-t [data-dock=voce]').classList.toggle('viva', !!r?.voce)
  $('#dock-nota').textContent = r?.voce?.motore ? `${r.voce.motore}${r.voce.calcolo ? ` · ${String(r.voce.calcolo).replace('.', ',')}×` : ''}` : ''
}

function disegnaPannello() {
  $('#filo').className = 'pallino su'; $('#filo span').textContent = `Lezioni OS ${S.versione}`
  const f2 = $('#filo-2'), r = S.reg
  f2.className = `pallino ${r ? 'su' : S.python ? 'spento' : ''}`
  f2.lastElementChild.textContent = r ? `In registrazione · ${hms(r.durata_s)}` : S.python ? (S.imp.automatico ? 'Aspetta l’orario' : 'Pronta') : 'Manca Python (installa.ps1)'
  const l = S.lavoro, av = l?.avanza
  const fallito = !l && S.ultimoLavoro && !S.ultimoLavoro.ok && S.ora - S.ultimoLavoro.alle < 15 * 60e3 ? S.ultimoLavoro : null
  $('#lavoro').hidden = !l && !fallito
  $('#lavoro .pallino').className = `pallino ${fallito ? '' : 'forse'}`
  $('#lavoro .mic-barra').hidden = !!fallito
  if (fallito) { // l'ultimo lavoro non è riuscito: resta scritto qui per un quarto d'ora
    $('#lavoro-t').textContent = `Non riuscito: ${fallito.errore ?? `${fallito.tipo} ${fallito.id ?? ''}`}`
    $('#lavoro').title = fallito.errore ?? ''
  }
  if (l) {
    $('#lavoro').title = ''
    const NOMI = { lezione: 'guardo i fotogrammi', miniature: 'miniature', pulita: 'pulisco la lavagna', audio: 'audio in Opus', ascolto: 'ascolto pulito', picchi: 'volume' }
    $('#lavoro-t').textContent = l.tipo === 'modello' ? `Scarico ${l.cosa.replace('scarica ', '')}` : l.tipo === 'leggi' ? `Leggo la lavagna${av?.totale ? ` ${av.fatto + 1}/${av.totale}` : ''}` : `${NOMI[av?.passo] ?? 'Sviluppo'}${S.fila.length ? ` (+${S.fila.length})` : ''}`
    $('#lavoro-b').style.width = `${av?.totale ? Math.round(av.fatto / av.totale * 100) : 8}%`
  }
  const g = S.pc.gpu, d = S.pc.disco
  $('#pc-gpu').textContent = g ? `${(g.mem / 1024).toFixed(1).replace('.', ',')}/${Math.round(g.tot / 1024)} GB · ${g.gradi}°` : '–'
  $('#pc-gpu').title = g ? `${g.nome} · uso ${g.uso}%` : ''
  $('#pc-disco').textContent = d ? `${d.liberi_gb} GB liberi` : '–'
  $('#pc-disco').title = d ? `${d.dove} · ${S.base}` : ''
}

// ══ la galleria ══
let aperta = null // { id, d } la lezione nel visore
let filtro = '' // la materia scelta a sinistra
let firmaFiniti = ''
async function caricaLezioni() {
  lezioni = await prendi('/api/lezioni') ?? []
  $('#n-lezioni').textContent = lezioni.length || ''
  if (vista === 'galleria') { disegnaGalleria(); if (aperta) apri(aperta.id, true) }
  if (vista === 'orario') disegnaOrario()
}
const tintaDi = (l) => l.materia?.colore ?? 'var(--riga)'
const titoloDi = (l) => l.titolo || l.materia?.nome || 'Lezione'
function segni(l) {
  const s = []
  s.push(l.frasi ? `<span class="segno si">${l.frasi} frasi</span>` : '<span class="segno no">senza voce</span>')
  s.push(`<span class="segno">${l.fotogrammi} lavagne</span>`)
  if (l.sviluppata?.pulita) s.push('<span class="segno si">pulita</span>')
  if (l.audio.opus) s.push('<span class="segno si">opus</span>')
  if (l.letture) s.push(`<span class="segno si">${l.letture} lette</span>`)
  if (l.appunti) s.push('<span class="segno si">appunti</span>')
  if (!l.sviluppata && !l.in_corso) s.push('<span class="segno no">da sviluppare</span>')
  return s.join('')
}
function disegnaGalleria() {
  const viste = lezioni.filter((l) => !filtro || (l.materia?.id ?? '-') === filtro)
  $('#conta-lezioni').textContent = `${lezioni.length} · ${durata(lezioni.reduce((n, l) => n + l.durata_s, 0))}`
  // a sinistra: le materie
  const per = new Map()
  for (const l of lezioni) { const k = l.materia?.id ?? '-'; per.set(k, { n: (per.get(k)?.n ?? 0) + 1, m: l.materia }) }
  $('#gal-materie').innerHTML = `<h2>Materie</h2><button class="mat-r" data-f="" aria-pressed="${!filtro}"><i style="background:var(--testo)"></i><b>Tutte</b><small>${lezioni.length}</small></button>` +
    [...per].map(([k, v]) => `<button class="mat-r" data-f="${k}" aria-pressed="${filtro === k}"><i style="background:${h(v.m?.colore ?? 'transparent')}"></i><b>${h(v.m?.breve ?? 'Senza materia')}</b><small>${v.n}</small></button>`).join('')
  for (const b of $$('#gal-materie [data-f]')) b.onclick = () => { filtro = b.dataset.f; chiudi(); disegnaGalleria() }
  if (aperta) return
  $('#gal-testa').innerHTML = `<h1>Galleria</h1><i class="sep"></i><span class="et">${viste.length} ${viste.length === 1 ? 'lezione' : 'lezioni'}${filtro ? ` · ${h(per.get(filtro)?.m?.breve ?? 'senza materia')}` : ''}</span>`
  let mese = '', html = ''
  for (const l of viste) {
    const m = new Date(l.inizio).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    if (m !== mese) { html += `${mese ? '</div>' : ''}<h2 class="mese">${m}</h2><div class="griglia">`; mese = m }
    html += `<button class="scheda-l" data-id="${l.id}" style="--tinta:${h(tintaDi(l))}"><div class="cop">${l.copertina ? `<img src="/f/${l.id}/${l.copertina}" alt="" loading="lazy">` : `<div class="senza">${h(l.materia?.breve ?? 'Lezione')}<small>${l.frasi ? 'solo voce: i fotogrammi non ci sono più' : 'senza fotogrammi'}</small></div>`}${l.in_corso ? '<span class="viva-l">IN REGISTRAZIONE</span>' : ''}<span class="dur">${durata(l.durata_s)}</span></div>
      <div class="corpo"><h3>${h(titoloDi(l))}</h3><span class="quando">${giorno(l.inizio)} · ${oraDi(l.inizio)}${l.materia?.docente ? ` · ${h(l.materia.docente)}` : ''}</span><div class="segni">${segni(l)}</div></div></button>`
  }
  $('#gal-griglia').innerHTML = html ? `${html}</div>` : '<p class="nota" style="padding:20px">Ancora nessuna lezione qui. Le registrazioni compaiono in questa pagina appena partono.</p>'
  for (const b of $$('#gal-griglia [data-id]')) b.onclick = () => apri(b.dataset.id)
  disegnaPropGalleria()
}
function disegnaPropGalleria() {
  if (aperta) return
  $('#prop-gal-t').textContent = 'Galleria'
  const wav = lezioni.reduce((n, l) => n + l.audio.wav_mb, 0), daFare = lezioni.filter((l) => !l.sviluppata && !l.in_corso && l.durata_s > 60)
  $('#prop-gal').className = 'prop-c vuota-p'
  $('#prop-gal').innerHTML = `<p class="nota">Scegli una lezione: si apre con la lavagna, la voce e l’audio sugli stessi tempi.</p>
    <details class="sez" open><summary>Archivio</summary><div class="sez-c"><dl class="dati"><dt>Lezioni</dt><dd>${lezioni.length}</dd><dt>Ore registrate</dt><dd>${durata(lezioni.reduce((n, l) => n + l.durata_s, 0))}</dd><dt>Frasi trascritte</dt><dd>${lezioni.reduce((n, l) => n + l.frasi, 0).toLocaleString('it-IT')}</dd><dt>Audio in WAV</dt><dd>${(wav / 1000).toFixed(1).replace('.', ',')} GB</dd><dt>Cartella</dt><dd class="mono" style="font-size:11px">${h(S?.base ?? '')}</dd></dl>
      <div class="pila" style="margin-top:10px">${daFare.length ? `<button id="g-tutte" class="forte">Sviluppa le ${daFare.length} da sviluppare</button>` : ''}<button id="g-cartella">Apri la cartella</button></div>
      ${daFare.length ? '<p class="nota"><b>Sviluppare</b> una lezione vecchia non le toglie niente: scarta dalla vista quello che lezione non è (l’altro schermo, un gioco sopra), pulisce la lavagna, fa l’audio in Opus e le miniature. Una lezione di due ore: qualche minuto, a bassa priorità.</p>' : ''}</div></details>`
  $('#g-cartella').onclick = () => azione({ tipo: 'apri' })
  $('#g-tutte') && ($('#g-tutte').onclick = async (e) => { e.target.disabled = true; for (const l of daFare.slice().reverse()) await azione({ tipo: 'sviluppa', id: l.id }) })
}
// la ricerca nelle trascrizioni
let cercaT = 0
$('#cerca').oninput = (e) => {
  clearTimeout(cercaT)
  const q = e.target.value.trim()
  cercaT = setTimeout(async () => {
    const el = $('#gal-trovate')
    if (q.length < 2) { el.hidden = true; return }
    const tt = await prendi(`/api/cerca?q=${encodeURIComponent(q)}`) ?? []
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    el.hidden = false
    el.innerHTML = tt.length ? tt.map((t) => `<button class="trovata" data-id="${t.id}" data-t="${t.t0}"><small>${t.id.slice(8, 10)}/${t.id.slice(5, 7)} · ${hms(t.t0)} · ${h(t.materia)}</small><span>${h(t.testo).replace(re, (m) => `<mark>${m}</mark>`)}</span></button>`).join('') : '<p class="nota">Nessuno l’ha detto.</p>'
    for (const b of $$('.trovata', el)) b.onclick = async () => { await apri(b.dataset.id); salta(+b.dataset.t, false) }
  }, 220)
}

// ── il visore ──
const suono = $('#suono')
const V = { t: 0, foto: 'nitida', audio: 'opus', scheda: 'voce', pezzo: -1, frames: [], iF: -1, iS: -1 }
async function apri(id, silenzioso = false) {
  const d = await prendi(`/api/lezione/${id}`)
  if (!d) return
  const stessa = aperta?.id === id
  aperta = { id, d }
  V.frames = d.frames.filter((f) => !f.fuori)
  if (!stessa) { suono.pause(); suono.removeAttribute('src'); V.t = V.frames[0]?.t ?? 0; V.pezzo = -1; V.iF = V.iS = -1 }
  const r = d.riassunto
  if (!r.sviluppata?.pulita && V.foto !== 'originale') V.foto = 'originale'
  if (r.sviluppata?.pulita && !stessa) V.foto = 'nitida'
  V.audio = r.audio.opus ? (V.audio === 'ascolto' && r.audio.ascolto ? 'ascolto' : 'opus') : 'wav'
  $('#gal-griglia').hidden = true; $('#visore').hidden = false
  $('#gal-testa').innerHTML = `<button class="piccolo" id="v-indietro" title="Esc">← Galleria</button><i class="tinta" style="background:${h(tintaDi(r))};margin:0"></i><h1 style="text-transform:none;letter-spacing:0;font-size:14.5px">${h(titoloDi(r))}</h1><span class="et" style="text-transform:none;letter-spacing:0">${giorno(r.inizio)} · ${oraDi(r.inizio)} · ${durata(r.durata_s)}</span>`
  $('#v-indietro').onclick = chiudi
  $('#quale-foto').innerHTML = [['originale', 'Originale'], ['pulita', 'Senza prof'], ['nitida', 'Nitida']].map(([k, n]) => `<button data-foto="${k}" aria-pressed="${V.foto === k}" ${k !== 'originale' && !r.sviluppata?.pulita ? 'disabled title="Sviluppa la lezione"' : ''}>${n}</button>`).join('')
  for (const b of $$('#quale-foto button')) b.onclick = () => { V.foto = b.dataset.foto; V.iF = -1; for (const x of $$('#quale-foto button')) x.setAttribute('aria-pressed', x === b); segui() }
  $('#quale-audio').innerHTML = r.audio.opus ? [['opus', 'Originale'], ['ascolto', 'Pulito']].map(([k, n]) => `<button data-audio="${k}" aria-pressed="${V.audio === k}" ${k === 'ascolto' && !r.audio.ascolto ? 'disabled' : ''}>${n}</button>`).join('') : ''
  for (const b of $$('#quale-audio button')) b.onclick = () => { const andava = !suono.paused; V.audio = b.dataset.audio; for (const x of $$('#quale-audio button')) x.setAttribute('aria-pressed', x === b); suono.removeAttribute('src'); salta(V.t, andava) }
  $('#gioca').disabled = !(r.audio.opus || d.wav.length)
  $('#vis-thumb').innerHTML = V.frames.some((f) => f.mini) ? V.frames.map((f, i) => `<button data-i="${i}" title="${hms(f.t)}"><img src="/f/${id}/${f.mini ?? f.file}" alt="" loading="lazy"></button>`).join('') : ''
  $('#vis-thumb').hidden = !V.frames.some((f) => f.mini)
  if (!silenzioso || !stessa) disegnaTesto()
  disegnaLinea(); disegnaPropLezione(); V.iF = V.iS = -1; segui()
}
function chiudi() {
  if (!aperta) return
  suono.pause(); aperta = null
  $('#visore').hidden = true; $('#gal-griglia').hidden = false
  disegnaGalleria()
}
$('#vis-thumb').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) salta(V.frames[+b.dataset.i].t, false) }
for (const b of $$('[data-vis]')) b.onclick = () => { V.scheda = b.dataset.vis; for (const x of $$('[data-vis]')) x.setAttribute('aria-selected', x === b); disegnaTesto(); V.iS = -1; segui() }
function disegnaTesto() {
  const { d } = aperta, el = $('#vis-testo')
  if (V.scheda === 'voce') {
    el.innerHTML = d.frasi.length ? d.frasi.map((s, i) => `<p data-s="${i}"><time>${hms(s.t0)}</time><span>${h(s.testo)}</span></p>`).join('') : '<p class="nota" style="padding:14px">Questa lezione non ha la trascrizione.</p>'
    $('#vis-nota').textContent = d.frasi.length ? `${d.frasi.length} frasi · ${d.riassunto.motore ?? ''}` : ''
  } else {
    const ll = V.frames.filter((f) => d.letture[f.file])
    el.innerHTML = ll.length ? ll.map((f) => `<div class="lav" data-t="${f.t}"><small>${hms(f.t)} · letta da ${h(d.letture[f.file].da)}</small><pre>${h(d.letture[f.file].lavagna)}</pre></div>`).join('') : '<p class="nota" style="padding:14px">Nessuna lavagna letta. Dalle proprietà: <b>Leggi questa lavagna</b> (sul PC, con Ollama), o tutta la lezione; con Claude le legge <code>ocr_claude.py</code>.</p>'
    $('#vis-nota').textContent = ll.length ? `${ll.length} lavagne` : ''
    try { window.renderMathInElement?.(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }) } catch {}
    for (const x of $$('.lav', el)) x.onclick = () => salta(+x.dataset.t, false)
  }
}
$('#vis-testo').onclick = (e) => { const p = e.target.closest('[data-s]'); if (p) salta(aperta.d.frasi[+p.dataset.s].t0, true) }

// l'audio: un file solo (Opus) se la lezione è sviluppata, se no i pezzi WAV uno dopo l'altro
function salta(t, suona = !suono.paused) {
  if (!aperta) return
  const { id, d } = aperta, r = d.riassunto
  V.t = Math.max(0, Math.min(t, r.durata_s))
  if (r.audio.opus) {
    const src = `/f/${id}/${V.audio === 'ascolto' ? 'ascolto' : 'audio'}.opus`
    if (!suono.src.endsWith(src)) suono.src = src
    suono.currentTime = V.t
  } else if (d.wav.length) {
    const lungo = d.meta.chunk_s, k = Math.min(d.wav.length - 1, Math.floor(V.t / lungo))
    if (k !== V.pezzo || !suono.src) { V.pezzo = k; suono.src = `/f/${id}/audio/${d.wav[k]}` }
    const dentro = V.t - k * lungo
    if (suono.readyState >= 1) suono.currentTime = dentro; else suono.onloadedmetadata = () => { suono.currentTime = dentro; suono.onloadedmetadata = null }
  }
  suono.playbackRate = +$('#velocita').value
  if (suona) suono.play().catch(() => {}); else if (!r.audio.opus) suono.pause()
  V.iS = -1; segui(true)
}
suono.ontimeupdate = () => { if (!aperta) return; V.t = aperta.d.riassunto.audio.opus ? suono.currentTime : V.pezzo * aperta.d.meta.chunk_s + suono.currentTime; segui() }
suono.onended = () => { if (aperta && !aperta.d.riassunto.audio.opus && V.pezzo + 1 < aperta.d.wav.length) salta((V.pezzo + 1) * aperta.d.meta.chunk_s, true) }
suono.onplay = suono.onpause = () => { $('#gioca').innerHTML = suono.paused ? '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.500z"/></svg>' : '<svg viewBox="0 0 16 16"><path d="M3.500 2.500h3v11h-3zM9.500 2.500h3v11h-3z"/></svg>' }
$('#gioca').onclick = () => { if (suono.paused) salta(V.t, true); else suono.pause() }
$('#velocita').onchange = (e) => { suono.playbackRate = +e.target.value }
$('#linea').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); salta((e.clientX - r.left) / r.width * aperta.d.riassunto.durata_s) }
// l'ultimo elemento di una lista (ordinata per tempo) che comincia prima di t
const ultimoPrima = (lista, t, chiave) => { let a = 0, b = lista.length - 1, i = -1; while (a <= b) { const m = (a + b) >> 1; if (lista[m][chiave] <= t) { i = m; a = m + 1 } else b = m - 1 } return i }
function segui(scorri = false) {
  if (!aperta) return
  const { id, d } = aperta, r = d.riassunto
  $('#vis-tempo').innerHTML = `${hms(V.t)} <small>/ ${hms(r.durata_s)}</small>`
  $('#testina').style.left = `${r.durata_s ? V.t / r.durata_s * 100 : 0}%`
  const iF = Math.max(0, ultimoPrima(V.frames, V.t + 0.5, 't'))
  if (iF !== V.iF && V.frames.length) {
    V.iF = iF
    const f = V.frames[iF]
    $('#vis-img').src = `/f/${id}/${(V.foto !== 'originale' && f[V.foto]) || f.file}`
    $('#vis-su').innerHTML = `<span>${hms(f.t)}${f.ora ? ` · ${h(f.ora)}` : ''}</span>${V.foto !== 'originale' && f.coperto > 0.01 ? `<span>il docente copriva il ${Math.round(f.coperto * 100)}%</span>` : ''}<span>${iF + 1}/${V.frames.length}</span>`
    for (const b of $$('#vis-thumb [aria-current]')) b.removeAttribute('aria-current')
    const th = $(`#vis-thumb [data-i="${iF}"]`)
    if (th) { th.setAttribute('aria-current', 'true'); th.scrollIntoView({ block: 'nearest', inline: 'center' }) }
    $('#p-frame') && ($('#p-frame').textContent = `${hms(f.t)} · ${f.file.replace('frames/', '')}`)
  }
  if (V.scheda === 'voce') {
    const iS = ultimoPrima(d.frasi, V.t + 0.2, 't0')
    if (iS !== V.iS) {
      V.iS = iS
      $('#vis-testo .ora')?.classList.remove('ora')
      const p = $(`#vis-testo [data-s="${iS}"]`)
      if (p) { p.classList.add('ora'); if (scorri || !suono.paused) p.scrollIntoView({ block: 'center', behavior: scorri ? 'auto' : 'smooth' }) }
    }
  }
}
function disegnaLinea() {
  if (!aperta) return
  const { d } = aperta, cv = $('#linea-c'), w = cv.clientWidth, a = cv.clientHeight, dpr = devicePixelRatio || 1
  if (!w) return
  cv.width = w * dpr; cv.height = a * dpr
  const x = cv.getContext('2d'), stile = getComputedStyle(document.documentElement), T = d.riassunto.durata_s || 1
  x.scale(dpr, dpr); x.clearRect(0, 0, w, a)
  if (d.picchi?.length) { // il volume, secondo per secondo
    x.fillStyle = stile.getPropertyValue('--tenue'); x.globalAlpha = 0.55
    const n = d.picchi.length
    for (let px = 0; px < w; px++) {
      let m = 0
      for (let i = Math.floor(px / w * n); i < Math.max(Math.floor(px / w * n) + 1, Math.floor((px + 1) / w * n)); i++) m = Math.max(m, d.picchi[i] ?? 0)
      const alt = Math.max(1, Math.max(0, (m - 45) / 55) ** 1.6 * (a - 14)) // (sotto i −33 dB è il fondo dell'aula)
      x.fillRect(px, (a - 10 - alt) / 2 + 2, 1, alt)
    }
    x.globalAlpha = 1
  } else { // senza volume: dove c'è voce
    x.fillStyle = stile.getPropertyValue('--vetro-2')
    for (const s of d.frasi) x.fillRect(s.t0 / T * w, 8, Math.max(1, (s.t1 - s.t0) / T * w), a - 26)
  }
  x.fillStyle = stile.getPropertyValue('--blu') // i fotogrammi della lezione
  for (const f of V.frames) x.fillRect(f.t / T * w, a - 8, 1.5, 6)
}
addEventListener('resize', () => { disegnaLinea() })

function disegnaPropLezione() {
  const { id, d } = aperta, r = d.riassunto, sv = d.sviluppo
  $('#prop-gal-t').textContent = 'Lezione'
  const inLavoro = S?.lavoro?.id === id || S?.fila.some((l) => l.id === id)
  $('#prop-gal').className = 'prop-c scheda'
  $('#prop-gal').innerHTML = `<div class="sc-testa"><div class="sc-titolo"><i class="tinta" style="background:${h(tintaDi(r))};margin:0"></i><h3>${h(titoloDi(r))}</h3></div><div class="sc-id"><span>${id}</span></div>
      <p class="nota sc-dice">${giorno(r.inizio)}, dalle ${oraDi(r.inizio)}${r.fine ? ` alle ${oraDi(r.fine)}` : ''}${r.aula ? ` · ${h(r.aula)}` : ''}${r.materia?.docente ? ` · ${h(r.materia.docente)}` : ''}</p></div>
    <details class="sez" open><summary>Materia</summary><div class="sez-c"><select id="l-materia"><option value="">Nessuna</option>${Object.entries(orario.materie).map(([k, m]) => `<option value="${k}" ${r.materia?.id === k ? 'selected' : ''}>${h(m.nome)}</option>`).join('')}</select>${r.dedotta ? '<p class="nota">Dedotta dall’orario: giorno e ora combaciano.</p>' : ''}</div></details>
    <details class="sez" open><summary>Dentro</summary><div class="sez-c"><dl class="dati"><dt>Durata</dt><dd>${durata(r.durata_s)}</dd><dt>Lavagne</dt><dd>${r.fotogrammi}${r.fuori ? ` (+${r.fuori} fuori lezione)` : ''}</dd><dt>Voce</dt><dd>${r.frasi ? `${r.frasi} frasi · ${r.parole.toLocaleString('it-IT')} parole` : 'non trascritta'}</dd><dt>Motore</dt><dd>${h(r.motore ?? '–')}</dd><dt>Audio</dt><dd>${r.audio.opus ? `Opus ${String(r.audio.opus_mb).replace('.', ',')} MB` : ''}${r.audio.opus && r.audio.pezzi ? ' + ' : ''}${r.audio.pezzi ? `WAV ${r.audio.wav_mb} MB` : ''}${!r.audio.opus && !r.audio.pezzi ? '–' : ''}</dd><dt>Lavagna pulita</dt><dd>${r.sviluppata?.pulita ? `sì (${h(SFONDI[r.sviluppata.sfondo]?.breve ?? r.sviluppata.sfondo ?? '')})` : 'no'}</dd><dt>Fotogramma</dt><dd class="mono" id="p-frame"></dd></dl>
      ${r.vecchia && r.fuori ? `<p class="nota">Registrata col vecchio Lezioni, che fotografava tutto lo schermo: ${r.fuori} fotogrammi non erano la lezione e qui non si vedono (nella cartella ci sono ancora).</p>` : ''}</div></details>
    <details class="sez" open><summary>Lavori</summary><div class="sez-c pila">
      ${sv?.stato === 'errore' ? `<div class="errore" style="margin:0 0 4px">Lo sviluppo si è fermato: ${h(sv.errore)}</div>` : ''}
      <button id="l-sviluppa" class="${r.sviluppata ? '' : 'forte'}" ${inLavoro || r.in_corso ? 'disabled' : ''}>${inLavoro ? 'In lavorazione…' : r.sviluppata ? 'Sviluppa quello che manca' : 'Sviluppa la lezione'}</button>
      ${r.sviluppata ? `<button id="l-rifai" ${inLavoro ? 'disabled' : ''} title="Rifà la lavagna pulita con il modello scelto adesso (${h(SFONDI[S?.imp.sfondo]?.breve ?? '')})">Rifai la lavagna pulita</button>` : ''}
      <button id="l-leggi" ${inLavoro ? 'disabled' : ''} title="Con il modello sul PC (Ollama): uno-due minuti">Leggi questa lavagna</button>
      ${r.audio.opus && r.audio.pezzi ? `<button id="l-libera" class="dx-stacca" ${inLavoro ? 'disabled' : ''}>Libera ${r.audio.wav_mb} MB (tieni l’Opus)</button>` : ''}
      ${r.appunti ? `<a href="/f/${id}/${r.appunti}" target="_blank" style="padding:6px 2px">Apri gli appunti in PDF</a>` : ''}
      <button id="l-apri">Apri la cartella</button>
    </div></details>`
  $('#l-materia').onchange = async (e) => { await azione({ tipo: 'materia', id, materia: e.target.value }); await caricaLezioni() }
  $('#l-sviluppa').onclick = async (e) => { e.target.disabled = true; e.target.textContent = 'In coda…'; await azione({ tipo: 'sviluppa', id }) }
  $('#l-rifai') && ($('#l-rifai').onclick = async (e) => { e.target.disabled = true; e.target.textContent = 'In coda…'; await azione({ tipo: 'sviluppa', id, rifai: true, passi: ['pulita'] }) })
  $('#l-leggi').onclick = async (e) => { const f = V.frames[V.iF]; if (!f) return; e.target.disabled = true; e.target.textContent = 'Leggo…'; await azione({ tipo: 'leggi', id, frame: f.file }) }
  $('#l-apri').onclick = () => azione({ tipo: 'apri', id })
  $('#l-libera') && ($('#l-libera').onclick = async (e) => {
    if (e.target.dataset.sicuro !== '1') { e.target.dataset.sicuro = '1'; e.target.textContent = `Sicuro? Tolgo i ${r.audio.pezzi} WAV, resta audio.opus`; return }
    const x = await azione({ tipo: 'libera', id }); if (x.ok) await caricaLezioni()
  })
  if (V.frames[V.iF]) $('#p-frame').textContent = `${hms(V.frames[V.iF].t)} · ${V.frames[V.iF].file.replace('frames/', '')}`
}

// ══ l'orario ══
let selOr = null // { tipo: 'lezione', i } | { tipo: 'materia', id }
const salvaOrario = async () => { const r = await azione({ tipo: 'orario', orario }); orario = await prendi('/api/orario') ?? orario; firmaMaterie = firmaProp = ''; return r }
function disegnaOrario() {
  const ora = new Date(), oggi = ora.getDay(), mOra = ora.getHours() * 60 + ora.getMinutes()
  const giorni = [1, 2, 3, 4, 5, ...(orario.lezioni.some((l) => l.giorno === 6) ? [6] : [])]
  const da = Math.min(9 * 60, ...orario.lezioni.map((l) => Math.floor(minuti(l.da) / 60) * 60)), a = Math.max(18 * 60, ...orario.lezioni.map((l) => Math.ceil(minuti(l.a) / 60) * 60))
  const ore = (a - da) / 60, pos = (m) => (m - da) / (a - da) * 100
  $('#or-semestre').textContent = `${orario.corso ?? ''}${orario.semestre?.nome ? ` · ${orario.semestre.nome}` : ''}`
  const el = $('#settimana')
  el.style.gridTemplateColumns = `52px repeat(${giorni.length}, minmax(0, 1fr))`
  el.innerHTML = `<div></div>${giorni.map((g) => `<div class="giorno-t${g === oggi ? ' oggi-t' : ''}">${GIORNI[g]}</div>`).join('')}
    <div class="ore">${Array.from({ length: ore + 1 }, (_, i) => `<span style="top:${i / ore * 100}%">${due(da / 60 + i)}:00</span>`).join('')}</div>
    ${giorni.map((g) => `<div class="col${g === oggi ? ' oggi-c' : ''}" style="--ore:${ore}">${orario.lezioni.map((l, i) => {
      if (l.giorno !== g) return ''
      const m = orario.materie[l.materia] ?? {}
      const n = lezioni.filter((z) => { const d = new Date(z.inizio), zm = d.getHours() * 60 + d.getMinutes(); return d.getDay() === g && (z.materia?.id === l.materia || orario.materie[l.materia]?.come === z.materia?.id) && zm < minuti(l.a) && zm + z.durata_s / 60 > minuti(l.da) - 30 }).length
      return `<button class="blocco" data-i="${i}" aria-pressed="${selOr?.tipo === 'lezione' && selOr.i === i}" style="--tinta:${h(m.colore ?? '#ddd')};top:calc(${pos(minuti(l.da))}% + 2px);height:calc(${pos(minuti(l.a)) - pos(minuti(l.da))}% - 4px)"><time>${l.da}–${l.a}</time><b>${h(m.breve ?? m.nome ?? l.materia)}</b><small>${h(m.docente ?? '')}${l.aula ? ` · ${h(l.aula)}` : ''}</small>${n ? `<span class="n-reg">${n} ${n === 1 ? 'registrata' : 'registrate'}</span>` : ''}</button>`
    }).join('')}${g === oggi && mOra >= da && mOra <= a ? `<div class="adesso-l" style="top:${pos(mOra)}%"></div>` : ''}</div>`).join('')}`
  for (const b of $$('.blocco', el)) b.onclick = () => { selOr = { tipo: 'lezione', i: +b.dataset.i }; disegnaOrario() }
  $('#auto').setAttribute('aria-checked', !!S?.imp.automatico)
  // a sinistra: le materie
  $('#conta-cfu').textContent = `${Object.values(orario.materie).reduce((n, m) => n + (m.cfu ?? 0), 0)} CFU`
  $('#or-materie').innerHTML = '<h2>Questo semestre</h2>' + Object.entries(orario.materie).map(([id, m]) => {
    const oreSett = orario.lezioni.filter((l) => l.materia === id).reduce((n, l) => n + (minuti(l.a) - minuti(l.da)) / 60, 0)
    return `<button class="mat-r" data-m="${id}" aria-pressed="${selOr?.tipo === 'materia' && selOr.id === id}" title="${h(m.nome)}"><i style="background:${h(m.colore ?? '#ddd')}"></i><b>${h(m.breve ?? m.nome)}</b><small>${oreSett} h</small></button>`
  }).join('') + '<div class="riga" style="padding:10px 2px"><button class="piccolo" id="or-materia-nuova">Aggiungi materia</button></div>'
  for (const b of $$('#or-materie [data-m]')) b.onclick = () => { selOr = { tipo: 'materia', id: b.dataset.m }; disegnaOrario() }
  $('#or-materia-nuova').onclick = async () => { const id = `materia-${Object.keys(orario.materie).length + 1}`; orario.materie[id] = { nome: 'Nuova materia', breve: 'Nuova', docente: '', cfu: 0, colore: '#d9e7ff', lessico: '' }; await salvaOrario(); selOr = { tipo: 'materia', id }; disegnaOrario() }
  disegnaPropOrario()
}
$('#auto').onclick = async () => { await azione({ tipo: 'imposta', automatico: !S.imp.automatico }) }
$('#or-nuova').onclick = async () => {
  const prima = Object.keys(orario.materie)[0]
  if (!prima) return avviso('Prima aggiungi una materia.')
  const g = new Date().getDay()
  orario.lezioni.push({ giorno: g >= 1 && g <= 5 ? g : 1, da: '14:00', a: '16:00', materia: prima, aula: '' })
  const nuova = orario.lezioni.at(-1)
  await salvaOrario(); selOr = { tipo: 'lezione', i: orario.lezioni.findIndex((l) => l.giorno === nuova.giorno && l.da === nuova.da && l.materia === nuova.materia) }; disegnaOrario()
}
function disegnaPropOrario() {
  const el = $('#prop-or')
  if (selOr?.tipo === 'lezione' && orario.lezioni[selOr.i]) {
    const l = orario.lezioni[selOr.i], m = orario.materie[l.materia] ?? {}
    el.className = 'prop-c scheda'
    el.innerHTML = `<div class="sc-testa"><div class="sc-titolo"><i class="tinta" style="background:${h(m.colore ?? '#ddd')};margin:0"></i><h3>${h(m.nome ?? l.materia)}</h3></div><div class="sc-id"><span>${GIORNI[l.giorno].toLowerCase()} ${l.da}–${l.a}</span></div>${l.nota ? `<p class="nota sc-dice">${h(l.nota)}</p>` : ''}</div>
      <details class="sez" open><summary>Lezione</summary><div class="sez-c">
        <label class="campo-l" style="margin-top:0"><span>Materia</span><select id="o-materia">${Object.entries(orario.materie).map(([k, x]) => `<option value="${k}" ${k === l.materia ? 'selected' : ''}>${h(x.nome)}</option>`).join('')}</select></label>
        <label class="campo-l"><span>Giorno</span><select id="o-giorno">${[1, 2, 3, 4, 5, 6].map((g) => `<option value="${g}" ${g === l.giorno ? 'selected' : ''}>${GIORNI[g]}</option>`).join('')}</select></label>
        <div class="reg-2" style="border-top:0"><label><span>Dalle</span><input type="time" id="o-da" value="${l.da}" step="900"></label><label><span>Alle</span><input type="time" id="o-a" value="${l.a}" step="900"></label></div>
        <label class="campo-l"><span>Aula</span><input type="text" id="o-aula" value="${h(l.aula ?? '')}"></label>
        <div class="riga sc-bottoni"><button id="o-salva" class="forte">Salva</button><button id="o-togli" class="dx-stacca">Togli</button></div>
      </div></details>`
    $('#o-salva').onclick = async () => {
      const n = { ...l, materia: $('#o-materia').value, giorno: +$('#o-giorno').value, da: $('#o-da').value, a: $('#o-a').value, aula: $('#o-aula').value.trim() }
      if (!(n.da < n.a)) return avviso('L’ora di fine viene dopo quella di inizio.')
      orario.lezioni[selOr.i] = n; await salvaOrario()
      selOr = { tipo: 'lezione', i: orario.lezioni.findIndex((x) => x.giorno === n.giorno && x.da === n.da && x.materia === n.materia) }; disegnaOrario()
    }
    $('#o-togli').onclick = async () => { orario.lezioni.splice(selOr.i, 1); selOr = null; await salvaOrario(); disegnaOrario() }
    return
  }
  if (selOr?.tipo === 'materia' && orario.materie[selOr.id]) {
    const id = selOr.id, m = orario.materie[id], usata = orario.lezioni.some((l) => l.materia === id)
    el.className = 'prop-c scheda'
    el.innerHTML = `<div class="sc-testa"><div class="sc-titolo"><i class="tinta" style="background:${h(m.colore ?? '#ddd')};margin:0"></i><h3>${h(m.nome)}</h3></div><div class="sc-id"><span>materia / ${id}</span></div></div>
      <details class="sez" open><summary>Materia</summary><div class="sez-c">
        <label class="campo-l" style="margin-top:0"><span>Nome</span><input type="text" id="m-nome" value="${h(m.nome)}"></label>
        <div class="reg-2" style="border-top:0"><label><span>Nome breve</span><input type="text" id="m-breve" value="${h(m.breve ?? '')}"></label><label><span>CFU</span><input type="number" id="m-cfu" min="0" max="30" value="${m.cfu ?? 0}"></label></div>
        <label class="campo-l"><span>Docente</span><input type="text" id="m-docente" value="${h(m.docente ?? '')}"></label>
        <label class="campo-l"><span>Colore</span><input type="color" id="m-colore" value="${h(m.colore ?? '#dddddd')}" style="width:100%;height:32px;padding:2px;border-radius:6px;border:1px solid var(--riga);background:var(--chiaro)"></label>
      </div></details>
      <details class="sez" open><summary>Lessico per il trascrittore</summary><div class="sez-c">${m.come ? `<p class="nota" style="margin-top:0">Usa il lessico di «${h(orario.materie[m.come]?.breve ?? m.come)}».</p>` : `<textarea id="m-lessico" spellcheck="false">${h(m.lessico ?? '')}</textarea><p class="nota">Parole separate da virgole: i termini che il docente usa e che un orecchio non del mestiere sbaglierebbe.</p>`}
        <div class="riga sc-bottoni"><button id="m-salva" class="forte">Salva</button><button id="m-togli" class="dx-stacca" ${usata ? 'disabled title="Ha lezioni in orario"' : ''}>Togli</button></div></div></details>`
    $('#m-salva').onclick = async () => {
      Object.assign(m, { nome: $('#m-nome').value.trim() || m.nome, breve: $('#m-breve').value.trim(), cfu: +$('#m-cfu').value || 0, docente: $('#m-docente').value.trim(), colore: $('#m-colore').value })
      if ($('#m-lessico')) m.lessico = $('#m-lessico').value.replace(/\s+/g, ' ').trim()
      await salvaOrario(); await caricaLezioni(); disegnaOrario()
    }
    $('#m-togli').onclick = async () => { delete orario.materie[id]; selOr = null; await salvaOrario(); disegnaOrario() }
    return
  }
  const p = S?.prossima, pm = p && orario.materie[p.materia]
  el.className = 'prop-c vuota-p'
  el.innerHTML = `<p class="nota">Scegli una lezione dell’orario o una materia: qui si cambiano.</p>
    <details class="sez" open><summary>Prossima lezione</summary><div class="sez-c">${p ? `<div class="grosso" style="font-size:22px">${fraQuanto(p.fra_s)}</div><dl class="dati" style="margin-top:10px"><dt>Materia</dt><dd>${h(pm?.nome ?? p.materia)}</dd><dt>Quando</dt><dd>${GIORNI[p.giorno]} ${p.da}–${p.a}</dd><dt>Docente</dt><dd>${h(pm?.docente ?? '–')}</dd><dt>Aula</dt><dd>${h(p.aula ?? '–')}</dd></dl>` : '<p class="nota" style="margin-top:0">Nessuna lezione in orario nei prossimi sette giorni (il semestre è finito?).</p>'}</div></details>
    <details class="sez" open><summary>Avvio automatico</summary><div class="sez-c"><p class="nota" style="margin-top:0">${S?.imp.automatico ? '<b>Acceso.</b>' : '<b>Spento.</b>'} Due minuti prima di ogni lezione dell’orario Lezioni OS guarda se c’è una finestra col titolo da lezione: se c’è, registra, con la materia e il lessico giusti. Si ferma dieci minuti dopo la fine, o prima se la finestra è chiusa e c’è silenzio da dieci minuti. Una lezione fermata a mano non riparte.</p><p class="nota">Serve il server acceso: parte con Windows se lo metti in avvio (<code>installa.ps1 -Avvio</code>).</p></div></details>
    <details class="sez"><summary>Da dove viene</summary><div class="sez-c"><p class="nota" style="margin-top:0;overflow-wrap:anywhere">${h(orario.fonte ?? 'orario.json')}</p>${orario.semestre ? `<p class="nota">Vale dal ${orario.semestre.da?.split('-').reverse().join('/')} al ${orario.semestre.a?.split('-').reverse().join('/')}: fuori da lì l’automatico non parte.</p>` : ''}</div></details>`
}

// ══ i modelli ══
const GRUPPI = { voce: 'Voce', lavagna: 'Lavagna', audio: 'Audio', lettura: 'Lettura della lavagna' }
async function caricaModelli() {
  modelli = await prendi('/api/modelli') ?? modelli
  disegnaModelli()
}
function disegnaModelli() {
  if (!S) return
  const usato = (m) => m.id === S.imp.motore || m.id === S.imp.sfondo || m.sempre || (m.id === 'qwen3-vl' && S.imp.sorgenti.lettura)
  $('#conta-modelli').textContent = `${modelli.filter((m) => m.presente).length}/${modelli.length} presenti`
  $('#mod-dove').textContent = 'I pesi stanno sul PC, fuori dal repository'
  $('#mod-gruppi').innerHTML = Object.entries(GRUPPI).map(([g, n]) => `<button class="mat-r" data-g="${g}"><i style="background:var(--testo)"></i><b>${n}</b><small>${modelli.filter((m) => m.gruppo === g).length}</small></button>`).join('')
  for (const b of $$('#mod-gruppi [data-g]')) b.onclick = () => $(`#g-${b.dataset.g}`)?.scrollIntoView({ behavior: 'smooth' })
  $('#mod-corpo').innerHTML = modelli.length ? Object.entries(GRUPPI).map(([g, n]) => `<h2 class="mese" id="g-${g}">${n}</h2><div class="modelli">${modelli.filter((m) => m.gruppo === g).map((m) => `<div class="modello${usato(m) ? ' usato' : ''}"><h3>${h(m.nome)}<i class="led${m.presente ? ' su' : ''}" title="${m.presente ? 'Presente' : 'Non presente'}"></i></h3><span class="di">${h(m.di)} · ${h(m.licenza)}</span><p>${h(m.dice)}</p>
      <div class="segni"><span class="segno">${h(m.peso)}</span><span class="segno">${h(m.gira)}</span><span class="segno ${m.provato.startsWith('sì') ? 'si' : 'no'}">provato: ${h(m.provato)}</span>${usato(m) ? '<span class="segno si">in uso</span>' : ''}${m.nota ? `<span class="segno no">${h(m.nota)}</span>` : ''}</div>
      <div class="riga">${m.scaricabile ? `<button class="piccolo" data-scarica="${m.id}">Scarica</button>` : ''}${g === 'voce' && S.imp.motore !== m.id && MOTORI[m.id] ? `<button class="piccolo" data-usa-motore="${m.id}">Usa per la voce</button>` : ''}${g === 'lavagna' && S.imp.sfondo !== m.id && m.presente ? `<button class="piccolo" data-usa-sfondo="${m.id}">Usa per la lavagna</button>` : ''}</div></div>`).join('')}</div>`).join('') : '<p class="nota" style="padding:20px">Leggo i modelli…</p>'
  for (const b of $$('[data-scarica]')) b.onclick = async () => { b.disabled = true; b.textContent = 'In coda…'; await azione({ tipo: 'modello', id: b.dataset.scarica }) }
  for (const b of $$('[data-usa-motore]')) b.onclick = async () => { await azione({ tipo: 'imposta', motore: b.dataset.usaMotore }); setTimeout(disegnaModelli, 1200) }
  for (const b of $$('[data-usa-sfondo]')) b.onclick = async () => { await azione({ tipo: 'imposta', sfondo: b.dataset.usaSfondo }); setTimeout(disegnaModelli, 1200) }
  const g = S.pc.gpu, d = S.pc.disco
  $('#prop-mod').className = 'prop-c vuota-p'
  $('#prop-mod').innerHTML = `<details class="sez" open><summary>Scheda video</summary><div class="sez-c"><dl class="dati"><dt>Modello</dt><dd>${h(g?.nome ?? 'non trovata')}</dd><dt>Memoria</dt><dd class="mono">${g ? `${g.mem} / ${g.tot} MB` : '–'}</dd><dt>Uso</dt><dd class="mono">${g ? `${g.uso}%` : '–'}</dd><dt>Temperatura</dt><dd class="mono">${g ? `${g.gradi} °C` : '–'}</dd></dl>
      <p class="nota">Durante la lezione la scheda video la usa solo Whisper (~3 GB). Il resto gira sulla CPU a bassa priorità, dopo: il PC resta tuo.</p></div></details>
    <details class="sez" open><summary>Disco</summary><div class="sez-c"><dl class="dati"><dt>Liberi</dt><dd class="mono">${d ? `${d.liberi_gb} GB su ${d.tot_gb}` : '–'}</dd><dt>Lezioni in</dt><dd class="mono" style="font-size:11px">${h(S.base)}</dd></dl></div></details>
    <details class="sez" open><summary>Lezioni OS</summary><div class="sez-c"><dl class="dati"><dt>Versione</dt><dd class="mono">${S.versione}</dd><dt>Python</dt><dd>${S.python ? 'presente' : 'manca'}</dd></dl></div></details>`
}

// ══ il filo col server ══
function aggiorna() {
  if (!S) return
  disegnaPannello()
  if (vista === 'regia') { disegnaSorgenti(); disegnaMaterie(); disegnaMonitor(); disegnaProp() }
  if (vista === 'orario') $('#auto').setAttribute('aria-checked', !!S.imp.automatico)
  // una lezione è finita, o un lavoro: la galleria si rilegge
  const firma = JSON.stringify([S.ultimoLavoro, S.ultimaFinita, S.reg?.id ?? null, S.lavoro?.id ?? null, S.fila.length])
  if (firma !== firmaFiniti) {
    const prima = firmaFiniti; firmaFiniti = firma
    if (prima) { caricaLezioni(); if (vista === 'modelli') caricaModelli() }
  }
}
function collega() {
  const f = new EventSource('/api/flusso')
  f.onmessage = (e) => { S = JSON.parse(e.data); aggiorna() }
  f.onerror = () => { $('#filo').className = 'pallino'; $('#filo span').textContent = 'Server spento: avvia.cmd' }
}
addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
  if (e.key === 'Escape') { if (vista === 'galleria' && aperta) chiudi(); else if (vista === 'regia' && scelta) { scelta = null; firmaProp = ''; aggiorna() } else if (vista === 'orario' && selOr) { selOr = null; disegnaOrario() } }
  if (vista === 'galleria' && aperta) {
    if (e.key === ' ') { e.preventDefault(); $('#gioca').click() }
    if (e.key === 'ArrowRight') salta(V.t + (e.shiftKey ? 30 : 5))
    if (e.key === 'ArrowLeft') salta(V.t - (e.shiftKey ? 30 : 5))
    if (e.key === 'ArrowDown' && V.frames[V.iF + 1]) { e.preventDefault(); salta(V.frames[V.iF + 1].t) }
    if (e.key === 'ArrowUp' && V.frames[V.iF - 1]) { e.preventDefault(); salta(V.frames[V.iF - 1].t) }
  }
})
setInterval(() => { if (vista === 'orario' && !selOr) disegnaOrario() }, 60000)

orario = await prendi('/api/orario') ?? orario
collega()
await caricaLezioni()
// si apre sulla vista dell'ultima volta, o su quella dell'indirizzo: /#galleria, /#orario, /#galleria/2026-11-04
let prima = 'regia'
try { prima = localStorage.getItem('lezioni-vista') || 'regia' } catch {}
const [daVista, daLezione] = decodeURIComponent(location.hash.slice(1)).split('/')
vai(NOMI_VISTE[daVista] ? daVista : NOMI_VISTE[prima] ? prima : 'regia')
if (daVista === 'galleria' && daLezione) apri(daLezione)
