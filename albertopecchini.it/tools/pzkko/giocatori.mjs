#!/usr/bin/env node
// Classifiche contro schede, sul sito vero (6.11, Alberto: «le classifiche dicono cose diverse da dentro i profili singoli»).
// Legge /api/giocatori come la legge il browser, niente chiavi: tutte le classifiche (?top) e la scheda di ogni giocatore
// che ci compare (?ind), e controlla che per ogni metrica il posto, il valore e i pari merito siano gli stessi nelle due.
// La regola sta nella banca (C:\pzkko-server\banca\giocatori-dati.mjs, posto: una funzione sola per classifica, scheda e
// rivali) e le sue prove in banca\prove\giocatori.mjs; questo è lo sguardo da fuori, dopo un riavvio o un push.
//
//   node tools/pzkko/giocatori.mjs                    pzkko.it
//   node tools/pzkko/giocatori.mjs http://localhost:5182   il server di prova (npm run dev:pzkko)
const base = (process.argv[2] ?? 'https://www.pzkko.it').replace(/\/$/, '')
// (un indirizzo ogni volta diverso: la risposta non viene dalla memoria di Vercel)
const leggi = async (q) => (await fetch(`${base}/api/giocatori/?${q}&v=${Date.now()}${Math.random().toString(36).slice(2, 6)}`)).json()

const stats = await leggi('stats=1')
if (!stats.ok) { console.log(`${base}: il database dei giocatori non risponde (${stats.errore ?? '?'})`); process.exit(1) }
const metriche = stats.metriche
const top = Object.fromEntries(await Promise.all(metriche.map(async (m) => [m, (await leggi(`top=${m}&n=25`)).top ?? []])))
const chi = new Map()
for (const t of Object.values(top)) for (const g of t) chi.set(g.ind, g.nome)
const schede = new Map(await Promise.all([...chi.keys()].map(async (ind) => [ind, (await leggi(`ind=${ind}`)).profilo])))

const male = []
let confronti = 0
for (const m of metriche) {
  // dentro la classifica: dal valore più alto, e il posto è 1 + quanti hanno di più
  top[m].forEach((g, i) => {
    const sopra = top[m].filter((x) => x.valore > g.valore).length
    if (i && top[m][i - 1].valore < g.valore) male.push(`${m}: la classifica non è in ordine (${top[m][i - 1].nome} prima di ${g.nome})`)
    if (g.pos !== sopra + 1) male.push(`${m}: ${g.nome} è ${g.pos}° ma ne ha ${sopra} sopra`)
  })
  for (const [ind, p] of schede) {
    if (!p) { male.push(`la scheda di ${chi.get(ind)} non risponde`); continue }
    const c = top[m].find((x) => x.ind === ind), s = p.posizioni?.[m]
    confronti++
    if (!c && !s) continue
    if (!c || !s) { if (top[m].length < 25) male.push(`${m}: ${p.nome} è ${c ? 'in classifica ma non nella scheda' : 'nella scheda ma non in classifica'}`); continue }
    if (c.pos !== s.pos || c.valore !== s.valore || (c.pari ?? 0) !== (s.pari ?? 0)) male.push(`${m}: ${p.nome} in classifica è ${c.pos}° con ${c.valore}${c.pari ? ' (pari)' : ''}, nella scheda ${s.pos}° con ${s.valore}${s.pari ? ' (pari)' : ''}`)
  }
}
// dentro la scheda: i numeri scritti sono quelli delle sue classifiche
for (const p of schede.values()) {
  if (!p) continue
  const s = p.s ?? {}, pos = p.posizioni ?? {}
  for (const [m, v] of [['xp', p.xp], ['liv', p.liv], ['pescati', s.pescati], ['cacciati', s.cacciati], ['scavati', s.scavati], ['quiz', s.quizGiusti], ['sfide', s.sfideFatte], ['missioni', s.missioniFatte], ['morti', s.morti], ['comandi', s.comandi], ['acquisti', s.acquisti], ['serie', p.serie], ['giri', s.giri], ['guadagnati', s.guadagnati], ['vinti', s.vinti], ['persi', s.persi]]) {
    if (pos[m] && pos[m].valore !== v) male.push(`${p.nome}: nella scheda «${m}» vale ${v}, nel suo posto in classifica ${pos[m].valore}`)
    if (!pos[m] && v > 0) male.push(`${p.nome}: ha ${v} in «${m}» ma nessun posto in quella classifica`)
  }
  if (p.cn && s.giri !== p.cn.mani) male.push(`${p.nome}: le mani della scheda (${s.giri}) non sono quelle del libro dei conti (${p.cn.mani})`)
}

console.log(`${base}: ${metriche.length} classifiche, ${schede.size} giocatori, ${confronti} confronti`)
for (const m of metriche) if (top[m].length) console.log(`  ${m.padEnd(11)} ${top[m].map((g) => `${g.pos}°${g.pari ? '=' : ''} ${g.nome} ${g.valore}`).join(' · ')}`)
console.log(male.length ? `GIOCATORI: ${male.length} differenze\n  - ${male.join('\n  - ')}` : 'GIOCATORI: classifiche e schede dicono le stesse cose')
process.exit(male.length ? 1 : 0)
