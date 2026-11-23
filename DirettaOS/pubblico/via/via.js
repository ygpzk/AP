// Diretta OS · lo sfondo dei «torno subito»: copre tutta la webcam con la scena di quello che stai facendo, sotto ai
// pezzi. Il tempo della scena è da quando hai premuto il tasto (stato.via.da) e il seme è quello: la regia e i livelli
// di Camo, anche ricaricati a metà, vedono lo stesso momento e le stesse cose. Le scene si caricano solo quando
// servono, e girano solo mentre sei via (30 volte al secondo; ferme quando la pagina è l'anteprima dal vivo).
//   legna → fuoco.js · pipi → bosco.js · bere / mangiare / lattina (la Red Bull) → casa.js · sistemo → postazione.js
//   telefono → telefono.js · spacco → spacco.js · riavvio → riavvio.js

const SCENE = { legna: ['fuoco'], pipi: ['bosco'], bere: ['casa', 'bere'], mangiare: ['casa', 'mangiare'], lattina: ['casa', 'redbull'], telefono: ['telefono'], spacco: ['spacco'], sistemo: ['postazione'], riavvio: ['riavvio'] }

export function creaSfondo(scena) {
  const box = document.createElement('div')
  box.className = 'sfondo-via'
  const cosaImg = document.createElement('img'), cosaNome = document.createElement('div')
  cosaImg.className = 'sv-cosa'; cosaImg.alt = ''; cosaNome.className = 'sv-nome'
  box.append(cosaImg, cosaNome)
  scena.prepend(box)
  let attiva = null, chiave = '', meteo = null, giro = null, prima = 0, nomePrima = ''
  let detto = null // l'ultima cosa che la scena ha detto di sé (a che punto è): la legge la scritta al centro (scritta.js)
  const caricate = new Map()

  async function accendi(cosa, da, m) {
    const k = `${cosa}|${da}`
    if (k === chiave) return
    chiave = k; meteo = m; detto = null
    const [file, tipo] = SCENE[cosa] ?? []
    if (!file) return
    let mod = caricate.get(file)
    if (!mod) { try { mod = await import(`/via/${file}.js`); caricate.set(file, mod) } catch (e) { console.warn('scena', file, e); return } }
    if (chiave !== k) return // (nel frattempo è cambiato)
    const s = mod.crea({ cosa: tipo ?? cosa, seme: Math.floor(da / 1000) % 100000, meteo })
    attiva?.tela.remove()
    attiva = { ...s, da }
    s.tela.classList.add('sv-tela'); s.tela.classList.toggle('morbido', !!s.morbido)
    box.prepend(s.tela)
    cosaImg.classList.remove('su'); cosaNome.classList.remove('su'); nomePrima = ''
    requestAnimationFrame(() => box.classList.add('su'))
    if (!giro) giro = requestAnimationFrame(disegna)
  }
  function spegni() {
    chiave = ''
    box.classList.remove('su')
    // via dopo la dissolvenza (se nel frattempo non si è riacceso)
    setTimeout(() => { if (chiave) return; attiva?.tela.remove(); attiva = null; cancelAnimationFrame(giro); giro = null }, 1000)
  }
  function disegna(ora) {
    giro = requestAnimationFrame(disegna)
    if (!attiva || ora - prima < 31 || scena.classList.contains('dal-vivo') || document.hidden) return
    const dt = Math.min(0.1, (ora - prima) / 1000); prima = ora
    const t = Math.max(0, (Date.now() - attiva.da) / 1000)
    let fatto = {}
    try { fatto = attiva.disegna(t, new Date(), dt) ?? {} } catch (e) { console.warn('scena:', e); attiva = null; return }
    detto = { cosa: chiave.split('|')[0], t, ...fatto }
    // l'oggetto trovato in cucina: l'immagine vera di pzkko, sopra la scena (x, y sono pixel della scena 480 × 270)
    const a = fatto.adesivo
    cosaImg.classList.toggle('su', !!a); cosaNome.classList.toggle('su', !!a?.nome)
    if (a) {
      if (cosaImg.getAttribute('src') !== a.src) cosaImg.src = a.src
      const alto = a.s * (cosaImg.naturalWidth ? cosaImg.naturalHeight / cosaImg.naturalWidth : 1)
      cosaImg.style.width = `${Math.round(a.s)}px`
      cosaImg.style.transform = `translate(${Math.round(a.x * 4 - a.s / 2)}px, ${Math.round(a.y * 4 - alto)}px)`
      if (a.nome) {
        if (a.nome !== nomePrima) { nomePrima = a.nome; cosaNome.textContent = a.nome }
        cosaNome.style.transform = `translate(calc(${Math.round(a.x * 4)}px - 50%), ${Math.round(a.y * 4 + 14)}px)`
      }
    }
  }
  return {
    accendi, spegni,
    meteo(m) { meteo = m; attiva?.meteo?.(m) },
    acceso: () => box.classList.contains('su'),
    dice: () => detto,
  }
}
