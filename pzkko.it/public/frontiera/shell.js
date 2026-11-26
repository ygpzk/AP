// shell.js — il guscio comune degli esperimenti del Laboratorio di pzkko.it.
//
// Ogni esperimento è un modulo che esporta `apri()` e costruisce il suo
// <dialog> con `creaDialogo()`. Qui stanno solo le cose che servono a tutti:
// la finestra, il tasto di chiusura, lo stato in fondo, lo scaricamento di un
// file, la copia negli appunti e la formattazione delle misure.
//
// La grafica sta in lab.css (26.11: lo stile pzk, come i tavoli; lo stato `.lab-stato` ora sta nella testata accanto
// al titolo, come la voce a pennarello dei tavoli, con lo stesso ruolo `status`). Non
// cambiare la logica degli esperimenti da qui: ogni motore sta nel suo file.

const CSS = new URL('./lab.css', import.meta.url).href

function caricaCss() {
  if (document.querySelector('link[data-lab-css]')) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = CSS
  l.dataset.labCss = ''
  document.head.appendChild(l)
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/**
 * Crea il <dialog> di un esperimento.
 * @param {object} o
 * @param {string} o.id          nome dell'esperimento (per data-lab e per l'hash)
 * @param {string} o.titolo      titolo grande
 * @param {string} o.tech        la tecnologia, nell'occhiello
 * @param {string} [o.voce]     una riga di spiegazione
 * @param {string} [o.corpo]    l'HTML interno (meglio se costruito con textContent)
 * @param {boolean} [o.larga]   finestra più larga (AR, due schede)
 * @param {Function} [o.onChiudi] chiamata dopo la distruzione
 */
export function creaDialogo({ id, titolo, tech, voce = '', corpo = '', larga = false, onChiudi = null }) {
  caricaCss()
  const dlg = document.createElement('dialog')
  dlg.className = `lab-dlg${larga ? ' lab-dlg--larga' : ''}`
  dlg.dataset.lab = id
  dlg.setAttribute('aria-labelledby', `lab-t-${id}`)
  dlg.innerHTML = `
    <div class="lab-dentro">
      <header class="lab-testa">
        <div class="lab-titoli">
          <p class="lab-occhiello"><span class="lab-luce"></span> frontiera <span class="lab-tech">${esc(tech)}</span></p>
          <div class="lab-titolo-riga">
            <h2 class="lab-titolo" id="lab-t-${id}">${esc(titolo)}</h2>
            <span class="lab-stato" role="status" aria-live="polite"></span>
          </div>
          ${voce ? `<p class="lab-descrizione">${esc(voce)}</p>` : ''}
        </div>
        <button type="button" class="lab-chiudi" data-chiudi aria-label="chiudi">
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8l18 17M25 7L8 25"/></svg>
        </button>
      </header>
      <div class="lab-corpo">${corpo}</div>
      <footer class="lab-piede">
        <span class="lab-firma">pzkko.it · frontiera</span>
      </footer>
    </div>`

  document.body.appendChild(dlg)

  const stato = dlg.querySelector('.lab-stato')
  const pulizie = []
  let chiuso = false

  const api = {
    dlg,
    corpo: dlg.querySelector('.lab-corpo'),
    stato,
    /** Accende la finestra. */
    apri() {
      if (!dlg.open) dlg.showModal()
      requestAnimationFrame(() => {
        const primo = dlg.querySelector('[data-focus]') || dlg.querySelector('.lab-chiudi')
        primo?.focus?.({ preventScroll: true })
      })
    },
    /** Scrive lo stato in fondo (e lo annuncia ai lettori di schermo). */
    nota(testo, tipo = '') {
      stato.textContent = testo
      if (tipo) stato.dataset.tipo = tipo
      else delete stato.dataset.tipo
    },
    /** Registra una pulizia da fare alla chiusura (rAF, audio, fotocamera…). */
    suPulizia(fn) {
      if (typeof fn === 'function') pulizie.push(fn)
    },
    /** Chiude con l'animazione, se il sistema non chiede meno movimento. */
    chiudi() {
      if (!dlg.open || chiuso) return
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return dlg.close()
      dlg.classList.add('lab-chiude')
      setTimeout(() => {
        dlg.classList.remove('lab-chiude')
        if (dlg.open) dlg.close()
      }, 170)
    },
    /** Toglie subito la finestra (per i casi di errore). */
    distruggi() {
      if (dlg.open) dlg.close()
      else if (!chiuso) {
        chiuso = true
        for (const f of pulizie.splice(0)) {
          try { f() } catch (e) { console.error(e) }
        }
        dlg.remove()
        window.dispatchEvent(new CustomEvent('pzkko-lab-chiuso', { detail: { id } }))
        onChiudi?.()
      }
    },
  }

  dlg.addEventListener('cancel', (e) => {
    e.preventDefault()
    api.chiudi()
  })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-chiudi]')) api.chiudi()
  })
  dlg.addEventListener('close', () => {
    if (chiuso) return
    chiuso = true
    for (const f of pulizie.splice(0)) {
      try { f() } catch (e) { console.error(e) }
    }
    dlg.remove()
    window.dispatchEvent(new CustomEvent('pzkko-lab-chiuso', { detail: { id } }))
    onChiudi?.()
  })

  return api
}

/** Scarica un Blob con un nome. */
export function scarica(blob, nome) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Copia un testo; torna true se ce l'ha fatta. */
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
    } catch {
      return false
    }
  }
}

/** Byte in una misura leggibile. */
export function byte(n) {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  const u = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  do { n /= 1024; i++ } while (n >= 1024 && i < u.length - 1)
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${u[i]}`
}

/** Data e ora brevi, in italiano. */
export function quando(ms) {
  try {
    return new Date(ms).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

/** Un numero casuale crittografico fra 0 e n-1. */
export function caso(n) {
  if (!Number.isInteger(n) || n <= 0) return 0
  const max = Math.floor(0xffffffff / n) * n
  const a = new Uint32Array(1)
  do { crypto.getRandomValues(a) } while (a[0] >= max)
  return a[0] % n
}
