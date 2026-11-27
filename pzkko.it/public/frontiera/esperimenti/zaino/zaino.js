// zaino.js — «Zaino»: file che restano nel browser, su questo dispositivo.
//
// Tecnologia: Origin Private File System (OPFS), la cartella privata che il
// browser dà a ogni sito. I file non vengono caricati da nessuna parte: si
// scrivono nel disco del dispositivo, dentro lo spazio del sito, e si possono
// scaricare o togliere. La quota la decide il browser; `persist()` chiede che
// non venga cancellata per fare spazio.
//
//   apri()  apre lo zaino

import { creaDialogo, scarica, byte, quando } from '../../shell.js'

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'zaino',
    titolo: 'Zaino',
    tech: 'OPFS · file system',
    voce: 'Trascina dei file: restano nel browser, su questo dispositivo. Niente cloud, niente upload, niente account.',
    larga: true,
    corpo: `
      <div class="zn-scena">
        <div class="lab-zaino-drop" data-drop data-focus tabindex="0" role="button"
             aria-label="trascina qui i file, oppure premi invio per sceglierli dal disco">
          <span class="zn-scatola" aria-hidden="true">
            <i class="zn-gola"></i>
            <i class="zn-flap zn-flap--sx"></i>
            <i class="zn-flap zn-flap--dx"></i>
            <i class="zn-fronte"></i>
            <b class="zn-bollo" aria-hidden="true">pzkko</b>
            <b class="zn-barcode" aria-hidden="true"></b>
            <svg class="zn-freccia" viewBox="0 0 64 78" focusable="false">
              <path d="M32 6c-6 17 6 27 0 44"/>
              <path d="M17 40l15 18 15-18"/>
            </svg>
            <span class="zn-etichetta">
              <b>trascina qui i file</b>
              <span>oppure <u>scegli dal disco</u> · restano in questo browser</span>
            </span>
          </span>
          <input type="file" multiple data-file hidden>
        </div>

        <div class="zn-comandi">
          <div class="zn-comandi__tasti">
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-scegli>scegli file</button>
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-aggiorna>aggiorna</button>
            <button type="button" class="lab-tasto lab-tasto--pericolo lab-tasto--piccolo" data-svuota>svuota</button>
          </div>
          <button type="button" class="zn-sigillo" data-persisti>proteggi i dati</button>
        </div>

        <section class="lab-pannello zn-inventario" aria-labelledby="zn-titolo">
          <div class="zn-inventario__testa">
            <h3 id="zn-titolo">Nello zaino</h3>
            <span class="zn-conteggio" data-conteggio>vuoto</span>
          </div>
          <div class="zn-quota">
            <div class="zn-quota__riga">
              <span data-quota>calcolo lo spazio…</span>
              <b data-quota-pct>—</b>
            </div>
            <div class="lab-barra" data-quota-track role="progressbar" aria-label="spazio usato nello zaino"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-quota-barra></i></div>
            <span class="zn-protetto" data-protetto hidden>✓ dati protetti</span>
          </div>
          <ul class="lab-lista lab-zaino-lista" data-lista></ul>
          <div class="lab-vuoto zn-vuoto" data-vuoto hidden>
            <svg class="zn-vuoto-arte" viewBox="0 0 180 130" aria-hidden="true" focusable="false">
              <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M47 58 95 41l47 17-47 17z"/>
                <path d="M47 58v38l48 17V75"/>
                <path d="M142 58v38l-47 17"/>
                <path d="M47 58 36 45l43-16 16 12"/>
                <path d="M142 58l11-13-42-16-16 12"/>
                <path d="M62 66l33 12 33-12" stroke-dasharray="3 5" opacity=".55"/>
                <path d="M70 8c-10 10-8 18 2 26" stroke-dasharray="4 6" opacity=".65"/>
                <path d="M64 28l8 8 8-9" opacity=".65"/>
              </g>
            </svg>
            <span class="zn-vuoto-zero" aria-hidden="true">0</span>
            <span data-vuoto-testo>lo zaino è vuoto: trascina qualcosa nella scatola.</span>
          </div>
          <div class="zn-timbro-pannello" aria-hidden="true">sul disco<span>non nel cloud</span></div>
          <div class="zn-promesse" data-promesse hidden aria-hidden="true">
            <span>niente cloud</span>
            <span>niente upload</span>
            <span>niente account</span>
          </div>
          <div class="zn-inventario__fondo" aria-hidden="true"><span>cartella privata · OPFS</span></div>
        </section>

        <p class="zn-dove">
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4.5" y="7" width="23" height="18" rx="2"/>
              <path d="M8.5 20.5h15"/>
              <circle cx="23" cy="12" r="1.4"/>
              <path d="M10 12h7"/>
            </g>
          </svg>
          <span><b>Dove finiscono:</b> nella cartella privata del sito (OPFS), sul disco di questo dispositivo. Il browser può cancellarli se lo spazio finisce: «proteggi i dati» chiede di tenerli. Se svuoti i dati del sito, spariscono.</span>
        </p>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const drop = q('[data-drop]')
  const fileInput = q('[data-file]')
  const lista = q('[data-lista]')
  const vuoto = q('[data-vuoto]')
  const vuotoTesto = q('[data-vuoto-testo]')
  const quota = q('[data-quota]')
  const quotaPct = q('[data-quota-pct]')
  const quotaTrack = q('[data-quota-track]')
  const quotaBarra = q('[data-quota-barra]')
  const conteggio = q('[data-conteggio]')
  const promesse = q('[data-promesse]')
  const protetto = q('[data-protetto]')
  const bSvuota = q('[data-svuota]')

  const supporto = !!(navigator.storage?.getDirectory)
  let radice = null
  let occupato = false
  let confermaSvuota = 0
  let fermo = false

  function stato(testo, tipo = '') {
    d.nota(testo, tipo)
  }

  function segnaProtetto(ok) {
    if (protetto) protetto.hidden = !ok
    if (ok) d.dlg.dataset.protetto = 'si'
    else delete d.dlg.dataset.protetto
  }

  function motivo(e) {
    if (e?.name === 'QuotaExceededError') return 'spazio non disponibile'
    return e?.message || String(e)
  }

  async function apriRadice() {
    if (!supporto) throw new Error('questo browser non ha OPFS')
    if (!radice) radice = await navigator.storage.getDirectory()
    return radice
  }

  function nomeSicuro(nome) {
    const pulito = String(nome || '')
      .normalize('NFC')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
      .replace(/^\.+/, '')
      .trim()
      .slice(0, 120)
    return pulito || 'file'
  }

  function conNumero(nome, n) {
    const i = nome.lastIndexOf('.')
    if (i <= 0) return `${nome} (${n})`
    return `${nome.slice(0, i)} (${n})${nome.slice(i)}`
  }

  async function nomiEsistenti() {
    const r = await apriRadice()
    const nomi = new Set()
    for await (const [nome, h] of r.entries()) {
      if (h.kind === 'file') nomi.add(nome)
    }
    return nomi
  }

  async function salvaUno(file, nomi) {
    const r = await apriRadice()
    let nome = nomeSicuro(file.name)
    let n = 2
    while (nomi.has(nome)) {
      nome = conNumero(nomeSicuro(file.name), n)
      n++
    }
    nomi.add(nome)
    const fh = await r.getFileHandle(nome, { create: true })
    const w = await fh.createWritable()
    try {
      if (file.size > 2_000_000 && file.stream) {
        const lettore = file.stream().getReader()
        let fatto = 0
        for (;;) {
          const { done, value } = await lettore.read()
          if (done) break
          await w.write(value)
          fatto += value.byteLength || 0
          const pct = Math.min(100, Math.round((fatto / Math.max(1, file.size)) * 100))
          stato(`salvo ${nome} · ${pct}%`, 'attesa')
        }
      } else {
        await w.write(file)
      }
      await w.close()
    } catch (e) {
      try { await w.abort?.() } catch {}
      throw e
    }
    return nome
  }

  async function salvaTutti(files) {
    if (!files.length || occupato) return
    occupato = true
    let ok = 0
    const errori = []
    try {
      const nomi = await nomiEsistenti()
      for (const f of files) {
        try {
          await salvaUno(f, nomi)
          ok++
        } catch (e) {
          console.error(e)
          errori.push(`${f.name}: ${motivo(e)}`)
        }
      }
      await render()
      if (errori.length) stato(`salvati ${ok}, non riesco con ${errori.length}: ${errori[0]}`, 'male')
      else stato(`salvati ${ok} file`, 'ok')
    } catch (e) {
      console.error(e)
      stato(`non riesco a salvare: ${motivo(e)}`, 'male')
    } finally {
      occupato = false
      fileInput.value = ''
    }
  }

  async function render() {
    if (!supporto) {
      lista.replaceChildren()
      vuoto.hidden = false
      vuotoTesto.textContent = 'questo browser non ha OPFS: serve un browser recente.'
      quota.textContent = 'spazio non disponibile'
      quotaPct.textContent = '—'
      quotaBarra.style.width = '0%'
      quotaTrack?.setAttribute('aria-valuenow', '0')
      conteggio.textContent = 'vuoto'
      promesse.hidden = true
      return
    }
    let voci = []
    try {
      const r = await apriRadice()
      for await (const [nome, h] of r.entries()) {
        if (h.kind !== 'file') continue
        try {
          const f = await h.getFile()
          voci.push({ nome, handle: h, file: f })
        } catch {}
      }
    } catch (e) {
      console.error(e)
      stato(`non riesco a leggere lo zaino: ${e?.message || e}`, 'male')
    }
    voci.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
    lista.replaceChildren()
    for (const v of voci) {
      const li = document.createElement('li')
      const icona = document.createElement('span')
      icona.className = 'lab-zaino-icona'
      const est = v.nome.includes('.') ? v.nome.split('.').pop().slice(0, 4).toUpperCase() : 'FILE'
      icona.textContent = est
      icona.dataset.tipo = est
      const testo = document.createElement('span')
      testo.className = 'zn-riga__testo'
      const nome = document.createElement('strong')
      nome.textContent = v.nome
      nome.title = v.nome
      const meta = document.createElement('small')
      meta.textContent = `${byte(v.file.size)} · ${quando(v.file.lastModified)}`
      testo.append(nome, meta)
      const azioni = document.createElement('span')
      azioni.className = 'zn-riga__azioni'
      const bScarica = document.createElement('button')
      bScarica.type = 'button'
      bScarica.className = 'lab-tasto lab-tasto--fantasma lab-tasto--piccolo'
      bScarica.textContent = 'apri'
      bScarica.setAttribute('aria-label', `apri ${v.nome}`)
      bScarica.addEventListener('click', () => scaricaFile(v))
      const bTogli = document.createElement('button')
      bTogli.type = 'button'
      bTogli.className = 'lab-tasto lab-tasto--pericolo lab-tasto--piccolo'
      bTogli.textContent = 'togli'
      bTogli.setAttribute('aria-label', `togli ${v.nome}`)
      bTogli.addEventListener('click', () => togli(v.nome))
      azioni.append(bScarica, bTogli)
      li.append(icona, testo, azioni)
      lista.append(li)
    }
    vuoto.hidden = voci.length > 0
    if (!voci.length) vuotoTesto.textContent = 'lo zaino è vuoto: trascina qualcosa nella scatola.'
    promesse.hidden = voci.length === 0
    conteggio.textContent = voci.length ? `${voci.length} file` : 'vuoto'
    await aggiornaQuota()
  }

  async function aggiornaQuota() {
    try {
      const stima = await navigator.storage.estimate()
      const usati = stima.usage || 0
      const totale = stima.quota || 0
      const pct = totale ? Math.min(100, (usati / totale) * 100) : 0
      quota.textContent = totale ? `${byte(usati)} di ${byte(totale)}` : `${byte(usati)} usati`
      quotaPct.textContent = totale
        ? (usati > 0 && pct < 0.01 ? '< 0,01%' : `${pct.toFixed(2).replace('.', ',')}%`)
        : '—'
      // anche una manciata di byte deve lasciare un segno sul righello
      quotaBarra.style.width = totale && usati ? `${Math.max(0.6, pct)}%` : '0%'
      if (quotaTrack) {
        quotaTrack.setAttribute('aria-valuenow', pct.toFixed(2))
        quotaTrack.setAttribute('aria-valuetext', totale ? `${byte(usati)} di ${byte(totale)}` : `${byte(usati)} usati`)
      }
    } catch {
      quota.textContent = 'spazio non disponibile'
      quotaPct.textContent = '—'
      quotaBarra.style.width = '0%'
      quotaTrack?.setAttribute('aria-valuenow', '0')
    }
  }

  async function scaricaFile(v) {
    try {
      const f = await v.handle.getFile()
      scarica(f, v.nome)
      stato(`scarico ${v.nome}`, 'ok')
    } catch (e) {
      console.error(e)
      stato(`non riesco a scaricare ${v.nome}`, 'male')
    }
  }

  async function togli(nome) {
    try {
      const r = await apriRadice()
      await r.removeEntry(nome)
      stato(`tolto ${nome}`, 'ok')
      await render()
    } catch (e) {
      console.error(e)
      stato(`non riesco a togliere ${nome}`, 'male')
    }
  }

  async function svuota() {
    const ora = Date.now()
    if (ora - confermaSvuota > 4000) {
      confermaSvuota = ora
      bSvuota.textContent = 'sicuro?'
      setTimeout(() => { if (Date.now() - confermaSvuota >= 4000) bSvuota.textContent = 'svuota' }, 4200)
      return
    }
    confermaSvuota = 0
    bSvuota.textContent = 'svuota'
    try {
      const r = await apriRadice()
      const nomi = []
      for await (const [nome, h] of r.entries()) if (h.kind === 'file') nomi.push(nome)
      for (const nome of nomi) await r.removeEntry(nome)
      stato(nomi.length ? `tolti ${nomi.length} file` : 'zaino vuoto', 'ok')
      await render()
    } catch (e) {
      console.error(e)
      stato('non riesco a svuotare lo zaino', 'male')
    }
  }

  async function persisti() {
    if (!navigator.storage?.persist) return stato('questo browser non sa proteggere i dati', 'male')
    try {
      const già = await navigator.storage.persisted?.()
      if (già) {
        segnaProtetto(true)
        return stato('i dati sono già protetti', 'ok')
      }
      const ok = await navigator.storage.persist()
      segnaProtetto(ok)
      stato(ok ? 'dati protetti: il browser non li cancella per fare spazio' : 'il browser non ha dato la protezione', ok ? 'ok' : 'attesa')
    } catch (e) {
      console.error(e)
      stato('non riesco a chiedere la protezione', 'male')
    }
  }

  // ── i gesti ────────────────────────────────────────────────────────────────
  const scegli = () => { if (!occupato) fileInput.click() }
  drop.addEventListener('click', scegli)
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scegli() }
  })
  q('[data-scegli]').addEventListener('click', scegli)
  q('[data-aggiorna]').addEventListener('click', () => { render(); stato('aggiornato') })
  q('[data-svuota]').addEventListener('click', svuota)
  q('[data-persisti]').addEventListener('click', persisti)
  fileInput.addEventListener('click', (e) => e.stopPropagation())
  fileInput.addEventListener('change', () => salvaTutti([...fileInput.files]))

  let dentro = 0
  drop.addEventListener('dragenter', (e) => {
    e.preventDefault()
    dentro++
    drop.classList.add('is-over')
  })
  drop.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  })
  drop.addEventListener('dragleave', (e) => {
    e.preventDefault()
    dentro = Math.max(0, dentro - 1)
    if (!dentro) drop.classList.remove('is-over')
  })
  drop.addEventListener('drop', (e) => {
    e.preventDefault()
    dentro = 0
    drop.classList.remove('is-over')
    const files = [...(e.dataTransfer?.files || [])]
    if (files.length) salvaTutti(files)
  })

  d.suPulizia(() => { fermo = true })

  d.apri()
  if (!supporto) {
    stato('questo browser non ha OPFS', 'male')
    drop.classList.add('is-off')
    render()
  } else {
    stato('pronto · trascina i file')
    navigator.storage.persisted?.().then((ok) => {
      if (ok) segnaProtetto(true)
      if (ok && !fermo) stato('dati protetti · trascina i file', 'ok')
    }).catch(() => {})
    render()
  }
  return d
}
