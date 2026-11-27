// poeta.js — «Poeta»: un motto per il muro, generato sul dispositivo.
//
// Due strade, la stessa faccia:
//   1. la Prompt API di Chrome (LanguageModel), se il modello locale è già
//      pronto: il motto lo scrive l'IA del browser, senza rete;
//   2. una catena di Markov a due parole costruita con le frasi qui sotto:
//      funziona ovunque, non scarica niente, non chiama nessuno.
//
//   apri()  apre il poeta
//
// Agganci aggiunti il 27.11 (solo grafica, niente motore):
//   [data-data]           la data di oggi in fondo al poster;
//   [data-copia-etichetta] l'etichetta del tasto copia («copiato ✓» per un attimo);
//   [data-ia] sul <dialog> lo stato vero dell'IA locale: pronta | scaricare | markov.

import { creaDialogo, copia } from '../../shell.js'

const CORPUS = [
  'il muro non chiede permesso',
  'meglio un adesivo storto che una parete vuota',
  'le cose fatte per svago vengono meglio',
  'un programma piccolo che funziona batte un progetto enorme che non parte',
  'la notte è lunga e il codice è corto',
  'se non sai dove metterlo, mettilo sul muro',
  'ogni errore è una riga che impara',
  'il browser è la macchina più diffusa del mondo',
  'niente server, niente permessi, niente scuse',
  'un link può essere una busta',
  'la grafica viene dopo, prima viene l\'idea',
  'chi disegna il muro decide cosa resta',
  'le idee buone arrivano quando il pc è spento',
  'un gioco è un sistema di regole che si diverte',
  'la semplicità è la feature più difficile',
  'fai una cosa sola, ma falla girare',
  'il futuro è già nel browser, basta chiederglielo',
  'un esperimento riuscito è una domanda nuova',
  'non serve un cloud per dire quello che pensi',
  'il tasto più importante è quello che riprovi',
  'il muro ricorda tutto e non si lamenta',
  'un\'idea senza un tasto è solo un pensiero',
  'il codice buono si legge come una frase',
  'la luce del monitor è la luna dei curiosi',
  'le mani imparano prima della testa',
  'un file locale vale più di mille promesse',
  'la rete è grande, ma il disco è tuo',
  'il silenzio del browser è la musica più bella',
  'se funziona, non toccarlo; se non funziona, guarda meglio',
  'le cose nuove fanno paura solo la prima volta',
  'un prototipo oggi è meglio di un progetto perfetto domani',
  'la curiosità è un tasto che non si consuma',
  'il muro è la homepage del mondo',
  'chi scrive a mano sceglie ogni riga',
  'le scorciatoie si imparano sbagliando',
  'un piccolo esperimento può cambiare una giornata',
  'la noia è il carburante delle idee strane',
  'il bello dei side project è che nessuno li aspetta',
  'un errore spiegato è metà del lavoro',
  'il codice di notte ha un altro sapore',
  'la tastiera sa cose che la testa non dice',
  'il muro non giudica, il muro espone',
  'le idee migliori arrivano senza permesso',
  'un gioco senza regole è solo un mucchio di pixel',
  'la grafica giusta fa sembrare facile anche il difficile',
  'il web è un laboratorio senza pareti',
  'ogni scheda è una finestra, ogni finestra un\'idea',
  'il tempo speso a capire non è tempo perso',
  'la curiosità non ha un tasto di pausa',
  'il muro è vivo finché qualcuno lo guarda',
  'un progetto finito è una storia che puoi raccontare',
  'il primo tentativo è sempre il più coraggioso',
  'le cose semplici sono le più difficili da spiegare',
  'un tasto premuto è meglio di un piano perfetto',
]

