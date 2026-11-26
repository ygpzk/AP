// Il vestito del riquadro «ADESSO» (26.11.2026, pzkko: «fai questa zona stra animata e stra nel mio stile, animazione
// per cambio app, switch e transizione in base all'utilizzo; tu pensa alla grafica, DeepSeek pensa a UX»).
//
// La UX è di DeepSeek (design/adesso-vivo.md) e il motore è il suo (adesso.js): la lista dei fatti, nodi a chiave, FLIP.
// Qui c'è solo la grafica, in stile pzk: il riquadro è un cartoncino con le graffette, lo stato e il luogo sono timbri,
// le app aperte sono adesivi di carta (più le usa, più sono grandi; quelle mai toccate sbiadiscono) e quella in primo
// piano è il foglietto colorato in cima alla fila, col nome, da quanto ci sta e le tacche di quante volte c'è tornato;
// il brano è una polaroid col vinile che gira. Il disegno sta in src/site.css («adesso: grafica (Claude)»).
//
// Il motore chiama tre cose: zona(z) quando nasce un riquadro, aggiorna(z, dati) dopo ogni cambio, tick(z) ogni secondo.
// Niente nodi con dati in più: solo classi, attributi e qualche pezzo di carta (aria-hidden) sui nodi che ci sono già.
//
// Il cambio dell'app in primo piano non è sempre lo stesso gesto: dipende da come sta usando il pc.
//   data-cambio="schiaffo"  il cambio normale: il foglietto arriva dall'alto e si attacca
//   data-cambio="veloce"    salta da un'app all'altra (meno di 2,5 s dall'ultimo cambio): uno scatto e basta
//   data-cambio="torna"     torna all'app di prima (avanti e indietro tra due): il foglietto si rigira come una carta
//   data-cambio="lungo"     lascia un'app dopo averci passato almeno dieci minuti: lo schiaffo grosso, coi segni attorno
// Tutti durano al massimo 300 ms (i limiti del brief, §6): il pc scrive ogni mezzo secondo.

const el = (tag, cls, testo) => { const n = document.createElement(tag); if (cls) n.className = cls; if (testo != null) n.textContent = testo; return n }
const impronta = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const CARTE = ['giallo', 'rosa', 'azzurro', 'verde', 'arancio']
const VELOCE = 2500, LUNGO = 600, FISSO = 600

