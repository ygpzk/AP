// I pezzi della macchina del tempo: gli indirizzi delle pagine, l'istogramma, le statistiche
// della cattura, i «momenti» del giorno e del sito. Solo stringhe, per i template di
// pages/tempo.js. I dati vengono da src/data/tempo.js (tools/tempo/tempo.mjs).
//
// Dal 26.11.2026 hanno lo stile del resto del sito (prima copiavano la barra grigia della
// Wayback Machine) e ogni testo scritto allora (messaggi dei commit, titoli delle pagine, cartelle)
// passa dalle regole di src/data/oscura.js: dove c'era un dato personale resta una barra. Niente
// più collegamenti a GitHub né al server di casa.
//
// Riservatezza (Alberto, 3.11.2026: «ripercorrere i momenti di quando committavo senza
// violare la mia privacy»): si mostrano ore, giorni e quantità, mai nomi o indirizzi di nessuno.

import { oscura } from '../../data/oscura.js'

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])

// Testo scritto allora, pronto per l'HTML: i dati diventano barre (come nelle copie dei siti).
const BARRA = (n) => `<span class="tm-x" title="tolto per riservatezza">${'x'.repeat(Math.max(3, Math.min(18, n)))}</span>`
export const sicuro = (s) => esc(oscura(s, (m) => `${m.length}`)).replace(/(\d+)/g, (_, n) => BARRA(Number(n)))
// …e per gli attributi e le meta, dove una barra non si può disegnare
export const piano = (s) => oscura(s)

const giorno = (iso) => new Date(iso + 'T12:00:00')
export const lunga = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
export const corta = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
const breve = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '')
const meseCorto = (iso) => giorno(iso).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')
export const settimanale = (iso) => giorno(iso).toLocaleDateString('it-IT', { weekday: 'long' })
export const num = (n) => Number(n || 0).toLocaleString('it-IT')
export const peso = (kb) => (kb >= 1024 ? `${(kb / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB` : `${num(kb)} KB`)
const avanti = (iso, n) => {
  const d = giorno(iso)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}
export const per = (n, uno, tanti) => `${num(n)} ${n === 1 ? uno : tanti}`
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export const GIORNI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']
const TIPI = { feat: 'novità', fix: 'correzioni', chore: 'manutenzione', docs: 'documenti', style: 'stile', refactor: 'riordino', perf: 'velocità', test: 'prove', build: 'build', ci: 'automatismi', revert: 'passi indietro', merge: 'unioni', altro: 'altro' }
const AI = { claude: 'Claude', copilot: 'Copilot', codex: 'Codex' }

// dove stanno le foto: rifatte dalle copie già oscurate (tools/tempo/oscura-pagine.mjs)
//   t  la prima finestra, 640 × 400        v  la cima in verticale, 480 × 640 (la home)
export const foto = (id, short, k = 't') => `/media/tempo/${id}/${short}-${k}.webp`
export const dominio = (url) => url.replace(/^https?:\/\/(www\.)?/, '')
// gli indirizzi: un sito, una cattura (una per giorno, quindi la data basta)
export const sitoPath = (s) => `/tempo/${dominio(s.url)}/`
export const catturaPath = (s, v) => `/tempo/${dominio(s.url)}/${v.data}/`
// una cattura ha la foto se ha la copia (le foto si fanno da lì)
export const conFoto = (v) => Boolean(v.pagina)

// ── L'istogramma: un posto per ogni giorno dal primo all'ultimo, alto quanti commit ──
// Ogni barra è un link alla sua cattura; l'anteprima (data-t) la mostra il browser al passaggio.

