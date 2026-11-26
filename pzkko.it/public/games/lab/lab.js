// Il banco del laboratorio (26.11): quello che le dieci app nuove hanno in comune. Non decide niente di nessuna app:
// prepara il foglio col nastro (foglio.css + lab.css + il foglio dell'app), la testata con la voce, la chiusura, il
// disegno su canvas e il ciclo dei fotogrammi. Ogni app porta il suo corpo e la sua logica.
//
//   creaFoglio({ chiave, titolo, voce, corpo }) → { dlg, corpo, voce(), chiudi(), alChiudere(), apri() }
//   tela(canvas) → { ctx, w, h, adatta(), ferma() }        il canvas nitido, che si adatta da solo
//   ciclo(fn) → { ferma() }                                requestAnimationFrame con dt fermato
//   stile(href), copia(testo), hz(n), db(n), clamp(n,a,b), mappa(v,a,b,c,d), caso(n)
//
// Le app si caricano con `qui:<chiave>` (TAVOLI in assets/app.js) e devono esportare `apri()`.

const STILI = new Map()
/** Aggiunge un foglio di stile una volta sola (e aspetta che sia pronto). */
export function stile(href) {
  if (!STILI.has(href)) {
    STILI.set(href, new Promise((ok) => {
      if ([...document.styleSheets].some((s) => s.href === new URL(href, location.href).href)) return ok()
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = href
      l.dataset.lab = href
      l.onload = ok
      l.onerror = ok
      document.head.appendChild(l)
    }))
  }
  return STILI.get(href)
}

/** Il foglio comune: carta, testata, voce, chiusura. `corpo` è l'HTML dell'app. */
export async function creaFoglio({ chiave, titolo, voce: voceIniziale = '', corpo = '' }) {
  await Promise.all([
    stile('/games/foglio.css'),
    stile('/games/lab/lab.css'),
    stile(`/games/${chiave}/${chiave}.css`),
  ])
  const dlg = document.createElement('dialog')
  dlg.className = 'fg lab'
  dlg.dataset.app = chiave
  dlg.setAttribute('aria-labelledby', `lab-${chiave}`)
  dlg.innerHTML = `<div class="fg-dentro">
      <header class="fg-testa">
        <h2 id="lab-${chiave}">${titolo}</h2>
        <p class="fg-voce" role="status" aria-live="polite">${voceIniziale}</p>
        <button type="button" class="fg-chiudi" data-chiudi aria-label="chiudi"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg></button>
      </header>
      <div class="lab-corpo">${corpo}</div>
    </div>`
  document.body.appendChild(dlg)
  const voceEl = dlg.querySelector('.fg-voce')
  const corpoEl = dlg.querySelector('.lab-corpo')
  const chiuditori = new Set()
  let chiudendo = false
  let primaFocus = null

  const voce = (testo, scossa = false) => {
    if (!voceEl) return
    voceEl.textContent = testo
    if (scossa && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      voceEl.classList.remove('scossa')
      void voceEl.offsetWidth
      voceEl.classList.add('scossa')
    }
  }
  const chiudi = () => {
    if (!dlg.open || chiudendo) return
    chiudendo = true
    dlg.classList.add('chiude')
    setTimeout(() => { if (dlg.open) dlg.close(); dlg.classList.remove('chiude'); chiudendo = false }, 220)
  }
  const alChiudere = (fn) => { chiuditori.add(fn); return () => chiuditori.delete(fn) }
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) chiudi()
  })
  dlg.addEventListener('close', () => {
    for (const fn of chiuditori) { try { fn() } catch (err) { console.error(err) } }
    chiuditori.clear()
    primaFocus?.focus?.({ preventScroll: true })
  })
  const apri = () => {
    if (!dlg.open) { primaFocus = document.activeElement; dlg.classList.remove('chiude'); dlg.showModal() }
    chiudendo = false
    const primo = corpoEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ; (primo || corpoEl).focus?.({ preventScroll: true })
  }
  return { dlg, corpo: corpoEl, voce, chiudi, alChiudere, apri }
}

/** Il canvas nitido: misura, moltiplica per il DPR (al massimo 2) e tiene il contesto in coordinate CSS. */
export function tela(canvas) {
  const ctx = canvas.getContext('2d')
  const stato = { ctx, w: 0, h: 0, dpr: 1 }
  const adatta = () => {
    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(r.width))
    const h = Math.max(1, Math.round(r.height))
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    stato.w = w
    stato.h = h
    stato.dpr = dpr
  }
  const ro = new ResizeObserver(adatta)
  ro.observe(canvas)
  adatta()
  stato.adatta = adatta
  stato.ferma = () => ro.disconnect()
  return stato
}

/** Il ciclo dei fotogrammi, con il tempo fermato a 50 ms (una scheda tornata in vita non fa saltare il mondo). */
export function ciclo(fn) {
  let vivo = true
  let prima = 0
  const passo = (t) => {
    if (!vivo) return
    const dt = prima ? Math.min(50, t - prima) : 16.7
    prima = t
    try { fn(t, dt) } catch (e) { vivo = false; console.error(e); return }
    requestAnimationFrame(passo)
  }
  requestAnimationFrame(passo)
  return { ferma() { vivo = false } }
}

/** Copia negli appunti, con il vecchio modo se il browser non lascia usare clipboard.writeText. */
export async function copia(testo) {
  try {
    await navigator.clipboard.writeText(testo)
    return true
  } catch {
    try {
      const t = document.createElement('textarea')
      t.value = testo
      t.setAttribute('readonly', '')
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      t.remove()
      return ok
    } catch { return false }
  }
}

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
export const mappa = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c)
export const caso = (n) => Math.floor(Math.random() * n)
export const it = (n, d = 0) => Number(n).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })
export const hz = (f) => (!Number.isFinite(f) || f <= 0 ? '—' : f >= 1000 ? `${(f / 1000).toFixed(2)} kHz` : `${Math.round(f)} Hz`)
export const db = (n) => (!Number.isFinite(n) ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1)} dB`)
export const nota = (midi) => {
  const nomi = ['do', 'do#', 're', 're#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']
  return `${nomi[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}
export const freqMidi = (midi) => 440 * 2 ** ((midi - 69) / 12)