const SISTEMA = 'Sei il poeta del muro di pzkko.it. Scrivi un motto breve, massimo 12 parole, in italiano, tutto minuscolo, senza hashtag, senza virgolette, spiritoso e concreto. Rispondi solo con il motto.'

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'poeta',
    titolo: 'Poeta',
    tech: 'IA locale · Markov',
    voce: 'Un motto per il muro, generato sul tuo dispositivo. Con l\'IA del browser, se c\'è; altrimenti con una catena di Markov costruita a mano.',
    larga: true,
    corpo: `
      <div class="lab-poeta">
        <div class="lab-poeta-scena">
          <div class="lab-pannello lab-poeta-quadro">
            <div class="lab-poeta-testa">
              <div class="lab-poeta-marchio">
                <span class="lab-poeta-num" aria-hidden="true">09</span>
                <span class="lab-poeta-timbro">motto del muro</span>
              </div>
              <span class="lab-badge lab-poeta-modello" data-modello>Markov locale</span>
            </div>
            <blockquote class="lab-motto" data-motto>…</blockquote>
            <div class="lab-poeta-fondo">
              <span class="lab-poeta-firma">pzkko · frontiera</span>
              <time class="lab-poeta-data" data-data></time>
            </div>
          </div>
          <div class="lab-poeta-comandi">
            <p class="lab-poeta-invito">un motto nuovo,<br>la stessa parete</p>
            <div class="lab-poeta-tasti">
              <button type="button" class="lab-tasto lab-tasto--pieno" data-genera data-focus>genera</button>
              <button type="button" class="lab-tasto lab-tasto--fantasma" data-copia><span data-copia-etichetta>copia</span></button>
            </div>
          </div>
        </div>
        <div class="lab-poeta-note">
          <div class="lab-pannello lab-poeta-come">
            <div class="lab-poeta-come__testa">
              <h3>come funziona</h3>
              <span class="lab-poeta-senza-rete" aria-hidden="true">senza rete</span>
            </div>
            <p class="lab-nota lab-poeta-spiega">Se Chrome ha l'<b>IA locale</b> già pronta, il motto lo scrive lei, sul tuo dispositivo. Altrimenti si usa una <b>catena di Markov</b> costruita con le frasi qui sotto: nessuna chiamata a un server, nessun modello da scaricare.</p>
            <div class="lab-poeta-ia">
              <span class="lab-poeta-ia__led" aria-hidden="true"></span>
              <div class="lab-poeta-ia__corpo">
                <span class="lab-poeta-ia__label">stato dell'IA locale</span>
                <p class="lab-poeta-ia__testo" data-ia-stato>controllo l'IA del browser…</p>
              </div>
            </div>
            <ul class="lab-poeta-scheda">
              <li><span>gira</span> <b>sul tuo dispositivo</b></li>
              <li><span>rete</span> <b>nessuna</b></li>
            </ul>
          </div>
          <div class="lab-pannello lab-poeta-quaderno">
            <span class="lab-poeta-strappo" aria-hidden="true"></span>
            <div class="lab-poeta-quaderno__testa">
              <h3>le frasi da cui impara</h3>
            </div>
            <ul class="lab-corpus" data-corpus></ul>
            <p class="lab-poeta-quaderno__piede">nessun modello scaricato · nessuna frase esce da qui</p>
            <span class="lab-poeta-conta" aria-hidden="true"></span>
          </div>
        </div>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const motto = q('[data-motto]')
  const bGenera = q('[data-genera]')
  const bCopia = q('[data-copia]')
  const copiaEtichetta = q('[data-copia-etichetta]')
  const badge = q('[data-modello]')
  const iaStato = q('[data-ia-stato]')
  const dataEl = q('[data-data]')
  const corpusEl = q('[data-corpus]')

  // la data del poster: quella di oggi, scritta a macchina in fondo al foglio
  try {
    const oggi = new Date()
    const due = (n) => String(n).padStart(2, '0')
    const iso = `${oggi.getFullYear()}-${due(oggi.getMonth() + 1)}-${due(oggi.getDate())}`
    dataEl.textContent = `${due(oggi.getDate())}.${due(oggi.getMonth() + 1)}.${oggi.getFullYear()}`
    dataEl.dateTime = iso
  } catch {
    dataEl.textContent = '—'
  }

  for (const frase of CORPUS) {
    const li = document.createElement('li')
    li.textContent = frase
    corpusEl.append(li)
  }

  const LM = globalThis.LanguageModel || globalThis.ai?.languageModel
  let iaPronta = false
  let fermo = false
  let ultimi = new Set()
  let copiaTimer = 0
  const catena = costruisciCatena(CORPUS)

  function generaMarkov() {
    for (let tentativo = 0; tentativo < 18; tentativo++) {
      const s = cammina(catena)
      const parole = s.split(/\s+/).length
      if (parole >= 4 && parole <= 16 && !ultimi.has(s)) {
        ultimi.add(s)
        if (ultimi.size > 24) ultimi = new Set([...ultimi].slice(-12))
        return s
      }
    }
    return CORPUS[Math.floor(Math.random() * CORPUS.length)]
  }

  async function generaIA() {
    if (!iaPronta || !LM?.create) throw new Error('IA non pronta')
    let sessione = null
    try {
      const base = { temperature: 0.9, topK: 40 }
      try {
        sessione = await LM.create({ ...base, initialPrompts: [{ role: 'system', content: SISTEMA }] })
      } catch {
        sessione = await LM.create({ ...base, systemPrompt: SISTEMA })
      }
      const risposta = await Promise.race([
        sessione.prompt('Scrivi un motto nuovo per il muro. Solo il motto, niente altro.'),
        new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 20000)),
      ])
      const pulito = String(risposta || '')
        .replace(/^["'«»\s]+|["'«»\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180)
      if (!pulito || pulito.length < 8) throw new Error('risposta vuota')
      return pulito.toLowerCase()
    } finally {
      try { sessione?.destroy?.() } catch {}
    }
  }

  async function genera() {
    if (fermo) return
    const avevaFocus = document.activeElement === bGenera
    bGenera.disabled = true
    d.nota('scrivo…', 'attesa')
    let testo = ''
    let usataIa = false
    if (iaPronta) {
      try {
        testo = await generaIA()
        usataIa = true
      } catch (e) {
        console.warn('Poeta: l\'IA non risponde, uso Markov', e)
        iaPronta = false
        badge.textContent = 'Markov locale'
        d.dlg.dataset.ia = 'markov'
        iaStato.textContent = 'l\'IA del browser non ha risposto: da adesso uso la catena di Markov.'
      }
    }
    if (!testo) testo = generaMarkov()
    if (fermo) return
    motto.textContent = testo
    adattaMotto()
    motto.classList.remove('is-nuovo')
    void motto.offsetWidth
    motto.classList.add('is-nuovo')
    d.nota(usataIa ? 'motto scritto dall\'IA del browser' : 'motto scritto dalla catena di Markov', 'ok')
    bGenera.disabled = false
    if (avevaFocus) bGenera.focus({ preventScroll: true })
  }

  // Il motto può essere lungo (l'IA arriva a 180 caratteri): se serve, cala il
  // corpo di un paio di punti alla volta, così la carta non lo lascia fuori.
  // Non tocca il testo: cambia solo la misura del blockquote.
  function adattaMotto() {
    if (!motto.isConnected) return
    motto.style.fontSize = ''
    const max = Math.min(360, Math.max(260, Math.round(innerHeight * .4)))
    let corpo = parseFloat(getComputedStyle(motto).fontSize) || 48
    let giri = 0
    while (motto.offsetHeight > max && corpo > 24 && giri < 40) {
      corpo -= 2
      motto.style.fontSize = `${corpo}px`
      giri += 1
    }
  }
  const osservatore = new MutationObserver(() => adattaMotto())
  osservatore.observe(motto, { childList: true, characterData: true, subtree: true })
  const suRidimensiona = () => adattaMotto()
  window.addEventListener('resize', suRidimensiona)
  document.fonts?.ready.then(() => adattaMotto()).catch(() => {})

  async function controllaIa() {
    if (!LM?.create) {
      d.dlg.dataset.ia = 'markov'
      iaStato.textContent = 'Questo browser non espone l\'IA locale: resta la catena di Markov, che funziona ovunque.'
      return
    }
    try {
      let disp
      if (typeof LM.availability === 'function') {
        disp = await LM.availability()
      } else if (typeof LM.capabilities === 'function') {
        const cap = await LM.capabilities()
        disp = cap?.available === 'readily' ? 'available'
          : cap?.available === 'after-download' ? 'downloadable'
          : 'unavailable'
      }
      if (disp === 'available' || disp === 'readily') {
        iaPronta = true
        d.dlg.dataset.ia = 'pronta'
        badge.textContent = 'IA del browser'
        iaStato.textContent = 'L\'IA locale è pronta: il prossimo motto lo scrive lei, senza rete.'
      } else if (disp === 'downloadable' || disp === 'downloading') {
        d.dlg.dataset.ia = 'scaricare'
        badge.textContent = 'IA da scaricare'
        iaStato.textContent = 'L\'IA locale c\'è ma il modello non è ancora pronto: per ora uso Markov. Se lo scarichi dalle impostazioni di Chrome, il Poeta lo usa da solo.'
      } else {
        d.dlg.dataset.ia = 'markov'
        iaStato.textContent = 'L\'IA locale non è disponibile: uso la catena di Markov.'
      }
    } catch {
      d.dlg.dataset.ia = 'markov'
      iaStato.textContent = 'Non riesco a chiedere all\'IA locale: uso la catena di Markov.'
    }
  }

  bGenera.addEventListener('click', genera)
  bCopia.addEventListener('click', async () => {
    const ok = await copia(motto.textContent || '')
    d.nota(ok ? 'motto copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
    if (ok) {
      copiaEtichetta.textContent = 'copiato ✓'
      bCopia.classList.add('is-fatto')
      clearTimeout(copiaTimer)
      copiaTimer = setTimeout(() => {
        if (!copiaEtichetta.isConnected) return
        copiaEtichetta.textContent = 'copia'
        bCopia.classList.remove('is-fatto')
      }, 1500)
    }
    // la copia di riserva crea una textarea per copiare: il focus torna al tasto
    if (document.activeElement !== bCopia) bCopia.focus({ preventScroll: true })
  })

  d.suPulizia(() => {
    fermo = true
    clearTimeout(copiaTimer)
    osservatore.disconnect()
    window.removeEventListener('resize', suRidimensiona)
  })

  d.apri()
  motto.textContent = generaMarkov()
  adattaMotto()
  d.nota('pronto · genera un motto', 'ok')
  controllaIa()
  return d
}

// ── la catena di Markov ─────────────────────────────────────────────────────

function costruisciCatena(frasi) {
  const mappa = new Map()
  for (const frase of frasi) {
    const parole = frase
      .toLowerCase()
      .replace(/[.,;:!?«»"]/g, '')
      .split(/\s+/)
      .filter(Boolean)
    const gettoni = ['<s>', '<s>', ...parole, '</s>']
    for (let i = 2; i < gettoni.length; i++) {
      const chiave = `${gettoni[i - 2]} ${gettoni[i - 1]}`
      if (!mappa.has(chiave)) mappa.set(chiave, [])
      mappa.get(chiave).push(gettoni[i])
    }
  }
  return mappa
}

function cammina(mappa) {
  let a = '<s>'
  let b = '<s>'
  const uscite = []
  for (let i = 0; i < 30; i++) {
    const prossime = mappa.get(`${a} ${b}`)
    if (!prossime || !prossime.length) break
    const w = prossime[Math.floor(Math.random() * prossime.length)]
    if (w === '</s>') break
    uscite.push(w)
    a = b
    b = w
  }
  if (uscite.length < 4) return CORPUS[Math.floor(Math.random() * CORPUS.length)]
  let frase = uscite.join(' ')
  if (!/[.!?]$/.test(frase)) frase += '.'
  return frase.charAt(0).toUpperCase() + frase.slice(1)
}
