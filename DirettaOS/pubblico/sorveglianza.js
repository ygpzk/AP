// Diretta OS · la scritta da videosorveglianza sopra la Vista esterna: data e ora in alto a sinistra, «● REC» in alto a
// destra, «CAM 02 · ESTERNO» in basso a destra, come la sovrimpressione di un videoregistratore di telecamere.
// Sta in un file suo perché esterna.js e esterna.css sono di OpenCode (filtro e finestra): qui si aggiunge solo uno
// strato di testo dentro .dx-finestra e si legge lo stato che esterna.js ha già scritto su .dx (data-stato).
// Leggera: l'ora cambia una volta al secondo e il pallino del REC lampeggia ogni mezzo secondo, con un solo timer che
// scrive un testo e una classe; niente animazioni CSS, niente lavoro a ogni fotogramma. Spenta, il timer si ferma.

const GIORNI = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB']
const due = (n) => String(n).padStart(2, '0')
const DICE = { live: 'REC', persa: 'SEGNALE PERSO', attesa: 'NO VIDEO', assente: 'NO VIDEO' }

export function sorveglianza(vista, { cam = 'CAM 02', dove = 'ESTERNO' } = {}) {
  const { el } = vista
  const finestra = el.querySelector('.dx-finestra')
  if (!finestra) return vista
  const osd = document.createElement('div')
  osd.className = 'dx-osd'
  osd.setAttribute('aria-hidden', 'true') // (il nome e lo stato veri li dicono già la riga sotto e l'alt della foto)
  osd.innerHTML = `<span class="osd-ora"></span><span class="osd-rec"><i></i><b>REC</b></span><span class="osd-cam"><b>${cam}</b><span>${dove}</span></span>`
  finestra.append(osd)
  el.classList.add('osd')
  const ora = osd.querySelector('.osd-ora')
  const rec = osd.querySelector('.osd-rec b')

  let timer = 0, acceso = false, lampo = true, scritta = '', dice = ''
  function batti() {
    timer = 0
    if (!acceso) return
    const d = new Date()
    if (!document.hidden) {
      const t = `${due(d.getDate())}-${due(d.getMonth() + 1)}-${d.getFullYear()} ${GIORNI[d.getDay()]} ${due(d.getHours())}:${due(d.getMinutes())}:${due(d.getSeconds())}`
      if (t !== scritta) ora.textContent = scritta = t
      lampo = d.getMilliseconds() < 500 // (acceso nella prima metà di ogni secondo, come i videoregistratori)
      osd.classList.toggle('spento', !lampo)
    }
    timer = setTimeout(batti, 500 - (d.getMilliseconds() % 500) + 8) // (sul mezzo secondo, così l'ora scatta giusta)
  }

  const aggiorna = vista.aggiorna
  vista.aggiorna = (s) => {
    aggiorna(s)
    const st = el.dataset.stato || 'assente'
    if (DICE[st] !== dice) rec.textContent = dice = DICE[st] ?? 'NO VIDEO'
    const su = !!s?.attivi?.esterna
    if (su !== acceso) {
      acceso = su
      clearTimeout(timer); timer = 0
      if (su) batti()
    }
  }
  return vista
}
