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
      <div class="bu-scena">
        <div class="lab-schede bu-falde" role="tablist" aria-label="scrivi o apri">
          <button type="button" class="lab-tab is-on" role="tab" id="bu-t-scrivi" aria-controls="bu-p-scrivi" aria-selected="true" data-scheda="scrivi">Scrivi</button>
          <button type="button" class="lab-tab" role="tab" id="bu-t-apri" aria-controls="bu-p-apri" aria-selected="false" data-scheda="apri">Apri</button>
        </div>

        <div class="bu-busta">
          <section id="bu-p-scrivi" class="bu-pannello" role="tabpanel" aria-labelledby="bu-t-scrivi" data-pannello="scrivi">
            <div class="bu-lettera bu-lettera--scrivi">
              <p class="bu-lettera__occhiello"><span>lettera</span><span>da sigillare</span></p>
              <div class="bu-lettera__griglia">
                <div class="bu-scrivi">
                  <label class="lab-etichetta" for="bu-messaggio">il messaggio</label>
                  <textarea id="bu-messaggio" class="lab-area bu-area" maxlength="${MAX}" data-messaggio data-focus placeholder="Scrivi qui quello che vuoi sigillare…"></textarea>
                  <p class="lab-nota bu-contatore" data-contatore>0 / ${MAX}</p>
                </div>
                <aside class="bu-margine">
                  <label class="lab-etichetta" for="bu-password">password <span class="lab-badge">facoltativa</span></label>
                  <input id="bu-password" class="lab-campo bu-password" type="password" autocomplete="new-password" data-password placeholder="senza password">
                  <label class="bu-comprimi">
                    <input type="checkbox" data-comprimi checked>
                    <span>comprimi se conviene <em>(gzip)</em></span>
                  </label>
                  <p class="bu-matita">con la password, il link da solo non basta: mandala a parte.</p>
                  <p class="bu-ps">p.s. il link esce qui sotto, pronto da copiare.</p>
                  <button type="button" class="bu-sigillo" data-sigilla aria-label="sigilla il messaggio">
                    <span class="bu-sigillo__testo">sigilla</span>
                    <span class="bu-sigillo__monogramma" aria-hidden="true">pzk</span>
                  </button>
                </aside>
              </div>
            </div>

            <div class="bu-uscita" data-uscita hidden>
              <div class="bu-uscita__riga">
                <span class="bu-uscita__titolo">il link sigillato</span>
                <span class="bu-lunghezza" data-lunghezza></span>
              </div>
              <div class="lab-copia bu-copia-link">
                <input class="lab-campo bu-link" readonly data-link aria-label="il link della busta">
                <button type="button" class="lab-tasto lab-tasto--piccolo bu-copia" data-copia-link>copia</button>
                <a class="bu-apri-ora" data-apri-link target="_blank" rel="noopener">apri ora →</a>
              </div>
            </div>
          </section>

          <section id="bu-p-apri" class="bu-pannello" role="tabpanel" aria-labelledby="bu-t-apri" data-pannello="apri" hidden>
            <div class="bu-tagliando">
              <p class="bu-tagliando__testa"><span>tagliando d'apertura</span><span aria-hidden="true">· · · · · · ·</span></p>
              <div class="bu-tagliando__campi">
                <div class="bu-tagliando__link">
                  <label class="lab-etichetta" for="bu-link">il link della busta</label>
                  <input id="bu-link" class="lab-campo" type="url" data-link-in placeholder="https://pzkko.it/frontiera/#b1.…">
                </div>
                <div>
                  <label class="lab-etichetta" for="bu-password-in">password <span class="lab-badge">se serve</span></label>
                  <input id="bu-password-in" class="lab-campo" type="password" autocomplete="current-password" data-password-in placeholder="solo se c'è">
                </div>
                <button type="button" class="lab-tasto lab-tasto--pieno bu-apri-busta" data-apri-busta>apri la busta</button>
              </div>
              <p class="bu-avviso" data-avviso-busta role="status" aria-live="polite"></p>
            </div>

            <div class="bu-vuota" data-vuota>
              <span class="bu-vuota__ceralacca" aria-hidden="true">pzk</span>
              <p>la lettera compare qui, appena la busta si apre.</p>
            </div>

            <div class="bu-lettera bu-lettera--letta" data-letto-box hidden>
              <div class="bu-lettera__testa">
                <p class="bu-lettera__occhiello"><span>lettera aperta</span><span>sola lettura</span></p>
                <span class="bu-lettera__sigillo" aria-hidden="true">pzk</span>
              </div>
              <pre class="lab-messaggio bu-letto" data-letto></pre>
              <div class="bu-lettera__piede">
                <button type="button" class="bu-copia-messaggio" data-copia-letto>copia il messaggio</button>
              </div>
            </div>
          </section>

          <aside class="bu-indirizzo" aria-label="come funziona e privacy">
            <div class="bu-affrancatura">
              <div class="bu-francobollo" aria-hidden="true">
                <span class="bu-francobollo__p">pzk</span>
                <span class="bu-francobollo__riga">posta cifrata</span>
                <span class="bu-francobollo__num">04</span>
              </div>
              <svg class="bu-timbro" viewBox="0 0 132 132" aria-hidden="true" focusable="false">
                <defs><path id="bu-cerchio-timbro" d="M66 66 m -46 0 a 46 46 0 1 1 92 0 a 46 46 0 1 1 -92 0"/></defs>
                <circle cx="66" cy="66" r="57"/>
                <circle cx="66" cy="66" r="38"/>
                <text><textPath href="#bu-cerchio-timbro" startOffset="2%">pzkko · frontiera · posta cifrata ·</textPath></text>
                <text class="bu-timbro__centro" x="66" y="64" text-anchor="middle">AES</text>
                <text class="bu-timbro__sotto" x="66" y="82" text-anchor="middle">GCM 256</text>
              </svg>
            </div>
            <div class="bu-nota">
              <h3>come funziona</h3>
              <ol>
                <li><b>scrivi</b> la lettera e premi il sigillo: diventa un link.</li>
                <li>senza password la chiave sta <b>dopo il cancelletto</b>: non arriva mai al server.</li>
                <li>con la password la chiave si ricava qui, sul posto (PBKDF2, 210 000 giri).</li>
              </ol>
            </div>
            <div class="bu-indirizzo-righe" aria-hidden="true">
              <p><span>a</span>chi trova il link</p>
              <p><span>da</span>pzkko · frontiera</p>
              <p><span>oggetto</span>una lettera cifrata</p>
            </div>
            <p class="bu-privacy"><b>privacy</b> la password non viaggia nel link. il messaggio resta nella cronologia del browser: non usarlo per segreti importanti.</p>
            <div class="bu-spago" aria-hidden="true">
              <svg viewBox="0 0 240 56" preserveAspectRatio="none" focusable="false"><path d="M14 38 C 62 8, 178 8, 226 38"/><path d="M18 46 C 66 18, 174 18, 222 46"/></svg>
              <i></i><i></i>
            </div>
          </aside>
        </div>
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
  const vuota = q('[data-vuota]')
  let timerCopia = 0

  function scheda(nome) {
    for (const b of d.corpo.querySelectorAll('[data-scheda]')) {
      const on = b.dataset.scheda === nome
      b.classList.toggle('is-on', on)
      b.setAttribute('aria-selected', String(on))
      b.tabIndex = on ? 0 : -1
    }
    for (const p of d.corpo.querySelectorAll('[data-pannello]')) p.hidden = p.dataset.pannello !== nome
    // il primo campo della scheda aperta è quello che prende il focus all'apertura
    passwordIn.removeAttribute('data-focus')
    messaggio.toggleAttribute('data-focus', nome === 'scrivi')
    linkIn.toggleAttribute('data-focus', nome === 'apri')
  }

  // «copiato ✓» per un attimo, poi torna «copia»
  function confermaCopia(bottone) {
    if (!bottone) return
    if (!bottone.dataset.etichetta) bottone.dataset.etichetta = bottone.textContent
    bottone.textContent = 'copiato ✓'
    bottone.classList.add('is-fatto')
    clearTimeout(timerCopia)
    timerCopia = setTimeout(() => {
      bottone.textContent = bottone.dataset.etichetta
      bottone.classList.remove('is-fatto')
    }, 1600)
  }

  d.corpo.addEventListener('click', (e) => {
    const s = e.target.closest('[data-scheda]')
    if (s) {
      scheda(s.dataset.scheda)
      s.focus({ preventScroll: true })
      return
    }
    const copiaLink = e.target.closest('[data-copia-link]')
    if (copiaLink) {
      copia(linkOut.value).then((ok) => {
        d.nota(ok ? 'link copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
        if (ok) confermaCopia(copiaLink)
      })
      return
    }
    const copiaLetto = e.target.closest('[data-copia-letto]')
    if (copiaLetto) {
      copia(letto.textContent || '').then((ok) => {
        d.nota(ok ? 'messaggio copiato' : 'non riesco a copiare', ok ? 'ok' : 'male')
        if (ok) confermaCopia(copiaLetto)
      })
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
    bottoneSigilla.classList.add('is-premuto')
    setTimeout(() => bottoneSigilla.classList.remove('is-premuto'), 460)
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
      uscita.scrollIntoView({
        block: 'nearest',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
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
      d.nota('manca il link della busta', 'attesa')
      return
    }
    const hash = testo.includes('#') ? testo.slice(testo.indexOf('#') + 1) : testo.replace(/^#/, '')
    let p
    try {
      p = analizza(hash)
    } catch (e) {
      if (!auto) avviso.textContent = e.message
      d.nota(e.message, 'male')
      return
    }
    if (p.modo === 'p' && !passwordIn.value) {
      avviso.textContent = 'questa busta ha una password: scrivila e riprova.'
      d.nota('serve la password', 'attesa')
      passwordIn.focus()
      return
    }
    bottoneApri.disabled = true
    avviso.textContent = 'apro…'
    d.nota('apro la busta…', 'attesa')
    lettoBox.hidden = true
    vuota.hidden = false
    try {
      const testoLetto = await leggiBusta(hash, passwordIn.value)
      letto.textContent = testoLetto
      lettoBox.hidden = false
      vuota.hidden = true
      avviso.textContent = ''
      d.nota('busta aperta', 'ok')
    } catch (e) {
      // una password sbagliata o un link rovinato sono stati previsti: non sono errori di programma
      const msg = e?.name === 'OperationError' ? 'password sbagliata o busta rovinata' : (e?.message || String(e))
      avviso.textContent = msg
      d.nota('non riesco ad aprire la busta', 'male')
      if (e?.name === 'OperationError' && p.modo === 'p') passwordIn.focus({ preventScroll: true })
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
        avviso.textContent = 'questa busta ha una password: scrivila e premi «apri la busta».'
        d.nota('serve la password', 'attesa')
      }
    } catch (e) {
      avviso.textContent = e.message
      d.nota(e.message, 'male')
    }
  } else {
    scheda('scrivi')
    d.nota('pronta · sigilla o apri')
  }

  d.suPulizia(() => {
    // niente da fermare: la crittografia è tutta qui, un colpo e via
    clearTimeout(timerCopia)
  })

  // se la busta vuole la password, il primo campo da riempire è quello
  if (auto?.modo === 'p') {
    linkIn.removeAttribute('data-focus')
    passwordIn.setAttribute('data-focus', '')
  }
  d.apri()
  if (auto?.modo === 'k') apriBusta(true)
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