export function istogramma(s, corrente = -1) {
  const versioni = s.versioni
  if (!versioni.length) return { barre: '', mesi: '', n: 1 }
  const max = Math.max(...versioni.map((v) => v.commit))
  const perData = new Map(versioni.map((v, i) => [v.data, i]))
  const giorni = []
  for (let d = versioni[0].data; d <= versioni.at(-1).data; d = avanti(d, 1)) giorni.push({ data: d, i: perData.has(d) ? perData.get(d) : -1 })
  const mesi = []
  giorni.forEach((g, k) => {
    const m = g.data.slice(0, 7)
    if (!mesi.length || mesi.at(-1).m !== m) mesi.push({ m, k, label: meseCorto(g.data) })
  })
  // il primo mese, se finisce fra pochi giorni, non scrive l'etichetta (si accavallerebbe)
  if (mesi.length > 1 && mesi[1].k - mesi[0].k < 12) mesi.shift()
  const barre = giorni
    .map((g, k) => {
      const v = g.i >= 0 ? versioni[g.i] : null
      if (!v) return ''
      const h = Math.max(10, Math.round((v.commit / max) * 100))
      const qui = g.i === corrente
      const t = conFoto(v) ? ` data-t="${foto(s.id, v.short)}"` : ''
      const righe = v.st?.piu || v.st?.meno ? ` · +${num(v.st.piu)} −${num(v.st.meno)}` : ''
      return `<a class="tm-col${qui ? ' is-current' : ''}${conFoto(v) ? '' : ' is-off'}" href="${catturaPath(s, v)}" style="--k:${k};--h:${h}%" data-tm-go data-d="${esc(lunga(v.data))} · ${v.ora}" data-n="${per(v.commit, 'commit', 'commit')}${righe}"${t} aria-label="${esc(lunga(v.data))}, ${per(v.commit, 'commit', 'commit')}"${qui ? ' aria-current="page"' : ''}></a>`
    })
    .join('')
  // l'ultimo mese, se comincia a pochi giorni dalla fine, si appoggia al bordo destro
  const fine = (m) => giorni.length - m.k < Math.max(8, giorni.length * 0.06)
  return { barre, mesi: mesi.map((m) => `<span${fine(m) ? ' class="tm-m-end"' : ''} style="--k:${m.k}">${m.label}</span>`).join(''), n: giorni.length }
}

export function grafico(s, k = -1) {
  const isto = istogramma(s, k)
  return `
    <div class="tm-graph" style="--n:${isto.n}">
      <div class="tm-spark" data-tm-spark role="group" aria-label="Catture di ${esc(dominio(s.url))}: una barra per giorno di lavoro, alta quanti commit">${isto.barre}</div>
      <div class="tm-months label" aria-hidden="true">${isto.mesi}</div>
      <div class="tm-tip" data-tm-tip hidden aria-hidden="true">
        <img class="tm-tip__img" data-tm-tip-img alt="" width="640" height="400" decoding="async" data-no-srcset>
        <span class="tm-tip__date" data-tm-tip-date></span>
        <span class="tm-tip__n label" data-tm-tip-n></span>
      </div>
    </div>`
}

export function conteggio(sito) {
  const vs = sito.versioni
  if (!vs.length) return 'nessuna cattura ancora'
  const m = sito.momenti || {}
  return `${per(vs.length, 'cattura', 'catture')} dal ${esc(lunga(vs[0].data))} al ${esc(lunga(vs.at(-1).data))} · ${per(m.commit ? m.commit + (m.auto || 0) : vs.reduce((n, v) => n + v.commit, 0), 'commit', 'commit')}`
}

// ── Le statistiche della cattura, a pillole ───────────────────────────────────