export function creaArte(o) {
  // o: { testi() → { voce, spento }, locale() → 'it-IT', reduced }
  const stati = new WeakMap()
  const formati = new Map()
  const unita = (u, n) => {
    const k = `${o.locale()}|${u}`
    if (!formati.has(k)) { try { formati.set(k, new Intl.NumberFormat(o.locale(), { style: 'unit', unit: u, unitDisplay: 'short' })) } catch { formati.set(k, { format: (x) => `${x} ${u[0]}` }) } }
    return formati.get(k).format(n)
  }
  const durata = (s) => (s < 60 ? unita('second', s) : s < 3600 ? unita('minute', Math.floor(s / 60)) : `${unita('hour', Math.floor(s / 3600))} ${unita('minute', Math.floor((s % 3600) / 60))}`)
  const fermo = () => o.reduced || document.hidden
  // una classe di movimento che si toglie da sola (e se ne arriva un'altra, ricomincia)
  function muovi(n, classe, ms = 320) {
    if (!n) return
    clearTimeout(n._adxVia)
    n.classList.remove(classe)
    void n.offsetWidth
    n.classList.add(classe)
    n._adxVia = setTimeout(() => n.classList.remove(classe), ms)
  }

  function zona(z) {
    const r = z.refs, root = z.root
    root.classList.add('adx')
    r.hNow.parentNode.classList.add('adx__testa')
    r.hNow.classList.add('adx__titolo')
    r.hLive.classList.add('adx__vivo', 'timbro')
    const voce = el('span', 'adx__voce')
    r.hNow.after(voce)
    r.dot.parentNode.classList.add('adx__timbri')
    r.sLabel.classList.add('adx__stato', 'timbro')
    r.luogo.classList.add('adx__luogo', 'timbro')
    const spento = el('span', 'adx__spento timbro'); spento.hidden = true
    r.luogo.after(spento)
    r.vuoto.classList.add('adx__vuoto')
    r.items.classList.add('adx__voci')
    r.pcapp.classList.add('adx__app')
    r.riga.classList.add('adx__fila')
    r.devices.classList.add('adx__piede')
    const s = { voce, spento, su: null, suPrima: null, cambioAlle: 0, suDal: 0, visto: false, brano: null, stato: null, luogo: null, uso: null, vista: false }
    stati.set(z, s)
    // fuori dallo schermo le cose che girano sempre (il vinile, le barrette, il polso) si fermano
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => root.toggleAttribute('data-fuori', !e.isIntersecting)).observe(root)
  }

  // un adesivo: la sua inclinazione e il colore del suo foglietto vengono dal nome (restano gli stessi finché è aperta)
  function vesti(li, nome) {
    if (li._adx) return li._adx
    const h = impronta(nome)
    li.style.setProperty('--r', `${(((h % 9) - 4) * 0.8).toFixed(1)}deg`)
    li.style.setProperty('--n', String(Math.max(3, Math.min(22, [...nome].length))))
    li.dataset.carta = CARTE[(h >>> 5) % CARTE.length]
    const nota = el('span', 'adx__nota'); nota.setAttribute('aria-hidden', 'true')
    const n = el('b', 'adx__nome', nome), da = el('span', 'adx__da'), tempo = el('i', 'adx__tempo'), tacche = el('i', 'adx__tacche')
    da.append(tempo, tacche)
    nota.append(n, da)
    li.append(nota)
    return (li._adx = { tempo, tacche })
  }
  // il peso di un adesivo: 0 mai in primo piano, poi 1, 2, 3 con l'uso (dal pc: 5 e 20 minuti nell'ultima ora;
  // senza i numeri del pc: la parte del tempo da quando la pagina è aperta)
  const peso = (u) => { if (u.fondo) return 0; const q = u.pc ? u.sec / 1200 : u.uso * 1.5; return q >= 1 ? 3 : q >= 0.25 ? 2 : 1 }
  function pesa(z, s) {
    for (const li of z.refs.riga.children) {
      const nome = li.dataset.app
      if (!nome) continue
      const u = s.uso(nome), p = String(peso(u))
      if (li.dataset.peso !== p) li.dataset.peso = p
      if (!li.classList.contains('is-su')) { if ('fisso' in li.dataset) delete li.dataset.fisso; continue }
      const a = vesti(li, nome)
      // da quanto è in primo piano: lo dice il pc; se no, solo se il cambio l'ho visto succedere (non invento da quando)
      const sec = u.pc ? u.da : s.visto && s.suDal ? Math.round((Date.now() - s.suDal) / 1000) : null
      const t = sec == null ? '' : durata(Math.max(0, sec))
      if (a.tempo.textContent !== t) a.tempo.textContent = t
      const k = String(Math.max(0, Math.min(9, (u.ritorni || 0) - 1)))
      if (a.tacche.dataset.k !== k) { a.tacche.dataset.k = k; a.tacche.style.setProperty('--k', k) }
      const fisso = sec != null && sec >= FISSO
      if (fisso !== 'fisso' in li.dataset) { if (fisso) li.dataset.fisso = ''; else delete li.dataset.fisso }
    }
  }

  // le voci (il brano, il gioco): la polaroid col nastro, il vinile, le barrette
  function vestiVoci(z) {
    for (const [k, rec] of z.voci) {
      if (rec.wrap.dataset.adx) continue
      const musica = k === 'm'
      rec.wrap.dataset.adx = musica ? 'musica' : 'gioco'
      const nastro = el('i', 'pz-nastro'); nastro.setAttribute('aria-hidden', 'true')
      rec.act.querySelector('.act__art')?.append(nastro)
      if (!musica) continue
      const vinile = el('span', 'adx__vinile'); vinile.setAttribute('aria-hidden', 'true')
      rec.act.prepend(vinile)
      const eq = el('i', 'adx__eq'); eq.setAttribute('aria-hidden', 'true'); eq.append(el('i'), el('i'), el('i'), el('i'))
      rec.headLabel.after(eq)
    }
  }

  function aggiorna(z, d) {
    const s = stati.get(z)
    if (!s) return
    // (si anima solo un cambio vero: la prima vetrina che arriva, o il riquadro rimontato, si disegnano fermi)
    const r = z.refs, T = o.testi(), anima = s.vista && !!d.vetrina && !fermo()
    s.uso = d.uso
    if (s.voce.textContent !== T.voce) s.voce.textContent = T.voce
    // i timbri: quando cambiano, si battono di nuovo
    const stato = z.root.dataset.stato || null, luogo = d.vetrina?.luogo || null
    if (anima && s.stato && stato !== s.stato) muovi(r.sLabel, 'is-batte')
    if (anima && luogo && s.luogo && luogo !== s.luogo) muovi(r.luogo, 'is-batte')
    s.stato = stato; s.luogo = luogo
    const spento = !!d.vetrina && d.pc !== 'vivo'
    if (s.spento.hidden === spento) { s.spento.hidden = !spento; if (spento) { s.spento.textContent = T.spento; if (anima) muovi(s.spento, 'is-batte') } }
    else if (spento && s.spento.textContent !== T.spento) s.spento.textContent = T.spento

    // gli adesivi
    const app = d.vetrina?.app || [], figli = [...r.riga.children].filter((li) => li.dataset.app)
    for (const li of figli) vesti(li, li.dataset.app)
    const su = app.find((x) => x.su)?.n ?? null
    if (su !== s.su) {
      const ora = Date.now(), prima = s.su
      if (anima) {
        const nuovo = su && figli.find((li) => li.dataset.app === su), vecchio = prima && figli.find((li) => li.dataset.app === prima)
        const turno = s.suDal ? (ora - s.suDal) / 1000 : 0
        const tipo = ora - s.cambioAlle < VELOCE ? 'veloce' : su === s.suPrima ? 'torna' : turno >= LUNGO ? 'lungo' : 'schiaffo'
        if (nuovo && !nuovo.classList.contains('is-entra')) { nuovo.dataset.cambio = tipo; muovi(nuovo, 'is-arriva') }
        if (vecchio && tipo !== 'veloce') muovi(vecchio, 'is-posa', 240)
      }
      s.visto = s.vista
      s.suPrima = prima; s.su = su; s.cambioAlle = ora; s.suDal = su ? ora : 0
    }
    pesa(z, s)

    // il brano: quando cambia, la polaroid arriva di nuovo e il vinile rientra ed esce
    vestiVoci(z)
    const m = d.vetrina?.musica, brano = m ? `${m.titolo}\n${m.artista}` : null
    if (brano !== s.brano) {
      const rec = z.voci.get('m')
      if (rec) rec.wrap.style.setProperty('--n', String(Math.max(3, Math.min(26, [...(m?.titolo || '')].length))))
      if (anima && brano && s.brano && rec) muovi(rec.wrap, 'is-cambia')
      s.brano = brano
    }
    s.vista = !!d.vetrina
  }

  function tick(z) {
    const s = stati.get(z)
    if (s?.uso) pesa(z, s)
  }

  return { zona, aggiorna, tick }
}
