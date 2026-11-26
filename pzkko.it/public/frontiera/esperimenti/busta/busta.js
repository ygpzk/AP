// busta.js — «Busta»: un messaggio cifrato dentro un link.
//
// Tecnologia: Web Crypto (AES-GCM a 256 bit). Se c'è una password, la chiave
// si ricava con PBKDF2 (210 000 giri, SHA-256) e il link da solo non basta.
// Senza password, la chiave viaggia nel frammento del link: il frammento non
// viene mandato al server, quindi il messaggio non passa da nessuna parte.
//
// Il formato è: #b1.<modo>.<compresso>.<iv>.<sale>.<chiave>.<cifrato>
//   modo      k = chiave nel link, p = password
//   compresso c = gzip, - = no
//
//   apri()  apre la busta

import { creaDialogo, copia } from '../../shell.js'

const MAX = 8000
const ITERAZIONI = 210000

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'busta',
    titolo: 'Busta',
    tech: 'Web Crypto · AES-GCM',
    voce: 'Un messaggio cifrato dentro un link. La chiave viaggia nel link, non passa da nessun server. Con una password, il link da solo non basta.',
    corpo: `
      <div class="lab-colonna">
        <div class="lab-schede" role="tablist" aria-label="scrivi o apri">
          <button type="button" class="lab-tab is-on" role="tab" id="bu-t-scrivi" aria-controls="bu-p-scrivi" aria-selected="true" data-scheda="scrivi">Scrivi</button>
          <button type="button" class="lab-tab" role="tab" id="bu-t-apri" aria-controls="bu-p-apri" aria-selected="false" data-scheda="apri">Apri</button>
        </div>

        <section id="bu-p-scrivi" role="tabpanel" aria-labelledby="bu-t-scrivi" data-pannello="scrivi">
          <div class="lab-griglia-2">
            <div class="lab-pannello">
              <label class="lab-etichetta" for="bu-messaggio">il messaggio</label>
              <textarea id="bu-messaggio" class="lab-area" maxlength="${MAX}" data-messaggio placeholder="Scrivi qui quello che vuoi sigillare…"></textarea>
              <p class="lab-nota" data-contatore>0 / ${MAX}</p>
            </div>
            <div class="lab-pannello">
              <label class="lab-etichetta" for="bu-password">password <span class="lab-badge">facoltativa</span></label>
              <input id="bu-password" class="lab-campo" type="password" autocomplete="new-password" data-password placeholder="senza password, la chiave sta nel link">
              <label class="lab-riga lab-nota" style="margin-top:12px;cursor:pointer">
                <input type="checkbox" data-comprimi checked> comprimi se conviene (gzip)
              </label>
              <div class="lab-divisore"></div>
              <button type="button" class="lab-tasto lab-tasto--pieno" data-sigilla>Sigilla</button>
              <p class="lab-nota" style="margin-top:10px">La password non finisce nel link: se la metti, mandala a parte. Il messaggio resta nella cronologia del browser: non usarlo per segreti importanti.</p>
            </div>
          </div>
          <div class="lab-pannello" data-uscita hidden style="margin-top:12px">
            <h3>Il link sigillato</h3>
            <div class="lab-copia">
              <input class="lab-campo" readonly data-link aria-label="il link della busta">
              <button type="button" class="lab-tasto lab-tasto--piccolo" data-copia-link>copia</button>
            </div>
            <div class="lab-riga lab-riga--tra" style="margin-top:10px">
              <span class="lab-nota" data-lunghezza></span>
              <a class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-apri-link target="_blank" rel="noopener">apri ora</a>
            </div>
          </div>
        </section>

        <section id="bu-p-apri" role="tabpanel" aria-labelledby="bu-t-apri" data-pannello="apri" hidden>
          <div class="lab-griglia-2">
            <div class="lab-pannello">
              <label class="lab-etichetta" for="bu-link">il link della busta</label>
              <input id="bu-link" class="lab-campo" type="url" data-link-in placeholder="https://pzkko.it/frontiera/#b1.…">
              <label class="lab-etichetta" for="bu-password-in" style="margin-top:12px">password <span class="lab-badge">se serve</span></label>
              <input id="bu-password-in" class="lab-campo" type="password" autocomplete="current-password" data-password-in placeholder="solo se chi ha scritto l'ha messa">
              <div class="lab-divisore"></div>
              <button type="button" class="lab-tasto lab-tasto--pieno" data-apri-busta>Apri la busta</button>
              <p class="lab-nota" style="margin-top:10px" data-avviso-busta role="status" aria-live="polite"></p>
            </div>
            <div class="lab-pannello" data-letto-box hidden>
              <h3>Il messaggio</h3>
              <pre class="lab-messaggio" data-letto></pre>
              <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-copia-letto style="margin-top:10px">copia il messaggio</button>
            </div>
          </div>
        </section>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const messaggio = q('[data-messaggio]')
  const password = q('[data-password]')
  const comprimi = q('[data-comprimi]')
  const bottoneSigilla = q('[data-sigilla]')
  const uscita = q('[data-uscita]')
  const linkOut = q('[data-link]')
  const lunghezza = q('[data-lunghezza]')
  const apriLink = q('[data-apri-link]')
  const contatore = q('[data-contatore]')
  const linkIn = q('[data-link-in]')
  const passwordIn = q('[data-password-in]')
  const bottoneApri = q('[data-apri-busta]')
  const avviso = q('[data-avviso-busta]')
  const lettoBox = q('[data-letto-box]')
  const letto = q('[data-letto]')

  function scheda(nome) {
    for (const b of d.corpo.querySelectorAll('[data-scheda]')) {
      const on = b.dataset.scheda === nome
      b.classList.toggle('is-on', on)
      b.setAttribute('aria-selected', String(on))
      b.tabIndex = on ? 0 : -1
    }
    for (const p of d.corpo.querySelectorAll('[data-pannello]')) p.hidden = p.dataset.pannello !== nome
    if (nome === 'apri') setTimeout(() => linkIn.focus({ preventScroll: true }), 0)
  }

  d.corpo.addEventListener('click', (e) => {
    const s = e.target.closest('[data-scheda]')
    if (s) {
      scheda(s.dataset.scheda)
      return
    }
    if (e.target.closest('[data-copia-link]')) {
      copia(linkOut.value).then((ok) => d.nota(ok ? 'link copiato' : 'non riesco a copiare', ok ? 'ok' : 'male'))
      return
    }
    if (e.target.closest('[data-copia-letto]')) {
      copia(letto.textContent || '').then((ok) => d.nota(ok ? 'messaggio copiato' : 'non riesco a copiare', ok ? 'ok' : 'male'))
    }
  })

  d.corpo.addEventListener('keydown', (e) => {
    if (!e.target.closest('[data-scheda]')) return
    const schede = [...d.corpo.querySelectorAll('[data-scheda]')]
    const i = schede.indexOf(e.target)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const n = schede[(i + (e.key === 'ArrowRight' ? 1 : -1) + schede.length) % schede.length]
      scheda(n.dataset.scheda)
      n.focus()
    }
  })

  messaggio.addEventListener('input', () => {
    contatore.textContent = `${messaggio.value.length} / ${MAX}`
    contatore.classList.toggle('lab-nota--male', messaggio.value.length > MAX * 0.9)
  })

  async function creaBusta(testo, pass, vuoleComprimere) {
    const enc = new TextEncoder()
    const originale = enc.encode(testo)
    let dati = originale
    let compresso = false
    if (vuoleComprimere && 'CompressionStream' in window) {
      try {
        const c = await comprimiBytes(originale)
        if (c && c.length + 18 < originale.length) {
          dati = c
          compresso = true
        }
      } catch {}
    }
    const iv = crypto.getRandomValues(new Uint8Array(12))
    let modo = 'k'
    let sale = new Uint8Array(0)
    let chiaveTesto = ''
    let chiave
    if (pass) {
      modo = 'p'
      sale = crypto.getRandomValues(new Uint8Array(16))
      chiave = await chiaveDaPassword(pass, sale)
    } else {
      const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
      chiave = k
      chiaveTesto = b64u(new Uint8Array(await crypto.subtle.exportKey('raw', k)))
    }
    const cifrato = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chiave, dati))
    return `b1.${modo}.${compresso ? 'c' : '-'}.${b64u(iv)}.${b64u(sale)}.${chiaveTesto}.${b64u(cifrato)}`
  }

  async function leggiBusta(hash, pass) {
    const p = analizza(hash)
    const iv = daB64u(p.iv)
    const cifrato = daB64u(p.ct)
    let chiave
    if (p.modo === 'k') {
      chiave = await crypto.subtle.importKey('raw', daB64u(p.chiave), 'AES-GCM', false, ['decrypt'])
    } else {
      if (!pass) throw new Error('serve la password')
      chiave = await chiaveDaPassword(pass, daB64u(p.sale))
    }
    let dati = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, chiave, cifrato))
    if (p.compresso) {
      if (!('DecompressionStream' in window)) throw new Error('questo browser non sa decomprimere il messaggio')
      dati = await decomprimiBytes(dati)
    }
    return dec.decode(dati)
  }

  function analizza(hash) {
    const h = String(hash || '').replace(/^#/, '').trim()
    if (!h.startsWith('b1.')) throw new Error('non è una busta di pzkko')
    const p = h.split('.')
    if (p.length !== 7 || p[0] !== 'b1') throw new Error('la busta è rovinata')
    const [, modo, flag, iv, sale, chiave, ct] = p
    if (modo !== 'k' && modo !== 'p') throw new Error('la busta ha un modo sconosciuto')
    if (flag !== 'c' && flag !== '-') throw new Error('la busta ha un formato sconosciuto')
    if (!iv || !ct) throw new Error('la busta è incompleta')
    if (modo === 'k' && !chiave) throw new Error('manca la chiave')
    if (modo === 'p' && !sale) throw new Error('manca il sale della password')
    return { modo, compresso: flag === 'c', iv, sale, chiave, ct }
  }

  async function sigilla() {
    const testo = messaggio.value
    if (!testo.trim()) return d.nota('scrivi qualcosa prima di sigillare', 'male')
    if (testo.length > MAX) return d.nota(`il messaggio è troppo lungo (max ${MAX})`, 'male')
    const pass = password.value
    if (pass && pass.length < 4) return d.nota('la password è troppo corta (almeno 4 caratteri)', 'male')
    if (!crypto.subtle) return d.nota('questo browser non ha Web Crypto: serve HTTPS', 'male')
    bottoneSigilla.disabled = true
    d.nota('sigillo…', 'attesa')
    try {
      const payload = await creaBusta(testo, pass, comprimi.checked)
      const link = `${location.origin}${location.pathname}#${payload}`
      linkOut.value = link
      apriLink.href = link
      uscita.hidden = false
      lunghezza.textContent = `${link.length.toLocaleString('it-IT')} caratteri · ${pass ? 'con password' : 'la chiave è nel link'}`
      d.nota('pronta · copia il link e mandalo', 'ok')
      if (link.length < 30000) {
        try { history.replaceState(null, '', `#${payload}`) } catch {}
      } else {
        d.nota('link molto lungo: alcuni programmi potrebbero troncarlo', 'attesa')
      }
      uscita.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    } catch (e) {
      console.error(e)
      d.nota(`non riesco a sigillare: ${e?.message || e}`, 'male')
    } finally {
      bottoneSigilla.disabled = false
    }
  }

  async function apriBusta(auto = false) {
    const testo = linkIn.value.trim()
    if (!testo) {
      if (!auto) avviso.textContent = 'incolla un link o apri una busta dal suo indirizzo.'
      return
    }
    const hash = testo.includes('#') ? testo.slice(testo.indexOf('#') + 1) : testo.replace(/^#/, '')
    let p
    try {
      p = analizza(hash)
    } catch (e) {
      if (!auto) avviso.textContent = e.message
      return
    }
    if (p.modo === 'p' && !passwordIn.value) {
      avviso.textContent = 'questa busta ha una password: scrivila e riprova.'
      passwordIn.focus()
      return
    }
    bottoneApri.disabled = true
    avviso.textContent = 'apro…'
    d.nota('apro la busta…', 'attesa')
    try {
      const testoLetto = await leggiBusta(hash, passwordIn.value)
      letto.textContent = testoLetto
      lettoBox.hidden = false
      avviso.textContent = ''
      d.nota('busta aperta', 'ok')
    } catch (e) {
      console.error(e)
      const msg = e?.name === 'OperationError' ? 'password sbagliata o busta rovinata' : (e?.message || String(e))
      avviso.textContent = msg
      d.nota('non riesco ad aprire la busta', 'male')
    } finally {
      bottoneApri.disabled = false
    }
  }

  bottoneSigilla.addEventListener('click', sigilla)
  bottoneApri.addEventListener('click', () => apriBusta(false))
  linkIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') apriBusta(false) })
  passwordIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') apriBusta(false) })

  // se la pagina è stata aperta con una busta nel frammento, vado diretto
  const hashIniziale = location.hash.slice(1)
  let auto = null
  if (hashIniziale.startsWith('b1.')) {
    linkIn.value = `${location.origin}${location.pathname}#${hashIniziale}`
    scheda('apri')
    try {
      auto = analizza(hashIniziale)
      if (auto.modo === 'p') {
        avviso.textContent = 'questa busta ha una password: scrivila e premi «Apri la busta».'
      }
    } catch (e) {
      avviso.textContent = e.message
    }
  } else {
    scheda('scrivi')
  }

  d.suPulizia(() => {
    // niente da fermare: la crittografia è tutta qui, un colpo e via
  })

  d.apri()
  if (auto?.modo === 'k') apriBusta(true)
  else if (auto?.modo === 'p') setTimeout(() => passwordIn.focus({ preventScroll: true }), 30)
  return d
}

// ── i pezzi di crittografia ─────────────────────────────────────────────────

const enc = new TextEncoder()
const dec = new TextDecoder()

async function chiaveDaPassword(password, sale) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sale, iterations: ITERAZIONI, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function comprimiBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function decomprimiBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function b64u(bytes) {
  let s = ''
  const pezzo = 0x8000
  for (let i = 0; i < bytes.length; i += pezzo) {
    s += String.fromCharCode(...bytes.subarray(i, i + pezzo))
  }
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function daB64u(testo) {
  let s = String(testo).replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
