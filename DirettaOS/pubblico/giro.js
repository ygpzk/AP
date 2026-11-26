// Diretta OS: un solo giro di disegno per tutta la pagina, a 60 fotogrammi al secondo.
// Il monitor va a 164 Hz e il browser chiama requestAnimationFrame 164 volte al secondo: Camo ne manda in onda al massimo
// 60, e il device che Discord vede da Camo è 1080p60: il livello web deve stare al passo, non a 164 e non a 30. Qui i giri cadono
// ogni due o tre fotogrammi del monitor, in media un filo sopra i 60 al secondo (su un monitor a 60 Hz, tutti).
// Due fasi per giro: prima chi misura (getBoundingClientRect, offsetWidth), poi chi scrive (stili, tele). Così il browser
// rifà l'impaginazione una volta sola, non dopo ogni scrittura.
// ?fps=30 nell'indirizzo è la modalità risparmio; ?fps=15 è l'anteprima della regia, che è piccola e non va in onda.

const Q = new URLSearchParams(location.search)
let FPS = Math.min(240, Math.max(10, +Q.get('fps') || 60))
let PASSO = 1000 / (FPS + 2)
const fasi = [[], []] // 0: misurano · 1: scrivono
let raf = 0, ultimo = null, scorta = 0, ultimoGiro = null

// il tasto «risparmio GPU» della regia cambia i fotogrammi senza ricaricare: 30 quando è acceso, 60 quando è spento
export function fpsScegli(n) {
  FPS = Math.min(240, Math.max(10, +n || 30))
  PASSO = 1000 / (FPS + 2)
}

// fn(dt in secondi, t = performance.now() in secondi, ora in ms); restituisce chi la toglie
export function ogniGiro(fn, fase = 1) {
  fasi[fase].push(fn)
  if (!raf) raf = requestAnimationFrame(giro)
  return () => { const i = fasi[fase].indexOf(fn); if (i >= 0) fasi[fase].splice(i, 1) }
}

function giro(ora) {
  raf = requestAnimationFrame(giro)
  if (ultimo !== null) scorta += ora - ultimo
  ultimo = ora
  if (ultimoGiro !== null && scorta < PASSO - 0.6) return
  scorta = Math.min(Math.max(0, scorta - PASSO), PASSO) // (dopo una pausa lunga non recupera a raffica)
  const dt = ultimoGiro === null ? 1 / FPS : Math.min(0.1, (ora - ultimoGiro) / 1000)
  ultimoGiro = ora
  const t = ora / 1000
  for (const lista of fasi) for (const fn of lista.slice()) { try { fn(dt, t, ora) } catch (e) { console.warn('giro:', e) } }
}
export const fpsOra = () => FPS

// ── le animazioni CSS infinite (i pezzi che galleggiano, le tacche che girano, i pallini che pulsano): il browser le fa
// avanzare a ogni fotogramma del monitor, e anche una sola tiene tutta la pagina a 164 fotogrammi al secondo (misurato:
// un pezzo fermo che galleggia costava l'8% di un core alla pagina e il 15% alla scheda video). Qui le metto in pausa e le
// faccio avanzare io, a ogni giro: stesse animazioni, 60 volte al secondo. Quelle che finiscono da sole (entrate, uscite,
// il «+1») e le transizioni restano al browser: durano un attimo.
// fermo(): finché dice sì (l'anteprima dal vivo, dove i pezzi sono nascosti) restano ferme.
const tenute = new Map() // animazione → quando è cominciata (ms, l'orologio di requestAnimationFrame)
const pezzoDi = new Map() // animazione → il pezzo che la contiene (.pezzo), se c'è
let cercaFra = 0, frenoAcceso = false
export function frenaAnimazioni(fermo = () => false) {
  if (frenoAcceso) return
  frenoAcceso = true
  ogniGiro((dt, t, ora) => {
    // (le nuove e quelle finite: ogni 400 ms, e prima di scrivere, perché leggere lo stato di un'animazione fa ricalcolare
    // gli stili: letto fra una scrittura e l'altra, erano decine di ricalcoli a giro)
    if (ora >= cercaFra) {
      cercaFra = ora + 400
      for (const a of tenute.keys()) if (a.playState === 'idle') tenute.delete(a) // (tolta: la classe è cambiata)
      for (const a of document.getAnimations()) {
        if (tenute.has(a) || !(a instanceof CSSAnimation) || a.playState !== 'running') continue
        if (a.effect?.getComputedTiming?.().iterations !== Infinity) continue
        const ct = a.currentTime ?? 0
        a.pause()
        tenute.set(a, ora - ct)
        pezzoDi.set(a, a.effect?.target?.closest?.('.pezzo') ?? null)
      }
    }
    const sta = fermo()
    for (const [a, inizio] of tenute) {
      if (!a.effect?.target?.isConnected) { tenute.delete(a); pezzoDi.delete(a); continue } // (l'elemento non c'è più: si legge senza ricalcoli)
      // (dentro un pezzo spento non si vede niente: resta ferma, e non costa niente)
      const pz = pezzoDi.get(a)
      if (sta || (pz && !pz.classList.contains('su'))) tenute.set(a, inizio + dt * 1000); else a.currentTime = ora - inizio
    }
  })
}