export function chips(v) {
  const st = v.st || {}
  const out = []
  if (st.piu || st.meno) out.push(`<li class="pill" title="righe aggiunte e tolte quel giorno"><b class="tm-plus">+${num(st.piu)}</b> <b class="tm-minus">−${num(st.meno)}</b></li>`)
  if (st.file) out.push(`<li class="pill" title="file toccati quel giorno">${per(st.file, 'file', 'file')}</li>`)
  out.push(`<li class="pill" title="commit quel giorno, il primo e l'ultimo${st.auto ? ` (più ${st.auto} automatici, le catture dei siti)` : ''}">${per(v.commit, 'commit', 'commit')}${st.da && st.da !== st.a ? ` · dalle ${st.da} alle ${st.a}` : st.da ? ` · alle ${st.da}` : ''}</li>`)
  if (st.giorno) out.push(`<li class="pill" title="giorni di lavoro dal primo commit; giorni di fila con almeno un commit">giorno ${num(st.giorno)}${st.serie > 1 ? ` · ${st.serie}° di fila` : ''}</li>`)
  if (st.ai) out.push(`<li class="pill" title="commit scritti insieme a un assistente (Claude, Copilot, Codex)">${num(st.ai)} con un assistente</li>`)
  if (st.sito) out.push(`<li class="pill" title="il sito di quel giorno: pagine HTML e peso di tutti i file">${per(st.sito.pagine, 'pagina', 'pagine')} · ${peso(st.sito.kb)}</li>`)
  return out.join('')
}

// ── I momenti: il giorno della cattura e tutto il sito ────────────────────────

// il giorno su un righello di 24 ore, un puntino per commit (più chiari quelli automatici)
export function righello(v, commit) {
  const righe = commit || (v.st?.ore || []).map((h) => [`${String(h).padStart(2, '0')}:30`])
  const ore = righe.filter((c) => !c[8]).map((c) => c[0])
  const punti = righe
    .map((c) => {
      const [h, m] = c[0].split(':').map(Number)
      const x = ((h * 60 + m) / 1440) * 100
      return `<span class="tm-dot${c[8] ? ' tm-dot--auto' : ''}" style="--x:${x.toFixed(2)}%" title="${c[0]}${c[2] ? ' · ' + esc(piano(c[2])) : ''}${c[8] ? ' (automatico)' : ''}"></span>`
    })
    .join('')
  const tacche = [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => `<span class="tm-tick label" style="--x:${(h / 24) * 100}%">${h === 24 ? '' : String(h).padStart(2, '0')}</span>`).join('')
  return `<div class="tm-ruler" role="img" aria-label="${ore.length} commit fra le ${ore[0] || '—'} e le ${ore.at(-1) || '—'}"><span class="tm-night" style="--a:0%;--b:${(6 / 24) * 100}%"></span>${tacche}${punti}</div>`
}

export function fattiGiorno(v) {
  const st = v.st || {}
  const tipi = Object.entries(st.tipi || {}).sort((a, b) => b[1] - a[1])
  return [
    `${per(v.commit, 'commit', 'commit')}${st.auto ? ` (${num(st.auto)} automatici)` : ''}${st.da && st.da !== st.a ? ` fra le ${st.da} e le ${st.a}` : st.da ? ` alle ${st.da}` : ''}${st.file ? `, ${per(st.file, 'file', 'file')}` : ''}${st.piu || st.meno ? `, <b class="tm-plus">+${num(st.piu)}</b> <b class="tm-minus">−${num(st.meno)}</b> righe` : ''}`,
    tipi.length && tipi.map(([t, n]) => `${num(n)} ${TIPI[t] || t}`).join(', '),
    st.aree?.length && `dove: ${st.aree.map(([a, n]) => `<code>${sicuro(a)}</code> ${n}`).join(' · ')}`,
    st.sito && `il sito quel giorno: ${per(st.sito.pagine, 'pagina', 'pagine')}, ${per(st.sito.file, 'file', 'file')}, ${peso(st.sito.kb)} (JS ${peso(st.sito.js)}, CSS ${peso(st.sito.css)}, immagini ${peso(st.sito.img)}) · ${st.sito.tipo === 'server' ? 'raccolto dal server di allora' : st.sito.tipo === 'statico' ? 'file statici' : 'compilato'} in ${num(st.sito.build)} s`,
    v.nota && sicuro(v.nota),
  ].filter(Boolean)
}

export function listaCommit(commit) {
  if (!commit) return `<p class="tm-muted">I commit uno per uno non ci sono: c’è solo il riassunto.</p>`
  return `<ol class="tm-commits">${commit
    .map(
      ([ora, short, msg, piu, meno, file, tipo, ai, auto]) =>
        `<li${auto ? ' class="is-auto"' : ''}><span class="tm-c-ora label">${ora}</span><code class="tm-c-sha">${short}</code><span class="tm-c-msg">${sicuro(msg)}</span><span class="tm-c-n label"><b class="tm-plus">+${num(piu)}</b> <b class="tm-minus">−${num(meno)}</b> · ${per(file, 'file', 'file')}${ai ? ` · ${AI[ai] || ai}` : ''}${auto ? ' · automatico' : ''}</span></li>`,
    )
    .join('')}</ol>`
}

// la griglia settimana × ora: un cerchio per ora, grande quanti commit
export function griglia(m) {
  const max = Math.max(1, ...m.griglia.flat())
  const righe = m.griglia
    .map((riga, d) => `<span class="tm-pc-day label">${GIORNI[d]}</span>${riga.map((n, h) => `<span class="tm-pc" style="--s:${n ? (0.25 + 0.75 * Math.sqrt(n / max)).toFixed(2) : 0}" title="${GIORNI[d]} ${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59 · ${per(n, 'commit', 'commit')}"></span>`).join('')}`)
    .join('')
  const ore = `<span class="tm-pc-day"></span>${Array.from({ length: 24 }, (_, h) => `<span class="tm-pc-h label">${h % 3 ? '' : String(h).padStart(2, '0')}</span>`).join('')}`
  return `<div class="tm-punch" role="img" aria-label="Commit per giorno della settimana e ora, ora italiana">${righe}${ore}</div>`
}

export function fattiSito(sito) {
  const m = sito.momenti
  if (!m?.commit) return []
  const oraTop = m.ore.indexOf(Math.max(...m.ore))
  const giornoTop = m.settimana.indexOf(Math.max(...m.settimana))
  const ai = Object.entries(m.ai || {}).filter(([, n]) => n)
  return [
    `<b>${per(m.commit, 'commit', 'commit')}</b> in <b>${per(m.giorni, 'giorno', 'giorni')}</b> di lavoro, dal ${esc(lunga(m.primo))} al ${esc(lunga(m.ultimo))}`,
    m.serie?.n > 1 && `la serie più lunga: <b>${m.serie.n} giorni di fila</b>, dal ${esc(breve(m.serie.da))} al ${esc(breve(m.serie.a))}`,
    m.intenso && `il giorno più intenso: <b>${esc(lunga(m.intenso.data))}</b>, ${per(m.intenso.commit, 'commit', 'commit')}`,
    m.lungo?.min > 0 && `la giornata più lunga: il ${esc(breve(m.lungo.data))}, dalle ${m.lungo.da} alle ${m.lungo.a}`,
    `l’ora preferita: <b>${String(oraTop).padStart(2, '0')}:00–${String(oraTop).padStart(2, '0')}:59</b> · il giorno preferito: <b>${['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'][giornoTop]}</b>`,
    m.notte && `di notte (fra mezzanotte e le sei): ${pct(m.notte, m.commit)}% dei commit${m.tardi ? `, il più tardi alle <b>${m.tardi.ora}</b> del ${esc(breve(m.tardi.data))}` : ''}`,
    m.presto && `il più mattiniero: alle <b>${m.presto.ora}</b> del ${esc(breve(m.presto.data))}`,
    `nel fine settimana: ${pct(m.weekend, m.commit)}% dei commit`,
    ai.length && `con un assistente: ${ai.map(([k, n]) => `${AI[k]} ${num(n)}`).join(' · ')} (${pct(ai.reduce((a, [, n]) => a + n, 0), m.commit)}%)`,
    `<b class="tm-plus">+${num(m.piu)}</b> <b class="tm-minus">−${num(m.meno)}</b> righe in tutto`,
    m.auto && `qui non contano ${per(m.auto, 'commit automatico', 'commit automatici')} (le catture dei siti, rifatte da sole)`,
  ].filter(Boolean)
}
